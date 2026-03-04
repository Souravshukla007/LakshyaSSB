import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized', isGuest: true }, { status: 401 });
        }

        // PRO users have unlimited access
        if (session.plan === 'PRO') {
            return NextResponse.json({
                isGuest: false,
                isPro: true,
                modules: {
                    OIR: { allowed: true },
                    WAT: { allowed: true },
                    TAT: { allowed: true },
                    SRT: { allowed: true },
                    LECTURETTE: { allowed: true },
                }
            });
        }

        // FREE users check - Group by module to get counts
        const attempts = await prisma.practiceAttempt.groupBy({
            by: ['module'],
            where: {
                userId: session.userId,
            },
            _count: {
                _all: true,
            },
        });

        // Map attempts to a dictionary
        const counts: Record<string, number> = {};
        attempts.forEach((a: any) => {
            counts[a.module] = a._count._all;
        });

        return NextResponse.json({
            isGuest: false,
            isPro: false,
            modules: {
                OIR: { allowed: (counts['OIR'] || 0) < 1 },
                WAT: { allowed: (counts['WAT'] || 0) < 1 },
                TAT: { allowed: (counts['TAT'] || 0) < 1 },
                SRT: { allowed: (counts['SRT'] || 0) < 1 },
                LECTURETTE: { allowed: (counts['LECTURETTE'] || 0) < 1 },
            }
        });

    } catch (error) {
        console.error('[ACCESS_STATUS_ERROR]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
