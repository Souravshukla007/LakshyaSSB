import type { Metadata } from 'next';

/**
 * Metadata for /ssb-entry-navigator.
 *
 * In a segment layout because page.tsx is a client component and client components
 * cannot export `metadata`.
 */
export const metadata: Metadata = {
    title: 'SSB Entry Navigator',
    description:
        'Find which defence entry you are eligible for — NDA, CDS, AFCAT, TES, ACC and more — filtered by age, education, gender and marital status.',
    alternates: { canonical: '/ssb-entry-navigator' },
};

export default function EntryNavigatorLayout({ children }: { children: React.ReactNode }) {
    return children;
}
