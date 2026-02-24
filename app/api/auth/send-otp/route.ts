import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

// Use environment variable, fallback only for type checker (don't use fallback in prod)
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            // To prevent email enumeration, return a "success" response even if user doesn't exist
            return NextResponse.json({ message: 'If the email exists, an OTP has been sent.' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

        // Store OTP in database
        await prisma.otp.create({
            data: {
                email: normalizedEmail,
                otp,
                expiresAt,
            },
        });

        // Send OTP via Resend
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'LakshyaSSB <onboarding@resend.dev>', // Change to your verified domain in production
                to: normalizedEmail,
                subject: 'Your LakshyaSSB Login OTP',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #f97316;">LakshyaSSB</h2>
                        <p>Your One-Time Password (OTP) for login is:</p>
                        <h1 style="font-size: 32px; letter-spacing: 5px; color: #111827; background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">${otp}</h1>
                        <p style="color: #6b7280; font-size: 14px;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
                    </div>
                `,
            });
        } else {
            console.log(`[DEV MODE] OTP for ${normalizedEmail} is ${otp}`);
        }

        return NextResponse.json({ message: 'If the email exists, an OTP has been sent.' });

    } catch (error) {
        console.error('[send-otp]', error);
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}
