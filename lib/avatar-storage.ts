/**
 * lib/avatar-storage.ts
 *
 * The single boundary between the app and wherever avatar images physically live.
 *
 * Why this file exists: avatars used to be stored as base64 `data:` URLs inside the
 * `User.profileImageUrl` column (`@db.Text`). Measured on production data, the
 * top-50 leaderboard slice held **5.5 MB** of avatar bytes with a single avatar as
 * large as **1.98 MB**. That had three consequences:
 *
 *   1. `/api/leaderboard` had to stop selecting the column at all (it was taking
 *      15–22s), which is why every user except the caller lost their picture.
 *   2. `/api/account/me` still returns the caller's avatar inline, and
 *      `components/Navbar.tsx` calls it on *every page load* — so each navigation
 *      shipped up to ~2 MB of JSON.
 *   3. Postgres was being used as a CDN, with no caching and no image resizing.
 *
 * Images now go to object storage and the column holds a short URL. Google OAuth
 * users were already storing a plain `https://` URL from `payload.picture`, so URLs
 * in that column are not a new shape — this makes them the *only* shape.
 */

import { put, del } from '@vercel/blob';

/** Cap on the stored image. The client downscales first; this is the backstop. */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

/** Formats we accept. Validated against magic bytes, not the declared MIME type. */
const ACCEPTED = [
    { mime: 'image/jpeg', ext: 'jpg', matches: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    { mime: 'image/png', ext: 'png', matches: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
    {
        mime: 'image/webp',
        ext: 'webp',
        // "RIFF" .... "WEBP"
        matches: (b: Uint8Array) =>
            b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
            b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
    },
    {
        mime: 'image/gif',
        ext: 'gif',
        matches: (b: Uint8Array) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
    },
];

export class AvatarStorageError extends Error {
    constructor(message: string, readonly kind: 'unconfigured' | 'too_large' | 'bad_format' | 'upstream') {
        super(message);
        this.name = 'AvatarStorageError';
    }
}

/**
 * True when object storage is usable. Checked before any write so the API can
 * return a clear 503 instead of a stack trace from the SDK.
 */
export function isAvatarStorageConfigured(): boolean {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/**
 * Sniff the real image type. The browser-supplied `Content-Type` is
 * attacker-controlled, so it is never trusted on its own — a file claiming
 * `image/png` while containing something else would otherwise be stored and then
 * served back to other users from our own origin.
 */
export function detectImageType(bytes: Uint8Array): { mime: string; ext: string } {
    const match = ACCEPTED.find((c) => c.matches(bytes));
    if (!match) {
        throw new AvatarStorageError(
            'Unsupported image format. Use JPEG, PNG, WebP or GIF.',
            'bad_format',
        );
    }
    return { mime: match.mime, ext: match.ext };
}

/**
 * True for a URL this app uploaded and is therefore allowed to delete.
 *
 * Google OAuth avatars (`lh3.googleusercontent.com/...`) also live in this column
 * and must never be passed to `del()` — they are not ours, and attempting it would
 * be both wrong and a confusing failure.
 */
export function isManagedAvatarUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)
        || /^https:\/\/[a-z0-9]+\.blob\.vercel-storage\.com\//i.test(url);
}

/** True for the legacy inline form this module exists to eliminate. */
export function isInlineDataUrl(url: string | null | undefined): boolean {
    return Boolean(url && url.startsWith('data:'));
}

/**
 * Store an avatar and return its public URL.
 *
 * `addRandomSuffix` is on so a replacement never collides with, or silently
 * overwrites, a previous file — and so a cached CDN copy of the old avatar can
 * never be served for the new one.
 */
export async function uploadAvatar(userId: string, bytes: Uint8Array): Promise<string> {
    if (!isAvatarStorageConfigured()) {
        throw new AvatarStorageError(
            'BLOB_READ_WRITE_TOKEN is not set, so avatar uploads cannot be stored.',
            'unconfigured',
        );
    }

    if (bytes.byteLength > MAX_AVATAR_BYTES) {
        throw new AvatarStorageError('Image must be under 2MB', 'too_large');
    }

    const { mime, ext } = detectImageType(bytes);

    try {
        const blob = await put(`avatars/${userId}.${ext}`, Buffer.from(bytes), {
            access: 'public',
            contentType: mime,
            addRandomSuffix: true,
            // Avatars are immutable once written (a change produces a new URL), so
            // they can be cached hard. This is the caching Postgres never gave us.
            cacheControlMaxAge: 60 * 60 * 24 * 365,
        });
        return blob.url;
    } catch (err) {
        throw new AvatarStorageError(
            err instanceof Error ? err.message : 'Avatar upload failed',
            'upstream',
        );
    }
}

/**
 * Delete a previously uploaded avatar, if we own it.
 *
 * Never throws: this runs after the database has already been updated, and an
 * orphaned blob is a storage-cost problem, not a user-facing failure. Failing the
 * request here would tell the user their avatar change did not work when it did.
 */
export async function deleteAvatarIfManaged(url: string | null | undefined): Promise<void> {
    if (!isManagedAvatarUrl(url) || !isAvatarStorageConfigured()) return;
    try {
        await del(url as string);
    } catch (err) {
        console.warn('[avatar-storage] orphaned blob, delete failed:', url, err);
    }
}
