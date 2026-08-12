#!/usr/bin/env node
/**
 * Heuristic allowlist pass: collect asset path strings from manifests + src,
 * then list files under public/assets that never appear as a substring match.
 *
 * Not perfect (dynamic path builders may false-positive as "unused").
 * Use as a starting point before deleting anything.
 *
 * Usage: node scripts/list-unreferenced-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicAssets = path.join(root, 'public', 'assets');
const scanRoots = [
  path.join(root, 'src'),
  path.join(root, 'index.html'),
];

const TEXT_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.json', '.md',
]);

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const st = fs.statSync(dir);
  if (st.isFile()) {
    acc.push(dir);
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walkFiles(full, acc);
    } else acc.push(full);
  }
  return acc;
}

function collectCorpus() {
  const chunks = [];
  for (const start of scanRoots) {
    for (const file of walkFiles(start)) {
      const ext = path.extname(file).toLowerCase();
      if (!TEXT_EXT.has(ext)) continue;
      try {
        chunks.push(fs.readFileSync(file, 'utf8'));
      } catch {
        /* ignore */
      }
    }
  }
  return chunks.join('\n');
}

function listPublicAssets() {
  const files = [];
  for (const file of walkFiles(publicAssets)) {
    const rel = path.relative(path.join(root, 'public'), file).replace(/\\/g, '/');
    files.push(rel);
  }
  return files;
}

const corpus = collectCorpus();
const assets = listPublicAssets();
const unused = [];
const used = [];

for (const rel of assets) {
  const base = path.posix.basename(rel);
  const asUrl = '/' + rel;
  // Match full public URL, path under assets/, or bare filename (manifests often use full paths).
  if (corpus.includes(asUrl) || corpus.includes(rel) || corpus.includes(base)) {
    used.push(rel);
  } else {
    unused.push(rel);
  }
}

unused.sort();
used.sort();

console.log(`Referenced (heuristic): ${used.length}`);
console.log(`Unreferenced candidates: ${unused.length}`);
console.log('\n--- Unreferenced candidates (review before delete) ---');
for (const u of unused) console.log(u);

const outPath = path.join(root, 'docs', 'asset-unreferenced-candidates.txt');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, unused.join('\n') + (unused.length ? '\n' : ''), 'utf8');
console.log(`\nWrote ${outPath}`);
