import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/**
 * ESLint flat config.
 *
 * History, because this is the third attempt and each failure looked different:
 *
 *   1. `package.json` ran `next lint`, but Next.js 16 removed that subcommand, so
 *      the word "lint" was parsed as a project path:
 *      "Invalid project directory provided, no such directory: …\lint".
 *   2. It was then rewritten to bridge the old .eslintrc.json through `FlatCompat`.
 *      That crashed with "TypeError: Converting circular structure to JSON" —
 *      eslint-config-next@16 already *ships flat configs* (see its `exports` map:
 *      "./core-web-vitals" and "./typescript"), and feeding native flat config
 *      back through the eslintrc compat layer creates a circular plugin reference
 *      via the shared `react` plugin.
 *
 * So: import the flat configs directly, no compat layer. The old .eslintrc.json
 * has been deleted — ESLint 9 ignores it whenever a flat config is present, so
 * keeping it around was duplicate config guaranteed to drift.
 */
export default [
    {
        ignores: [
            '.next/**',
            'node_modules/**',
            'android/**',
            'public/sw.js',
            'next-env.d.ts',
            // Local AI-assistant tooling and scratch skills. These are gitignored
            // and are not application source, but they were contributing 11 of the
            // 45 reported problems (all `no-require-imports` in .cjs helpers),
            // which buries the findings that actually matter.
            '.gemini/**',
            '.kiro/**',
            'skills/**',
        ],
    },
    // Each export may be a single config object or an array of them; flatten so
    // either shape composes correctly.
    ...[coreWebVitals, nextTypescript].flat(),
    {
        rules: {
            'react/no-unescaped-entities': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            'react-hooks/exhaustive-deps': 'off',
            '@next/next/no-img-element': 'off',
            '@next/next/no-page-custom-font': 'off',
        },
    },
];
