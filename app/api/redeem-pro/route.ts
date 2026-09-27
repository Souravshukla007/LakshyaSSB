import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { syncSessionPlan } from '@/lib/entitlement';
import { prisma } from '@/lib/prisma';

/**
 * Medals are a currency, and this is the only place that spends them.
 *
 * The conditional `updateMany` below is race-safe, but that was never the weak
 * point — the weak point was medal *supply*. A `POST /api/medals/award` endpoint
 * let the client pick both the event type and the score, so any free user could
 * mint 50 medals in five requests and buy PRO here for nothing. That endpoint has
 * been deleted; medals are now only awarded by server code that observed the work.
 */
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

    // Align the cookie's plan hint with the database right away, so the user
    // isn't told to upgrade on the very next page load.
    await syncSessionPlan(session, 'PRO');

    return NextResponse.json({
        message: 'Congratulations! You are now a Pro member! 🎖️',
        isPro: updated?.plan === 'PRO',
        medals_total: updated?.medals_total ?? 0,
        medals_weekly: updated?.medals_weekly ?? 0,
    });
}
