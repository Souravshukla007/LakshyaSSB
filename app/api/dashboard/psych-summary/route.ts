import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.userId;

        // Fetch latest results
        const [tat, wat, srt] = await Promise.all([
            prisma.tatResult.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
            prisma.watResult.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
            prisma.srtResult.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        ]);

        if (!tat && !wat && !srt) {
            return NextResponse.json({ status: 'NO_DATA' });
        }

        // Aggregate scores
        const scores = [];
        if (tat) scores.push(tat.totalScore);
        if (wat) scores.push(wat.totalScore);
        if (srt) scores.push(srt.totalScore);

        const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

        // Aggregate themes for Radar Chart
        // Common OLQs: Leadership, Initiative, Responsibility, Social Adaptability, Confidence, Consistency
        const olqs: Record<string, number> = {
            leadership: 0,
            initiative: 0,
            responsibility: 0,
            social_adaptability: 0,
            confidence: 0,
        };

        const themeCount: Record<string, number> = {};

        const processThemeScores = (themeScores: any) => {
            if (!themeScores) return;
            Object.entries(themeScores).forEach(([theme, data]: [string, any]) => {
                const normalizedTheme = theme.toLowerCase().replace(/\s+/g, '_');
                // Map various themes to core OLQs if possible
                let targetKey = normalizedTheme;
                if (normalizedTheme.includes('lead')) targetKey = 'leadership';
                if (normalizedTheme.includes('initiat')) targetKey = 'initiative';
                if (normalizedTheme.includes('respons')) targetKey = 'responsibility';
                if (normalizedTheme.includes('social') || normalizedTheme.includes('adapt')) targetKey = 'social_adaptability';
                if (normalizedTheme.includes('confid') || normalizedTheme.includes('emot')) targetKey = 'confidence';

                if (olqs.hasOwnProperty(targetKey)) {
                    olqs[targetKey] += data.percentage || 0;
                    themeCount[targetKey] = (themeCount[targetKey] || 0) + 1;
                }
            });
        };

        processThemeScores(tat?.themeScores);
        processThemeScores(wat?.themeScores);
        processThemeScores(srt?.themeScores);

        // Calculate averages for OLQs
        Object.keys(olqs).forEach(key => {
            if (themeCount[key]) {
                olqs[key] = Math.round(olqs[key] / themeCount[key]);
            } else {
                olqs[key] = 0; // Default if no data
            }
        });

        // Determine Insight
        let insight = "Continue practicing to reveal your officer-like qualities.";
        if (overallScore >= 75) {
            insight = "Strong psychological projection. Your consistency across TAT and SRT indicates high reliability.";
        } else if (overallScore >= 60) {
            insight = "Good foundation. Focus on taking more proactive actions in your stories to boost your Initiative score.";
        } else if (overallScore > 0) {
            insight = "Focus on developing positive framing and action-oriented responses in all psych tests.";
        }

        return NextResponse.json({
            status: 'HAS_DATA',
            overallScore,
            olqs,
            insight,
            lastUpdated: [tat?.createdAt, wat?.createdAt, srt?.createdAt].filter(Boolean).sort().reverse()[0]
        });

    } catch (error) {
        console.error('[psych-summary] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
