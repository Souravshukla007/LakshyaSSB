'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary: catches errors thrown in the root layout itself, where
 * app/error.tsx cannot help because the layout never rendered. Must ship its own
 * <html>/<body>, and cannot rely on the app's CSS being present.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[app/global-error]', error);
    }, [error]);

    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#faf9f6',
                    color: '#111827',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    padding: '24px',
                }}
            >
                <div style={{ maxWidth: '480px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '28px', margin: '0 0 12px', fontWeight: 700 }}>
                        LakshyaSSB could not load
                    </h1>
                    <p style={{ color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 }}>
                        A critical error stopped the app from starting. Your account and saved
                        results are safe.
                    </p>
                    {error.digest && (
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 24px' }}>
                            Reference: {error.digest}
                        </p>
                    )}
                    <button
                        onClick={reset}
                        style={{
                            padding: '14px 32px',
                            borderRadius: '999px',
                            border: 'none',
                            background: '#111827',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                        }}
                    >
                        Reload the app
                    </button>
                </div>
            </body>
        </html>
    );
}
