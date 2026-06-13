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
                current_streak: true,
                medals_total: true,
                medals_weekly: true,
                last_login: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const now = new Date();
        const lastLogin = user.last_login;
        let isNewDay = true;

        if (lastLogin) {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());

            if (today.getTime() === lastLoginDate.getTime()) {
                // Already logged in today
                isNewDay = false;
            }
        }

        if (isNewDay) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    medals_total: { increment: 1 },
                    medals_weekly: { increment: 1 },
                    last_login: now
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
