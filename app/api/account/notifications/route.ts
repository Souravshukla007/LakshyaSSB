import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/account/notifications
 * Returns notification preferences, auto-creates defaults if first time.
 */
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let prefs = await prisma.notificationPref.findUnique({
            where: { userId: session.userId },
        });

        // Auto-create with defaults if no prefs exist
        if (!prefs) {
            prefs = await prisma.notificationPref.create({
                data: { userId: session.userId },
            });
        }

        return NextResponse.json({
            loginAlerts: prefs.loginAlerts,
            weeklyDigest: prefs.weeklyDigest,
            promoEmails: prefs.promoEmails,
        });
    } catch (error) {
        console.error('[notifications GET]', error);
        return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }
}

/**
 * PATCH /api/account/notifications
 * Update notification preference toggles.
 */
export async function PATCH(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { loginAlerts, weeklyDigest, promoEmails } = body;

        // Build update data with only provided booleans
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: Record<string, any> = {};
        if (typeof loginAlerts === 'boolean') data.loginAlerts = loginAlerts;
        if (typeof weeklyDigest === 'boolean') data.weeklyDigest = weeklyDigest;
        if (typeof promoEmails === 'boolean') data.promoEmails = promoEmails;

        const updated = await prisma.notificationPref.upsert({
            where: { userId: session.userId },
            update: data,
            create: {
                userId: session.userId,
                ...data,
            },
        });

        return NextResponse.json({
            loginAlerts: updated.loginAlerts,
            weeklyDigest: updated.weeklyDigest,
            promoEmails: updated.promoEmails,
        });
    } catch (error) {
        console.error('[notifications PATCH]', error);
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }
}
