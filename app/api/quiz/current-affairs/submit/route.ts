import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { completePracticeForUser } from '@/lib/streak'; 

export async function POST(request: Request) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { score, totalQuestions, timeTaken } = body;

        // Validation against spam/cheat (score max 10)
        let actualScore = Number(score) || 0;
        if (actualScore < 0) actualScore = 0;
        if (actualScore > 10) actualScore = 10;

        // 1. Transactionally update medals + user metrics + log
        await prisma.$transaction(async (tx: any) => {
            // Give 1 medal per correct answer
            const medalsEarned = actualScore;

            await tx.user.update({
                where: { id: session.userId },
                data: {
                    medals_total: { increment: medalsEarned },
                    medals_weekly: { increment: medalsEarned }
                }
            });

            // Log activity to prevent users from spamming the system if we decide to enforce 1/day
            await tx.activityLog.create({
                data: {
                    userId: session.userId,
                    action: "DAILY_CA_QUIZ",
                    details: `Scored ${actualScore}/${totalQuestions} in ${timeTaken}s`
                }
            });
        });

        // Trigger streak update check
        await completePracticeForUser(session.userId, 'NEWS');

        return NextResponse.json({ success: true, message: "Score submitted", medalsEarned: actualScore });

    } catch (error) {
        console.error("Quiz Submit API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to submit score" }, { status: 500 });
    }
}
