import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fullName, email, password } = body;

        // Validate
        if (!fullName || !email || !password) {
            return NextResponse.json({ error: 'Full name, email and password are required' }, { status: 400 });
        }

        if (typeof fullName !== 'string' || fullName.trim().length < 2) {
            return NextResponse.json({ error: 'Full name must be at least 2 characters' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (existing) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                fullName: fullName.trim(),
                email: email.toLowerCase().trim(),
                passwordHash,
                plan: 'FREE',
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                plan: true,
                planExpiry: true,
                createdAt: true,
            },
        });

        await signSession({
            userId: user.id,
            email: user.email,
            plan: 'FREE',
            planExpiry: null,
        });

        return NextResponse.json(
            { message: 'Account created successfully', user },
            { status: 201 }
        );
    } catch (error) {
        console.error('[signup]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
