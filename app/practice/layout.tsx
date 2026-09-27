import type { Metadata } from 'next';

/**
 * Metadata for /practice.
 *
 * In a segment layout because page.tsx is a client component and client components
 * cannot export `metadata`.
 */
export const metadata: Metadata = {
    title: 'Practice',
    description:
        'Practice the full SSB psychological and GTO battery — SRT, TAT, WAT, OIR, GPE and Lecturette — with AI evaluation against Officer Like Qualities.',
    alternates: { canonical: '/practice' },
};

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
    return children;
}
