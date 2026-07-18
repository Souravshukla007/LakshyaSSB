'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import LakshyaAIMentor from './chat/LakshyaAIMentor';
import ConnectivityIndicator from './offline/ConnectivityIndicator';
import DraftSyncIndicator from './offline/DraftSyncIndicator';
import NetworkGuard from './offline/NetworkGuard';
import OfflinePopup from './offline/OfflinePopup';

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
            {!hideNavFooter && <LakshyaAIMentor />}
            {/* Connectivity indicator renders on every route, including /auth (Req 8.3-8.5, 1.7). */}
            <ConnectivityIndicator />
            {/* Draft persistence + deferred-submission status, app-wide (Req 6.2, 6.4-6.6). */}
            <DraftSyncIndicator />
            {/* Global online-only guard: patches fetch to surface the popup on offline online-only requests. */}
            <NetworkGuard />
            {/* Global themed "Please connect to the internet" popup, mounted on ALL routes incl. /auth. */}
            <OfflinePopup />
        </div>
    );
}
