#!/usr/bin/env node
/**
 * scripts/migrate-avatars-to-blob.mjs
 *
 * One-off migration: moves avatars stored as inline base64 `data:` URLs in
 * `User.profileImageUrl` into Vercel Blob, replacing each value with a short URL.
 *
 * Why: measured on production, the top-50 leaderboard slice held 5.5 MB of avatar
 * bytes with a single avatar at 1.98 MB. That is why `/api/leaderboard` had to stop
 * selecting the column (15–22s response) and every user except the caller lost
 * their picture, and why `/api/account/me` — hit by the navbar on every page load —
 * was shipping megabytes of JSON.
 *
 * Safety:
 *   - DRY RUN by default. Nothing is written without `--apply`.
 *   - Before the first write it dumps every original value to a timestamped JSON
 *     backup file, so the change is reversible.
 *   - Only rows whose value starts with `data:` are touched. Google OAuth avatars
 *     (already `https://` URLs) and empty rows are skipped, so re-running is safe.
 *
 * Usage:
 *   node scripts/migrate-avatars-to-blob.mjs            # dry run, shows the plan
 *   node scripts/migrate-avatars-to-blob.mjs --apply    # perform the migration
 *   node scripts/migrate-avatars-to-blob.mjs --restore <backup.json>
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';

// Next loads .env automatically; a bare node script does not.
for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
}

const APPLY = process.argv.includes('--apply');
const restoreIdx = process.argv.indexOf('--restore');
const RESTORE_FILE = restoreIdx !== -1 ? process.argv[restoreIdx + 1] : null;

const prisma = new PrismaClient();
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

/** Map a data URL's declared MIME to an extension, sniffing as a fallback. */
function extFor(dataUrl, bytes) {
    const declared = (dataUrl.match(/^data:image\/([a-z0-9.+-]+)/i) || [, ''])[1].toLowerCase();
    if (declared === 'jpeg' || declared === 'jpg') return 'jpg';
    if (declared === 'png') return 'png';
    if (declared === 'webp') return 'webp';
    if (declared === 'gif') return 'gif';
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpg';
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'png';
    return 'bin';
}

async function restore() {
    const rows = JSON.parse(readFileSync(RESTORE_FILE, 'utf8'));
    console.log(`Restoring ${rows.length} original value(s) from ${RESTORE_FILE} ...`);
    if (!APPLY) {
        console.log('DRY RUN — add --apply to actually restore.');
        return;
    }
    let n = 0;
    for (const r of rows) {
        await prisma.user.update({
            where: { id: r.id },
            data: { profileImageUrl: r.profileImageUrl },
        });
        n++;
    }
    console.log(`Restored ${n} row(s).`);
}

async function migrate() {
    const all = await prisma.user.findMany({
        select: { id: true, email: true, profileImageUrl: true },
    });

    const inline = all.filter((u) => u.profileImageUrl && u.profileImageUrl.startsWith('data:'));
    const urls = all.filter((u) => u.profileImageUrl && /^https?:\/\//.test(u.profileImageUrl));
    const empty = all.filter((u) => !u.profileImageUrl);

    const totalBytes = inline.reduce((n, u) => n + u.profileImageUrl.length, 0);

    console.log('=== AVATAR MIGRATION ===');
    console.log('mode                :', APPLY ? 'APPLY (will write)' : 'DRY RUN');
    console.log('users total         :', all.length);
    console.log('inline base64 avatars:', inline.length, '(' + kb(totalBytes) + ' total)');
    console.log('already URLs        :', urls.length, '(skipped)');
    console.log('no avatar           :', empty.length, '(skipped)');

    if (inline.length === 0) {
        console.log('\nNothing to migrate.');
        return;
    }

    console.log('\nRows to migrate:');
    for (const u of inline) {
        console.log(`  ${u.email.padEnd(38)} ${kb(u.profileImageUrl.length)}`);
    }

    if (!APPLY) {
        console.log('\nDRY RUN — no changes made. Re-run with --apply to migrate.');
        return;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
        console.error('\nFAIL  BLOB_READ_WRITE_TOKEN is not set. Cannot upload.');
        process.exitCode = 1;
        return;
    }

    // Back up BEFORE the first write so this is reversible.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `avatar-backup-${stamp}.json`;
    writeFileSync(
        backupPath,
        JSON.stringify(inline.map((u) => ({ id: u.id, email: u.email, profileImageUrl: u.profileImageUrl })), null, 2),
    );
    console.log(`\nBackup written: ${backupPath}`);
    console.log('Restore with: node scripts/migrate-avatars-to-blob.mjs --restore ' + backupPath + ' --apply\n');

    let ok = 0;
    let failed = 0;
    let after = 0;

    for (const u of inline) {
        const dataUrl = u.profileImageUrl;
        try {
            const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
            const bytes = Buffer.from(base64, 'base64');
            const ext = extFor(dataUrl, bytes);

            const blob = await put(`avatars/${u.id}.${ext}`, bytes, {
                access: 'public',
                contentType: (dataUrl.match(/^data:([^;,]+)/) || [, 'image/jpeg'])[1],
                addRandomSuffix: true,
                cacheControlMaxAge: 60 * 60 * 24 * 365,
            });

            await prisma.user.update({
                where: { id: u.id },
                data: { profileImageUrl: blob.url },
            });

            after += blob.url.length;
            ok++;
            console.log(`  OK   ${u.email.padEnd(38)} ${kb(dataUrl.length)} -> ${blob.url.length} bytes`);
        } catch (err) {
            failed++;
            console.error(`  FAIL ${u.email.padEnd(38)} ${err?.message?.slice(0, 120)}`);
        }
    }

    console.log('\n=== RESULT ===');
    console.log('migrated :', ok);
    console.log('failed   :', failed);
    console.log('column shrank from', kb(totalBytes), 'to', kb(after));
    if (failed) {
        console.log('\nSome rows failed and still hold base64. Re-running is safe — it only');
        console.log('touches rows that still start with "data:".');
        process.exitCode = 1;
    }
}

try {
    if (RESTORE_FILE) await restore();
    else await migrate();
} finally {
    await prisma.$disconnect();
}
