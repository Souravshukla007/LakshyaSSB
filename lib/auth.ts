import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Read from env — never hard-code in production
const secretKey = process.env.JWT_SECRET ?? 'fallback-dev-secret-change-me';
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
    userId: string;
    email: string;
    plan: 'FREE' | 'PRO';
    planExpiry: string | null; // ISO string
    expires: string;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
    return await new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // 7-day rolling session
        .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
}

export async function signSession(payload: Omit<SessionPayload, 'expires'>) {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const full: SessionPayload = { ...payload, expires: expires.toISOString() };
    const token = await encrypt(full);

    (await cookies()).set('session', token, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
}

export async function logout() {
    (await cookies()).set('session', '', { expires: new Date(0), path: '/' });
}

export async function getSession(): Promise<SessionPayload | null> {
    const session = (await cookies()).get('session')?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch {
        return null;
    }
}

export async function updateSession(request: NextRequest): Promise<NextResponse | undefined> {
    const session = request.cookies.get('session')?.value;
    if (!session) return;

    try {
        const parsed = await decrypt(session);
        const newExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        parsed.expires = newExpires.toISOString();

        const res = NextResponse.next();
        res.cookies.set({
            name: 'session',
            value: await encrypt(parsed),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: newExpires,
            path: '/',
        });
        return res;
    } catch {
        return;
    }
}
