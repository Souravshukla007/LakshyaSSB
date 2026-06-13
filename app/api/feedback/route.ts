import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            userType,
            rating,
            features,
            suggestion,
            isAnonymous
        } = body;

        // Validation
        if (!userType || !rating || !suggestion) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Rating must be an integer between 1 and 5
        const ratingNum = Number(rating);
        if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return NextResponse.json(
                { error: 'Rating must be an integer between 1 and 5' },
                { status: 400 }
            );
        }

        // Try to get session to link user, optional
        let userId: string | null = null;
        try {
            const session = await getSession();
            if (session && session.userId && !isAnonymous) {
                userId = session.userId;
            }
        } catch (e) {
            // Ignore if no session or error fetching session
        }

        const feedback = await prisma.feedback.create({
            data: {
                userId,
                name: isAnonymous ? null : name,
                email: isAnonymous ? null : email,
                userType,
                rating: ratingNum,
                features: features || [],
                suggestion,
                isAnonymous: Boolean(isAnonymous),
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Feedback submitted successfully',
            feedbackId: feedback.id
        });

    } catch (error) {
        console.error('[feedback_api]', error);
        return NextResponse.json(
            { error: 'Internal server error while saving feedback' },
            { status: 500 }
        );
    }
}
