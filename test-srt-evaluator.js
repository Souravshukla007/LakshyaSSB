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

function evaluateSrt(inputs) {
    const themeScores = {};
    let totalScore = 0;
    const maxPossibleScore = inputs.length * 5;

    inputs.forEach(input => {
        const responseText = input.user_response.toLowerCase().trim();
        let questionScore = 1;

        if (responseText.length > 0) {
            const hasAction = ACTION_VERBS.some(verb => responseText.includes(verb));
            if (hasAction) questionScore += 1;

            const hasResponsibility = RESPONSIBILITY_PHRASES.some(phrase => responseText.includes(phrase));
            if (hasResponsibility) questionScore += 1;

            const hasPanic = EMOTIONAL_PANIC_WORDS.some(word => responseText.includes(word));
            if (!hasPanic && responseText.length > 10) {
                questionScore += 1;
            }

            const hasVague = VAGUE_WORDS.some(word => responseText.includes(word));
            if (!hasVague && responseText.length > 5) {
                questionScore += 1;
            }

            if (hasVague || responseText.length < 10) {
                questionScore -= 1;
            }

            const AGGRESSIVE_WORDS = ['hit', 'beat', 'kill', 'slap', 'punch', 'shoot'];
            const hasAggression = AGGRESSIVE_WORDS.some(word => responseText.includes(word));
            if (hasAggression) questionScore -= 1;

            questionScore = Math.max(0, Math.min(questionScore, 5));
        } else {
            questionScore = 0;
        }

        totalScore += questionScore;

        const theme = input.theme || 'General';
        if (!themeScores[theme]) {
            themeScores[theme] = { score: 0, max: 0 };
        }
        themeScores[theme].score += questionScore;
        themeScores[theme].max += 5;
    });

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    let riskLevel = 'HIGH';
    if (percentage >= 80) {
        riskLevel = 'LOW';
    } else if (percentage >= 65) {
        riskLevel = 'MODERATE';
    }

    const calculatedThemeScores = {};
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

const sampleData = [
    {
        question_id: 1,
        theme: 'Leadership',
        user_response: 'I will quickly organize the team and alert the authorities to handle the situation.'
    },
    {
        question_id: 2,
        theme: 'Emotional Control',
        user_response: 'I am terrified and would probably freeze and cry.'
    },
    {
        question_id: 3,
        theme: 'Responsibility',
        user_response: 'It is my responsibility to try to help if possible.'
    },
    {
        question_id: 4,
        theme: 'Integrity',
        user_response: 'I will report the incident immediately and assist the victims.'
    }
];

const result = evaluateSrt(sampleData);
console.log(JSON.stringify(result, null, 2));
