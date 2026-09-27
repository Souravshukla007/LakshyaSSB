import type { Metadata } from 'next';

/**
 * Metadata for /current-affairs/quiz.
 *
 * Without this the page inherited "Current Affairs for SSB" from the parent
 * segment layout, so the quiz was indistinguishable from the news index in
 * browser tabs and search results. In a segment layout because page.tsx is a
 * client component and client components cannot export `metadata`.
 */
export const metadata: Metadata = {
    title: 'Daily Current Affairs Quiz',
    description:
        'Test yourself on the latest defence and geopolitics current affairs with a fresh 10-question SSB-focused quiz.',
    alternates: { canonical: '/current-affairs/quiz' },
};

export default function CurrentAffairsQuizLayout({ children }: { children: React.ReactNode }) {
    return children;
}
