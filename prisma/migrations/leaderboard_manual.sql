-- ============================================================
-- LakshyaSSB — Leaderboard Migration + autoRenew cleanup
-- Run this in your Neon SQL Editor:
-- https://console.neon.tech → your project → SQL Editor
-- ============================================================

-- 1. Drop unwanted column
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "autoRenew";

-- 2. Add leaderboard/medal columns to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "medals_total"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "medals_weekly"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "current_streak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "longest_streak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "last_login"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "is_pro"         BOOLEAN NOT NULL DEFAULT false;

-- 3. Performance indexes for leaderboard ordering
CREATE INDEX IF NOT EXISTS "User_medals_total_idx"   ON "User"("medals_total");
CREATE INDEX IF NOT EXISTS "User_medals_weekly_idx"  ON "User"("medals_weekly");
CREATE INDEX IF NOT EXISTS "User_current_streak_idx" ON "User"("current_streak");
