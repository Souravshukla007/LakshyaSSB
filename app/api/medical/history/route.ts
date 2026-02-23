import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface MedicalRow {
    id: string;
    bmi: number;
    bmiScore: number;
    visionScore: number;
    conditionScore: number;
    fitnessScore: number;
    medicalScore: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    createdAt: Date;
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use raw SQL to bypass missing MedicalResult delegate in generated client
        const results = await prisma.$queryRaw<MedicalRow[]>`
            SELECT
                id,
                bmi,
                "bmiScore",
                "visionScore",
                "conditionScore",
                "fitnessScore",
                "medicalScore",
                "riskLevel",
                "createdAt"
            FROM "MedicalResult"
            WHERE "userId" = ${session.userId}
            ORDER BY "createdAt" DESC
            LIMIT 10
        `;

        return NextResponse.json(results);

    } catch (error) {
        console.error('[medical/history]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
