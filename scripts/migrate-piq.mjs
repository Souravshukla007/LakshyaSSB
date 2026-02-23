/**
 * scripts/migrate-piq.mjs
 * Run with: node scripts/migrate-piq.mjs
 *
 * Creates PiqSubmission and PiqScore tables in Neon using the existing
 * Prisma connection (same DATABASE_URL as the app).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating PiqSubmission table...');
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
    console.log('✅ PiqSubmission created (or already exists)');

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PiqSubmission_userId_idx" ON "PiqSubmission" ("userId")
    `);

    console.log('Creating PiqScore table...');
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
    console.log('✅ PiqScore created (or already exists)');

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PiqScore_userId_idx" ON "PiqScore" ("userId")
    `);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PiqScore_createdAt_idx" ON "PiqScore" ("createdAt")
    `);

    console.log('✅ All PIQ tables and indexes ready.');
}

main()
    .catch(e => { console.error('Migration failed:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
