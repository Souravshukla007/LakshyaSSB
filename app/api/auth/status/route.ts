import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // Added prisma import

export async function GET() {
    try {
        const session = await getSession();
        if (session) {
            // Fetch live user from DB to ensure PRO status is always perfectly up to date
            const user = await prisma.user.findUnique({
                where: { id: session.userId },
                select: { plan: true }
            });

            if (user) {
                return NextResponse.json({ 
                    isLoggedIn: true, 
                    email: session.email,
                    plan: user.plan  // Pass real-time plan back to UI
                });
            }
        }
        return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    } catch (error) {
        console.error("Auth status error:", error);
        return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    }
}
