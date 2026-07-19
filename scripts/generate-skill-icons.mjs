/**
 * DEPRECATED (T-028): Do NOT generate SVG skill tiles.
 * Use Imagine (image_gen) → public/assets/icons/skills/{id}.jpg and update skillArtManifest.
 */
console.error(
  '[T-028] generate-skill-icons.mjs is deprecated. Skill art must be Imagine raster, not SVG.',
);
process.exit(1);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public', 'assets', 'icons', 'skills');
const publicAssets = path.join(root, 'public', 'assets');
const rootAssets = path.join(root, 'assets');

const ELEMENT_STYLE = {
  FIRE: { bg: '#2a1010', border: '#ff5a2a', glow: '#ff8a40', emoji: '🔥' },
  WATER: { bg: '#0c1a28', border: '#3a9dff', glow: '#7ec8ff', emoji: '💧' },
  WIND: { bg: '#102818', border: '#4dff9a', glow: '#9affc8', emoji: '🌪️' },
  LIGHTNING: { bg: '#1a1830', border: '#c9a0ff', glow: '#e8d0ff', emoji: '⚡' },
  EARTH: { bg: '#22180c', border: '#c4a35a', glow: '#e8d090', emoji: '🪨' },
  PHYSICAL: { bg: '#1a1410', border: '#e8b84a', glow: '#f5d98a', emoji: '👊' },
  MENTAL: { bg: '#1c1028', border: '#d45bff', glow: '#f0b0ff', emoji: '👁️' },
};

const ACTION_EMOJI = {
  MAIN: '⚔️',
  SIDE: '🛡️',
  TOGGLE: '🔁',
  PASSIVE: '✨',
};

/** Known painted backgrounds (repo-root assets/) → skill ids */
const PNG_BY_SKILL = {
  basic_atk: 'skill_taijutsu.png',
  shuriken: 'skill_shuriken.png',
  fireball: 'skill_fireball.png',
  primary_lotus: 'skill_primary_lotus.png',
  shadow_clone: 'skill_shadow_clones.png',
  gentle_fist: 'skill_gentle_fist.png',
  mind_destruction: 'skill_mind_body_disturbing.png',
  chidori: 'skill_chidori.png',
};

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function styleFor(skill) {
  return ELEMENT_STYLE[skill.el] || ELEMENT_STYLE.PHYSICAL;
}

function emojiFor(skill) {
  if (skill.action === 'PASSIVE') return '✨';
  return styleFor(skill).emoji || ACTION_EMOJI[skill.action] || '⚔️';
}

function svgFor(skill) {
  const st = styleFor(skill);
  const emoji = emojiFor(skill);
  const label = escapeXml(skill.name || skill.id);
  // Card-shaped 192×256 tile (arcade hard edges, element palette)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="256" viewBox="0 0 192 256" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${st.glow}" stop-opacity="0.35"/>
      <stop offset="55%" stop-color="${st.bg}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#050508" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="192" height="256" fill="url(#g)"/>
  <rect x="4" y="4" width="184" height="248" fill="none" stroke="${st.border}" stroke-width="6"/>
  <rect x="12" y="12" width="168" height="232" fill="none" stroke="${st.border}" stroke-width="2" opacity="0.5"/>
  <circle cx="96" cy="108" r="48" fill="${st.bg}" stroke="${st.glow}" stroke-width="3" opacity="0.9"/>
  <text x="96" y="122" text-anchor="middle" font-size="42" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
  <text x="96" y="188" text-anchor="middle" fill="${st.glow}" font-size="14" font-family="Silkscreen, monospace" font-weight="700" letter-spacing="1">${escapeXml((skill.el || 'PHYS').slice(0, 8))}</text>
  <text x="96" y="220" text-anchor="middle" fill="#f0e8d8" font-size="11" font-family="Silkscreen, monospace">${escapeXml((skill.action || 'MAIN').slice(0, 8))}</text>
</svg>
`;
}

const metaPath = path.join(root, 'todos', 'skills-meta.json');
if (!fs.existsSync(metaPath)) {
  console.error('Missing todos/skills-meta.json — run extract-skills-meta.mjs first');
  process.exit(1);
}

const skills = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(publicAssets, { recursive: true });

// Ensure known PNGs are servable from public/
for (const file of Object.values(PNG_BY_SKILL)) {
  const src = path.join(rootAssets, file);
  const dest = path.join(publicAssets, file);
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log('copied', file, '→ public/assets/');
  }
}
// Also copy any other skill_*.png from root assets
if (fs.existsSync(rootAssets)) {
  for (const f of fs.readdirSync(rootAssets)) {
    if (f.startsWith('skill_') && f.endsWith('.png')) {
      const dest = path.join(publicAssets, f);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(rootAssets, f), dest);
        console.log('copied', f);
      }
    }
  }
}

const manifest = [];

for (const skill of skills) {
  const svgPath = path.join(outDir, `${skill.id}.svg`);
  fs.writeFileSync(svgPath, svgFor(skill), 'utf8');

  let src = `/assets/icons/skills/${skill.id}.svg`;
  let quality = 'svg-tile';

  // Prefer painted PNG override
  const pngName = PNG_BY_SKILL[skill.id];
  if (pngName && fs.existsSync(path.join(publicAssets, pngName))) {
    src = `/assets/${pngName}`;
    quality = 'painted-png';
  } else if (skill.image) {
    // skills.ts image path (e.g. /assets/skill_chidori.png)
    const base = path.basename(skill.image);
    if (fs.existsSync(path.join(publicAssets, base))) {
      src = skill.image.startsWith('/') ? skill.image : `/${skill.image}`;
      quality = 'painted-png';
    }
  }

  manifest.push({
    id: skill.id,
    name: skill.name,
    el: skill.el,
    action: skill.action,
    dmg: skill.dmg,
    emoji: emojiFor(skill),
    src,
    quality,
  });
}

fs.writeFileSync(
  path.join(root, 'todos', 'skill-art-manifest.json'),
  JSON.stringify(manifest, null, 2),
);

// Emit TS fragment data for artRegistry import
const ts = `/* AUTO-GENERATED by scripts/generate-skill-icons.mjs — do not edit by hand */
export interface SkillArtManifestEntry {
  id: string;
  name: string;
  el?: string;
  action?: string;
  dmg?: string;
  emoji: string;
  src: string;
  quality: 'svg-tile' | 'painted-png';
}

export const SKILL_ART_MANIFEST: SkillArtManifestEntry[] = ${JSON.stringify(manifest, null, 2)};
`;

fs.writeFileSync(path.join(root, 'src', 'game', 'constants', 'skillArtManifest.ts'), ts);

const painted = manifest.filter((m) => m.quality === 'painted-png').length;
console.log(`Generated ${manifest.length} skill arts (${painted} painted PNG, ${manifest.length - painted} SVG tiles)`);
console.log('Wrote src/game/constants/skillArtManifest.ts');
