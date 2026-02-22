import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: {
                id: true,
                email: true,
                fullName: true,
                passwordHash: true,
                plan: true,
                planExpiry: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        await signSession({
            userId: user.id,
            email: user.email,
            plan: user.plan as 'FREE' | 'PRO',
            planExpiry: user.planExpiry ? user.planExpiry.toISOString() : null,
        });

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                plan: user.plan,
                planExpiry: user.planExpiry,
            },
        });
    } catch (error) {
        console.error('[login]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
