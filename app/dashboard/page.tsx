
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default async function Dashboard() {
    const session = await getSession();

    if (!session) {
        redirect('/auth');
    }

    // Fetch fresh user data from DB (session only holds id, email, plan)
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            fullName: true,
            email: true,
            targetEntry: true,
            plan: true,
            planExpiry: true,
        },
    });

    if (!user) redirect('/auth');

    return (
        <>
            <Navbar />
            <DashboardClient
                user={{
                    name: user.fullName,
                    email: user.email,
                    entry: user.targetEntry ?? '',
                    plan: user.plan,
                }}
            />
            <Footer />
        </>
    );
}
