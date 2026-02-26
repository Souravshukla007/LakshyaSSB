import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

export async function GET() {
    try {
        const session = await getSession();
        if (session) {
            return NextResponse.json({ isLoggedIn: true, email: session.email });
        }
        return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    } catch {
        return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    }
}
