import type { Metadata } from 'next';

/**
 * Metadata for /current-affairs.
 *
 * In a segment layout because page.tsx is a client component and client components
 * cannot export `metadata`. Note this layout also covers /current-affairs/quiz,
 * which sets its own title.
 */
export const metadata: Metadata = {
    // `template` is repeated here on purpose. A plain-string `title` in an
    // intermediate layout ends the root template chain for deeper segments, so
    // /current-affairs/quiz rendered as bare "Daily Current Affairs Quiz" with no
    // brand suffix while every sibling page had one. Declaring the template at this
    // level restores it for children; `default` covers this segment itself.
    title: {
        default: 'Current Affairs for SSB',
        template: '%s | LakshyaSSB',
    },
    description:
        'Defence and geopolitics current affairs framed for SSB — summaries, why each story matters, plus ready Group Discussion and Lecturette angles.',
    alternates: { canonical: '/current-affairs' },
};

export default function CurrentAffairsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
