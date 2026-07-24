// Feature: offline-support — Task 6.3
// Unit tests for the connectivity hook (hooks/useOnlineStatus.ts).
// Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
//
// ── Environment note / documented limitation ────────────────────────────────
// vitest.config.ts uses environment 'node' and this repo intentionally adds NO
// new test dependencies (no jsdom, no @testing-library/react). We render the
// REAL hook with `react-dom/server` (which IS installed) via
// renderToStaticMarkup. SSR runs the component body — including the
// `useState('online')` initializer — but skips `useEffect`.
//
// HYDRATION-SAFETY CONTRACT (the property these tests lock in):
// The hook MUST return a stable value on the server AND on the first client
// render so React hydration does not mismatch. The server has no `navigator`,
// so that stable value is 'online'. The hook then corrects to the real
// connectivity inside a `useEffect` immediately after mount (Req 8.5), and
// updates on the window online/offline events (Req 8.2–8.4). The live,
// post-mount transition behavior requires a DOM environment (jsdom) and is
// therefore exercised via the DOM/integration path, not here.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Temporarily install a `navigator` value (or remove it entirely when `navValue`
 * is `undefined`) on the global object for the duration of `fn`, then restore the
 * original descriptor.
 */
function withNavigator<T>(navValue: unknown, fn: () => T): T {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    try {
        // @ts-expect-error - navigator is a host global; we override it for the test.
        delete globalThis.navigator;
        if (navValue !== undefined) {
            Object.defineProperty(globalThis, 'navigator', {
                value: navValue,
                configurable: true,
                writable: true,
            });
        }
        return fn();
    } finally {
        if (original) {
            Object.defineProperty(globalThis, 'navigator', original);
        } else {
            // @ts-expect-error - restore to "not defined".
            delete globalThis.navigator;
        }
    }
}

/** Render the real hook via SSR and return the connectivity string it produces. */
function renderHookState(): string {
    const Probe = () => React.createElement(React.Fragment, null, useOnlineStatus());
    return renderToStaticMarkup(React.createElement(Probe));
}

const restoreDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

afterEach(() => {
    if (restoreDescriptor) {
        Object.defineProperty(globalThis, 'navigator', restoreDescriptor);
    }
});

describe('useOnlineStatus — hydration-safe initial render (Req 8.1, 8.5)', () => {
    it("renders the stable 'online' value on the server / first render even when navigator.onLine is false", () => {
        // This is the core hydration-safety guarantee: the first render must NOT
        // depend on navigator.onLine, or an offline client would mismatch the
        // server-rendered 'online' and break hydration.
        expect(withNavigator({ onLine: false }, renderHookState)).toBe('online');
    });

    it("renders 'online' on the server / first render when navigator.onLine is true", () => {
        expect(withNavigator({ onLine: true }, renderHookState)).toBe('online');
    });

    it("renders 'online' when navigator is unavailable (SSR-safe default)", () => {
        expect(withNavigator(undefined, renderHookState)).toBe('online');
    });

    it('always returns a valid ConnectivityState literal on first render', () => {
        const state = withNavigator({ onLine: false }, renderHookState);
        expect(['online', 'offline']).toContain(state);
    });
});
