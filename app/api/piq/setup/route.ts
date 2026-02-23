import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/piq/setup
 * One-time route to create PiqSubmission and PiqScore tables.
 * Hit this once from the browser. Safe to call multiple times (IF NOT EXISTS).
 * DELETE this file after running.
 */
export async function GET() {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "PiqSubmission" (
                id                          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
                "userId"                    TEXT        NOT NULL,
                "positionOfResponsibility"  BOOLEAN     NOT NULL DEFAULT false,
                "teamSportsYears"           INTEGER     NOT NULL DEFAULT 0,
                "nccInvolvement"            BOOLEAN     NOT NULL DEFAULT false,
                "sportsLevel"               TEXT        NOT NULL DEFAULT 'none',
                "organizedEvent"            BOOLEAN     NOT NULL DEFAULT false,
                "volunteerWork"             BOOLEAN     NOT NULL DEFAULT false,
                "familyResponsibility"      BOOLEAN     NOT NULL DEFAULT false,
                "academicConsistency"       BOOLEAN     NOT NULL DEFAULT false,
                "publicSpeaking"            BOOLEAN     NOT NULL DEFAULT false,
                "competitiveAchievements"   BOOLEAN     NOT NULL DEFAULT false,
                "attemptNumber"             INTEGER     NOT NULL DEFAULT 1,
                "createdAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id),
                UNIQUE ("userId"),
                FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
            )
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "PiqSubmission_userId_idx" ON "PiqSubmission" ("userId")
        `);

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "PiqScore" (
                id                   TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
                "userId"             TEXT        NOT NULL,
                "leadership"         INTEGER     NOT NULL,
                "initiative"         INTEGER     NOT NULL,
                "responsibility"     INTEGER     NOT NULL,
                "socialAdaptability" INTEGER     NOT NULL,
                "confidence"         INTEGER     NOT NULL,
                "consistency"        INTEGER     NOT NULL,
                "totalScore"         INTEGER     NOT NULL,
                "riskLevel"          "RiskLevel" NOT NULL,
                "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id),
                FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
            )
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "PiqScore_userId_idx" ON "PiqScore" ("userId")
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "PiqScore_createdAt_idx" ON "PiqScore" ("createdAt")
        `);

        return NextResponse.json({
            ok: true,
            message: 'PiqSubmission and PiqScore tables created successfully. You can now delete app/api/piq/setup/route.ts'
        });

    } catch (error) {
        console.error('[piq/setup]', error);
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
}
