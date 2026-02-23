import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { awardMedals, AwardType } from '@/lib/medals';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { type?: string; score?: number };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { type, score } = body;
    const VALID_TYPES: AwardType[] = ['login', 'piq', 'daily_question'];

    if (!type || !VALID_TYPES.includes(type as AwardType)) {
        return NextResponse.json(
            { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
            { status: 400 },
        );
    }

    if (type === 'piq' && (typeof score !== 'number' || score < 0 || score > 100)) {
        return NextResponse.json(
            { error: 'score must be a number 0–100 for PIQ type' },
            { status: 400 },
        );
    }

    try {
        const result = await awardMedals(session.userId, type as AwardType, score);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[medals/award]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
