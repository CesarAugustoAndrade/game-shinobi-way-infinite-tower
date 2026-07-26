/**
 * Black-key enemy cutouts: convert solid black backgrounds to true transparency.
 *
 * Processes public/assets/enemy_cut_*.png and assets/enemy_cut_*.png:
 *  - RGB colorType 2 (no alpha) with black matte
 *  - RGBA colorType 6 that still has opaque black corner matte (unused alpha)
 * Skips files that already have usable transparency.
 *
 * Algorithm:
 *  - R,G,B all <= HARD (15) → alpha 0
 *  - low-chroma max channel in (HARD, SOFT] (45) → soft partial alpha
 *  - colored / bright pixels stay fully opaque
 *  - writes PNG colorType 6 (RGBA)
 *
 * Usage: node scripts/blackkey-enemy-cutouts.mjs
 *        node scripts/blackkey-enemy-cutouts.mjs --dry-run
 *        node scripts/blackkey-enemy-cutouts.mjs --force
 */

import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DIRS = [
  path.join(ROOT, 'public', 'assets'),
  path.join(ROOT, 'assets'),
];

/** Near-black: all channels <= HARD → fully transparent */
const HARD = 15;
/** Soft fringe: max channel HARD+1..SOFT → partial alpha (anti-jagged edges) */
const SOFT = 45;

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

function readIhdrMeta(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] !== 0x89 || buf[1] !== 0x50) {
    return { error: 'not png' };
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  let hasTRNS = false;
  let offset = 8;
  while (offset + 8 <= buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'tRNS') {
      hasTRNS = true;
      break;
    }
    if (type === 'IEND') break;
    offset += 12 + len;
  }
  const names = {
    0: 'Gray',
    2: 'RGB',
    3: 'Indexed',
    4: 'Gray+Alpha',
    6: 'RGBA',
  };
  const hasAlpha =
    colorType === 4 ||
    colorType === 6 ||
    ((colorType === 3 || colorType === 0) && hasTRNS);
  return {
    width,
    height,
    bitDepth,
    colorType,
    colorTypeName: names[colorType] || String(colorType),
    hasTRNS,
    hasAlpha,
  };
}

/**
 * Map one pixel RGB → alpha via black-key with soft edge.
 * Near-black (all channels <= HARD) → 0.
 * Soft edge when max channel in (HARD, SOFT] and low chroma (background fringe).
 * Colored / bright pixels stay fully opaque.
 */
function blackKeyAlpha(r, g, b) {
  if (r <= HARD && g <= HARD && b <= HARD) {
    return 0;
  }

  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const chroma = mx - mn;

  // Keep clearly colored pixels opaque (e.g. dark red clothes, blue cloth)
  if (chroma > 24) {
    return 255;
  }

  if (mx <= SOFT) {
    // Soft ramp for dark, low-chroma fringe near the black matte
    const t = (mx - HARD) / (SOFT - HARD);
    return Math.max(0, Math.min(255, Math.round(t * 255)));
  }

  return 255;
}

/**
 * True if the image already has usable transparency (not just RGBA with
 * an all-255 alpha channel over a black matte).
 */
function hasUsableTransparency(data) {
  let transparent = 0;
  const step = 4 * 16; // sample every 16th pixel
  let samples = 0;
  for (let i = 3; i < data.length; i += step) {
    samples++;
    if (data[i] < 250) transparent++;
  }
  // Corners: if most corners are already non-opaque, treat as cut out
  return samples > 0 && transparent / samples >= 0.05;
}

/**
 * True if image looks like a black-matte cutout (opaque near-black corners
 * and substantial opaque black area).
 */
function hasOpaqueBlackMatte(data, width, height) {
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  let blackCorners = 0;
  for (const [x, y] of corners) {
    const i = (y * width + x) * 4;
    if (
      data[i] <= HARD + 3 &&
      data[i + 1] <= HARD + 3 &&
      data[i + 2] <= HARD + 3 &&
      data[i + 3] >= 250
    ) {
      blackCorners++;
    }
  }
  return blackCorners >= 2;
}

function processFile(filePath) {
  const metaBefore = readIhdrMeta(filePath);
  if (metaBefore.error) {
    return { filePath, status: 'error', error: metaBefore.error };
  }

  const png = PNG.sync.read(fs.readFileSync(filePath));
  const { width, height, data } = png;

  const usableAlpha = metaBefore.hasAlpha && hasUsableTransparency(data);
  const opaqueBlackMatte = hasOpaqueBlackMatte(data, width, height);

  // Convert when: no alpha, or RGBA with opaque black matte, or --force
  const needsKey = force || !metaBefore.hasAlpha || opaqueBlackMatte;

  // Skip good cutouts (real alpha, no black corners) unless --force
  if (!needsKey || (usableAlpha && !opaqueBlackMatte && !force)) {
    return {
      filePath,
      status: 'skipped',
      reason: 'already has usable alpha',
      before: metaBefore,
    };
  }

  const note = !metaBefore.hasAlpha
    ? 'no-alpha RGB'
    : opaqueBlackMatte
      ? 'RGBA opaque black matte'
      : 'force re-key';

  if (dryRun) {
    return {
      filePath,
      status: 'would-convert',
      before: metaBefore,
      note,
    };
  }

  let transparent = 0;
  let partial = 0;
  let opaque = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const existingA = data[i + 3];
    let a = blackKeyAlpha(r, g, b);
    // Preserve prior real transparency when re-keying
    if (metaBefore.hasAlpha && existingA < 255) {
      a = Math.min(a, existingA);
    }
    data[i + 3] = a;
    if (a === 0) transparent++;
    else if (a < 255) partial++;
    else opaque++;
  }

  png.colorType = 6;
  const out = PNG.sync.write(png, { colorType: 6 });
  fs.writeFileSync(filePath, out);

  const metaAfter = readIhdrMeta(filePath);
  return {
    filePath,
    status: 'converted',
    before: metaBefore,
    after: metaAfter,
    note,
    stats: { transparent, partial, opaque, pixels: width * height },
  };
}

function main() {
  const results = { converted: [], skipped: [], would: [], errors: [] };

  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) {
      console.log(`DIR missing: ${dir}`);
      continue;
    }
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith('enemy_cut_') && f.endsWith('.png'))
      .sort();

    console.log(`\n=== ${path.relative(ROOT, dir)} (${files.length} files) ===`);

    for (const f of files) {
      const filePath = path.join(dir, f);
      const result = processFile(filePath);
      const rel = path.relative(ROOT, filePath);

      if (result.status === 'skipped') {
        results.skipped.push(result);
        console.log(
          `  SKIP  ${f}  (${result.before.colorTypeName}, usable alpha)`,
        );
      } else if (result.status === 'would-convert') {
        results.would.push(result);
        console.log(
          `  DRY   ${f}  ct=${result.before.colorType} ${result.before.colorTypeName} ` +
            `${result.before.width}x${result.before.height}  [${result.note}]`,
        );
      } else if (result.status === 'converted') {
        results.converted.push(result);
        const s = result.stats;
        const pctT = ((s.transparent / s.pixels) * 100).toFixed(1);
        console.log(
          `  FIX   ${f}  ${result.before.colorTypeName}→${result.after.colorTypeName}  ` +
            `trans=${pctT}% partial=${s.partial} opaque=${s.opaque}  [${result.note}]`,
        );
      } else {
        results.errors.push(result);
        console.log(`  ERR   ${rel}: ${result.error}`);
      }
    }
  }

  console.log('\n--- Summary ---');
  if (dryRun) {
    console.log(`Would convert: ${results.would.length}`);
  } else {
    console.log(`Converted: ${results.converted.length}`);
  }
  console.log(`Skipped (already RGBA/alpha): ${results.skipped.length}`);
  console.log(`Errors: ${results.errors.length}`);

  if (!dryRun && results.converted.length) {
    console.log('\nSample before→after color types:');
    for (const r of results.converted.slice(0, 5)) {
      console.log(
        `  ${path.basename(r.filePath)}: ct=${r.before.colorType} ${r.before.colorTypeName} → ct=${r.after.colorType} ${r.after.colorTypeName}`,
      );
    }
  }
}

main();
