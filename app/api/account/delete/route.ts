import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
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

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
    }

    // Cascade delete payments via schema onDelete: Cascade
    await prisma.user.delete({ where: { id: session.userId } });

    // Clear session cookie
    (await cookies()).set('session', '', { expires: new Date(0), path: '/' });

    return NextResponse.json({ success: true });
}
