import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computePIQScore, type PiqInput } from '@/lib/piq-score';

/**
 * POST /api/piq/evaluate
 *
 * Body: PiqInput fields (see lib/piq-score.ts)
 *
 * 1. Validates inputs
 * 2. Computes OLQ scores via pure scoring engine
 * 3. Upserts PiqSubmission (stores raw inputs)
 * 4. Inserts new PiqScore row (history)
 * 5. Returns full breakdown
 */
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // ── Parse & validate ────────────────────────────────────────────────
        const input: PiqInput = {
            positionOfResponsibility: Boolean(body.positionOfResponsibility),
            teamSportsYears: Math.max(0, Math.min(20, Number(body.teamSportsYears) || 0)),
            nccInvolvement: Boolean(body.nccInvolvement),
            sportsLevel: (['none', 'school', 'district', 'state'].includes(body.sportsLevel)
                ? body.sportsLevel : 'none'),
            organizedEvent: Boolean(body.organizedEvent),
            volunteerWork: Boolean(body.volunteerWork),
            familyResponsibility: Boolean(body.familyResponsibility),
            academicConsistency: Boolean(body.academicConsistency),
            publicSpeaking: Boolean(body.publicSpeaking),
            competitiveAchievements: Boolean(body.competitiveAchievements),
            attemptNumber: Math.max(1, Math.min(10, Number(body.attemptNumber) || 1)),
        };

        // ── Compute scores ───────────────────────────────────────────────────
        const result = computePIQScore(input);

        // ── Upsert raw submission (for IO question re-generation) ────────────
        await prisma.$executeRaw`
            INSERT INTO "PiqSubmission" (
                id, "userId",
                "positionOfResponsibility", "teamSportsYears", "nccInvolvement", "sportsLevel",
                "organizedEvent", "volunteerWork",
                "familyResponsibility", "academicConsistency",
                "publicSpeaking", "competitiveAchievements",
                "attemptNumber",
                "createdAt", "updatedAt"
            ) VALUES (
                gen_random_uuid(), ${session.userId},
                ${input.positionOfResponsibility}, ${input.teamSportsYears},
                ${input.nccInvolvement}, ${input.sportsLevel},
                ${input.organizedEvent}, ${input.volunteerWork},
                ${input.familyResponsibility}, ${input.academicConsistency},
                ${input.publicSpeaking}, ${input.competitiveAchievements},
                ${input.attemptNumber},
                NOW(), NOW()
            )
            ON CONFLICT ("userId") DO UPDATE SET
                "positionOfResponsibility" = EXCLUDED."positionOfResponsibility",
                "teamSportsYears"          = EXCLUDED."teamSportsYears",
                "nccInvolvement"           = EXCLUDED."nccInvolvement",
                "sportsLevel"              = EXCLUDED."sportsLevel",
                "organizedEvent"           = EXCLUDED."organizedEvent",
                "volunteerWork"            = EXCLUDED."volunteerWork",
                "familyResponsibility"     = EXCLUDED."familyResponsibility",
                "academicConsistency"      = EXCLUDED."academicConsistency",
                "publicSpeaking"           = EXCLUDED."publicSpeaking",
                "competitiveAchievements"  = EXCLUDED."competitiveAchievements",
                "attemptNumber"            = EXCLUDED."attemptNumber",
                "updatedAt"                = NOW()
        `;

        // ── Insert new history row ───────────────────────────────────────────
        await prisma.$executeRaw`
            INSERT INTO "PiqScore" (
                id, "userId",
                leadership, initiative, responsibility, "socialAdaptability",
                confidence, consistency,
                "totalScore", "riskLevel",
                "createdAt"
            ) VALUES (
                gen_random_uuid(), ${session.userId},
                ${result.olqs.leadership},
                ${result.olqs.initiative},
                ${result.olqs.responsibility},
                ${result.olqs.socialAdaptability},
                ${result.olqs.confidence},
                ${result.olqs.consistency},
                ${result.totalScore},
                ${result.riskLevel}::"RiskLevel",
                NOW()
            )
        `;

        // ── Return full breakdown ────────────────────────────────────────────
        return NextResponse.json({
            olqs: result.olqs,
            totalScore: result.totalScore,
            riskLevel: result.riskLevel,
            ioQuestions: result.ioQuestions,
            savedToProfile: true,
        });

    } catch (error) {
        console.error('[piq/evaluate]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
