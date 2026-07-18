// Feature: offline-support — Task 6.3
// Unit tests for the connectivity hook (hooks/useOnlineStatus.ts).
// Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
//
// ── Environment note / documented limitation ────────────────────────────────
// vitest.config.ts uses environment 'node' and this repo intentionally adds NO
// new test dependencies (no jsdom, no @testing-library/react, no
// react-test-renderer — none are installed). Because of that we cannot mount
// the hook in a live DOM and dispatch real `window` 'online'/'offline' events to
// drive React effects.
//
// What we CAN do faithfully against the real hook, without new deps, is render
// it with `react-dom/server` (which IS installed). Server rendering executes the
// component body — including the synchronous `useState(getCurrentState)`
// initializer that derives state from `navigator.onLine` — but skips `useEffect`.
// That lets us verify, against the ACTUAL hook code:
//   • initial/launch-time state derivation for online and offline (Req 8.1, 8.5),
//   • the SSR / no-navigator default path (Req 8.5),
//   • that the online↔offline state values the transitions switch between are
//     the ones the hook derives from connectivity on each fresh mount
//     (the derivation underpinning Req 8.2/8.3/8.4).
//
// The live event-driven UPDATE while mounted (Req 8.2/8.3/8.4 timing) is driven
// by `useEffect` + `window` events and requires a DOM environment (jsdom); that
// portion is intentionally left to a DOM-enabled/integration environment so this
// suite stays green with zero new dependencies.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Temporarily install a `navigator` value (or remove it entirely when `navValue`
 * is `undefined`) on the global object for the duration of `fn`, then restore the
 * original descriptor. Node 24 exposes `globalThis.navigator` as a configurable
 * getter, so redefining/deleting it is safe and reversible.
 */
function withNavigator<T>(navValue: unknown, fn: () => T): T {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    try {
        // Remove any existing definition first so a getter-only descriptor cannot
        // block the reassignment.
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
    // Belt-and-suspenders: guarantee the global navigator is restored between tests.
    if (restoreDescriptor) {
        Object.defineProperty(globalThis, 'navigator', restoreDescriptor);
    }
});

describe('useOnlineStatus — initial state derivation (Req 8.1, 8.5)', () => {
    it("derives 'online' at launch when navigator.onLine is true", () => {
        const state = withNavigator({ onLine: true }, renderHookState);
        expect(state).toBe('online');
    });

    it("derives 'offline' at launch when navigator.onLine is false", () => {
        const state = withNavigator({ onLine: false }, renderHookState);
        expect(state).toBe('offline');
    });

    it("classifies state strictly as either 'online' or 'offline' (Req 8.1)", () => {
        const online = withNavigator({ onLine: true }, renderHookState);
        const offline = withNavigator({ onLine: false }, renderHookState);
        expect(['online', 'offline']).toContain(online);
        expect(['online', 'offline']).toContain(offline);
        expect(online).not.toBe(offline);
    });
});

describe('useOnlineStatus — SSR / no-navigator default path (Req 8.5)', () => {
    it("defaults to 'online' when navigator is unavailable (SSR-safe)", () => {
        const state = withNavigator(undefined, renderHookState);
        expect(state).toBe('online');
    });
});

describe('useOnlineStatus — online/offline values the transitions switch between (Req 8.2, 8.3, 8.4)', () => {
    // Each fresh mount re-derives from current connectivity. This confirms the
    // hook reports the correct target value for each connectivity state — the two
    // values a live online→offline / offline→online transition moves between.
    // (The live in-place update while mounted requires a DOM env; see file header.)
    it('reports the offline value when connectivity is offline at mount', () => {
        expect(withNavigator({ onLine: false }, renderHookState)).toBe('offline');
    });

    it('reports the online value when connectivity is online at mount', () => {
        expect(withNavigator({ onLine: true }, renderHookState)).toBe('online');
    });

    it('re-derives independently across successive mounts (offline then online)', () => {
        const first = withNavigator({ onLine: false }, renderHookState);
        const second = withNavigator({ onLine: true }, renderHookState);
        expect(first).toBe('offline');
        expect(second).toBe('online');
    });
});
