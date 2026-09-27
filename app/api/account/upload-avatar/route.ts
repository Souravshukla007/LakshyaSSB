import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    AvatarStorageError,
    MAX_AVATAR_BYTES,
    deleteAvatarIfManaged,
    isAvatarStorageConfigured,
    uploadAvatar,
} from '@/lib/avatar-storage';

/**
 * POST /api/account/upload-avatar
 *
 * Stores the image in object storage and saves only its URL on the user row.
 *
 * This used to write the raw base64 `data:` URL straight into
 * `User.profileImageUrl` (`@db.Text`). On production data that produced avatars up
 * to 1.98 MB *per row*, which is why `/api/leaderboard` had to stop selecting the
 * column (it was taking 15–22s and everyone lost their picture), and why
 * `/api/account/me` — called by the navbar on every single page load — was shipping
 * megabytes of JSON.
 *
 * Accepts two body shapes:
 *   - `multipart/form-data` with a `file` field (preferred; the account page now
 *     downscales client-side before sending, so this is usually 20–60 KB), and
 *   - `application/json` with `{ image: "data:image/..." }`, the legacy shape, so an
 *     older cached client bundle or the Android WebView keeps working during rollout.
 *
 * Either way the bytes are sniffed for a real image signature and stored as a file.
 */
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAvatarStorageConfigured()) {
        // Explicit and loud: silently falling back to storing base64 in Postgres
        // would quietly reintroduce the exact problem this endpoint was rewritten
        // to remove.
        return NextResponse.json(
            {
                error: 'Avatar storage is not configured on the server.',
                reason: 'storage_unconfigured',
            },
            { status: 503 },
        );
    }

    try {
        const contentType = request.headers.get('content-type') || '';
        let bytes: Uint8Array;

        if (contentType.includes('multipart/form-data')) {
            const form = await request.formData();
            const file = form.get('file');
            if (!(file instanceof File)) {
                return NextResponse.json({ error: 'No image provided' }, { status: 400 });
            }
            if (file.size > MAX_AVATAR_BYTES) {
                return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 });
            }
            bytes = new Uint8Array(await file.arrayBuffer());
        } else {
            const body = await request.json();
            const image = body?.image;

            if (!image || typeof image !== 'string') {
                return NextResponse.json({ error: 'No image provided' }, { status: 400 });
            }
            if (!image.startsWith('data:image/')) {
                return NextResponse.json(
                    { error: 'Invalid image format. Must be a data URL.' },
                    { status: 400 },
                );
            }

            const base64 = image.slice(image.indexOf(',') + 1);
            // Check the decoded size before allocating: base64 is ~33% larger than
            // the bytes it encodes, so the string length alone over-reports.
            const approxBytes = Math.ceil((base64.length * 3) / 4);
            if (approxBytes > MAX_AVATAR_BYTES) {
                return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 });
            }
            bytes = new Uint8Array(Buffer.from(base64, 'base64'));
        }

        if (bytes.byteLength === 0) {
            return NextResponse.json({ error: 'Image is empty' }, { status: 400 });
        }

        // Read the current value first so the old file can be cleaned up afterwards.
        const before = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { profileImageUrl: true },
        });

        const url = await uploadAvatar(session.userId, bytes);

        await prisma.user.update({
            where: { id: session.userId },
            data: { profileImageUrl: url },
        });

        await prisma.activityLog.create({
            data: {
                userId: session.userId,
                action: 'AVATAR_UPLOAD',
                details: 'Profile picture updated',
            },
        });

        // Best-effort: the DB already points at the new file, so a failure here only
        // leaves an orphaned blob.
        await deleteAvatarIfManaged(before?.profileImageUrl);

        // The URL is returned so the client can render it without a full reload.
        return NextResponse.json({
            success: true,
            message: 'Avatar updated successfully',
            url,
        });
    } catch (error) {
        if (error instanceof AvatarStorageError) {
            const status =
                error.kind === 'too_large' || error.kind === 'bad_format'
                    ? 400
                    : error.kind === 'unconfigured'
                        ? 503
                        : 502;
            return NextResponse.json({ error: error.message, reason: error.kind }, { status });
        }
        console.error('[upload-avatar]', error);
        return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }
}

/**
 * DELETE /api/account/upload-avatar
 * Remove the user's avatar, and the stored file with it.
 */
export async function DELETE() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const before = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { profileImageUrl: true },
        });

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

        // Clearing the column alone would leak the file forever. Only blobs this app
        // uploaded are deleted — a Google OAuth picture URL is not ours to remove.
        await deleteAvatarIfManaged(before?.profileImageUrl);

        return NextResponse.json({ success: true, message: 'Avatar removed' });
    } catch (error) {
        console.error('[upload-avatar DELETE]', error);
        return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
    }
}
