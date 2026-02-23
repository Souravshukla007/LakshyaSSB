import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface LatestPiqRow {
    id: string;
    leadership: number;
    initiative: number;
    responsibility: number;
    socialAdaptability: number;
    confidence: number;
    consistency: number;
    totalScore: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    createdAt: Date;
}

/**
 * GET /api/piq/latest
 * Returns the latest PIQ score for the authenticated user.
 * If no score exists, returns { status: "NO_PIQ" }.
 */
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rows = await prisma.$queryRaw<LatestPiqRow[]>`
            SELECT
                id,
                leadership,
                initiative,
                responsibility,
                "socialAdaptability",
                confidence,
                consistency,
                "totalScore",
                "riskLevel",
                "createdAt"
            FROM "PiqScore"
            WHERE "userId" = ${session.userId}
            ORDER BY "createdAt" DESC
            LIMIT 1
        `;

        if (!rows || rows.length === 0) {
            return NextResponse.json({ status: 'NO_PIQ' });
        }

        const latest = rows[0];

        return NextResponse.json({
            status: 'HAS_PIQ',
            latestScore: latest.totalScore,
            riskLevel: latest.riskLevel,
            lastUpdated: latest.createdAt,
            olqs: {
                leadership: latest.leadership,
                initiative: latest.initiative,
                responsibility: latest.responsibility,
                socialAdaptability: latest.socialAdaptability,
                confidence: latest.confidence,
                consistency: latest.consistency,
            },
        });

    } catch (error) {
        console.error('[piq/latest]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
