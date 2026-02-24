import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndDowngrade } from '@/lib/plan';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AccountClient from './AccountClient';

/**
 * /account — Server Component
 * Fetches fresh user data from DB, auto-downgrades if subscription expired,
 * then renders the client-side AccountClient with the data.
 */
export default async function AccountPage() {
    const session = await getSession();
    if (!session) redirect('/auth');

    // Auto-downgrade before showing subscription status
    await checkAndDowngrade(session.userId);

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            targetEntry: true,
            attemptNumber: true,
            preferredSSBCenter: true,
            plan: true,
            planExpiry: true,
            payments: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    createdAt: true,
                    razorpayPaymentId: true,
                },
            },
        },
    });

    if (!user) redirect('/auth');

    // Serialize dates + cast Prisma enums for client component
    const serialized = {
        ...user,
        plan: user.plan as 'FREE' | 'PRO',
        planExpiry: user.planExpiry ? user.planExpiry.toISOString() : null,
        payments: user.payments.map((p) => ({
            ...p,
            status: p.status as 'PENDING' | 'SUCCESS' | 'FAILED',
            createdAt: p.createdAt.toISOString(),
        })),
    };

    return (
        <main className="min-h-screen bg-brand-bg">
            <Navbar />

            <section className="min-h-screen bg-brand-bg pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8 sm:mb-12">
                        <h1 className="font-hero font-bold text-3xl sm:text-4xl text-brand-dark mb-2">
                            My <span className="text-brand-orange">Account</span>
                        </h1>
                        <p className="text-gray-500 font-noname">
                            Manage your cadet profile and subscription.
                        </p>
                    </div>

                    <AccountClient user={serialized} />
                </div>
            </section>

            <Footer />
        </main>
    );
}
