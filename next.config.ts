import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    async headers() {
        return [
            {
                // The SERVED `/sw.js` is the authoritative worker that controls the
                // Capacitor Android WebView under `server.url` mode. These headers keep
                // new worker versions picked up and allow root-scope control so offline
                // rendering of the allowlisted pages works (offline-page-support Req 2.4).
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
