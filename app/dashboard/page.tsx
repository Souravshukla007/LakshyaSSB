
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

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            fullName: true,
            email: true,
            targetEntry: true,
            plan: true,
            current_streak: true,
            longest_streak: true,
            medals_total: true,
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
                    current_streak: user.current_streak,
                    longest_streak: user.longest_streak,
                    medals_total: user.medals_total,
                }}
            />
            <Footer />
        </>
    );
}
