import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import CapacitorBackButtonHandler from "@/components/CapacitorBackButtonHandler";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
    title: "LakshaySSB | Elite SSB Preparation Academy",
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
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                    integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                />
                <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Inter:wght@400;500;600;700;900&family=Outfit:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Raleway:wght@700;800&display=swap" rel="stylesheet" />
                {/* Google AdSense — loaded non-blocking after hydration */}
                <Script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2268345575050436"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />
            </head>
            <body className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg" suppressHydrationWarning>
                <CapacitorBackButtonHandler />
                <LayoutWrapper>
                    {children}
                </LayoutWrapper>
                <Script id="reveal-animation" strategy="afterInteractive">
                    {`
            document.addEventListener('DOMContentLoaded', () => {
              const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                  if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                  }
                });
              }, { threshold: 0.15 });
              document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el));
            });
          `}
                </Script>
                {/* Vercel Analytics */}
                <Analytics />

                {/* Vercel Performance Monitoring */}
                <SpeedInsights />
            </body>
        </html>
    );
}
