import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api — unauthenticated health check.
 *
 * Keep the body minimal. This endpoint previously answered
 *   { message: 'API is working!', database: 'Connected to PostgreSQL', … }
 * to anyone on the internet, which names the datastore for free. A health check
 * only needs to say "up"; the status code already carries the signal, and the
 * error path deliberately keeps Prisma detail in the server log because those
 * messages embed table, column and sometimes connection-target names.
 */
export async function GET() {
    try {
        await prisma.$connect();
        return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('[api] health check failed', error);
        return NextResponse.json({ ok: false }, { status: 503 });
    }
}
