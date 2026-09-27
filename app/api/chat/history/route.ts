import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            // Consistent shape: a 401 carries an error and a reason, not a
            // success-looking empty payload.
            return NextResponse.json(
                { error: 'Unauthorized', reason: 'unauthenticated', messages: [] },
                { status: 401 },
            );
        }

        // Bounded: this had no `take`, so an active user's entire message log was
        // fetched and serialised on every chat mount. Take the newest 100 and
        // return them in chronological order for rendering.
        const recent = await prisma.chatMessage.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: { role: true, content: true },
        });

        return NextResponse.json({ messages: recent.reverse() });
    } catch (error) {
        console.error("Chat History Error:", error);
        return NextResponse.json({ messages: [], error: 'Internal Server Error' }, { status: 500 });
    }
}
