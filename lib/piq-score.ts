/**
 * lib/piq-score.ts
 * Pure scoring functions for the PIQ Builder Analysis Engine.
 * No I/O — can be imported from both API routes and the frontend.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PIQRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';
export type SportsLevel = 'none' | 'school' | 'district' | 'state';

export interface PiqInput {
    // Leadership signals
    positionOfResponsibility: boolean;
    teamSportsYears: number;
    nccInvolvement: boolean;
    sportsLevel: SportsLevel;

    // Initiative signals
    organizedEvent: boolean;
    volunteerWork: boolean;

    // Responsibility signals
    familyResponsibility: boolean;
    academicConsistency: boolean;

    // Confidence signals
    publicSpeaking: boolean;
    competitiveAchievements: boolean;

    // Meta
    attemptNumber: number;
}

export interface OLQScores {
    leadership: number;        // 0–10
    initiative: number;        // 0–10
    responsibility: number;    // 0–10
    socialAdaptability: number; // 0–10
    confidence: number;        // 0–10
    consistency: number;       // 0–10
}

export interface PIQScoreBreakdown {
    olqs: OLQScores;
    totalScore: number;        // 0–100
    riskLevel: PIQRiskLevel;
    ioQuestions: IOQuestion[];
}

export interface IOQuestion {
    question: string;
    context: string;
    triggerOLQ: string;
}

// ─── OLQ Scoring ─────────────────────────────────────────────────────────────

/**
 * Score all 6 OLQs using weighted signals. Each clamped 0–10.
 */
export function scoreOLQs(input: PiqInput): OLQScores {
    // ── Leadership ──────────────────────────────────────────
    let leadership = 0;
    if (input.positionOfResponsibility) leadership += 3;
    if (input.teamSportsYears >= 2) leadership += 2;
    if (input.nccInvolvement) leadership += 2;
    if (input.sportsLevel === 'district' || input.sportsLevel === 'state') leadership += 2;

    // ── Initiative ──────────────────────────────────────────
    let initiative = 0;
    if (input.organizedEvent) initiative += 3;
    if (input.volunteerWork) initiative += 2;
    // Extra: NCC / position holder tend to self-initiate
    if (input.nccInvolvement) initiative += 1;
    if (input.positionOfResponsibility) initiative += 1;

    // ── Responsibility ──────────────────────────────────────
    let responsibility = 0;
    if (input.familyResponsibility) responsibility += 2;
    if (input.academicConsistency) responsibility += 2;
    if (input.positionOfResponsibility) responsibility += 2;
    if (input.teamSportsYears >= 1) responsibility += 1;

    // ── Social Adaptability ─────────────────────────────────
    let socialAdaptability = 0;
    if (input.nccInvolvement) socialAdaptability += 3;
    if (input.sportsLevel !== 'none') socialAdaptability += 2;
    if (input.volunteerWork) socialAdaptability += 2;
    if (input.teamSportsYears >= 2) socialAdaptability += 1;

    // ── Confidence ──────────────────────────────────────────
    let confidence = 0;
    if (input.publicSpeaking) confidence += 3;
    if (input.competitiveAchievements) confidence += 2;
    if (input.positionOfResponsibility) confidence += 2;
    if (input.sportsLevel === 'district' || input.sportsLevel === 'state') confidence += 2;

    // ── Consistency ─────────────────────────────────────────
    let consistency = 0;
    if (input.academicConsistency) consistency += 3;
    if (input.teamSportsYears >= 2) consistency += 2;
    if (input.nccInvolvement) consistency += 2;
    if (input.volunteerWork) consistency += 1;

    return {
        leadership: Math.min(10, leadership),
        initiative: Math.min(10, initiative),
        responsibility: Math.min(10, responsibility),
        socialAdaptability: Math.min(10, socialAdaptability),
        confidence: Math.min(10, confidence),
        consistency: Math.min(10, consistency),
    };
}

// ─── Total Score (0–100) ──────────────────────────────────────────────────────

/**
 * Weighted average of 6 OLQs (max 60 pts) → normalised to 100.
 * Weights: Responsibility & Leadership slightly heavier (SSB priorities).
 */
export function calcTotalScore(olqs: OLQScores): number {
    const weighted =
        olqs.leadership * 1.2 +
        olqs.initiative * 1.0 +
        olqs.responsibility * 1.2 +
        olqs.socialAdaptability * 1.0 +
        olqs.confidence * 1.0 +
        olqs.consistency * 1.0;

    const maxWeighted = 10 * (1.2 + 1.0 + 1.2 + 1.0 + 1.0 + 1.0); // 64
    return Math.round(Math.min(100, (weighted / maxWeighted) * 100));
}

// ─── Risk Level ───────────────────────────────────────────────────────────────

export function piqRiskLevel(score: number): PIQRiskLevel {
    if (score >= 80) return 'LOW';
    if (score >= 65) return 'MODERATE';
    return 'HIGH';
}

// ─── IO Question Generator ────────────────────────────────────────────────────

/**
 * Generate ≤5 IO questions based on weak OLQs and PIQ gaps.
 * Ordered by severity (lowest OLQ first).
 */
export function generateIOQuestions(olqs: OLQScores, input: PiqInput): IOQuestion[] {
    const questions: IOQuestion[] = [];

    // Leadership weak
    if (olqs.leadership < 5) {
        questions.push({
            triggerOLQ: 'Leadership',
            question: 'You mention holding a position of responsibility. Can you give me a specific example of a difficult decision you made as a leader?',
            context: 'Low leadership score — IO will probe depth of leadership experience.',
        });
        questions.push({
            triggerOLQ: 'Leadership',
            question: 'Why have you not taken up any leadership roles in sports or community activities?',
            context: 'Absence of leadership evidence outside academics flagged.',
        });
    }

    // Initiative weak
    if (olqs.initiative < 5 && questions.length < 5) {
        questions.push({
            triggerOLQ: 'Initiative',
            question: 'Have you ever started something — a club, event, or project — without being asked to? Tell me about it.',
            context: 'Low initiative score — no self-started activities found in PIQ.',
        });
        if (questions.length < 5) {
            questions.push({
                triggerOLQ: 'Initiative',
                question: 'What did you do proactively in your school or college that was not part of the syllabus or curriculum?',
                context: 'IO will probe for self-driven action beyond routine academics.',
            });
        }
    }

    // No sports participation
    if (input.sportsLevel === 'none' && questions.length < 5) {
        questions.push({
            triggerOLQ: 'Confidence',
            question: 'Your profile shows no participation in competitive sports. How do you maintain your physical fitness?',
            context: 'Missing sports signal — critical gap for SSB IO assessment.',
        });
    }

    // Multiple attempts
    if (input.attemptNumber > 1 && questions.length < 5) {
        questions.push({
            triggerOLQ: 'Consistency',
            question: `This is your attempt #${input.attemptNumber} at the SSB. What specific areas have you improved since your last conference out?`,
            context: 'IO always probes repeat candidates on self-improvement and self-awareness.',
        });
    }

    // Social adaptability weak
    if (olqs.socialAdaptability < 5 && questions.length < 5) {
        questions.push({
            triggerOLQ: 'Social Adaptability',
            question: 'Tell me about a time you had to work closely with someone very different from you in background or temperament.',
            context: 'Low social adaptability — limited evidence of cross-group interaction.',
        });
    }

    // Confidence weak (only if not already at max)
    if (olqs.confidence < 5 && questions.length < 5) {
        questions.push({
            triggerOLQ: 'Confidence',
            question: 'Have you ever stood up for yourself or your decision in front of a senior who disagreed with you?',
            context: 'Low confidence score — IO will probe assertiveness under authority.',
        });
    }

    return questions.slice(0, 5);
}

// ─── Convenience Wrapper ─────────────────────────────────────────────────────

export function computePIQScore(input: PiqInput): PIQScoreBreakdown {
    const olqs = scoreOLQs(input);
    const totalScore = calcTotalScore(olqs);
    const riskLevel = piqRiskLevel(totalScore);
    const ioQuestions = generateIOQuestions(olqs, input);

    return { olqs, totalScore, riskLevel, ioQuestions };
}
