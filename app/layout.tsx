import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import CapacitorBackButtonHandler from "@/components/CapacitorBackButtonHandler";
import LayoutWrapper from "@/components/LayoutWrapper";
import ServiceWorkerRegister from "@/components/offline/ServiceWorkerRegister";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Root metadata.
 *
 * Two fixes here:
 *
 *  1. The brand was spelled "LakshaySSB" — Lakshay, not Lakshya. Because only five
 *     pages (/about, /contact, /privacy, /refund-policy, /terms) declare their own
 *     metadata, this misspelling was the browser-tab and search title for the
 *     other 36 routes, including / , /pricing and /checkout.
 *  2. Those same 36 routes all shared one identical title and description. `title`
 *     is now a template, so any page that sets `title: 'Practice'` renders
 *     "Practice | LakshyaSSB" and inherits nothing stale.
 *
 * `metadataBase` is required for Open Graph / canonical URLs to resolve to
 * absolute addresses; without it Next emits a warning and relative OG image paths
 * break for crawlers.
 */
export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://lakshyassb.in'),
    title: {
        default: "LakshyaSSB | Elite SSB Preparation Academy",
        template: "%s | LakshyaSSB",
    },
    description: "Elite mentorship for SSB aspirants. Join 500+ recommended candidates who mastered the OLQs with our scientific preparation framework.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Web App Manifest — enables installability and offline support */}
                <link rel="manifest" href="/manifest.webmanifest" />

                {/* DNS Preconnects — let browser open connections early */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://cdnjs.cloudflare.com" />

                {/* Font Awesome — kept as CDN, preconnect above reduces latency */}
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                    integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                />
                {/* Google Fonts — trimmed from 5 families to 2 (saves ~3 extra roundtrips) */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg" suppressHydrationWarning>
                <ServiceWorkerRegister />
                <CapacitorBackButtonHandler />
                <LayoutWrapper>
                    {children}
                </LayoutWrapper>

                {/*
                  * Google AdSense — deliberately a plain <script>, not next/script.
                  *
                  * This logged "AdSense head tag doesn't support data-nscript
                  * attribute" on all 41 pages. Two things were going on:
                  *   - it was mounted inside <head> with strategy="afterInteractive",
                  *     which is the wrong place for that strategy; and
                  *   - the warning itself comes from Google's own loader objecting to
                  *     the `data-nscript` attribute that next/script stamps onto the
                  *     tag. Moving it to <body> fixed the placement but NOT the
                  *     warning, because the attribute is still there.
                  *
                  * A plain async script carries no data-nscript, so Google stops
                  * complaining and the loader behaves identically (React 19 dedupes
                  * `<script async src>` across renders).
                  */}
                <script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2268345575050436"
                    crossOrigin="anonymous"
                />

                {/*
                  * The reveal-animation <Script> that used to live here has been
                  * removed. It registered a `DOMContentLoaded` listener from inside an
                  * afterInteractive script — by the time that script runs,
                  * DOMContentLoaded has already fired, so the callback never executed.
                  * It was dead code, and harmless only because every page carrying
                  * .reveal markup runs its own IntersectionObserver (via
                  * hooks/useScrollReveal.ts or an inline useEffect).
                  *
                  * Do not reintroduce it as a global script: .reveal is opacity:0 until
                  * .active (app/globals.css), so anything relying on a global activator
                  * that silently no-ops renders invisible content.
                  */}

                {/* Vercel Analytics */}
                <Analytics />

                {/* Vercel Performance Monitoring */}
                <SpeedInsights />
            </body>
        </html>
    );
}
