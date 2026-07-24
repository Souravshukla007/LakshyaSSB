// Feature: offline-page-support (BUGFIX) — Task 4 supporting UNIT tests.
//
// **Validates: Requirements 2.2, 3.2, 3.3**
//
// Unit coverage for the RSC / soft-navigation DETECTION logic that lives inside
// the SERVED public/sw.js (the authoritative worker in Capacitor `server.url`
// mode). The relevant helpers — `isRscRequest(request, url)` and
// `isRscResponse(response)` — are plain top-level `function` declarations in the
// worker, so we load the REAL worker source into a sandboxed `node:vm` context
// and invoke those exact functions (no logic is re-implemented here). We also
// pin the fetch-handler GATE — an RSC request is only treated as cacheable when
// it is ALSO an allowlisted route (`isRscRequest(...) && isOfflineRoute(...)`),
// which is the preservation boundary for non-allowlisted RSC (Req 3.2/3.3).

import { describe, it, expect } from 'vitest';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SW_SOURCE = readFileSync(resolve(process.cwd(), 'public', 'sw.js'), 'utf8');

// Minimal fake header bag with a case-insensitive `.get`, mirroring Headers.
function fakeHeaders(map: Record<string, string>) {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) lower[k.toLowerCase()] = v;
  return {
    get(name: string): string | null {
      const key = String(name).toLowerCase();
      return key in lower ? lower[key] : null;
    },
  };
}

interface SwGlobals {
  isRscRequest: (request: unknown, url: unknown) => boolean;
  isRscResponse: (response: unknown) => boolean;
  isOfflineRoute: (pathname: string) => boolean;
}

/**
 * Load public/sw.js into a fresh vm context. Top-level `function` declarations
 * (isRscRequest, isRscResponse, isOfflineRoute, ...) become properties of the
 * sandbox global, so we can call the worker's REAL implementations directly.
 */
function loadWorkerGlobals(): SwGlobals {
  const sandbox: Record<string, unknown> = {
    self: {
      addEventListener() {
        /* capture not needed for pure-function extraction */
      },
      skipWaiting() {},
      clients: { claim: async () => {} },
    },
    caches: {
      open: async () => ({
        addAll: async () => {},
        put: async () => {},
        match: async () => undefined,
      }),
      keys: async () => [],
      delete: async () => false,
      match: async () => undefined,
    },
    fetch: async () => {
      throw new Error('network unavailable in unit test');
    },
    Response,
    Request: globalThis.Request,
    URL,
    console,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(sandbox);
  vm.runInContext(SW_SOURCE, sandbox, { filename: 'sw.js' });
  return sandbox as unknown as SwGlobals;
}

const sw = loadWorkerGlobals();

describe('isRscRequest — RSC header detection (Req 2.2)', () => {
  it('detects a request carrying the App Router RSC header', () => {
    const req = { headers: fakeHeaders({ RSC: '1' }) };
    const url = new URL('https://lakshyassb.online/about');
    expect(sw.isRscRequest(req, url)).toBe(true);
  });

  it('is case-insensitive about the RSC header name', () => {
    const req = { headers: fakeHeaders({ rsc: '1' }) };
    const url = new URL('https://lakshyassb.online/roadmap');
    expect(sw.isRscRequest(req, url)).toBe(true);
  });

  it('returns false when no RSC header and no ?_rsc= token is present', () => {
    const req = { headers: fakeHeaders({ Accept: 'text/html' }) };
    const url = new URL('https://lakshyassb.online/about');
    expect(sw.isRscRequest(req, url)).toBe(false);
  });
});

describe('isRscRequest — ?_rsc= query token detection (Req 2.2)', () => {
  it('detects the ?_rsc= query token even without the RSC header', () => {
    const req = { headers: fakeHeaders({}) };
    const url = new URL('https://lakshyassb.online/pricing?_rsc=ab12c');
    expect(sw.isRscRequest(req, url)).toBe(true);
  });

  it('does not misfire on an unrelated query string', () => {
    const req = { headers: fakeHeaders({}) };
    const url = new URL('https://lakshyassb.online/pricing?ref=home');
    expect(sw.isRscRequest(req, url)).toBe(false);
  });

  it('does not throw when header access throws (falls through to URL check)', () => {
    const req = {
      headers: {
        get() {
          throw new Error('header access blew up');
        },
      },
    };
    const url = new URL('https://lakshyassb.online/terms?_rsc=zzz');
    expect(sw.isRscRequest(req, url)).toBe(true);
  });
});

describe('isRscResponse — text/x-component content-type detection', () => {
  it('recognises a text/x-component response as an RSC payload', () => {
    const res = { headers: fakeHeaders({ 'Content-Type': 'text/x-component; charset=utf-8' }) };
    expect(sw.isRscResponse(res)).toBe(true);
  });

  it('rejects an ordinary HTML document response', () => {
    const res = { headers: fakeHeaders({ 'Content-Type': 'text/html; charset=utf-8' }) };
    expect(sw.isRscResponse(res)).toBe(false);
  });

  it('returns false defensively when the response/headers are missing', () => {
    expect(sw.isRscResponse(undefined)).toBe(false);
    expect(sw.isRscResponse({})).toBe(false);
  });
});

describe('RSC caching GATE — only allowlisted-route RSC is cacheable (Req 3.2, 3.3)', () => {
  // The fetch handler intercepts+caches an RSC request ONLY when
  //   isRscRequest(request, url) && isOfflineRoute(url.pathname)
  // is true. A non-allowlisted RSC request stays passthrough (preservation).
  const rscReq = { headers: fakeHeaders({ RSC: '1' }) };

  it('an RSC request to an allowlisted route IS treated as cacheable', () => {
    for (const path of ['/about', '/roadmap', '/pricing', '/ssb/day-5']) {
      const url = new URL(`https://lakshyassb.online${path}`);
      const cacheable = sw.isRscRequest(rscReq, url) && sw.isOfflineRoute(url.pathname);
      expect(cacheable, `${path} RSC should be cacheable`).toBe(true);
    }
  });

  it('an RSC request to a NON-allowlisted route is NOT cacheable (stays passthrough)', () => {
    for (const path of ['/account', '/dashboard', '/offline', '/ssb/day-6']) {
      const url = new URL(`https://lakshyassb.online${path}?_rsc=tok`);
      const cacheable = sw.isRscRequest(rscReq, url) && sw.isOfflineRoute(url.pathname);
      expect(cacheable, `${path} RSC must NOT be cacheable`).toBe(false);
    }
  });
});
