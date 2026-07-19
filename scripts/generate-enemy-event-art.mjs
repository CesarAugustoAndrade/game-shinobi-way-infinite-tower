/**
 * DEPRECATED (T-028): Do NOT generate SVG enemy/event tiles.
 * Use Imagine raster only under public/assets/icons/enemies|events/.
 */
console.error(
  '[T-028] generate-enemy-event-art.mjs is deprecated. Use Imagine for enemy/event art.',
);
process.exit(1);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicAssets = path.join(root, 'public', 'assets');
const rootAssets = path.join(root, 'assets');
const enemyDir = path.join(publicAssets, 'icons', 'enemies');
const eventDir = path.join(publicAssets, 'icons', 'events');

const ARCHETYPES = [
  { id: 'TANK', emoji: '🛡️', border: '#6b8cae', bg: '#121820', label: 'Tank' },
  { id: 'ASSASSIN', emoji: '🗡️', border: '#c44', bg: '#1a1010', label: 'Assassin' },
  { id: 'BALANCED', emoji: '⚖️', border: '#e8b84a', bg: '#1a1610', label: 'Balanced' },
  { id: 'CASTER', emoji: '🔮', border: '#8a6bff', bg: '#14101f', label: 'Caster' },
  { id: 'GENJUTSU', emoji: '👁️', border: '#d45bff', bg: '#1c1028', label: 'Genjutsu' },
];

/** Land of Waves enemyPool IDs (from landOfWaves.ts) */
const POOL_IDS = [
  'dock_worker', 'corrupt_guard', 'smuggler', 'beach_bandit', 'sea_spirit',
  'stranded_ronin', 'forest_bandit', 'wild_boar', 'missing_nin', 'cave_smuggler',
  'trap_master', 'guard_dog', 'village_thug', 'corrupt_merchant', 'hired_muscle',
  'river_bandit', 'camp_raider', 'desperate_traveler', 'drowned_sailor', 'water_spirit',
  'treasure_guardian', 'bridge_saboteur', 'hired_assassin', 'corrupt_foreman',
  'bandit_captain', 'elite_mercenary', 'war_dog', 'vengeful_ghost', 'manor_guardian',
  'cursed_servant', 'cove_smuggler', 'sea_creature', 'hidden_guard', 'shrine_demon',
  'corrupted_priest', 'eldritch_guardian', 'elite_guard', 'ronin', 'assassin', 'gato',
];

/** Job keyword portraits (existing painted assets) */
const JOB_PAINTED = {
  puppeteer: 'enemy_clumsy_puppeteer.png',
  monk: 'enemy_monk.png',
  ninja: 'enemy_exhausted_shinobi.png',
  shinobi: 'enemy_exhausted_shinobi.png',
  samurai: 'enemy_samurai.png',
};

const BOSS_PAINTED = {
  haku: 'enemy_boss_haku.png',
  demon_brothers: 'enemy_boss_demon_brothers.png',
};

const EVENT_IDS = [
  'forbidden_scroll_library', 'bullying_incident', 'secret_training_ground',
  'bridge_worker_plea', 'mist_ambush_cache', 'tazuna_request',
  'forest_death_trap', 'rival_team_encounter', 'giant_serpent_nest', 'scroll_merchant',
  'sound_four_ritual', 'curse_mark_amplifier', 'valley_vision',
  'orochimaru_experiment', 'orochimaru_experiment_result',
  'white_zetsu_paranoia', 'bijuu_chakra_fragment', 'reanimated_envoy',
  'reanimated_envoy_fate', 'envoy_gratitude_repaid',
  'scavengers_field', 'abandoned_supply_cache', 'ancient_treasure_map',
  'traveling_merchant_caravan', 'hidden_shrine_blessing', 'intelligence_network',
];

/** Key events get slightly distinct emoji; rest use category. */
const KEY_EVENT_EMOJI = {
  bridge_worker_plea: '🌉',
  tazuna_request: '👷',
  mist_ambush_cache: '🌫️',
  forbidden_scroll_library: '📜',
  forest_death_trap: '🌲',
  sound_four_ritual: ' Crowley',
  orochimaru_experiment: '🐍',
  reanimated_envoy: '💀',
  bijuu_chakra_fragment: '🦊',
  hidden_shrine_blessing: '⛩️',
  intelligence_network: '📡',
};

const EVENT_CATEGORIES = [
  { id: 'combat', emoji: '⚔️', border: '#c44', bg: '#1a1010', label: 'Combat Event' },
  { id: 'reward', emoji: '💎', border: '#e8b84a', bg: '#1a1610', label: 'Reward Event' },
  { id: 'story', emoji: '📖', border: '#6b8cae', bg: '#101820', label: 'Story Event' },
  { id: 'danger', emoji: '☠️', border: '#ff5a2a', bg: '#1a0c0c', label: 'Danger Event' },
  { id: 'generic', emoji: '🌀', border: '#8a6bff', bg: '#14101f', label: 'Event' },
];

/** Simple category assignment for cascade fallback */
const EVENT_CATEGORY_MAP = {
  bridge_worker_plea: 'combat',
  mist_ambush_cache: 'reward',
  tazuna_request: 'story',
  forest_death_trap: 'danger',
  rival_team_encounter: 'combat',
  giant_serpent_nest: 'danger',
  scroll_merchant: 'reward',
  sound_four_ritual: 'danger',
  curse_mark_amplifier: 'danger',
  valley_vision: 'story',
  orochimaru_experiment: 'danger',
  orochimaru_experiment_result: 'story',
  white_zetsu_paranoia: 'danger',
  bijuu_chakra_fragment: 'reward',
  reanimated_envoy: 'story',
  reanimated_envoy_fate: 'combat',
  envoy_gratitude_repaid: 'reward',
  scavengers_field: 'combat',
  abandoned_supply_cache: 'reward',
  ancient_treasure_map: 'reward',
  traveling_merchant_caravan: 'reward',
  hidden_shrine_blessing: 'reward',
  intelligence_network: 'story',
  forbidden_scroll_library: 'reward',
  bullying_incident: 'story',
  secret_training_ground: 'reward',
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function portraitSvg({ emoji, border, bg, label, sub }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="320" viewBox="0 0 256 320" role="img" aria-label="${esc(label)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${border}" stop-opacity="0.4"/>
      <stop offset="60%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#050508"/>
    </linearGradient>
  </defs>
  <rect width="256" height="320" fill="url(#g)"/>
  <rect x="6" y="6" width="244" height="308" fill="none" stroke="${border}" stroke-width="6"/>
  <rect x="16" y="16" width="224" height="288" fill="none" stroke="${border}" stroke-width="2" opacity="0.45"/>
  <circle cx="128" cy="130" r="64" fill="${bg}" stroke="${border}" stroke-width="4"/>
  <text x="128" y="148" text-anchor="middle" font-size="56" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
  <text x="128" y="230" text-anchor="middle" fill="${border}" font-size="16" font-family="Silkscreen, monospace" font-weight="700">${esc(String(label).slice(0, 18).toUpperCase())}</text>
  ${sub ? `<text x="128" y="258" text-anchor="middle" fill="#c8c0b0" font-size="12" font-family="Silkscreen, monospace">${esc(String(sub).slice(0, 22))}</text>` : ''}
</svg>
`;
}

function eventSvg({ emoji, border, bg, label }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="384" height="216" viewBox="0 0 384 216" role="img" aria-label="${esc(label)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#050508"/>
    </linearGradient>
  </defs>
  <rect width="384" height="216" fill="url(#g)"/>
  <rect x="4" y="4" width="376" height="208" fill="none" stroke="${border}" stroke-width="5"/>
  <text x="192" y="120" text-anchor="middle" font-size="64" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
  <text x="192" y="180" text-anchor="middle" fill="${border}" font-size="14" font-family="Silkscreen, monospace">${esc(String(label).slice(0, 28).toUpperCase())}</text>
</svg>
`;
}

fs.mkdirSync(enemyDir, { recursive: true });
fs.mkdirSync(eventDir, { recursive: true });
fs.mkdirSync(publicAssets, { recursive: true });

// Copy painted enemy PNGs (+ cutouts) into public
if (fs.existsSync(rootAssets)) {
  for (const f of fs.readdirSync(rootAssets)) {
    if (f.startsWith('enemy_') && f.endsWith('.png')) {
      const dest = path.join(publicAssets, f);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(rootAssets, f), dest);
        console.log('copied', f);
      }
    }
  }
}

const enemyManifest = [];

// Archetypes
for (const a of ARCHETYPES) {
  const file = `archetype_${a.id.toLowerCase()}.svg`;
  fs.writeFileSync(path.join(enemyDir, file), portraitSvg({
    emoji: a.emoji, border: a.border, bg: a.bg, label: a.label, sub: 'ARCHETYPE',
  }));
  enemyManifest.push({
    key: `enemy:archetype_${a.id}`,
    id: `archetype_${a.id}`,
    emoji: a.emoji,
    label: a.label,
    src: `/assets/icons/enemies/${file}`,
    quality: 'svg-tile',
    kind: 'archetype',
  });
}

// Job painted keys
for (const [job, png] of Object.entries(JOB_PAINTED)) {
  const src = `/assets/${png}`;
  enemyManifest.push({
    key: `enemy:job_${job}`,
    id: `job_${job}`,
    emoji: '🥷',
    label: job,
    src,
    quality: 'painted-png',
    kind: 'job',
  });
}

// Boss painted
for (const [id, png] of Object.entries(BOSS_PAINTED)) {
  enemyManifest.push({
    key: `enemy:boss_${id}`,
    id: `boss_${id}`,
    emoji: '👹',
    label: id,
    src: `/assets/${png}`,
    quality: 'painted-png',
    kind: 'boss',
  });
}

// Pool IDs — map some to jobs/bosses, rest archetype-ish SVG by name heuristics
function poolStyle(id) {
  if (id === 'gato') return { emoji: '💰', border: '#e8b84a', bg: '#1a1610', arch: 'BALANCED' };
  if (id.includes('assassin') || id.includes('bandit') || id.includes('smuggler')) {
    return { emoji: '🗡️', border: '#c44', bg: '#1a1010', arch: 'ASSASSIN' };
  }
  if (id.includes('guard') || id.includes('dog') || id.includes('boar')) {
    return { emoji: '🛡️', border: '#6b8cae', bg: '#121820', arch: 'TANK' };
  }
  if (id.includes('spirit') || id.includes('ghost') || id.includes('demon') || id.includes('eldritch') || id.includes('priest')) {
    return { emoji: '👁️', border: '#d45bff', bg: '#1c1028', arch: 'GENJUTSU' };
  }
  if (id.includes('ronin') || id.includes('mercenary') || id.includes('captain')) {
    return { emoji: '⚔️', border: '#e8b84a', bg: '#1a1610', arch: 'BALANCED' };
  }
  return { emoji: '🥷', border: '#8a6bff', bg: '#14101f', arch: 'CASTER' };
}

for (const id of POOL_IDS) {
  // Prefer painted when obvious
  let src;
  let quality = 'svg-tile';
  let emoji = '🥷';
  if (id === 'gato') {
    // no painted gato — SVG
  } else if (id.includes('ronin') || id === 'elite_guard') {
    src = `/assets/${JOB_PAINTED.samurai}`;
    quality = 'painted-png';
    emoji = '⚔️';
  } else if (id.includes('assassin') || id.includes('bandit') || id.includes('ninja') || id.includes('thug') || id.includes('smuggler') || id.includes('worker') || id.includes('guard') || id.includes('merchant') || id.includes('foreman') || id.includes('muscle') || id.includes('raider') || id.includes('traveler') || id.includes('saboteur') || id.includes('captain') || id.includes('mercenary')) {
    src = `/assets/${JOB_PAINTED.ninja}`;
    quality = 'painted-png';
    emoji = '🥷';
  }

  if (!src) {
    const st = poolStyle(id);
    emoji = st.emoji;
    const file = `${id}.svg`;
    fs.writeFileSync(path.join(enemyDir, file), portraitSvg({
      emoji: st.emoji, border: st.border, bg: st.bg, label: id.replace(/_/g, ' '), sub: st.arch,
    }));
    src = `/assets/icons/enemies/${file}`;
  }

  enemyManifest.push({
    key: `enemy:pool_${id}`,
    id: `pool_${id}`,
    emoji,
    label: id.replace(/_/g, ' '),
    src,
    quality,
    kind: 'pool',
  });
}

// Events
const eventManifest = [];
for (const cat of EVENT_CATEGORIES) {
  const file = `cat_${cat.id}.svg`;
  fs.writeFileSync(path.join(eventDir, file), eventSvg(cat));
  eventManifest.push({
    key: `event:cat_${cat.id}`,
    id: `cat_${cat.id}`,
    emoji: cat.emoji,
    label: cat.label,
    src: `/assets/icons/events/${file}`,
    quality: 'svg-tile',
    kind: 'category',
    category: cat.id,
  });
}

for (const id of EVENT_IDS) {
  const cat = EVENT_CATEGORY_MAP[id] || 'generic';
  const catMeta = EVENT_CATEGORIES.find((c) => c.id === cat) || EVENT_CATEGORIES[4];
  const emoji = KEY_EVENT_EMOJI[id] || catMeta.emoji;
  const file = `${id}.svg`;
  fs.writeFileSync(path.join(eventDir, file), eventSvg({
    emoji,
    border: catMeta.border,
    bg: catMeta.bg,
    label: id.replace(/_/g, ' '),
  }));
  eventManifest.push({
    key: `event:${id}`,
    id,
    emoji,
    label: id.replace(/_/g, ' '),
    src: `/assets/icons/events/${file}`,
    quality: 'svg-tile',
    kind: 'event',
    category: cat,
  });
}

const enemyTs = `/* AUTO-GENERATED by scripts/generate-enemy-event-art.mjs — do not edit by hand */
export interface EnemyArtManifestEntry {
  key: string;
  id: string;
  emoji: string;
  label: string;
  src: string;
  quality: 'svg-tile' | 'painted-png';
  kind: 'archetype' | 'job' | 'boss' | 'pool';
}

export const ENEMY_ART_MANIFEST: EnemyArtManifestEntry[] = ${JSON.stringify(enemyManifest, null, 2)};
`;

const eventTs = `/* AUTO-GENERATED by scripts/generate-enemy-event-art.mjs — do not edit by hand */
export interface EventArtManifestEntry {
  key: string;
  id: string;
  emoji: string;
  label: string;
  src: string;
  quality: 'svg-tile' | 'painted-png';
  kind: 'category' | 'event';
  category?: string;
}

export const EVENT_ART_MANIFEST: EventArtManifestEntry[] = ${JSON.stringify(eventManifest, null, 2)};

export const EVENT_CATEGORY_BY_ID: Record<string, string> = ${JSON.stringify(EVENT_CATEGORY_MAP, null, 2)};
`;

fs.writeFileSync(path.join(root, 'src', 'game', 'constants', 'enemyArtManifest.ts'), enemyTs);
fs.writeFileSync(path.join(root, 'src', 'game', 'constants', 'eventArtManifest.ts'), eventTs);
fs.writeFileSync(path.join(root, 'todos', 'enemy-art-manifest.json'), JSON.stringify(enemyManifest, null, 2));
fs.writeFileSync(path.join(root, 'todos', 'event-art-manifest.json'), JSON.stringify(eventManifest, null, 2));

console.log('Enemies:', enemyManifest.length, 'painted', enemyManifest.filter((e) => e.quality === 'painted-png').length);
console.log('Events:', eventManifest.length);
