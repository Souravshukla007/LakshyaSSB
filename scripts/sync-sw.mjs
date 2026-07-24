// ─────────────────────────────────────────────────────────────────────────────
// sync-sw.mjs — keep the bundled Android Service Worker in lockstep with the
// served one.
//
// WHY THIS EXISTS
// ---------------
// `public/sw.js` is the SINGLE SOURCE OF TRUTH and the AUTHORITATIVE worker for
// the Capacitor Android app: `capacitor.config.ts` sets `server.url`, so the
// WebView loads the REMOTE origin over the network and registers the worker
// served from `/sw.js` (i.e. the copy generated from `public/sw.js`). In that
// `server.url` mode the bundled web assets under
// `android/app/src/main/assets/public/` are IGNORED at runtime — so the bundled
// `sw.js` copy is INERT and changing it has NO runtime effect.
//
// The bundled copy ONLY matters if the app is ever switched to bundled-asset
// (`webDir`) mode (server.url removed). Historically the two copies drifted
// (bundled `v1` vs served `v4`), which hid which worker was authoritative. This
// script regenerates the bundled copy from `public/sw.js` so the two can never
// diverge again, and it exits non-zero if it cannot produce a byte-identical
// result.
//
// This is a pure file copy: it makes NO change to runtime behavior in
// `server.url` mode. Run it via `npm run sync:sw` (or as part of `npm run
// cap:copy`, which also runs `npx cap copy android`).
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const SERVED = resolve(projectRoot, 'public', 'sw.js');
const BUNDLED = resolve(
  projectRoot,
  'android',
  'app',
  'src',
  'main',
  'assets',
  'public',
  'sw.js'
);

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

// Read the authoritative served worker as raw bytes (no transformation).
const served = readFileSync(SERVED);

// Ensure the destination directory exists, then write the exact same bytes.
mkdirSync(dirname(BUNDLED), { recursive: true });
writeFileSync(BUNDLED, served);

// Verify the bundled copy is byte-identical to the served source.
const bundled = readFileSync(BUNDLED);
const servedHash = sha256(served);
const bundledHash = sha256(bundled);

if (servedHash !== bundledHash || bundled.length !== served.length) {
  console.error('[sync-sw] FAILED — bundled sw.js is not byte-identical to public/sw.js');
  console.error(`[sync-sw]   public/sw.js : ${served.length} bytes  sha256=${servedHash}`);
  console.error(`[sync-sw]   bundled sw.js: ${bundled.length} bytes  sha256=${bundledHash}`);
  process.exit(1);
}

console.log('[sync-sw] OK — bundled sw.js is byte-identical to public/sw.js');
console.log(`[sync-sw]   ${served.length} bytes  sha256=${servedHash}`);
console.log(`[sync-sw]   source: ${SERVED}`);
console.log(`[sync-sw]   target: ${BUNDLED}`);
