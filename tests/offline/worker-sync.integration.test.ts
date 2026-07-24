// Feature: offline-page-support (BUGFIX) — Task 4 supporting INTEGRATION test.
//
// **Validates: Requirements 1.4, 2.4**
//
// Worker-sync equality check. `public/sw.js` is the SINGLE SOURCE OF TRUTH and
// the AUTHORITATIVE worker for the Capacitor Android WebView in `server.url`
// mode; the bundled copy at android/app/src/main/assets/public/sw.js is
// regenerated from it by `scripts/sync-sw.mjs` (npm run sync:sw / cap:copy) and
// MUST be byte-identical so the two can never diverge again (the divergence was
// a hypothesized root cause — bug 1.4). This test reads both files from disk and
// compares them exactly, mirroring the verification `sync-sw.mjs` performs.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const SERVED = resolve(process.cwd(), 'public', 'sw.js');
const BUNDLED = resolve(
  process.cwd(),
  'android',
  'app',
  'src',
  'main',
  'assets',
  'public',
  'sw.js'
);

const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex');

describe('Worker sync — bundled sw.js is byte-identical to public/sw.js (Req 1.4, 2.4)', () => {
  const served = readFileSync(SERVED);
  const bundled = readFileSync(BUNDLED);

  it('has identical byte length', () => {
    expect(bundled.length).toBe(served.length);
  });

  it('has an identical sha256 digest', () => {
    expect(sha256(bundled)).toBe(sha256(served));
  });

  it('is byte-for-byte equal', () => {
    // Buffer.equals is the exact byte comparison sync-sw.mjs relies on.
    expect(bundled.equals(served)).toBe(true);
  });

  it('both declare the same CACHE_VERSION (no version divergence)', () => {
    const versionOf = (buf: Buffer) =>
      buf.toString('utf8').match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1] ?? null;
    const servedVersion = versionOf(served);
    expect(servedVersion).toBeTruthy();
    expect(versionOf(bundled)).toBe(servedVersion);
  });
});
