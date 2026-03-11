'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

const noNavRoutes = ['/auth'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hideNavFooter = pathname ? noNavRoutes.some(route => pathname.startsWith(route)) : false;

    return (
        <div className="flex flex-col min-h-screen">
            {!hideNavFooter && <Navbar />}
            <main className="flex-grow">
                {children}
            </main>
            {!hideNavFooter && <Footer />}
        </div>
    );
}
