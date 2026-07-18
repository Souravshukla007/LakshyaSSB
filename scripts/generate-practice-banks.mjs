#!/usr/bin/env node
// scripts/generate-practice-banks.mjs
//
// Build-time generator for offline practice-bank static assets.
//
// Reads every `data/practice/*.json` bank, copies it verbatim into
// `public/practice-banks/<sameName>.json`, and emits
// `public/practice-banks/index.json` describing each bank with a stable,
// versioned, forward-slash URL and a question `count`.
//
// The `version` field is a sha256 content hash of the concatenated bank
// contents, so it changes only when the underlying bank content changes.
//
// Idempotent and safe to re-run. Platform-neutral (Node ESM, no deps).
//
// _Requirements: 4.1, 4.2_
// _Design: Static bank assets (Components → Offline practice selection module)_

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const CWD = process.cwd();
const SRC_DIR = path.join(CWD, 'data', 'practice');
const OUT_DIR = path.join(CWD, 'public', 'practice-banks');
const URL_BASE = '/practice-banks';

/** Convert a bank file name into its stable id (drop the .json extension). */
function bankIdFromFile(fileName) {
  return fileName.replace(/\.json$/i, '');
}

/** Count array items in a parsed bank; guard non-arrays to 0 and warn. */
function countItems(id, parsed) {
  if (Array.isArray(parsed)) {
    return parsed.length;
  }
  console.warn(
    `[generate-practice-banks] WARN: bank "${id}" is not a JSON array; recording count 0.`
  );
  return 0;
}

function main() {
  // Enumerate bank files from the source directory so new banks are picked up
  // automatically rather than being hardcoded.
  let entries;
  try {
    entries = readdirSync(SRC_DIR, { withFileTypes: true });
  } catch (err) {
    console.error(
      `[generate-practice-banks] ERROR: cannot read source directory "${SRC_DIR}": ${err.message}`
    );
    process.exit(1);
    return;
  }

  const bankFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.json'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  if (bankFiles.length === 0) {
    console.warn(
      `[generate-practice-banks] WARN: no *.json banks found in "${SRC_DIR}".`
    );
  }

  // Ensure the output directory exists (idempotent).
  mkdirSync(OUT_DIR, { recursive: true });

  const banks = [];
  let totalQuestions = 0;
  const hash = createHash('sha256');

  for (const fileName of bankFiles) {
    const id = bankIdFromFile(fileName);
    const srcPath = path.join(SRC_DIR, fileName);
    const raw = readFileSync(srcPath, 'utf8');

    // Feed raw content into the content hash so `version` changes only when
    // bank content changes. Prefix with the id to keep the hash sensitive to
    // renames/additions as well as content edits.
    hash.update(id);
    hash.update('\0');
    hash.update(raw);
    hash.update('\n');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.warn(
        `[generate-practice-banks] WARN: bank "${id}" is not valid JSON (${err.message}); recording count 0 and copying verbatim.`
      );
      parsed = null;
    }

    const count = parsed === null ? 0 : countItems(id, parsed);
    totalQuestions += count;

    // Copy the JSON verbatim into the output directory.
    const outPath = path.join(OUT_DIR, fileName);
    writeFileSync(outPath, raw);

    banks.push({
      id,
      // Emitted URLs always use forward slashes regardless of platform.
      file: `${URL_BASE}/${fileName}`,
      count,
    });
  }

  const version = hash.digest('hex');

  const index = { version, banks };
  const indexPath = path.join(OUT_DIR, 'index.json');
  writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);

  console.log(
    `[generate-practice-banks] Wrote ${banks.length} bank(s), ${totalQuestions} total question(s) to ${path
      .relative(CWD, OUT_DIR)
      .split(path.sep)
      .join('/')}/`
  );
  console.log(`[generate-practice-banks] version: ${version}`);
}

main();
