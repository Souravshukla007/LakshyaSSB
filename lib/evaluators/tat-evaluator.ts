export type TatInput = {
    image_id: string; // or number, but the user spec says image_id
    theme?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    story_text: string;
};

export type TatEvaluationResult = {
    totalScore: number;
    maxPossibleScore: number;
    percentage: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    themeScores: Record<string, { score: number; max: number; percentage: number }>;
};

// ─── NLP Keyword Categories ───────────────────────────────────────────────────

const HERO_KEYWORDS = [
    'he', 'she', 'they', 'the man', 'the woman', 'officer', 'student',
    'captain', 'leader', 'ram', 'shyam', 'rohit', 'amit', 'rahul', 'priya', 'sita',
    'hero', 'protagonist'
];

const PROBLEM_KEYWORDS = [
    'issue', 'problem', 'crisis', 'challenge', 'accident', 'fire', 'attack',
    'difficult', 'suddenly', 'emergency', 'danger', 'stuck', 'trapped', 'loss',
    'struggle', 'injured', 'broken', 'obstacle'
];

const PLANNING_KEYWORDS = [
    'first', 'then', 'planned', 'decided', 'organized', 'strategy', 'divided',
    'arranged', 'managed', 'step', 'prepared', 'collected', 'gathered', 'analyzed',
    'assessed', 'allocated'
];

const LEADERSHIP_KEYWORDS = [
    'led', 'guided', 'motivated', 'instructed', 'directed', 'rallied', 'convinced',
    'ordered', 'team', 'group', 'together', 'encouraged', 'inspired', 'delegated',
    'coordinated'
];

const OUTCOME_KEYWORDS = [
    'success', 'saved', 'resolved', 'completed', 'won', 'achieved', 'happy', 'safe',
    'overcame', 'praised', 'awarded', 'successfully', 'concluded', 'finally',
    'rescued', 'restored', 'prevented', 'accomplished'
];

const PANIC_WORDS = [
    'scared', 'panic', 'cry', 'gave up', 'hopeless', 'depressed', 'angry',
    'shouted', 'lost', 'terrified', 'frozen', 'confused', 'helpless', 'quit',
    'impossible', 'doomed', 'failed miserably'
];

const UNREALISTIC_WORDS = [
    'superpower', 'magic', 'alien', 'ghost', 'god', 'miracle', 'magically',
    'teleport', 'flying machine', 'time travel', 'superman', 'batman', 'zombie'
];

export function evaluateTat(inputs: TatInput[]): TatEvaluationResult {
    const themeScores: Record<string, { score: number; max: number }> = {};
    let totalScore = 0;
    let maxPossibleScore = 0;

    inputs.forEach(input => {
        const text = input.story_text.toLowerCase().trim();

        let heroScore = 0;
        let problemScore = 0;
        let planningScore = 0;
        let leadershipScore = 0;
        let outcomeScore = 0;
        let emotionScore = 1; // Default assumes stable unless panic
        let realismScore = 1; // Default assumes realistic unless magic/fantasy

        if (text.length > 30) {
            // 1. Hero Identification (0-2)
            const heroCount = HERO_KEYWORDS.filter(w => text.includes(w)).length;
            heroScore = Math.min(2, heroCount);

            // 2. Problem Recognition (0-2)
            const problemCount = PROBLEM_KEYWORDS.filter(w => text.includes(w)).length;
            problemScore = Math.min(2, problemCount);

            // 3. Planning Ability (0-2)
            const planningCount = PLANNING_KEYWORDS.filter(w => text.includes(w)).length;
            planningScore = Math.min(2, planningCount);

            // 4. Leadership (0-2)
            const leadershipCount = LEADERSHIP_KEYWORDS.filter(w => text.includes(w)).length;
            leadershipScore = Math.min(2, leadershipCount);

            // 5. Positive Outcome (0-2)
            const outcomeCount = OUTCOME_KEYWORDS.filter(w => text.includes(w)).length;
            outcomeScore = Math.min(2, outcomeCount);

            // 6. Emotional Stability (0-2)
            const panicCount = PANIC_WORDS.filter(w => text.includes(w)).length;
            emotionScore = panicCount === 0 ? 2 : (panicCount === 1 ? 1 : 0);

            // 7. Realism (0-2)
            const fantasyCount = UNREALISTIC_WORDS.filter(w => text.includes(w)).length;
            realismScore = fantasyCount === 0 ? 2 : (fantasyCount === 1 ? 1 : 0);

            // Sub-penalties for very short stories that trick the keyword lack (panic/fantasy)
            if (text.split(' ').length < 30) {
                emotionScore = Math.min(emotionScore, 1);
                realismScore = Math.min(realismScore, 1);
            }
        } else {
            // Empty or purely invalid short text
            heroScore = problemScore = planningScore = leadershipScore = outcomeScore = emotionScore = realismScore = 0;
        }

        const rawImageScore = heroScore + problemScore + planningScore + leadershipScore + outcomeScore + emotionScore + realismScore; // Max 14

        // Difficulty Multiplier
        let multiplier = 1;
        if (input.difficulty === 'medium') multiplier = 1.2;
        if (input.difficulty === 'hard') multiplier = 1.5;

        const scaledScore = rawImageScore * multiplier;
        const scaledMax = 14 * multiplier;

        totalScore += scaledScore;
        maxPossibleScore += scaledMax;

        // Theme Aggregation
        const theme = input.theme || 'General';
        if (!themeScores[theme]) {
            themeScores[theme] = { score: 0, max: 0 };
        }
        themeScores[theme].score += scaledScore;
        themeScores[theme].max += scaledMax;
    });

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'HIGH';
    if (percentage >= 80) {
        riskLevel = 'LOW'; // Strong projection
    } else if (percentage >= 65) {
        riskLevel = 'MODERATE'; // Developing pattern
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
        totalScore: Math.round(totalScore),
        maxPossibleScore: Math.round(maxPossibleScore),
        percentage: Math.round(percentage),
        riskLevel,
        themeScores: calculatedThemeScores
    };
}
