import type { Metadata } from 'next';

/**
 * Metadata for /leaderboard.
 *
 * In a segment layout because page.tsx is a client component and client components
 * cannot export `metadata`.
 */
export const metadata: Metadata = {
    title: 'Leaderboard',
    description:
        'See where you stand among LakshyaSSB aspirants — medals, weekly standings and practice streaks.',
    alternates: { canonical: '/leaderboard' },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
    return children;
}
