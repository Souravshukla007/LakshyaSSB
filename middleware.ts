import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    // Update session expiration if it exists
    await updateSession(request);

    // Protect dashboard route
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const session = request.cookies.get('session')?.value;
        if (!session) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
