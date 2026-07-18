// Feature: offline-support — Task 5.5
// Unit tests for the Web App Manifest and the Service Worker registration fallback.
// Validates: Requirements 1.2, 1.7
//
// ── Environment note / documented limitation ────────────────────────────────
// The manifest assertions (Req 1.2) are fully verified here by reading the real
// public/manifest.webmanifest from disk and parsing it.
//
// For the registration fallback (Req 1.7), the ServiceWorkerRegister component
// dispatches the `lssb:sw-unavailable` window event from inside a `useEffect`
// when Service Workers are unsupported. Driving that effect requires a DOM
// environment (jsdom) and/or @testing-library/react, neither of which is
// installed and — per the hard no-new-dependency constraint — neither is added.
// We therefore verify the component CONTRACT without a DOM: it is a valid default
// React component export, and it renders nothing (returns null) so mounting it in
// the layout is inert on the server. The live event dispatch is left to a
// DOM-enabled/integration environment.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ServiceWorkerRegister from '@/components/offline/ServiceWorkerRegister';

function readManifest(): Record<string, unknown> {
    const manifestPath = resolve(process.cwd(), 'public', 'manifest.webmanifest');
    const raw = readFileSync(manifestPath, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
}

describe('Web App Manifest — required fields and icons (Req 1.2)', () => {
    it('is valid JSON with the required top-level members', () => {
        const manifest = readManifest();
        expect(typeof manifest.name).toBe('string');
        expect((manifest.name as string).length).toBeGreaterThan(0);
        expect(manifest.start_url).toBe('/');
        expect(typeof manifest.display).toBe('string');
        expect((manifest.display as string).length).toBeGreaterThan(0);
        expect(Array.isArray(manifest.icons)).toBe(true);
    });

    it('declares at least one 192x192 and one 512x512 icon', () => {
        const manifest = readManifest();
        const icons = manifest.icons as Array<{ sizes?: string; src?: string; type?: string }>;
        const sizes = icons.map((i) => i.sizes);
        expect(sizes).toContain('192x192');
        expect(sizes).toContain('512x512');

        // Every declared icon should have a src and a type for installability.
        for (const icon of icons) {
            expect(typeof icon.src).toBe('string');
            expect((icon.src as string).length).toBeGreaterThan(0);
            expect(typeof icon.type).toBe('string');
        }
    });
});

describe('ServiceWorkerRegister — registration fallback contract (Req 1.7)', () => {
    it('is exported as a default React component (function)', () => {
        expect(typeof ServiceWorkerRegister).toBe('function');
    });

    it('renders nothing (returns null) so it is inert in the tree', () => {
        // SSR executes the render body (no effects), so no window/navigator access
        // occurs and the component contributes empty markup.
        const markup = renderToStaticMarkup(React.createElement(ServiceWorkerRegister));
        expect(markup).toBe('');
    });
});
