import { PrismaClient } from '@prisma/client';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface WatResponse {
    word_id: number;
    word: string;
    difficulty: "easy" | "medium" | "hard";
    theme: string;
    user_sentence: string;
}

export interface WatEvaluationResult {
    total_score: number;
    max_possible_score: number;
    percentage_score: number;
    risk_level: RiskLevel;
    theme_scores: Record<string, {
        score: number,
        max_possible: number,
        percentage: number
    }>;
}

const NEGATIVE_WORDS = ['afraid', 'hate', 'cannot', 'impossible', 'quit', 'loser', 'die', 'death', 'kill'];
const RESPONSIBILITY_WORDS = ['i', 'we', 'should', 'must', 'ensure', 'will', 'responsible', 'duty', 'commit'];
const ACTION_WORDS = ['do', 'make', 'create', 'build', 'lead', 'inspire', 'act', 'complete', 'achieve', 'solve', 'overcome', 'finish', 'start', 'help', 'protect'];

export function evaluateWat(responses: WatResponse[]): WatEvaluationResult {
    let totalScore = 0;
    let maxPossibleTotal = 0;

    // Using a map to aggregate scores by theme
    const themeScoresMap: Record<string, { score: number, max: number }> = {};

    responses.forEach(response => {
        const sentence = response.user_sentence.toLowerCase().trim();

        // 1. Determine max possible for this word difficulty
        let maxWordScore = 3; // base easy length
        if (response.difficulty === 'medium') maxWordScore = 4;
        if (response.difficulty === 'hard') maxWordScore = 5;

        maxPossibleTotal += maxWordScore;

        if (!themeScoresMap[response.theme]) {
            themeScoresMap[response.theme] = { score: 0, max: 0 };
        }
        themeScoresMap[response.theme].max += maxWordScore;

        // Base score for attempting
        let wordScore = sentence.length > 3 ? 1 : 0;

        if (wordScore > 0) {
            // 2. Positivity & Emotional Stability (Penalty for negative/panic words)
            const hasNegative = NEGATIVE_WORDS.some(w => sentence.includes(w));
            if (!hasNegative) {
                wordScore += 1; // +1 positivity
            }

            // 3. Action Orientation
            const hasAction = ACTION_WORDS.some(w => sentence.includes(w));
            if (hasAction) {
                wordScore += 1; // +1 action
            }

            // 4. Responsibility 
            // Splitting by regex to specifically match whole words like 'i' and 'we'
            const wordsInSentence = sentence.split(/\W+/);
            const hasResponsibility = RESPONSIBILITY_WORDS.some(w => wordsInSentence.includes(w));
            if (hasResponsibility) {
                wordScore += 1; // +1 responsibility
            }

            // 5. Moral Integrity (Bonus for hard words if well formed)
            if (response.difficulty === 'hard' && !hasNegative && wordScore >= 3) {
                wordScore += 1;
            }

            // Cap the score to its max
            if (wordScore > maxWordScore) wordScore = maxWordScore;
        }

        totalScore += wordScore;
        themeScoresMap[response.theme].score += wordScore;
    });

    const percentageScore = maxPossibleTotal > 0 ? (totalScore / maxPossibleTotal) * 100 : 0;

    let riskLevel: RiskLevel = 'HIGH'; // < 65 
    if (percentageScore >= 80) {
        riskLevel = 'LOW'; // Strong Officer Thinking
    } else if (percentageScore >= 65) {
        riskLevel = 'MODERATE'; // Moderate Development
    }

    // Process theme scores
    const finalThemeScores: Record<string, { score: number, max_possible: number, percentage: number }> = {};
    for (const theme in themeScoresMap) {
        const t = themeScoresMap[theme];
        finalThemeScores[theme] = {
            score: t.score,
            max_possible: t.max,
            percentage: t.max > 0 ? Math.round((t.score / t.max) * 100) : 0
        };
    }

    return {
        total_score: totalScore,
        max_possible_score: maxPossibleTotal,
        percentage_score: Math.round(percentageScore),
        risk_level: riskLevel,
        theme_scores: finalThemeScores
    };
}
