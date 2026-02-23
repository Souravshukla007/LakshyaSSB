import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateIOQuestions, scoreOLQs, type PiqInput } from '@/lib/piq-score';

interface SubmissionRow {
    positionOfResponsibility: boolean;
    teamSportsYears: number;
    nccInvolvement: boolean;
    sportsLevel: string;
    organizedEvent: boolean;
    volunteerWork: boolean;
    familyResponsibility: boolean;
    academicConsistency: boolean;
    publicSpeaking: boolean;
    competitiveAchievements: boolean;
    attemptNumber: number;
}

interface ScoreRow {
    leadership: number;
    initiative: number;
    responsibility: number;
    socialAdaptability: number;
    confidence: number;
    consistency: number;
}

/**
 * GET /api/piq/io-questions
 * Fetches the user's latest PiqSubmission, re-runs IO question generator,
 * and returns up to 5 personalised interview questions.
 */
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch latest submission
        const submissions = await prisma.$queryRaw<SubmissionRow[]>`
            SELECT
                "positionOfResponsibility", "teamSportsYears", "nccInvolvement", "sportsLevel",
                "organizedEvent", "volunteerWork",
                "familyResponsibility", "academicConsistency",
                "publicSpeaking", "competitiveAchievements",
                "attemptNumber"
            FROM "PiqSubmission"
            WHERE "userId" = ${session.userId}
            LIMIT 1
        `;

        if (!submissions || submissions.length === 0) {
            return NextResponse.json({ questions: [], message: 'No PIQ submission found. Complete the PIQ form first.' });
        }

        const sub = submissions[0];

        // Re-hydrate PiqInput
        const input: PiqInput = {
            positionOfResponsibility: sub.positionOfResponsibility,
            teamSportsYears: Number(sub.teamSportsYears),
            nccInvolvement: sub.nccInvolvement,
            sportsLevel: (sub.sportsLevel as PiqInput['sportsLevel']),
            organizedEvent: sub.organizedEvent,
            volunteerWork: sub.volunteerWork,
            familyResponsibility: sub.familyResponsibility,
            academicConsistency: sub.academicConsistency,
            publicSpeaking: sub.publicSpeaking,
            competitiveAchievements: sub.competitiveAchievements,
            attemptNumber: Number(sub.attemptNumber),
        };

        // Get latest OLQ scores for context (optional — use submission-derived if no scores yet)
        const scoreRows = await prisma.$queryRaw<ScoreRow[]>`
            SELECT leadership, initiative, responsibility, "socialAdaptability", confidence, consistency
            FROM "PiqScore"
            WHERE "userId" = ${session.userId}
            ORDER BY "createdAt" DESC
            LIMIT 1
        `;

        const olqs = scoreRows && scoreRows.length > 0
            ? {
                leadership: Number(scoreRows[0].leadership),
                initiative: Number(scoreRows[0].initiative),
                responsibility: Number(scoreRows[0].responsibility),
                socialAdaptability: Number(scoreRows[0].socialAdaptability),
                confidence: Number(scoreRows[0].confidence),
                consistency: Number(scoreRows[0].consistency),
            }
            : scoreOLQs(input); // fallback: recompute

        const questions = generateIOQuestions(olqs, input);

        return NextResponse.json({
            questions,
            generatedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('[piq/io-questions]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
