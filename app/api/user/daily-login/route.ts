import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
            select: {
                id: true,
                last_login: true,
                current_streak: true,
                longest_streak: true,
                medals_total: true,
                medals_weekly: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const now = new Date();
        const lastLogin = user.last_login;
        let isNewDay = true;
        let isMissedDay = false;

        if (lastLogin) {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());

            const diffTime = Math.abs(today.getTime() - lastLoginDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Already logged in today
                isNewDay = false;
            } else if (diffDays > 1) {
                // Missed at least one calendar day
                isMissedDay = true;
            }
        }

        if (isNewDay) {
            const newStreak = isMissedDay ? 1 : user.current_streak + 1;
            const newLongestStreak = Math.max(newStreak, user.longest_streak);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    last_login: now,
                    current_streak: newStreak,
                    longest_streak: newLongestStreak,
                    medals_total: { increment: 1 },
                    medals_weekly: { increment: 1 }
                }
            });
            return NextResponse.json({ message: 'Daily login bonus awarded!', awarded: true });
        }

        return NextResponse.json({ message: 'Already logged in today', awarded: false });

    } catch (error) {
        console.error('Error tracking daily login:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
