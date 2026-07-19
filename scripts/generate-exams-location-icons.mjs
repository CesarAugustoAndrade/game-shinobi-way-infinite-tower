/**
 * DEPRECATED (T-028): Do NOT generate SVG location icons.
 * Use Imagine → public/assets/icons/locations/{id}.jpg
 */
console.error(
  '[T-028] generate-exams-location-icons.mjs is deprecated. Use Imagine for location icons.',
);
process.exit(1);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'assets', 'icons', 'locations');

const LOCATIONS = [
  ['exam_gates', '🚪', 'Exam Gates', '#3ecf8e'],
  ['forest_edge', '🌲', 'Forest Edge', '#2d8f4e'],
  ['thicket_paths', '🌿', 'Thicket Paths', '#4dff9a'],
  ['muddy_ford', '🌊', 'Muddy Ford', '#3a9dff'],
  ['scroll_cache', '📜', 'Scroll Cache', '#e8b84a'],
  ['rival_checkpoint', '⚔️', 'Rival Checkpoint', '#c44'],
  ['sound_hideout', '🔊', 'Sound Hideout', '#c9a0ff'],
  ['tower_approach', '🗼', 'Tower Approach', '#e8b84a'],
  ['serpent_thicket', '🐍', 'Serpent Thicket', '#6b8f3a'],
  ['orochimaru_arena', '🏟️', "Orochimaru's Arena", '#ff5a2a'],
  ['hidden_heaven_scroll', '✨', 'Heaven Scroll', '#f5d98a'],
  ['insect_colony', '🪲', 'Insect Colony', '#8a6bff'],
  ['snake_den', '🐍', 'Snake Den', '#d45bff'],
];

function svg(emoji, border, label) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="${label}">
  <rect width="64" height="64" fill="#0f1c18"/>
  <rect x="2" y="2" width="60" height="60" fill="none" stroke="${border}" stroke-width="4"/>
  <text x="32" y="40" text-anchor="middle" font-size="26" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
</svg>
`;
}

fs.mkdirSync(outDir, { recursive: true });
for (const [id, emoji, label, border] of LOCATIONS) {
  fs.writeFileSync(path.join(outDir, `${id}.svg`), svg(emoji, border, label), 'utf8');
}
console.log(`Wrote ${LOCATIONS.length} Chunin Exams location icons`);
