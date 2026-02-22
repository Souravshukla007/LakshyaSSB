import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/account/change-password
 * Verifies current password before updating to new one.
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

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash },
    });

    return NextResponse.json({ success: true });
}
