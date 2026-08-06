/**
 * Central art registry (T-019 + T-020 skills + T-021 enemies/events).
 *
 * Resolve image assets by stable key with cascade:
 *   dedicated src → category/archetype fallback → emoji → mystery '?'
 *
 * Path convention (Vite public/):
 *   /assets/icons/{components|artifacts|locations|activities|clans|enemies|ui}/
 *   Painted: /assets/skills/skill_*.png, /assets/events/event_*.png, /assets/enemies/enemy_*.png (+ cutouts)
 */

import { Clan, ComponentId, Item, Skill } from '../types';
import { SKILL_ART_MANIFEST } from './skillArtManifest';
import { ENEMY_ART_MANIFEST } from './enemyArtManifest';
import { EVENT_ART_MANIFEST, EVENT_CATEGORY_BY_ID } from './eventArtManifest';

// ============================================================================
// TYPES
// ============================================================================

export interface ArtEntry {
  /** Public URL for the image. Omit when only emoji exists. */
  src?: string;
  /** Required emoji fallback (always present for a11y / onError). */
  emoji: string;
  /** Optional label for alt text / tooltips. */
  label?: string;
}

export type ArtCategory =
  | 'component'
  | 'artifact'
  | 'location'
  | 'activity'
  | 'clan'
  | 'skill'
  | 'enemy'
  | 'event'
  | 'approach';

// ============================================================================
// HELPERS
// ============================================================================

/** Slug for artifact / free-form names → filesystem-safe id. */
export function artSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function artKey(category: ArtCategory, id: string): string {
  return `${category}:${id}`;
}

/**
 * Asset path helper. T-028 migrates categories to Imagine `.jpg`.
 * Converted: clans, activities, components (Lot A), artifacts (Lot B),
 * all locations (Lot D — Waves+Exams; Retrieval/War already jpg).
 * All icon categories migrated to Imagine raster (T-028 complete).
 * Skills/enemies/events via manifests; others via iconPath(..., 'jpg').
 */
function iconPath(folder: string, id: string, ext: 'svg' | 'png' | 'jpg' = 'svg'): string {
  return `/assets/icons/${folder}/${id}.${ext}`;
}

function entry(emoji: string, label: string, src?: string): ArtEntry {
  return src ? { src, emoji, label } : { emoji, label };
}

// ============================================================================
// REGISTRY DATA
// ============================================================================

const COMPONENTS: Record<string, ArtEntry> = {
  [ComponentId.NINJA_STEEL]: entry('⚔️', 'Ninja Steel', iconPath('components', 'ninja_steel', 'jpg')),
  [ComponentId.SPIRIT_TAG]: entry('📜', 'Spirit Tag', iconPath('components', 'spirit_tag', 'jpg')),
  [ComponentId.CHAKRA_PILL]: entry('💊', 'Chakra Pill', iconPath('components', 'chakra_pill', 'jpg')),
  [ComponentId.IRON_SAND]: entry('🛡️', 'Iron Sand', iconPath('components', 'iron_sand', 'jpg')),
  [ComponentId.ANBU_MASK]: entry('🎭', 'ANBU Mask', iconPath('components', 'anbu_mask', 'jpg')),
  [ComponentId.TRAINING_WEIGHTS]: entry('🏋️', 'Training Weights', iconPath('components', 'training_weights', 'jpg')),
  [ComponentId.SWIFT_SANDALS]: entry('👟', 'Swift Sandals', iconPath('components', 'swift_sandals', 'jpg')),
  [ComponentId.TACTICAL_SCROLL]: entry('🧠', 'Tactical Scroll', iconPath('components', 'tactical_scroll', 'jpg')),
  [ComponentId.HASHIRAMA_CELL]: entry('🧬', 'Hashirama Cell', iconPath('components', 'hashirama_cell', 'jpg')),
};

/** Artifact name → emoji (mirrors synthesis.ts; src from slug). */
const ARTIFACT_META: Array<{ name: string; emoji: string }> = [
  { name: 'Kubikiribōchō', emoji: '🗡️' },
  { name: 'Chakra Flow Blade', emoji: '⚡' },
  { name: 'Samehada', emoji: '🦈' },
  { name: 'Gunbai War Fan', emoji: '🪭' },
  { name: 'Nuibari', emoji: '🪡' },
  { name: 'Kusanagi', emoji: '⚔️' },
  { name: 'Hiramekarei', emoji: '🔱' },
  { name: 'Kabutowari', emoji: '🪓' },
  { name: "Sage's Scripture", emoji: '📖' },
  { name: 'Gourd of Sand', emoji: '🏺' },
  { name: 'Totsuka Blade', emoji: '🌀' },
  { name: "Konan's Paper Wings", emoji: '🦋' },
  { name: 'Explosive Tag Array', emoji: '💥' },
  { name: 'Flying Thunder God Seal', emoji: '⚡' },
  { name: 'Forbidden Scroll', emoji: '📜' },
  { name: 'Eight Gates Core', emoji: '🔥' },
  { name: 'Yata Mirror', emoji: '🪞' },
  { name: 'Akimichi Food Pills', emoji: '💊' },
  { name: 'Curse Mark Essence', emoji: '☯️' },
  { name: 'Sage Mode Chakra', emoji: '🐸' },
  { name: 'Byakugō Seal', emoji: '💎' },
  { name: 'Susanoo Ribcage', emoji: '💀' },
  { name: "Hokage's Necklace", emoji: '📿' },
  { name: 'Puppet Armor Core', emoji: '🤖' },
  { name: "Jiraiya's Headband", emoji: '🐸' },
  { name: 'Will of Fire Charm', emoji: '🔥' },
  { name: 'Tsukuyomi Lens', emoji: '👁️' },
  { name: "Shikamaru's Earrings", emoji: '💍' },
  { name: "Kakashi's Bell", emoji: '🔔' },
  { name: 'Nara Shadow Bind', emoji: '🌑' },
  { name: 'Weights Released', emoji: '💨' },
  { name: 'Gentle Fist Wraps', emoji: '🥋' },
  { name: 'Eight Trigrams Map', emoji: '☯️' },
  { name: 'Yellow Flash Boots', emoji: '⚡' },
  { name: 'Body Flicker Sash', emoji: '🌀' },
  { name: 'Scroll of Seals', emoji: '📚' },
  { name: 'Ten-Tails Husk', emoji: '🌳' },
  { name: 'Curse Mark (Heaven)', emoji: '☯️' },
  { name: 'Rinnegan Fragment', emoji: '👁️' },
  { name: 'Infinite Chakra Core', emoji: '💫' },
  { name: 'Adamantine Chains', emoji: '⛓️' },
  { name: 'Sharingan Implant', emoji: '🔴' },
  { name: 'Byakugan Awakening', emoji: '⚪' },
  { name: 'Shadow Mastery', emoji: '🌑' },
  { name: 'Uzumaki Vitality', emoji: '🌀' },
];

const ARTIFACTS: Record<string, ArtEntry> = Object.fromEntries(
  ARTIFACT_META.map(({ name, emoji }) => {
    const id = artSlug(name);
    return [id, entry(emoji, name, iconPath('artifacts', id, 'jpg'))];
  }),
);

const LOCATIONS: Record<string, ArtEntry> = {
  // Land of Waves (T-019) — Imagine Lot D
  the_docks: entry('⚓', 'The Docks', iconPath('locations', 'the_docks', 'jpg')),
  misty_beach: entry('🌫️', 'Misty Beach', iconPath('locations', 'misty_beach', 'jpg')),
  coastal_forest: entry('🌲', 'Coastal Forest', iconPath('locations', 'coastal_forest', 'jpg')),
  smugglers_cave: entry('🕳️', "Smuggler's Cave", iconPath('locations', 'smugglers_cave', 'jpg')),
  fishing_village: entry('🏘️', 'Fishing Village', iconPath('locations', 'fishing_village', 'jpg')),
  riverside_camp: entry('🔥', 'Riverside Camp', iconPath('locations', 'riverside_camp', 'jpg')),
  sunken_ship: entry('🚢', 'Sunken Ship', iconPath('locations', 'sunken_ship', 'jpg')),
  bridge_construction: entry('🌉', 'Bridge Construction', iconPath('locations', 'bridge_construction', 'jpg')),
  bandit_outpost: entry('⚔️', 'Bandit Outpost', iconPath('locations', 'bandit_outpost', 'jpg')),
  abandoned_manor: entry('🏚️', 'Abandoned Manor', iconPath('locations', 'abandoned_manor', 'jpg')),
  hidden_cove: entry('🏝️', 'Hidden Cove', iconPath('locations', 'hidden_cove', 'jpg')),
  drowned_shrine: entry('🏛️', 'Drowned Shrine', iconPath('locations', 'drowned_shrine', 'jpg')),
  gatos_compound: entry('👹', "Gato's Compound", iconPath('locations', 'gatos_compound', 'jpg')),
  // Chunin Exams / Forest of Death (T-024) — Imagine Lot D
  exam_gates: entry('🚪', 'Exam Gates', iconPath('locations', 'exam_gates', 'jpg')),
  forest_edge: entry('🌲', 'Forest Edge', iconPath('locations', 'forest_edge', 'jpg')),
  thicket_paths: entry('🌿', 'Thicket Paths', iconPath('locations', 'thicket_paths', 'jpg')),
  muddy_ford: entry('🌊', 'Muddy Ford', iconPath('locations', 'muddy_ford', 'jpg')),
  scroll_cache: entry('📜', 'Scroll Cache', iconPath('locations', 'scroll_cache', 'jpg')),
  rival_checkpoint: entry('⚔️', 'Rival Checkpoint', iconPath('locations', 'rival_checkpoint', 'jpg')),
  sound_hideout: entry('🔊', 'Sound Hideout', iconPath('locations', 'sound_hideout', 'jpg')),
  tower_approach: entry('🗼', 'Tower Approach', iconPath('locations', 'tower_approach', 'jpg')),
  serpent_thicket: entry('🐍', 'Serpent Thicket', iconPath('locations', 'serpent_thicket', 'jpg')),
  orochimaru_arena: entry('🏟️', "Orochimaru's Arena", iconPath('locations', 'orochimaru_arena', 'jpg')),
  hidden_heaven_scroll: entry('✨', 'Hidden Heaven Scroll', iconPath('locations', 'hidden_heaven_scroll', 'jpg')),
  insect_colony: entry('🪲', 'Insect Colony', iconPath('locations', 'insect_colony', 'jpg')),
  snake_den: entry('🐍', 'Snake Den', iconPath('locations', 'snake_den', 'jpg')),
  // Sasuke Retrieval / Valley of the End (T-025) — Imagine raster (no SVG)
  leaf_gate: entry('🚪', 'Leaf Gate', iconPath('locations', 'leaf_gate', 'jpg')),
  river_road: entry('🌊', 'River Road', iconPath('locations', 'river_road', 'jpg')),
  sound_border: entry('🚧', 'Sound Border', iconPath('locations', 'sound_border', 'jpg')),
  waterfall_pass: entry('💦', 'Waterfall Pass', iconPath('locations', 'waterfall_pass', 'jpg')),
  sound_four_camp: entry('⛺', 'Sound Four Camp', iconPath('locations', 'sound_four_camp', 'jpg')),
  curse_mark_shrine: entry('☯️', 'Curse Mark Shrine', iconPath('locations', 'curse_mark_shrine', 'jpg')),
  forest_of_chains: entry('⛓️', 'Forest of Chains', iconPath('locations', 'forest_of_chains', 'jpg')),
  northern_hideout: entry('🏰', 'Northern Hideout', iconPath('locations', 'northern_hideout', 'jpg')),
  bridge_to_valley: entry('🌉', 'Bridge to the Valley', iconPath('locations', 'bridge_to_valley', 'jpg')),
  valley_of_the_end: entry('⚔️', 'Valley of the End', iconPath('locations', 'valley_of_the_end', 'jpg')),
  hidden_supply_cache: entry('📦', 'Hidden Supply Cache', iconPath('locations', 'hidden_supply_cache', 'jpg')),
  orochimaru_lab: entry('🧪', "Orochimaru's Lab", iconPath('locations', 'orochimaru_lab', 'jpg')),
  lightning_cliff: entry('⚡', 'Lightning Cliff', iconPath('locations', 'lightning_cliff', 'jpg')),
  // Great Ninja War / Divine Tree Roots (T-026) — Imagine raster (no SVG)
  alliance_camp: entry('⛺', 'Alliance Camp', iconPath('locations', 'alliance_camp', 'jpg')),
  outer_trenches: entry('🪖', 'Outer Trenches', iconPath('locations', 'outer_trenches', 'jpg')),
  scavenger_field: entry('⚔️', 'Scavenger Field', iconPath('locations', 'scavenger_field', 'jpg')),
  ash_forest: entry('🔥', 'Ash Forest', iconPath('locations', 'ash_forest', 'jpg')),
  village_ruins: entry('🏚️', 'Village Ruins', iconPath('locations', 'village_ruins', 'jpg')),
  artillery_ridge: entry('💥', 'Artillery Ridge', iconPath('locations', 'artillery_ridge', 'jpg')),
  alliance_hq: entry('🏛️', 'Alliance HQ', iconPath('locations', 'alliance_hq', 'jpg')),
  god_tree_roots: entry('🌳', 'God Tree Roots', iconPath('locations', 'god_tree_roots', 'jpg')),
  reanimation_nexus: entry('⚰️', 'Reanimation Nexus', iconPath('locations', 'reanimation_nexus', 'jpg')),
  god_tree_heart: entry('🌑', 'God Tree Heart', iconPath('locations', 'god_tree_heart', 'jpg')),
  sealed_bunker: entry('🔒', 'Sealed Bunker', iconPath('locations', 'sealed_bunker', 'jpg')),
  bijuu_chakra_pool: entry('🦊', 'Bijuu Chakra Pool', iconPath('locations', 'bijuu_chakra_pool', 'jpg')),
  ten_tails_fragment: entry('👁️', 'Ten-Tails Fragment', iconPath('locations', 'ten_tails_fragment', 'jpg')),
};

const ACTIVITIES: Record<string, ArtEntry> = {
  combat: entry('⚔️', 'Combat', iconPath('activities', 'combat', 'jpg')),
  eliteChallenge: entry('👹', 'Elite Challenge', iconPath('activities', 'elite_challenge', 'jpg')),
  merchant: entry('🛒', 'Merchant', iconPath('activities', 'merchant', 'jpg')),
  event: entry('🎪', 'Event', iconPath('activities', 'event', 'jpg')),
  scrollDiscovery: entry('📜', 'Scroll Discovery', iconPath('activities', 'scroll_discovery', 'jpg')),
  rest: entry('💤', 'Rest', iconPath('activities', 'rest', 'jpg')),
  training: entry('🎯', 'Training', iconPath('activities', 'training', 'jpg')),
  treasure: entry('💎', 'Treasure', iconPath('activities', 'treasure', 'jpg')),
  infoGathering: entry('📡', 'Intel', iconPath('activities', 'info_gathering', 'jpg')),
};

const CLANS: Record<string, ArtEntry> = {
  uzumaki: entry('🌀', 'Uzumaki', iconPath('clans', 'uzumaki', 'jpg')),
  uchiha: entry('🔥', 'Uchiha', iconPath('clans', 'uchiha', 'jpg')),
  hyuga: entry('👁️', 'Hyuga', iconPath('clans', 'hyuga', 'jpg')),
  lee: entry('💪', 'Lee Disciple', iconPath('clans', 'lee', 'jpg')),
  yamanaka: entry('💠', 'Yamanaka', iconPath('clans', 'yamanaka', 'jpg')),
};

/** Skills from auto-generated manifest (T-020) — every id has src. */
const SKILLS: Record<string, ArtEntry> = Object.fromEntries(
  SKILL_ART_MANIFEST.map((m) => [m.id, entry(m.emoji, m.name, m.src)]),
);

/** Enemies (T-021): keys already include `enemy:` prefix in manifest. */
const ENEMY_ENTRIES: Record<string, ArtEntry> = Object.fromEntries(
  ENEMY_ART_MANIFEST.map((m) => [m.key, entry(m.emoji, m.label, m.src)]),
);

/** Events (T-021): keys already include `event:` prefix in manifest. */
const EVENT_ENTRIES: Record<string, ArtEntry> = Object.fromEntries(
  EVENT_ART_MANIFEST.map((m) => [m.key, entry(m.emoji, m.label, m.src)]),
);

/** Pre-combat approach icons (Imagine UI set). Keys match ApproachType enum values lowercased. */
const APPROACHES: Record<string, ArtEntry> = {
  FRONTAL_ASSAULT: entry('⚔️', 'Frontal Assault', iconPath('approaches', 'frontal_assault', 'jpg')),
  STEALTH_AMBUSH: entry('🗡️', 'Silent Strike', iconPath('approaches', 'silent_strike', 'jpg')),
  GENJUTSU_SETUP: entry('🌀', 'Mind Trap', iconPath('approaches', 'mind_trap', 'jpg')),
  ENVIRONMENTAL: entry('🪤', 'Terrain Trap', iconPath('approaches', 'terrain_trap', 'jpg')),
  IRON_GUARD: entry('🛡️', 'Iron Guard', iconPath('approaches', 'iron_guard', 'jpg')),
  SHADOW_BYPASS: entry('👤', 'Shadow Passage', iconPath('approaches', 'shadow_passage', 'jpg')),
};

/** Flat registry: `category:id` → ArtEntry */
export const ART_REGISTRY: Record<string, ArtEntry> = {
  ...Object.fromEntries(Object.entries(COMPONENTS).map(([id, e]) => [artKey('component', id), e])),
  ...Object.fromEntries(Object.entries(ARTIFACTS).map(([id, e]) => [artKey('artifact', id), e])),
  ...Object.fromEntries(Object.entries(LOCATIONS).map(([id, e]) => [artKey('location', id), e])),
  ...Object.fromEntries(Object.entries(ACTIVITIES).map(([id, e]) => [artKey('activity', id), e])),
  ...Object.fromEntries(Object.entries(CLANS).map(([id, e]) => [artKey('clan', id), e])),
  ...Object.fromEntries(Object.entries(SKILLS).map(([id, e]) => [artKey('skill', id), e])),
  ...ENEMY_ENTRIES,
  ...EVENT_ENTRIES,
  ...Object.fromEntries(Object.entries(APPROACHES).map(([id, e]) => [artKey('approach', id), e])),
};

const MYSTERY: ArtEntry = { emoji: '❓', label: 'Unknown' };

// ============================================================================
// LOOKUP API
// ============================================================================

export function getArt(key: string): ArtEntry {
  return ART_REGISTRY[key] ?? MYSTERY;
}

export function getArtSrc(key: string): string | undefined {
  return getArt(key).src;
}

export function getArtEmoji(key: string): string {
  return getArt(key).emoji;
}

export function hasArtSrc(key: string): boolean {
  return Boolean(ART_REGISTRY[key]?.src);
}

/** Keys registered without a dedicated `src` (live backlog for asset waves). */
export function listMissingArt(keys?: string[]): string[] {
  const pool = keys ?? Object.keys(ART_REGISTRY);
  return pool.filter((k) => !ART_REGISTRY[k]?.src);
}

/** All registered keys (for audits / T-020 prep). */
export function listRegisteredArtKeys(): string[] {
  return Object.keys(ART_REGISTRY).sort();
}

// ============================================================================
// DOMAIN RESOLVERS
// ============================================================================

export function clanArtKey(clan: Clan): string {
  switch (clan) {
    case Clan.UZUMAKI:
      return artKey('clan', 'uzumaki');
    case Clan.UCHIHA:
      return artKey('clan', 'uchiha');
    case Clan.HYUGA:
      return artKey('clan', 'hyuga');
    case Clan.LEE:
      return artKey('clan', 'lee');
    case Clan.YAMANAKA:
      return artKey('clan', 'yamanaka');
    default:
      return artKey('clan', 'unknown');
  }
}

export function getClanArt(clan: Clan): ArtEntry {
  return getArt(clanArtKey(clan));
}

/** Filesystem slug for hero / hero_cut painted plates (R1-201). */
export function clanSlug(clan: Clan): string {
  const key = clanArtKey(clan);
  const slug = key.includes(':') ? key.slice(key.indexOf(':') + 1) : key;
  return slug === 'unknown' ? 'uzumaki' : slug;
}

/**
 * Full-plate hero portrait (`/assets/heroes/hero_<slug>.png`).
 * Falls back to clan crest emoji when the file is missing (consumer onError).
 */
export function getHeroArt(clan: Clan): ArtEntry {
  const crest = getClanArt(clan);
  return entry(crest.emoji, crest.label ?? String(clan), `/assets/heroes/hero_${clanSlug(clan)}.png`);
}

/**
 * Transparent hero cutout (`/assets/heroes/hero_cut_<slug>.png`).
 * CharacterSelect prefers cutout → portrait → crest cascade.
 */
export function getHeroCutout(clan: Clan): ArtEntry {
  const crest = getClanArt(clan);
  return entry(crest.emoji, crest.label ?? String(clan), `/assets/heroes/hero_cut_${clanSlug(clan)}.png`);
}

/**
 * Runtime location ids are `location-<configId>-<timestamp>-<rand>` (RegionSystem).
 * Art keys are config ids only (`the_docks`, `gatos_compound`, …).
 */
export function resolveLocationArtKey(locationId: string): string {
  let id = locationId.trim();
  if (id.startsWith('location-')) {
    id = id.slice('location-'.length);
    // Strip trailing generateId(): Date.now()-base36
    id = id.replace(/-\d{10,}-[a-z0-9]+$/i, '');
  }
  return id;
}

export function getLocationArt(locationId: string): ArtEntry {
  return getArt(artKey('location', resolveLocationArtKey(locationId)));
}

export function getActivityArt(activityKey: string): ArtEntry {
  return getArt(artKey('activity', activityKey));
}

export function getComponentArt(componentId: ComponentId | string): ArtEntry {
  return getArt(artKey('component', componentId));
}

/** ApproachType enum value → art entry (Imagine icons). */
export function getApproachArt(approachType: string): ArtEntry {
  return getArt(artKey('approach', approachType));
}

export function getArtifactArt(name: string): ArtEntry {
  return getArt(artKey('artifact', artSlug(name)));
}

/** Convention install path for cinematic skill plates (16:9 painted PNGs). */
export function skillArtPath(id: string): string {
  return `/assets/skills/skill_${id}.png`;
}

/**
 * Resolve skill art (T-020 + full catalog plates).
 * Cascade: registry skill:<id> (with src) → skill.image → convention skill_<id>.png
 * → skill.icon emoji → mystery.
 * Painted plates live at public/assets/skills/skill_<id>.png for every catalog id.
 */
export function getSkillArt(
  skill: Pick<Skill, 'id' | 'name' | 'image' | 'icon'> | string,
): ArtEntry {
  const id = typeof skill === 'string' ? skill : skill.id;
  const registered = ART_REGISTRY[artKey('skill', id)];
  if (registered?.src) return registered;

  if (typeof skill !== 'string') {
    if (skill.image) {
      return { src: skill.image, emoji: skill.icon || registered?.emoji || '⚔️', label: skill.name };
    }
    // Prefer on-disk painted plate over emoji-only registry stubs
    return {
      src: skillArtPath(id),
      emoji: skill.icon || registered?.emoji || '⚔️',
      label: skill.name,
    };
  }

  if (registered) {
    return { ...registered, src: skillArtPath(id) };
  }

  return { src: skillArtPath(id), emoji: '⚔️', label: id };
}

/** Skill ids still missing registry src (should be empty after full plate catalog). */
export function listMissingSkillArt(): string[] {
  return SKILL_ART_MANIFEST.filter((m) => !m.src).map((m) => m.id);
}

const ARCHETYPE_IDS = ['TANK', 'ASSASSIN', 'BALANCED', 'CASTER', 'GENJUTSU'] as const;

/**
 * Enemy portrait cascade (T-021):
 * 1. pool id (`enemy:pool_<id>`) if provided
 * 2. boss name keywords (haku / demon)
 * 3. job keywords (puppeteer / monk / samurai / ninja)
 * 4. archetype fallback (`enemy:archetype_TANK` …)
 * 5. mystery emoji
 *
 * Does not call GenAI — offline-first portraits so combat never depends on runtime AI.
 */
export function getEnemyArt(opts: {
  name?: string;
  archetype?: string;
  poolId?: string;
  isBoss?: boolean;
}): ArtEntry {
  const { name = '', archetype, poolId, isBoss } = opts;
  const lower = name.toLowerCase();

  if (poolId) {
    const pool = ART_REGISTRY[`enemy:pool_${poolId}`];
    if (pool?.src) return pool;
  }

  if (isBoss || lower.includes('haku') || lower.includes('gato') || lower.includes('demon')) {
    if (lower.includes('gato')) {
      const art = ART_REGISTRY['enemy:pool_gato'];
      if (art?.src) return art;
    }
    if (lower.includes('haku')) {
      const art = ART_REGISTRY['enemy:boss_haku'];
      if (art) return art;
    }
    if (lower.includes('demon')) {
      const art = ART_REGISTRY['enemy:boss_demon_brothers'];
      if (art) return art;
    }
  }

  if (lower.includes('puppeteer')) {
    const art = ART_REGISTRY['enemy:job_puppeteer'];
    if (art) return art;
  }
  if (lower.includes('monk')) {
    const art = ART_REGISTRY['enemy:job_monk'];
    if (art) return art;
  }
  if (lower.includes('samurai')) {
    const art = ART_REGISTRY['enemy:job_samurai'];
    if (art) return art;
  }
  if (lower.includes('mist')) {
    // Mist-keyword name fallback → dedicated mist-ninja plate owner.
    // Do NOT route via pool_assassin — that plate is hired_assassin.
    const mist =
      ART_REGISTRY['enemy:pool_mist_ninja'] ||
      ART_REGISTRY['enemy:pool_hidden_guard'];
    if (mist?.src) return mist;
  }
  if (lower.includes('ninja') || lower.includes('shinobi') || lower.includes('mercenary')) {
    const art = ART_REGISTRY['enemy:job_ninja'];
    if (art) return art;
  }

  const arch = (archetype || 'BALANCED').toUpperCase();
  const archKey = ARCHETYPE_IDS.includes(arch as (typeof ARCHETYPE_IDS)[number])
    ? arch
    : 'BALANCED';
  const archArt = ART_REGISTRY[`enemy:archetype_${archKey}`];
  if (archArt) return archArt;

  return { emoji: '🥷', label: name || 'Enemy' };
}

/** Image URL only (for Enemy.image assignment). */
export function resolveEnemyImageSrc(opts: {
  name?: string;
  archetype?: string;
  poolId?: string;
  isBoss?: boolean;
}): string | undefined {
  return getEnemyArt(opts).src;
}

/**
 * Event illustration cascade (T-021):
 * dedicated event:<id> → event:cat_<category> → emoji
 */
export function getEventArt(eventId: string, categoryHint?: string): ArtEntry {
  const dedicated = ART_REGISTRY[`event:${eventId}`];
  if (dedicated?.src) return dedicated;

  const cat = categoryHint || EVENT_CATEGORY_BY_ID[eventId] || 'generic';
  const catArt = ART_REGISTRY[`event:cat_${cat}`];
  if (catArt) return catArt;

  return { emoji: '🌀', label: eventId };
}

/**
 * Resolve display art for an inventory item.
 * Cascade: componentId → artifact name slug → item.icon emoji → mystery.
 */
export function resolveItemArt(
  item: Pick<Item, 'isComponent' | 'componentId' | 'name' | 'icon' | 'recipe'>,
): ArtEntry {
  if (item.isComponent && item.componentId) {
    const art = getComponentArt(item.componentId);
    if (art.emoji !== '❓' || art.src) return art;
  }

  if (!item.isComponent && item.name) {
    const art = getArtifactArt(item.name);
    if (art !== MYSTERY && (art.src || art.emoji !== '❓')) {
      // Only treat as hit if the key was registered
      if (ART_REGISTRY[artKey('artifact', artSlug(item.name))]) {
        return art;
      }
    }
  }

  if (item.icon) {
    return { emoji: item.icon, label: item.name };
  }

  return { ...MYSTERY, label: item.name };
}

/**
 * LocationIcon-compatible shape from registry (asset + fallback emoji).
 */
export function locationIconFromRegistry(locationId: string): {
  asset?: string;
  fallback: string;
} {
  const art = getLocationArt(locationId);
  return {
    asset: art.src,
    fallback: art.emoji,
  };
}

/**
 * Living audit backlog for later waves (skills, enemies, events).
 * Not in ART_REGISTRY until content exists — tracked here for T-020/T-021.
 */
export const ART_BACKLOG_NOTES = {
  T019_done: [
    'component:* (9)',
    'artifact:* (45)',
    'location:* land of waves (13)',
    'activity:* (9)',
    'clan:* (5)',
  ],
  T020_skills:
    'skill:* (116) registered — full cinematic 16:9 painted PNG faces under /assets/skills/skill_<id>.png (catalog docs/skill-art-prompts.md). getSkillArt falls back to skillArtPath(id). basic_atk → skill_basic_atk.png; heavy_kick + adamantine_chains in manifest.',
  T021_enemies_events:
    'enemy: painted portraits + enemy_cut_* (WAVE15: archetype_tank shinobi regen; pool_mist_ninja plate-owner key; mist-keyword → pool_mist_ninja; WAVE14 residual 15 JPGs deleted + P0/P1 regen + 5 DEDICATE plates). Soft-share KEEP: job_ninja/shinobi→exhausted_shinobi; guard_dog→war_dog; hidden_guard→mist_ninja; assassin→hired_assassin. event: 44 on-disk event_*.png plates wired painted-png (5 cat + 39 event/alias keys; residual R1 reuses meet_tazuna/caravan/intel/mist_ambush/shrine).',
  T_laminas_r1:
    'All 14 R1 location slugs have location_ + lamina_mid_ + lamina_fg_ plates (A3 wave2 closed mid/fg residual). resolveLaminaPaths + LAMINA_ASSET_REV=r5fire6.',
} as const;
