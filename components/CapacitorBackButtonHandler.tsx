'use client';

import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

declare global {
    interface Window {
        Capacitor?: any;
    }
}

export default function CapacitorBackButtonHandler() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Capacitor?.isNative) {
            const listener = App.addListener('backButton', ({ canGoBack }) => {
                if (pathname === '/') {
                    App.exitApp();
                } else {
                    router.back();
                }
            });

            return () => { listener.then(l => l.remove()); };
        }
    }, [pathname, router]);

    return null;
}
