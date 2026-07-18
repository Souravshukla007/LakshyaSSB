// Feature: offline-support — Global "Please connect to the internet" popup.
// Unit tests for the platform-neutral guard core (lib/offline/online-guard.ts).
//
// ── Environment note ─────────────────────────────────────────────────────────
// vitest.config.ts uses environment 'node' with NO DOM (no jsdom) and this repo
// intentionally adds NO new test dependencies. So, matching the no-DOM approach
// used by the other offline tests, we drive `requireOnline` against minimal
// `globalThis.navigator` / `globalThis.window` stubs and restore them afterward.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, afterEach } from 'vitest';
import {
  shouldPromptForRequest,
  requireOnline,
  NEEDS_INTERNET_EVENT,
} from '@/lib/offline/online-guard';

// Enumerated online-only endpoints / mutations that MUST prompt while offline.
const ONLINE_ONLY: ReadonlyArray<[string, string]> = [
  ['/api/auth/login', 'GET'],
  ['/api/auth/signup', 'GET'],
  ['/api/payment/create-order', 'POST'],
  ['/api/chat', 'GET'],
  ['/anything', 'POST'],
  ['/api/srt/submit', 'GET'],
];

// Cacheable classes that MUST NOT prompt, even while offline.
const CACHEABLE: ReadonlyArray<[string, string]> = [
  ['/', 'GET'],
  ['/api/auth/status', 'GET'],
  ['/_next/static/chunks/main.js', 'GET'],
  ['/roadmap', 'GET'],
];

describe('shouldPromptForRequest — pure classification', () => {
  it('prompts when offline AND the request is online-only', () => {
    for (const [url, method] of ONLINE_ONLY) {
      expect(shouldPromptForRequest(url, method, false)).toBe(true);
    }
  });

  it('never prompts while online, regardless of the request', () => {
    for (const [url, method] of [...ONLINE_ONLY, ...CACHEABLE]) {
      expect(shouldPromptForRequest(url, method, true)).toBe(false);
    }
  });

  it('does not prompt for cacheable GETs even while offline', () => {
    for (const [url, method] of CACHEABLE) {
      expect(shouldPromptForRequest(url, method, false)).toBe(false);
    }
  });
});

// ── requireOnline: navigator + window stubs ──────────────────────────────────

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

function setNavigator(navValue: unknown): void {
  // @ts-expect-error - navigator is a host global; override for the test.
  delete globalThis.navigator;
  if (navValue !== undefined) {
    Object.defineProperty(globalThis, 'navigator', {
      value: navValue,
      configurable: true,
      writable: true,
    });
  }
}

/** Minimal no-DOM window stub that records dispatched events. */
function setWindowStub(): { events: Array<{ type: string; detail: any }> } {
  const events: Array<{ type: string; detail: any }> = [];
  const stub = {
    dispatchEvent: (event: any) => {
      events.push({ type: event.type, detail: event.detail });
      return true;
    },
    // Minimal CustomEvent shim so notifyNeedsInternet can construct events.
    CustomEvent: class {
      type: string;
      detail: any;
      constructor(type: string, init?: { detail?: any }) {
        this.type = type;
        this.detail = init?.detail;
      }
    },
  };
  Object.defineProperty(globalThis, 'window', {
    value: stub,
    configurable: true,
    writable: true,
  });
  // requireOnline -> notifyNeedsInternet uses the global CustomEvent constructor.
  Object.defineProperty(globalThis, 'CustomEvent', {
    value: stub.CustomEvent,
    configurable: true,
    writable: true,
  });
  return { events };
}

afterEach(() => {
  if (originalNavigator) {
    Object.defineProperty(globalThis, 'navigator', originalNavigator);
  } else {
    // @ts-expect-error - restore to "not defined".
    delete globalThis.navigator;
  }
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow);
  } else {
    // @ts-expect-error - restore to "not defined".
    delete globalThis.window;
  }
  // @ts-expect-error - CustomEvent is a test-injected global; clean it up.
  delete globalThis.CustomEvent;
});

describe('requireOnline — gating + event dispatch', () => {
  it('returns false and dispatches the needs-internet event when offline', () => {
    setNavigator({ onLine: false });
    const { events } = setWindowStub();

    const result = requireOnline();

    expect(result).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(NEEDS_INTERNET_EVENT);
  });

  it('passes a provided reason through as the event detail', () => {
    setNavigator({ onLine: false });
    const { events } = setWindowStub();

    requireOnline('Sign in requires internet.');

    expect(events[0].detail).toEqual({ reason: 'Sign in requires internet.' });
  });

  it('returns true and does NOT dispatch when online', () => {
    setNavigator({ onLine: true });
    const { events } = setWindowStub();

    const result = requireOnline();

    expect(result).toBe(true);
    expect(events).toHaveLength(0);
  });
});
