import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PRO_COST = 99;

export async function POST() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            id: true,
            fullName: true,
            medals_total: true,
            is_pro: true,
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.is_pro) {
        return NextResponse.json(
            { error: 'You are already a Pro member via medal redemption.' },
            { status: 409 },
        );
    }

    if (user.medals_total < PRO_COST) {
        return NextResponse.json(
            {
                error: `Not enough medals. You need ${PRO_COST}, but have ${user.medals_total}.`,
                medals_total: user.medals_total,
                required: PRO_COST,
                shortfall: PRO_COST - user.medals_total,
            },
            { status: 422 },
        );
    }

    // Atomic decrement + flag set
    const updated = await prisma.user.update({
        where: { id: session.userId },
        data: {
            medals_total: { decrement: PRO_COST },
            is_pro: true,
        },
        select: {
            medals_total: true,
            medals_weekly: true,
            is_pro: true,
        },
    });

    return NextResponse.json({
        message: 'Congratulations! You are now a Pro member! 🎖️',
        is_pro: updated.is_pro,
        medals_total: updated.medals_total,
        medals_weekly: updated.medals_weekly,
    });
}
