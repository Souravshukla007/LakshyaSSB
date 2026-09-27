/**
 * lib/ist.ts
 *
 * Every "day" in this product is an IST day, because every user is preparing for
 * an Indian selection board.
 *
 * This exists because the day boundary was implemented three times and one of
 * them was wrong: `lib/medals.ts` and `lib/streak.ts` both used
 * `Asia/Kolkata`, but the chat quota in `app/api/chat/route.ts` used
 * `today.setHours(0,0,0,0)` — server-local midnight, i.e. UTC on Vercel. So an
 * Indian user's chat allowance reset at 05:30 IST while their streak reset at
 * 00:00 IST, and someone chatting at 05:00 and again at 06:00 IST spent from two
 * different "days" and effectively got double the cap inside an hour.
 */

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** IST calendar date as "YYYY-MM-DD". */
export function toISTDateString(d: Date = new Date()): string {
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/** The instant IST midnight occurred for the IST day containing `d`. */
export function startOfISTDay(d: Date = new Date()): Date {
    const [y, m, day] = toISTDateString(d).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS);
}

/** The instant the next IST day begins — useful for "resets in …" copy. */
export function startOfNextISTDay(d: Date = new Date()): Date {
    return new Date(startOfISTDay(d).getTime() + 24 * 60 * 60 * 1000);
}

/** Whole-day difference between two "YYYY-MM-DD" keys (a - b). */
export function istDayDiff(a: string, b: string): number {
    const toUtc = (key: string) => {
        const [y, m, d] = key.split('-').map(Number);
        return Date.UTC(y, m - 1, d);
    };
    return Math.round((toUtc(a) - toUtc(b)) / 86_400_000);
}
