import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';

/**
 * POST /api/account/logout-all
 * Clears the session cookie for the current device.
 * At this scale (stateless JWT) this effectively logs out the user.
 */
export async function POST() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    (await cookies()).set('session', '', { expires: new Date(0), path: '/' });

    return NextResponse.json({ success: true });
}
