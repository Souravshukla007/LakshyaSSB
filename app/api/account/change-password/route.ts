import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession, bumpTokenVersion, signSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/account/change-password
 * Verifies the current password, updates it, then revokes every other session.
 */
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Both passwords are required' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { passwordHash: true },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.passwordHash) {
        return NextResponse.json({ error: 'This account uses Google sign-in. Password cannot be changed.' }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
        return NextResponse.json(
            { error: 'The new password must be different from the current one' },
            { status: 400 },
        );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash },
    });

    // A password change is the standard response to a suspected compromise, so it
    // has to revoke sessions. Previously an attacker holding a stolen token kept
    // full access afterwards, which defeated the point of changing it.
    const newVersion = await bumpTokenVersion(session.userId);

    // Re-issue for *this* device so the user who just changed their password
    // isn't the one who gets signed out.
    await signSession({
        userId: session.userId,
        email: session.email,
        plan: session.plan,
        tokenVersion: newVersion,
    });

    // Log password change activity
    await prisma.activityLog.create({
        data: {
            userId: session.userId,
            action: 'PASSWORD_CHANGE',
            details: 'Password changed; other devices signed out',
        },
    });

    return NextResponse.json({
        success: true,
        message: 'Password updated. Other devices have been signed out.',
    });
}
