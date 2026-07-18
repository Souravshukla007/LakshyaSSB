// Feature: offline-support
// Platform-neutrality compliance guard (Task 13.2).
//
// The offline layer MUST be implemented entirely with standards-based web
// platform features and contain NO Capacitor/native/Cordova references, so the
// service worker and offline modules stay portable to a future iOS client
// without any web-layer rework. This guard reads the source of every offline
// file and fails if it references native/Capacitor code.
//
// The matchers deliberately target import specifiers (`@capacitor/...`) and
// identifier usage (the `Capacitor` global via `Capacitor.` / `Capacitor(`,
// and `cordova` as a module path or global member) rather than the bare word,
// so a comment that merely mentions "capacitor" in prose does not trip the
// guard — only actual references to native code do.
//
// Validates: Requirements 11.1 (no native calls/plugins/bridges),
// 11.3 (standards-based, portable to iOS), 11.5 (offending native references
// are reported so they can be removed).

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/** Resolve a path relative to the repo root. */
function p(...segments: string[]): string {
  return join(ROOT, ...segments);
}

/**
 * A forbidden reference pattern. Each targets an actual native/Capacitor code
 * reference (import specifier or identifier usage), not a bare prose mention.
 */
interface ForbiddenPattern {
  readonly name: string;
  readonly regex: RegExp;
}

const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  // `@capacitor/...` scoped package — appears only in import specifiers /
  // require() calls, never in normal prose (the `@` scope prefix is the tell).
  { name: '@capacitor scoped import', regex: /@capacitor\b/i },
  // `Capacitor` global identifier usage: `Capacitor.isNativePlatform()`,
  // `Capacitor.Plugins`, `Capacitor(...)`, etc. Case-sensitive to match the
  // actual global rather than the lowercase word in prose.
  { name: 'Capacitor global usage', regex: /\bCapacitor\s*[.(]/ },
  // Cordova as a module path or global member: `require('cordova')`,
  // `window.cordova`, `cordova.exec(...)`, `@cordova/...`.
  { name: 'cordova import/global usage', regex: /(@cordova\b|\bcordova\s*\.|['"]cordova['"])/i },
];

/**
 * Build the list of offline-layer files to scan.
 * - `public/sw.js`
 * - every file directly under `lib/offline/` (enumerated dynamically so new
 *   files are covered automatically)
 * - the offline hooks `hooks/useOnlineStatus.ts` and `hooks/useDraftSync.ts`
 * Only files that actually exist on disk are returned.
 */
function collectOfflineFiles(): string[] {
  const files: string[] = [];

  const swPath = p('public', 'sw.js');
  if (existsSync(swPath)) files.push(swPath);

  const offlineDir = p('lib', 'offline');
  if (existsSync(offlineDir)) {
    for (const entry of readdirSync(offlineDir, { withFileTypes: true })) {
      if (entry.isFile()) files.push(join(offlineDir, entry.name));
    }
  }

  for (const hook of ['useOnlineStatus.ts', 'useDraftSync.ts']) {
    const hookPath = p('hooks', hook);
    if (existsSync(hookPath)) files.push(hookPath);
  }

  return files;
}

interface Violation {
  readonly file: string;
  readonly pattern: string;
  readonly line: number;
  readonly text: string;
}

/** Scan a single file's source for any forbidden native/Capacitor reference. */
function scanFile(absPath: string): Violation[] {
  const source = readFileSync(absPath, 'utf-8');
  const lines = source.split(/\r?\n/);
  const rel = absPath.slice(ROOT.length + 1).replace(/\\/g, '/');
  const violations: Violation[] = [];

  lines.forEach((lineText, idx) => {
    for (const { name, regex } of FORBIDDEN_PATTERNS) {
      const match = regex.exec(lineText);
      if (match) {
        violations.push({
          file: rel,
          pattern: name,
          line: idx + 1,
          text: lineText.trim(),
        });
      }
    }
  });

  return violations;
}

describe('offline-support platform-neutrality guard (Req 11.1, 11.3, 11.5)', () => {
  const offlineFiles = collectOfflineFiles();

  it('discovers the offline-layer source files to scan', () => {
    // Sanity: the guard must actually be looking at files, otherwise it would
    // pass vacuously. sw.js + the lib/offline modules should always be present.
    expect(offlineFiles.length, 'expected offline-layer files to scan').toBeGreaterThan(0);
    expect(
      offlineFiles.some((f) => f.replace(/\\/g, '/').endsWith('public/sw.js')),
      'public/sw.js should be included in the scan',
    ).toBe(true);
  });

  it('contains no Capacitor/native/Cordova references anywhere in the offline layer', () => {
    const violations = offlineFiles.flatMap(scanFile);

    const report = violations
      .map((v) => `  - ${v.file}:${v.line} [${v.pattern}] -> ${v.text}`)
      .join('\n');

    expect(
      violations,
      violations.length > 0
        ? `Found forbidden native/Capacitor references in the offline layer (Req 11.5):\n${report}`
        : '',
    ).toEqual([]);
  });

  // Per-file assertions give a precise failure location when the aggregate
  // fails, and keep newly added lib/offline files covered automatically.
  it.each(offlineFiles.map((f) => [f.slice(ROOT.length + 1).replace(/\\/g, '/'), f] as const))(
    'offline file %s is free of native/Capacitor references',
    (_rel, absPath) => {
      const violations = scanFile(absPath);
      const report = violations
        .map((v) => `  - ${v.file}:${v.line} [${v.pattern}] -> ${v.text}`)
        .join('\n');
      expect(violations, report).toEqual([]);
    },
  );
});
