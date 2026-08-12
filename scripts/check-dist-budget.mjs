#!/usr/bin/env node
/**
 * Dist size budget gate for CI / npm run verify.
 *
 * Vite copies all of public/ into dist/, so total dist size tracks asset bloat.
 * Initial download is approximated by JS+CSS under dist/assets (hashed bundles).
 *
 * Env overrides (bytes or with M/K suffix):
 *   DIST_BUDGET_TOTAL_MB   default 900
 *   DIST_BUDGET_JS_CSS_MB  default 5
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');

const TOTAL_MB = Number(process.env.DIST_BUDGET_TOTAL_MB ?? 750);
const JS_CSS_MB = Number(process.env.DIST_BUDGET_JS_CSS_MB ?? 5);

const TOTAL_BUDGET = TOTAL_MB * 1024 * 1024;
const JS_CSS_BUDGET = JS_CSS_MB * 1024 * 1024;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function mb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

if (!fs.existsSync(distDir)) {
  console.error('[budget] dist/ not found — run `npm run build` first');
  process.exit(1);
}

const files = walk(distDir);
let total = 0;
let jsCss = 0;
const largest = [];

for (const file of files) {
  const size = fs.statSync(file).size;
  total += size;
  const rel = path.relative(distDir, file).replace(/\\/g, '/');
  largest.push({ rel, size });
  if (/\.(js|css|mjs|map)$/i.test(file) && rel.startsWith('assets/')) {
    // Count only production bundles, not source maps toward "initial download"
    if (!file.endsWith('.map')) jsCss += size;
  }
}

largest.sort((a, b) => b.size - a.size);

console.log(`[budget] dist files: ${files.length}`);
console.log(`[budget] total dist: ${mb(total)} MB (budget ${TOTAL_MB} MB)`);
console.log(`[budget] JS+CSS bundles: ${mb(jsCss)} MB (budget ${JS_CSS_MB} MB)`);
console.log('[budget] top 10 largest files:');
for (const item of largest.slice(0, 10)) {
  console.log(`  ${mb(item.size).padStart(8)} MB  ${item.rel}`);
}

let failed = false;
if (total > TOTAL_BUDGET) {
  console.error(
    `[budget] FAIL: dist total ${mb(total)} MB exceeds ${TOTAL_MB} MB — purge unused public assets or raise DIST_BUDGET_TOTAL_MB intentionally`
  );
  failed = true;
}
if (jsCss > JS_CSS_BUDGET) {
  console.error(
    `[budget] FAIL: JS+CSS ${mb(jsCss)} MB exceeds ${JS_CSS_MB} MB — add code-splitting or raise DIST_BUDGET_JS_CSS_MB intentionally`
  );
  failed = true;
}

if (failed) process.exit(1);
console.log('[budget] OK');
