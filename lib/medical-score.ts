/**
 * lib/medical-score.ts
 * Pure scoring functions for the Medical Readiness Simulator.
 * No I/O — can be imported from both API routes and the frontend.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type VisionType = '6/6' | 'correctable' | 'none';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface MedicalInput {
    heightCm: number;
    weightKg: number;
    vision: VisionType;
    flatFoot: boolean;
    colorBlind: boolean;
    surgeryHistory: boolean;
    pushups: number;
    runMinutes: number;
    situps: number;
}

export interface MedicalScoreBreakdown {
    bmi: number;
    bmiScore: number;
    visionScore: number;
    conditionScore: number;
    fitnessScore: number;
    medicalScore: number;
    riskLevel: RiskLevel;
    plan: WeeklyPlan[];
}

export interface WeeklyPlan {
    week: string;
    task: string;
}

// ─── BMI ─────────────────────────────────────────────────────────────────────

export function calcBMI(heightCm: number, weightKg: number): number {
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(2));
}

export type BMICategory = 'Underweight' | 'Fit' | 'Overweight' | 'Obese';

export function bmiCategory(bmi: number): BMICategory {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Fit';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
}

/**
 * BMI contributes 30 points max to the final score.
 */
export function scoreBMI(bmi: number): number {
    const cat = bmiCategory(bmi);
    if (cat === 'Fit') return 30;
    if (cat === 'Underweight' || cat === 'Overweight') return 20;
    return 10; // Obese
}

// ─── Vision ───────────────────────────────────────────────────────────────────

/**
 * Vision contributes up to 25 points.
 */
export function scoreVision(vision: VisionType): number {
    if (vision === '6/6') return 25;
    if (vision === 'correctable') return 20;
    return 0;
}

// ─── Physical Conditions ─────────────────────────────────────────────────────

/**
 * Conditions score: starts at 25, deductions applied, floored at 0.
 * This replaces the separate "conditions" weight in the UI — it feeds the
 * final score alongside vision rather than being double-counted.
 */
export function scoreConditions(
    flatFoot: boolean,
    colorBlind: boolean,
    surgeryHistory: boolean,
): number {
    let score = 25;
    if (flatFoot) score -= 10;
    if (colorBlind) score -= 20;
    if (surgeryHistory) score -= 10;
    return Math.max(0, score);
}

// ─── Fitness ──────────────────────────────────────────────────────────────────

function scorePushups(n: number): number {
    if (n > 40) return 10;
    if (n >= 20) return 7;
    return 4;
}

function scoreRun(minutes: number): number {
    if (minutes < 6) return 10;
    if (minutes <= 7) return 8;
    if (minutes <= 8) return 6;
    return 4;
}

function scoreSitups(n: number): number {
    if (n > 40) return 5;
    if (n >= 20) return 3;
    return 2;
}

/**
 * Fitness total: pushups (10) + run (10) + situps (5) = 25 max.
 */
export function scoreFitness(
    pushups: number,
    runMinutes: number,
    situps: number,
): number {
    return scorePushups(pushups) + scoreRun(runMinutes) + scoreSitups(situps);
}

// ─── Final Score ──────────────────────────────────────────────────────────────

/**
 * Final medical score = BMI(30) + vision(25) + conditions(25) + fitness(25) = max 105
 * Clamped to 0–100.
 */
export function calcFinalScore(
    bmiScore: number,
    visionScore: number,
    conditionScore: number,
    fitnessScore: number,
): number {
    return Math.min(100, Math.max(0, bmiScore + visionScore + conditionScore + fitnessScore));
}

export function riskLevel(score: number): RiskLevel {
    if (score >= 75) return 'LOW';
    if (score >= 60) return 'MODERATE';
    return 'HIGH';
}

// ─── 30-Day Plan Generator ───────────────────────────────────────────────────

export function generatePlan(
    bmi: number,
    fitnessScore: number,
    vision: VisionType,
    flatFoot: boolean,
    colorBlind: boolean,
): WeeklyPlan[] {
    const cat = bmiCategory(bmi);
    const plans: WeeklyPlan[] = [];

    // Week 1 — BMI / cardio
    if (cat === 'Overweight' || cat === 'Obese') {
        plans.push({ week: 'Week 1', task: 'Caloric deficit: reduce 300–500 kcal/day. 30 min brisk walk or cycle daily.' });
    } else if (cat === 'Underweight') {
        plans.push({ week: 'Week 1', task: 'Caloric surplus: add 300 kcal/day with protein-rich foods (eggs, dal, milk). 3 meals + 2 snacks.' });
    } else {
        plans.push({ week: 'Week 1', task: 'Cardio maintenance: 20 min jogging or cycling daily to sustain Fit BMI.' });
    }

    // Week 2 — Strength
    if (fitnessScore < 15) {
        plans.push({ week: 'Week 2', task: 'Strength foundation: push-ups 3×15, sit-ups 3×20, squats 3×20 — rest 60 sec between sets.' });
    } else {
        plans.push({ week: 'Week 2', task: 'Strength training 3×/week: push-ups, pull-ups, dips. Target >40 push-ups in one set.' });
    }

    // Week 3 — Posture / Vision / Flat Foot
    if (flatFoot) {
        plans.push({ week: 'Week 3', task: 'Posture & arch correction: towel toe-scrunches 3×20, heel raises 3×15, barefoot grass walking 10 min/day.' });
    } else if (vision !== '6/6') {
        plans.push({ week: 'Week 3', task: 'Schedule a Snellen chart eye test. Consult an ophthalmologist about corrective options. Reduce screen time to <2 hr/day.' });
    } else {
        plans.push({ week: 'Week 3', task: 'Flexibility & mobility: yoga or stretching 20 min daily. Focus on hamstrings, hip flexors, and shoulder mobility.' });
    }

    // Week 4 — Medical re-evaluation
    const docNotes: string[] = [];
    if (colorBlind) docNotes.push('Ishihara plate test report');
    if (vision !== '6/6') docNotes.push('ophthalmologist clearance');
    if (docNotes.length > 0) {
        plans.push({ week: 'Week 4', task: `Medical re-evaluation. Gather documents: ${docNotes.join(', ')}. Do a mock BMI + fitness self-test.` });
    } else {
        plans.push({ week: 'Week 4', task: 'Medical re-evaluation: repeat all fitness tests. Compare with Week 1 baseline. Prepare medical documents for SSB reporting.' });
    }

    return plans;
}

// ─── Convenience — compute everything from one input object ──────────────────

export function computeMedicalScore(input: MedicalInput): MedicalScoreBreakdown {
    const bmi = calcBMI(input.heightCm, input.weightKg);
    const bmiScore = scoreBMI(bmi);
    const visionScore = scoreVision(input.vision);
    const condScore = scoreConditions(input.flatFoot, input.colorBlind, input.surgeryHistory);
    const fitScore = scoreFitness(input.pushups, input.runMinutes, input.situps);
    const finalScore = calcFinalScore(bmiScore, visionScore, condScore, fitScore);
    const risk = riskLevel(finalScore);
    const plan = generatePlan(bmi, fitScore, input.vision, input.flatFoot, input.colorBlind);

    return {
        bmi,
        bmiScore,
        visionScore,
        conditionScore: condScore,
        fitnessScore: fitScore,
        medicalScore: finalScore,
        riskLevel: risk,
        plan,
    };
}
