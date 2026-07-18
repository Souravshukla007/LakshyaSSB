// Feature: offline-support
// Post-build smoke assertions for required offline artifacts (Task 13.1).
//
// These are on-disk existence/shape checks (not property or unit tests): they
// guard that the manifest, PWA icons, hero placeholder, service worker, and
// generated practice-bank assets are present and well-formed so the offline
// layer can actually function in production.
//
// Validates: Requirements 1.2 (manifest + 192/512 icons), 4.1 (practice banks
// exposed as static, versioned assets with counts).

import { describe, it, expect } from 'vitest';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/** Resolve a path relative to the repo root. */
function p(...segments: string[]): string {
  return join(ROOT, ...segments);
}

/** Assert a file exists and has a non-zero size, returning its size in bytes. */
function assertNonEmptyFile(relPath: string): number {
  const abs = p(relPath);
  expect(existsSync(abs), `${relPath} should exist on disk`).toBe(true);
  const size = statSync(abs).size;
  expect(size, `${relPath} should be non-empty`).toBeGreaterThan(0);
  return size;
}

describe('offline-support required artifacts (smoke)', () => {
  it('public/manifest.webmanifest exists and is a valid Web App Manifest (Req 1.2)', () => {
    const abs = p('public', 'manifest.webmanifest');
    expect(existsSync(abs), 'manifest.webmanifest should exist').toBe(true);

    const raw = readFileSync(abs, 'utf-8');
    let manifest: Record<string, unknown>;
    expect(() => {
      manifest = JSON.parse(raw);
    }, 'manifest.webmanifest should be valid JSON').not.toThrow();

    manifest = JSON.parse(raw);

    // Required top-level fields.
    expect(typeof manifest.name, 'manifest.name should be a string').toBe('string');
    expect((manifest.name as string).length).toBeGreaterThan(0);
    expect(typeof manifest.start_url, 'manifest.start_url should be a string').toBe('string');
    expect(typeof manifest.display, 'manifest.display should be a string').toBe('string');

    // Icons array with at least 192x192 and 512x512 entries (Req 1.2).
    expect(Array.isArray(manifest.icons), 'manifest.icons should be an array').toBe(true);
    const icons = manifest.icons as Array<{ sizes?: string }>;
    const sizes = icons.map((icon) => icon?.sizes);
    expect(sizes, 'icons should include a 192x192 entry').toContain('192x192');
    expect(sizes, 'icons should include a 512x512 entry').toContain('512x512');
  });

  it('public/icons/icon-192.png exists and is non-empty (Req 1.2)', () => {
    assertNonEmptyFile(join('public', 'icons', 'icon-192.png'));
  });

  it('public/icons/icon-512.png exists and is non-empty (Req 1.2)', () => {
    assertNonEmptyFile(join('public', 'icons', 'icon-512.png'));
  });

  it('public/images/hero-placeholder.png exists and is non-empty (Req 2.3)', () => {
    assertNonEmptyFile(join('public', 'images', 'hero-placeholder.png'));
  });

  it('public/sw.js exists and contains CACHE_VERSION and addEventListener', () => {
    const abs = p('public', 'sw.js');
    expect(existsSync(abs), 'sw.js should exist').toBe(true);
    const source = readFileSync(abs, 'utf-8');
    expect(source, 'sw.js should declare a CACHE_VERSION').toContain('CACHE_VERSION');
    expect(source, 'sw.js should register event listeners').toContain('addEventListener');
  });

  it('public/practice-banks/index.json exists, is valid, and references real bank files (Req 4.1)', () => {
    const abs = p('public', 'practice-banks', 'index.json');
    expect(existsSync(abs), 'practice-banks/index.json should exist').toBe(true);

    const raw = readFileSync(abs, 'utf-8');
    let index: { version?: unknown; banks?: unknown };
    expect(() => {
      index = JSON.parse(raw);
    }, 'index.json should be valid JSON').not.toThrow();

    index = JSON.parse(raw);

    // version string.
    expect(typeof index.version, 'index.version should be a string').toBe('string');
    expect((index.version as string).length).toBeGreaterThan(0);

    // Non-empty banks array with well-formed entries.
    expect(Array.isArray(index.banks), 'index.banks should be an array').toBe(true);
    const banks = index.banks as Array<{ id?: unknown; file?: unknown; count?: unknown }>;
    expect(banks.length, 'index.banks should be non-empty').toBeGreaterThan(0);

    for (const bank of banks) {
      expect(typeof bank.id, 'bank.id should be a string').toBe('string');
      expect((bank.id as string).length).toBeGreaterThan(0);
      expect(typeof bank.file, 'bank.file should be a string').toBe('string');
      expect(
        (bank.file as string).startsWith('/practice-banks/'),
        'bank.file should start with /practice-banks/',
      ).toBe(true);
      expect(typeof bank.count, 'bank.count should be numeric').toBe('number');
    }

    // At least one referenced bank file exists on disk.
    const firstFile = (banks[0].file as string).replace(/^\//, '');
    assertNonEmptyFile(join('public', ...firstFile.split('/')));
  });
});
