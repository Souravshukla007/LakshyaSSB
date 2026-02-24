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
    // adding raw inputs to decide UI state ("Ready" vs "Needs Test")
    vision: string;
    flatFoot: boolean;
    colorBlind: boolean;
    surgeryHistory: boolean;
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rows = await prisma.$queryRaw<MedicalRow[]>`
            SELECT
                id,
                bmi,
                "bmiScore",
                "visionScore",
                "conditionScore",
                "fitnessScore",
                "medicalScore",
                "riskLevel",
                "createdAt",
                vision,
                "flatFoot",
                "colorBlind",
                "surgeryHistory"
            FROM "MedicalResult"
            WHERE "userId" = ${session.userId}
            ORDER BY "createdAt" DESC
            LIMIT 1
        `;

        if (!rows || rows.length === 0) {
            return NextResponse.json({ status: 'NO_MEDICAL' });
        }

        const latest = rows[0];

        return NextResponse.json({
            status: 'HAS_MEDICAL',
            data: latest
        });

    } catch (error) {
        console.error('[medical/latest]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
