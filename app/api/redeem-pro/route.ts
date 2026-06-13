import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PRO_COST = 49;

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
            plan: true,
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.plan === 'PRO') {
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

    // Atomic, race-safe redemption: only decrements + upgrades if the user is
    // still non-PRO AND has enough medals at the moment of the write. This
    // prevents concurrent requests from driving medals negative or double-granting.
    const result = await prisma.user.updateMany({
        where: {
            id: session.userId,
            plan: { not: 'PRO' },
            medals_total: { gte: PRO_COST },
        },
        data: {
            medals_total: { decrement: PRO_COST },
            plan: 'PRO',
        },
    });

    if (result.count === 0) {
        // Lost the race (already PRO or medals changed) — re-read for an accurate message
        const fresh = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { medals_total: true, plan: true },
        });
        if (fresh?.plan === 'PRO') {
            return NextResponse.json(
                { error: 'You are already a Pro member via medal redemption.' },
                { status: 409 },
            );
        }
        return NextResponse.json(
            {
                error: `Not enough medals. You need ${PRO_COST}, but have ${fresh?.medals_total ?? 0}.`,
                medals_total: fresh?.medals_total ?? 0,
                required: PRO_COST,
            },
            { status: 422 },
        );
    }

    const updated = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            medals_total: true,
            medals_weekly: true,
            plan: true,
        },
    });

    // Create activity log
    await prisma.activityLog.create({
        data: {
            userId: session.userId,
            action: 'PRO_REDEEM',
            details: `Redeemed PRO membership using ${PRO_COST} medals.`,
        }
    });

    return NextResponse.json({
        message: 'Congratulations! You are now a Pro member! 🎖️',
        isPro: updated?.plan === 'PRO',
        medals_total: updated?.medals_total ?? 0,
        medals_weekly: updated?.medals_weekly ?? 0,
    });
}
