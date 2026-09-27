import { NextResponse } from 'next/server';
import { requirePro } from '@/lib/entitlement';
import { prisma } from '@/lib/prisma';

interface PiqHistoryRow {
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
 * GET /api/piq/history
 * Returns all PIQ score rows for the authenticated user (newest first, max 10).
 */
export async function GET() {
    try {
        const gate = await requirePro();
        if (gate.response) return gate.response;
        const session = gate.entitlement;

        const rows = await prisma.$queryRaw<PiqHistoryRow[]>`
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
            LIMIT 10
        `;

        // Return ordered oldest→newest so the frontend charts render left-to-right
        return NextResponse.json(rows.reverse());

    } catch (error) {
        console.error('[piq/history]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
