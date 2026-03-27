import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ messages: [] }, { status: 401 });
        }

        const chatHistory = await prisma.chatMessage.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'asc' },
            select: { role: true, content: true } // Only return needed fields
        });

        return NextResponse.json({ messages: chatHistory });
    } catch (error) {
        console.error("Chat History Error:", error);
        return NextResponse.json({ messages: [], error: 'Internal Server Error' }, { status: 500 });
    }
}
