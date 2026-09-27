import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { requireUser } from '@/lib/entitlement';
import { claimFreeEval } from '@/lib/practice-limit';
import { prisma } from '@/lib/prisma';
import analogy from '@/data/practice/oir_analogy.json';
import codeDe from '@/data/practice/oir_CodeDe.json';
import dice from '@/data/practice/oir_Dice.json';
import dictonary from '@/data/practice/oir_dictonary.json';
import number from '@/data/practice/oir_number.json';
import odd from '@/data/practice/oir_odd.json';
import rank from '@/data/practice/oir_Rank.json';
import rearrange from '@/data/practice/oir_rearrange.json';
import sym from '@/data/practice/oir_sym.json';
import wordProb from '@/data/practice/oir_wordProb.json';

type OirQuestion = {
  id?: string | number;
  topic?: string;
  question?: string;
  [key: string]: unknown;
};

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function toQuestionKey(question: OirQuestion & { __source: string; __sourceIndex: number }) {
  const source = question.__source;
  const sourceIndex = question.__sourceIndex;
  const originalId = question.id ?? sourceIndex;
  const topic = String(question.topic ?? '').trim().toLowerCase();
  const text = String(question.question ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${source}::${originalId}::${topic}::${text}`;
}

/**
 * POST /api/oir/generate
 *
 * Three things were wrong here:
 *
 *  1. No authentication at all — a full OIR paper, *including the answer key*,
 *     was served to anonymous callers via the guest branch.
 *  2. No entitlement check. OIR is scored entirely client-side (there is no
 *     /api/oir/submit), so this endpoint is the only place the one-free-test
 *     limit can be enforced. Because the old quota write was a POST the browser
 *     volunteered, OIR was effectively unlimited for free users.
 *  3. It was a GET that mutates. Generating a paper consumes the user's free OIR
 *     attempt and writes OirQuestionHistory, so a link prefetch, a crawler, a
 *     double-click or a browser retry could silently spend a free attempt. Safe
 *     methods must not have side effects — this is now POST.
 *
 * Generating the paper consumes the free OIR attempt atomically.
 */
export async function POST() {
  try {
    const gate = await requireUser();
    if (gate.response) return gate.response;
    const session = gate.entitlement;

    // Claiming here is what makes "1 free OIR test" real.
    const claimed = await claimFreeEval(session.userId, session.isPro, 'OIR');
    if (!claimed) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have used your free OIR test. Upgrade to Pro for unlimited attempts.',
          reason: 'free_limit_reached',
          upgradeUrl: '/pricing',
        },
        { status: 403 },
      );
    }

    const allQuestions: (OirQuestion & { __source: string; __sourceIndex: number })[] = [
      ...(Array.isArray(analogy) ? analogy : []).map((q, idx) => ({ ...(q as OirQuestion), __source: 'analogy', __sourceIndex: idx })),
      ...(Array.isArray(codeDe) ? codeDe : []).map((q, idx) => ({ ...(q as OirQuestion), __source: 'codeDe', __sourceIndex: idx })),
      ...(Array.isArray(dice) ? dice : []).map((q, idx) => ({ ...(q as OirQuestion), __source: 'dice', __sourceIndex: idx })),
      ...(Array.isArray(dictonary) ? dictonary : []).map((q, idx) => ({ ...(q as OirQuestion), __source: 'dictonary', __sourceIndex: idx })),
      ...(Array.isArray(number) ? number : []).map((q, idx) => ({ ...(q as OirQuestion), __source: 'number', __sourceIndex: idx })),
      ...(Array.isArray(odd) ? odd : []).map((q, idx) => ({ ...(q as OirQuestion), __source: 'odd', __sourceIndex: idx })),
      ...(Array.isArray(rank) ? rank : []).map((q, idx) => ({ ...(q as OirQuestion), __source: 'rank', __sourceIndex: idx })),
      ...(Array.isArray(rearrange) ? rearrange : []).map((q, idx) => ({ ...(q as OirQuestion), __source: 'rearrange', __sourceIndex: idx })),
      ...(Array.isArray(sym) ? sym : []).map((q, idx) => ({ ...(q as OirQuestion), __source: 'sym', __sourceIndex: idx })),
      ...(Array.isArray(wordProb) ? wordProb : []).map((q, idx) => ({ ...(q as OirQuestion), __source: 'wordProb', __sourceIndex: idx }))
    ];

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions available' },
        { status: 500 }
      );
    }

    // Step 1 - Random Question Count (35 to 50), capped by available pool
    const randomQuestionCount = Math.floor(Math.random() * (50 - 35 + 1)) + 35;
    const questionCount = Math.min(randomQuestionCount, allQuestions.length);

    let selectedBase: (OirQuestion & { __source: string; __sourceIndex: number })[] = [];

    {
      // The CREATE TABLE / CREATE INDEX that used to run here on every single
      // request is gone. `OirQuestionHistory` is declared in schema.prisma, so the
      // runtime DDL was a duplicate definition free to drift, cost two extra
      // round-trips per test, and required the production app role to hold
      // CREATE TABLE privileges. It existed only because the project had no
      // migrations; it now does.
      const seenRows = await prisma.oirQuestionHistory.findMany({
        where: { userId: session.userId },
        select: { questionKey: true },
      });

      const seenSet = new Set((seenRows || []).map((r) => r.questionKey));
      const unseenPool = allQuestions.filter((q) => !seenSet.has(toQuestionKey(q)));

      shuffleInPlace(unseenPool);
      selectedBase = unseenPool.slice(0, questionCount);

      // Fallback: if unseen pool is exhausted, fill remaining from total pool (no duplicates within current paper)
      if (selectedBase.length < questionCount) {
        const selectedKeys = new Set(selectedBase.map((q) => toQuestionKey(q)));
        const remainingPool = allQuestions.filter((q) => !selectedKeys.has(toQuestionKey(q)));
        shuffleInPlace(remainingPool);
        selectedBase = [...selectedBase, ...remainingPool.slice(0, questionCount - selectedBase.length)];
      }

      // Persist served questions as seen (parameterized — no manual escaping)
      if (selectedBase.length > 0) {
        await prisma.oirQuestionHistory.createMany({
          data: selectedBase.map((q) => ({
            userId: session.userId,
            questionKey: toQuestionKey(q),
          })),
          skipDuplicates: true,
        });
      }
    }

    // Keep response format expected by frontend
    const selectedQuestions = selectedBase.map((q, index) => ({
      ...q,
      originalId: q.id,
      id: index + 1
    }));

    return NextResponse.json({
      success: true,
      data: selectedQuestions,
      totalQuestions: questionCount,
    });
  } catch (error) {
    console.error('Error generating OIR test:', error);
    return NextResponse.json(
      { error: 'Failed to generate test' },
      { status: 500 }
    );
  }
}
