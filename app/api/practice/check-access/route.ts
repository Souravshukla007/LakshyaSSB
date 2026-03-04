import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized', allowed: false }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const moduleName = searchParams.get('module')?.toUpperCase();

        if (!moduleName) {
            return NextResponse.json({ error: 'Module parameter is required', allowed: false }, { status: 400 });
        }

        // PRO users have unlimited access
        if (session.plan === 'PRO') {
            return NextResponse.json({ allowed: true, attempts: 0 });
        }

        // FREE users check
        const attemptCount = await prisma.practiceAttempt.count({
            where: {
                userId: session.userId,
                module: moduleName
            }
        });

        if (attemptCount === 0) {
            return NextResponse.json({ allowed: true, attempts: attemptCount });
        } else {
            return NextResponse.json({ allowed: false, attempts: attemptCount, reason: 'limit_reached' });
        }
    } catch (error) {
        console.error('[CHECK_ACCESS_ERROR]', error);
        return NextResponse.json({ error: 'Internal server error', allowed: false }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const moduleName = body.module?.toUpperCase();

        if (!moduleName) {
            return NextResponse.json({ error: 'Module required' }, { status: 400 });
        }

        // Log the attempt
        await prisma.practiceAttempt.create({
            data: {
                userId: session.userId,
                module: moduleName,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[RECORD_ATTEMPT_ERROR]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
