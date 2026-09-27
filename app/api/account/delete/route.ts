import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession, clearSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/account/delete
 * Requires password confirmation. Deletes user + all payments (cascade).
 * Clears session cookie on success.
 */
export async function DELETE(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
        return NextResponse.json({ error: 'Password confirmation required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { passwordHash: true },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.passwordHash === null) {
        return NextResponse.json({ error: 'This account uses Google sign-in. Account deletion is restricted.' }, { status: 400 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
    }

    // Cascade delete payments via schema onDelete: Cascade
    await prisma.user.delete({ where: { id: session.userId } });

    // Clear the cookie with attributes mirroring how it was set. Tokens still held
    // by other devices now fail `getSession()` because the user row is gone, so
    // they are rejected cleanly instead of reaching handlers that assume the user
    // exists and hitting foreign-key errors.
    await clearSessionCookie();

    return NextResponse.json({ success: true });
}
