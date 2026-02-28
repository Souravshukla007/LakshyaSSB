export type SrtInput = {
    question_id: number;
    theme: string;
    user_response: string;
};

export type SrtEvaluationResult = {
    totalScore: number;
    maxPossibleScore: number;
    percentage: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    themeScores: Record<string, { score: number; max: number; percentage: number }>;
};

// NLP Keywords
const ACTION_VERBS = [
    'help', 'inform', 'rescue', 'alert', 'report', 'organize',
    'assist', 'intervene', 'call', 'tackle', 'fight', 'stop',
    'manage', 'handle', 'take', 'go', 'save', 'protect'
];

const RESPONSIBILITY_PHRASES = [
    'i will', "i'll", 'i take responsibility', 'i assure', 'i ensure',
    'i arrange', 'i immediately', 'my responsibility', 'i am going to'
];

const EMOTIONAL_PANIC_WORDS = [
    'panic', 'scared', 'cry', 'run away', 'give up', 'hopeless',
    'terrified', 'freeze', 'don\'t know', 'confused'
];

const VAGUE_WORDS = [
    'try', 'maybe', 'if possible', 'might', 'probably', 'perhaps',
    'i think', 'hopefully', 'could'
];

export function evaluateSrt(inputs: SrtInput[]): SrtEvaluationResult {
    const themeScores: Record<string, { score: number; max: number }> = {};
    let totalScore = 0;
    const maxPossibleScore = inputs.length * 5;

    inputs.forEach(input => {
        const responseText = input.user_response.toLowerCase().trim();
        let questionScore = 1; // Base score

        if (responseText.length > 0) {
            // 1. Action Orientation (+1)
            const hasAction = ACTION_VERBS.some(verb => responseText.includes(verb));
            if (hasAction) questionScore += 1;

            // 2. Responsibility Indicator (+1)
            const hasResponsibility = RESPONSIBILITY_PHRASES.some(phrase => responseText.includes(phrase));
            if (hasResponsibility) questionScore += 1;

            // 3. Emotional Control (Detect panic words, no implicit +1 unless absence is treated as calm)
            // By requirement: +1 if socially aware, +1 if legally correct. 
            // We will approximate social/legal correctness by lack of negative aggression/panic, plus action.
            const hasPanic = EMOTIONAL_PANIC_WORDS.some(word => responseText.includes(word));
            if (!hasPanic && responseText.length > 10) {
                // Approximate emotional control/social awareness
                questionScore += 1;
            }

            // 4. Decision Clarity / Integrity (+1)
            const hasVague = VAGUE_WORDS.some(word => responseText.includes(word));
            if (!hasVague && responseText.length > 5) {
                questionScore += 1; // Direct/Clear/Legally correct approximation
            }

            // Penalties (-1)
            if (hasVague || responseText.length < 10) {
                questionScore -= 1; // Passive/Vague
            }

            // aggressive without justification
            const AGGRESSIVE_WORDS = ['hit', 'beat', 'kill', 'slap', 'punch', 'shoot'];
            const hasAggression = AGGRESSIVE_WORDS.some(word => responseText.includes(word));
            if (hasAggression) questionScore -= 1;

            // Clamp max per question
            questionScore = Math.max(0, Math.min(questionScore, 5));
        } else {
            questionScore = 0; // Empty response = 0
        }

        totalScore += questionScore;

        // Theme Aggregation
        const theme = input.theme || 'General';
        if (!themeScores[theme]) {
            themeScores[theme] = { score: 0, max: 0 };
        }
        themeScores[theme].score += questionScore;
        themeScores[theme].max += 5;
    });

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'HIGH'; // High Risk = Weak Pattern
    if (percentage >= 80) {
        riskLevel = 'LOW'; // Low Risk = Strong Officer Traits
    } else if (percentage >= 65) {
        riskLevel = 'MODERATE';
    }

    const calculatedThemeScores: Record<string, { score: number; max: number; percentage: number }> = {};
    Object.keys(themeScores).forEach(theme => {
        const themeData = themeScores[theme];
        calculatedThemeScores[theme] = {
            ...themeData,
            percentage: themeData.max > 0 ? (themeData.score / themeData.max) * 100 : 0
        };
    });

    return {
        totalScore,
        maxPossibleScore,
        percentage,
        riskLevel,
        themeScores: calculatedThemeScores
    };
}
