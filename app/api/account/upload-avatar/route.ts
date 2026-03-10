import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * POST /api/account/upload-avatar
 * Accepts a base64 data URL image, validates size/format, stores in DB.
 */
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { image } = body;

        if (!image || typeof image !== 'string') {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Validate it's a data URL
        if (!image.startsWith('data:image/')) {
            return NextResponse.json({ error: 'Invalid image format. Must be a data URL.' }, { status: 400 });
        }

        // Check size (~base64 is ~33% larger than binary)
        const sizeInBytes = Math.ceil((image.length * 3) / 4);
        if (sizeInBytes > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 });
        }

        // Save to DB
        await prisma.user.update({
            where: { id: session.userId },
            data: { profileImageUrl: image },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: session.userId,
                action: 'AVATAR_UPLOAD',
                details: 'Profile picture updated',
            },
        });

        return NextResponse.json({ success: true, message: 'Avatar updated successfully' });
    } catch (error) {
        console.error('[upload-avatar]', error);
        return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }
}

/**
 * DELETE /api/account/upload-avatar
 * Remove the user's avatar.
 */
export async function DELETE() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.user.update({
            where: { id: session.userId },
            data: { profileImageUrl: null },
        });

        await prisma.activityLog.create({
            data: {
                userId: session.userId,
                action: 'AVATAR_REMOVE',
                details: 'Profile picture removed',
            },
        });

        return NextResponse.json({ success: true, message: 'Avatar removed' });
    } catch (error) {
        console.error('[upload-avatar DELETE]', error);
        return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
    }
}
