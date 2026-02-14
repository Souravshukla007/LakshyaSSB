import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { firstName, lastName, email, targetEntry, password } = body;

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName: firstName || null,
                lastName: lastName || null,
                targetEntry: targetEntry || null,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                targetEntry: true,
                createdAt: true,
            },
        });

        // Create session
        await signSession({
            user: {
                id: user.id,
                email: user.email,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                entry: user.targetEntry || '',
            },
        });

        return NextResponse.json(
            {
                message: 'Account created successfully',
                user,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
