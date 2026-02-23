import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { computeMedicalScore } from '@/lib/medical-score';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const {
            heightCm, weightKg, vision, flatFoot, colorBlind,
            surgeryHistory, pushups, runMinutes, situps,
        } = body;

        // Basic validation
        if (!heightCm || !weightKg || heightCm < 50 || heightCm > 250 || weightKg < 20 || weightKg > 200) {
            return NextResponse.json({ error: 'Invalid height or weight' }, { status: 400 });
        }

        const result = computeMedicalScore({
            heightCm: Number(heightCm),
            weightKg: Number(weightKg),
            vision: vision ?? '6/6',
            flatFoot: Boolean(flatFoot),
            colorBlind: Boolean(colorBlind),
            surgeryHistory: Boolean(surgeryHistory),
            pushups: Math.round(Number(pushups) || 0),
            runMinutes: Number(runMinutes) || 0,
            situps: Math.round(Number(situps) || 0),
        });

        // Persist using raw SQL so we don't need a regenerated Prisma client
        await prisma.$executeRaw`
            INSERT INTO "MedicalResult" (
                id, "userId",
                "heightCm", "weightKg", vision,
                "flatFoot", "colorBlind", "surgeryHistory",
                pushups, "runMinutes", situps,
                bmi, "bmiScore", "visionScore", "conditionScore", "fitnessScore",
                "medicalScore", "riskLevel", "createdAt"
            ) VALUES (
                gen_random_uuid(), ${session.userId},
                ${Number(heightCm)}, ${Number(weightKg)}, ${vision ?? '6/6'},
                ${Boolean(flatFoot)}, ${Boolean(colorBlind)}, ${Boolean(surgeryHistory)},
                ${Math.round(Number(pushups) || 0)}, ${Number(runMinutes) || 0}, ${Math.round(Number(situps) || 0)},
                ${result.bmi}, ${result.bmiScore}, ${result.visionScore}, ${result.conditionScore}, ${result.fitnessScore},
                ${result.medicalScore}, ${result.riskLevel}::"RiskLevel", NOW()
            )
        `;

        return NextResponse.json({
            bmi: result.bmi,
            bmiScore: result.bmiScore,
            visionScore: result.visionScore,
            conditionScore: result.conditionScore,
            fitnessScore: result.fitnessScore,
            medicalScore: result.medicalScore,
            riskLevel: result.riskLevel,
            plan: result.plan,
            savedToProfile: true,
        });

    } catch (error) {
        console.error('[medical/calculate]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
