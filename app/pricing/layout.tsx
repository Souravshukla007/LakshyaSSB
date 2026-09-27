import type { Metadata } from 'next';

/**
 * Metadata for /pricing.
 *
 * This lives in a segment layout rather than in page.tsx because page.tsx is a
 * client component ('use client'), and Next.js does not allow a client component
 * to export `metadata`. The layout is a server component that just renders its
 * children, so it adds a title without changing behaviour.
 *
 * Before this, 36 of 41 routes inherited one identical root title, so /pricing was
 * indistinguishable from the homepage in search results and browser tabs.
 */
export const metadata: Metadata = {
    title: 'Pricing',
    description:
        'LakshyaSSB Pro pricing. Unlock AI-evaluated SRT, TAT, WAT, GPE and Lecturette practice, the full PIQ and OLQ engine, and the complete leaderboard.',
    alternates: { canonical: '/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
