import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

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
        <html lang="en">
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                    integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                />
            </head>
            <body className="antialiased overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans bg-brand-bg">
                {children}
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
            </body>
        </html>
    );
}
