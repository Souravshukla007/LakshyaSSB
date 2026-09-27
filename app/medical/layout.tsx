import type { Metadata } from 'next';

/**
 * Metadata for /medical.
 *
 * In a segment layout because page.tsx is a client component and client components
 * cannot export `metadata`.
 */
export const metadata: Metadata = {
    title: 'SSB Medical Readiness',
    description:
        'Check your SSB medical readiness — BMI, vision, colour vision and common rejection criteria, with a weekly plan to close the gaps before your board.',
    alternates: { canonical: '/medical' },
};

export default function MedicalLayout({ children }: { children: React.ReactNode }) {
    return children;
}
