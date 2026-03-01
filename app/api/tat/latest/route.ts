import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const latest = await prisma.tatResult.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
        });

        if (!latest) {
            return NextResponse.json({ status: 'NO_TAT' });
        }

        return NextResponse.json({
            status: 'HAS_TAT',
            result: {
                id: latest.id,
                totalScore: latest.totalScore,
                themeScores: latest.themeScores,
                riskLevel: latest.riskLevel,
                createdAt: latest.createdAt,
            }
        });

    } catch (error) {
        console.error('[tat/latest]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
