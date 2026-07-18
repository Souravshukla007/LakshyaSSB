import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    async headers() {
        return [
            {
                source: "/sw.js",
                headers: [
                    // Pick up a new release's worker promptly instead of serving a stale one.
                    { key: "Cache-Control", value: "no-cache" },
                    // Keep the service worker's root scope explicit.
                    { key: "Service-Worker-Allowed", value: "/" },
                ],
            },
        ];
    },
};

export default nextConfig;
