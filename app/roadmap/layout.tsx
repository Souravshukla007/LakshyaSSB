import type { Metadata } from 'next';

/**
 * Metadata for /roadmap.
 *
 * In a segment layout because page.tsx is a client component and client components
 * cannot export `metadata`.
 */
export const metadata: Metadata = {
    title: 'Preparation Roadmap',
    description:
        'A staged SSB preparation roadmap — from screening and OIR through the psychological battery, GTO tasks and the personal interview.',
    alternates: { canonical: '/roadmap' },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
    return children;
}
