
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default async function Dashboard() {
    const session = await getSession();

    if (!session) {
        redirect('/auth');
    }

    const { user } = session;

    return (
        <>
            <Navbar />
            <DashboardClient user={user} />
            <Footer />
        </>
    );
}
