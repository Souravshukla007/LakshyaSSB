// Feature: offline-support, Property 5: Dynamic and online-only requests are never served from cache — For any request, isNetworkOnly(url, method) returns true for every non-GET method and for every enumerated online-only endpoint (login/signup/Google auth, payments/Razorpay, AI evaluation, AI chat mentor, current affairs, leaderboards, notifications, access-check, streak, and OIR generation), and returns false for cacheable classes (app shell, static study pages, /_next/static, fonts, hero images, practice banks, whitelisted read-only GET APIs); whenever isNetworkOnly is true the Service Worker does not substitute a cached response (it passes the request through to the network).

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isNetworkOnly } from '@/lib/offline/sw-helpers';

// Enumerated online-only endpoints (GET) that MUST be network-only.
const ONLINE_ONLY_PATHS: readonly string[] = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/google',
  '/api/payment/create-order',
  '/api/payment/verify',
  '/api/srt/submit',
  '/api/wat/submit',
  '/api/tat/generate',
  '/api/tat/x',
  '/api/piq/evaluate',
  '/api/gpe/evaluate',
  '/api/chat',
  '/api/current-affairs',
  '/api/leaderboard',
  '/api/notifications',
  '/api/practice/check-access',
  '/api/streak/status',
  '/api/oir/generate',
];

// Cacheable classes (GET) that MUST NOT be network-only.
const CACHEABLE_PATHS: readonly string[] = [
  '/',
  '/roadmap',
  '/about',
  '/ssb/day-1',
  '/piq/form',
  '/_next/static/chunks/main.js',
  '/practice-banks/oir_analogy.json',
  '/practice-banks/srt01.json',
  'https://fonts.googleapis.com/css2?family=Inter',
  'https://fonts.gstatic.com/s/inter/font.woff2',
  'https://images.unsplash.com/photo-123',
  'https://images.pexels.com/photo/456',
  '/api/auth/status',
];

const HTTP_VERBS = ['GET', 'get', 'Get', 'gEt'];
const NON_GET_VERBS = ['POST', 'PUT', 'PATCH', 'DELETE', 'post', 'delete', 'HEAD', 'OPTIONS'];

describe('Property 5: dynamic and online-only requests are never served from cache', () => {
  it('any non-GET method is network-only, for any url', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...NON_GET_VERBS),
        fc.oneof(
          fc.constantFrom(...ONLINE_ONLY_PATHS, ...CACHEABLE_PATHS),
          fc.webUrl(),
          fc.string({ minLength: 1 })
        ),
        (method, url) => {
          expect(isNetworkOnly(url, method)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('every enumerated online-only endpoint with GET is network-only (any casing)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ONLINE_ONLY_PATHS),
        fc.constantFrom(...HTTP_VERBS),
        (path, method) => {
          expect(isNetworkOnly(path, method)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('every cacheable class with GET is NOT network-only (any casing)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CACHEABLE_PATHS),
        fc.constantFrom(...HTTP_VERBS),
        (path, method) => {
          expect(isNetworkOnly(path, method)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 4 gap-fill: PAYMENT HOST classification. The property suites above cover
// non-GET, enumerated online-only paths, and cacheable classes, but the payment
// GATEWAY HOSTS (Razorpay) — which are network-only for GET regardless of path —
// were only exercised in the preservation suite. Pin them here as focused unit
// examples so the dedicated isNetworkOnly unit file covers every branch.
// ─────────────────────────────────────────────────────────────────────────────
const PAYMENT_HOSTS: readonly string[] = ['checkout.razorpay.com', 'api.razorpay.com'];

describe('isNetworkOnly — payment gateway hosts are network-only for GET', () => {
  it('treats every Razorpay host path as network-only regardless of path', () => {
    for (const host of PAYMENT_HOSTS) {
      for (const path of ['/', '/checkout', '/v1/orders', '/anything?x=1']) {
        expect(isNetworkOnly(`https://${host}${path}`, 'GET')).toBe(true);
      }
    }
  });

  it('does NOT flag look-alike / non-payment hosts as network-only for a cacheable GET', () => {
    // A different host must not be captured by the payment-host rule.
    expect(isNetworkOnly('https://razorpay.com.evil.example/checkout', 'GET')).toBe(false);
    expect(isNetworkOnly('https://images.unsplash.com/photo-1', 'GET')).toBe(false);
  });

  it('the whitelisted read-only GET API stays cacheable while other auth GETs do not', () => {
    // Boundary between the whitelist and the enumerated online-only auth group.
    expect(isNetworkOnly('/api/auth/status', 'GET')).toBe(false);
    expect(isNetworkOnly('/api/auth/login', 'GET')).toBe(true);
    expect(isNetworkOnly('/api/auth', 'GET')).toBe(true);
  });
});
