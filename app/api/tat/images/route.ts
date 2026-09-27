import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { requireUser } from '@/lib/entitlement';

// All 44 available TAT image filenames in public/tat/
const ALL_TAT_IMAGES = Array.from({ length: 44 }, (_, i) =>
    `/tat/tat${String(i + 1).padStart(2, '0')}.jpg`
);

// Fisher-Yates shuffle using a CSPRNG so the sequence isn't predictable from
// a previously observed set.
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = randomInt(0, i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * GET /api/tat/images
 *
 * Requires a signed-in user. This was fully public, so the whole TAT stimulus set
 * could be enumerated by anyone — which both devalues the test and lets a
 * candidate pre-write stories for every image.
 */
export async function GET() {
    const gate = await requireUser();
    if (gate.response) return gate.response;

    // Pick 11 random images from the pool, then append blank slide ('')
    const selected = shuffle(ALL_TAT_IMAGES).slice(0, 11);
    selected.push(''); // blank slide last
    return NextResponse.json({ images: selected });
}
