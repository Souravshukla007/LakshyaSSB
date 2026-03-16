import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { completePracticeForUser, PracticeActivityType } from '@/lib/streak';

const VALID_TYPES: PracticeActivityType[] = ['WAT', 'SRT', 'OIR', 'LECTURETTE', 'NEWS', 'FITNESS'];

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const activityType = String(body?.activityType || '').toUpperCase() as PracticeActivityType;

    if (!VALID_TYPES.includes(activityType)) {
      return NextResponse.json(
        { error: `activityType must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await completePracticeForUser(session.userId, activityType);

    return NextResponse.json({
      success: true,
      ...result,
      celebration:
        result.milestoneHit !== null
          ? {
              title: `🔥 ${result.milestoneHit} Day Streak Achieved`,
              reward: `+${result.milestoneBonus} Medal of Honour points`,
            }
          : null,
    });
  } catch (error) {
    console.error('[streak/complete]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
