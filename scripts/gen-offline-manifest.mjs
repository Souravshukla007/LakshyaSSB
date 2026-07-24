// ─────────────────────────────────────────────────────────────────────────────
// offline-page-support — build-time precache manifest generator.
//
// Task 3.3: For each route in OFFLINE_ROUTES, resolve from the Next.js build
// output (`.next/`) the exact content-hashed URLs it needs to render offline —
// the route document, its page/layout/runtime JS chunks under `/_next/static/`,
// associated CSS, and the route's RSC payload URL — and emit them to
// `public/offline-manifest.json`. The service worker reads this manifest at
// `install` (wired in task 3.4) to precache each allowlisted route's complete
// render-dependency set, so allowlisted pages render offline in the Capacitor
// Android WebView (Requirement 2.3).
//
// SCOPE (Preservation): the manifest covers ONLY the routes in
// lib/offline/offline-routes.ts (OFFLINE_ROUTES). No other route is added.
//
// Run AFTER `next build`:
//   node scripts/gen-offline-manifest.mjs
// (wired into package.json as `build:offline-manifest`, run via `postbuild`).
//
// Robustness: if `.next/` is missing the script exits with a clear message and
// a non-zero code so CI notices; it never fabricates URLs. It reads whatever
// the current build produced (Turbopack or Webpack) by scanning the emitted,
// prerendered `.html` / `.rsc` documents — the authoritative source of a
// route's real content-hashed dependency set — plus the global build manifest
// for shared runtime chunks.
// ─────────────────────────────────────────────────────────────────────────────

import { readFile, writeFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const NEXT_DIR = path.join(ROOT, '.next');
const APP_DIR = path.join(NEXT_DIR, 'server', 'app');
const OUTPUT = path.join(ROOT, 'public', 'offline-manifest.json');

/** Matches content-hashed static asset URLs anywhere in a document/flight blob. */
const STATIC_ASSET_RE = /\/_next\/static\/[^\s"'<>()\\]+?\.(?:js|css)/g;

/**
 * Read the OFFLINE_ROUTES allowlist from the single source of truth
 * (lib/offline/offline-routes.ts) so this script can never drift from the
 * worker / app. Parses the array literal without importing TypeScript.
 */
async function readOfflineRoutes() {
  const file = path.join(ROOT, 'lib', 'offline', 'offline-routes.ts');
  const src = await readFile(file, 'utf8');
  const match = src.match(/OFFLINE_ROUTES[^=]*=\s*\[([\s\S]*?)\]/);
  if (!match) {
    throw new Error(`Could not locate OFFLINE_ROUTES array in ${file}`);
  }
  const routes = [...match[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);
  if (routes.length === 0) {
    throw new Error(`OFFLINE_ROUTES array in ${file} appears to be empty`);
  }
  return routes;
}

/** Read CACHE_VERSION from the served worker so the manifest is tagged to match. */
async function readCacheVersion() {
  try {
    const src = await readFile(path.join(ROOT, 'public', 'sw.js'), 'utf8');
    const m = src.match(/CACHE_VERSION\s*=\s*['"`]([^'"`]+)['"`]/);
    if (m) return m[1];
  } catch {
    /* fall through */
  }
  return null;
}

/**
 * Map an allowlisted route pathname to the base name Next.js uses for its
 * emitted build artifacts under `.next/server/app/`.
 *   '/'          -> 'index'
 *   '/about'     -> 'about'
 *   '/ssb/day-5' -> 'ssb/day-5'
 */
function routeToBase(route) {
  if (route === '/') return 'index';
  return route.replace(/^\//, '');
}

/** Normalize `/_next/static/chunks/x.js` -> disk path under `.next/`. */
function assetUrlToDiskPath(url) {
  // url starts with '/_next/'; the on-disk file lives at `.next/<rest>`.
  const rest = url.replace(/^\/_next\//, '');
  return path.join(NEXT_DIR, rest);
}

/** Extract unique `/_next/static/*.{js,css}` URLs from a text blob. */
function extractStaticAssets(text) {
  const found = new Set();
  for (const m of text.matchAll(STATIC_ASSET_RE)) {
    // Flight payloads escape quotes as \" — the char class already stops before
    // the backslash, so matches are clean. Unescape any stray unicode-escaped
    // ampersands just in case (defensive; static chunk names never contain them).
    found.add(m[0]);
  }
  return found;
}

/**
 * Collect the shared runtime / framework / low-priority chunks that every route
 * depends on, from the global build manifest. Returns absolute `/_next/...` URLs.
 */
async function readSharedChunks() {
  const shared = new Set();
  const manifestPath = path.join(NEXT_DIR, 'build-manifest.json');
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const groups = ['polyfillFiles', 'rootMainFiles', 'lowPriorityFiles'];
    for (const group of groups) {
      for (const rel of manifest[group] || []) {
        if (typeof rel === 'string' && rel.startsWith('static/')) {
          shared.add(`/_next/${rel}`);
        }
      }
    }
  } catch {
    // Non-fatal: the per-route documents already embed the runtime chunks.
  }
  return shared;
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!existsSync(NEXT_DIR) || !existsSync(APP_DIR)) {
    console.error(
      '[gen-offline-manifest] No Next.js build found at .next/server/app.\n' +
        '  Run `next build` first, then re-run this script:\n' +
        '    npm run build && node scripts/gen-offline-manifest.mjs\n' +
        '  (the `postbuild` npm script does this automatically).'
    );
    process.exit(1);
  }

  const [routes, cacheVersion, sharedChunks] = await Promise.all([
    readOfflineRoutes(),
    readCacheVersion(),
    readSharedChunks(),
  ]);

  let buildId = null;
  try {
    buildId = (await readFile(path.join(NEXT_DIR, 'BUILD_ID'), 'utf8')).trim();
  } catch {
    /* optional */
  }

  const routeEntries = [];
  const warnings = [];

  for (const route of routes) {
    const base = routeToBase(route);
    const htmlPath = path.join(APP_DIR, `${base}.html`);
    const rscPath = path.join(APP_DIR, `${base}.rsc`);

    const assets = new Set(sharedChunks);
    let hasDocument = false;
    let hasRsc = false;

    if (await fileExists(htmlPath)) {
      hasDocument = true;
      const html = await readFile(htmlPath, 'utf8');
      for (const a of extractStaticAssets(html)) assets.add(a);
    } else {
      warnings.push(`No prerendered document for ${route} (expected ${base}.html)`);
    }

    if (await fileExists(rscPath)) {
      hasRsc = true;
      const rsc = await readFile(rscPath, 'utf8');
      for (const a of extractStaticAssets(rsc)) assets.add(a);
    }

    // Keep only assets that actually exist on disk (avoid precaching 404s).
    const existing = [];
    for (const url of assets) {
      if (await fileExists(assetUrlToDiskPath(url))) {
        existing.push(url);
      } else {
        warnings.push(`Dropped missing asset ${url} referenced by ${route}`);
      }
    }
    existing.sort();

    const js = existing.filter((u) => u.endsWith('.js'));
    const css = existing.filter((u) => u.endsWith('.css'));

    routeEntries.push({
      route,
      // The navigation document URL the worker precaches (served HTML).
      document: route,
      // The RSC payload is fetched from the same URL with an `RSC` header /
      // `?_rsc=` query (content-negotiated). The worker requests this path with
      // the RSC header at install (task 3.4/3.5). null if the route has no RSC.
      rsc: hasRsc ? route : null,
      css,
      js,
    });

    if (!hasDocument && !hasRsc) {
      warnings.push(`Route ${route} produced no document or RSC — nothing to precache`);
    }
  }

  const manifest = {
    // Tie the manifest to the worker's cache version + the Next build it was
    // generated from, so a stale manifest is easy to detect.
    cacheVersion,
    buildId,
    generatedAt: new Date().toISOString(),
    // Shared runtime/framework chunks common to every allowlisted route.
    shared: [...sharedChunks].sort(),
    // Per-route render-dependency sets (document + RSC + JS + CSS).
    routes: routeEntries,
  };

  await writeFile(OUTPUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  const totalAssets = routeEntries.reduce((n, r) => n + r.js.length + r.css.length, 0);
  console.log(
    `[gen-offline-manifest] Wrote ${path.relative(ROOT, OUTPUT)} — ` +
      `${routeEntries.length} routes, ${manifest.shared.length} shared chunks, ` +
      `${totalAssets} per-route asset refs` +
      (cacheVersion ? `, cacheVersion=${cacheVersion}` : '') +
      (buildId ? `, buildId=${buildId}` : '') +
      '.'
  );
  if (warnings.length) {
    console.warn(`[gen-offline-manifest] ${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
}

main().catch((err) => {
  console.error('[gen-offline-manifest] Failed:', err);
  process.exit(1);
});
