import { NextResponse } from 'next/server';

// All 44 available TAT image filenames in public/tat/
const ALL_TAT_IMAGES = Array.from({ length: 44 }, (_, i) =>
    `/tat/tat${String(i + 1).padStart(2, '0')}.jpg`
);

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export async function GET() {
    // Pick 11 random images from the pool, then append blank slide ('')
    const selected = shuffle(ALL_TAT_IMAGES).slice(0, 11);
    selected.push(''); // blank slide last
    return NextResponse.json({ images: selected });
}
