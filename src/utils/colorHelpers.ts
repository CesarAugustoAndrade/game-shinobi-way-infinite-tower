import { Rarity, LocationType } from '../game/types';

/**
 * Rarity color utilities — BEM class tokens (design-system `.rarity-*`).
 * Hierarchy: broken/common = fog/metal (quiet), rare+ = accent heat, legendary = rust sole heat.
 * No Tailwind zinc leftovers (project has no Tailwind utilities).
 */

// Text color only (for labels, names)
export const getRarityTextColor = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.LEGENDARY: return 'rarity-text--legendary';
    case Rarity.EPIC: return 'rarity-text--epic';
    case Rarity.RARE: return 'rarity-text--rare';
    case Rarity.CURSED: return 'rarity-text--cursed';
    case Rarity.BROKEN: return 'rarity-text--broken';
    default: return 'rarity-text--common';
  }
};

// Border color only
export const getRarityBorderColor = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.LEGENDARY: return 'rarity-border--legendary';
    case Rarity.EPIC: return 'rarity-border--epic';
    case Rarity.RARE: return 'rarity-border--rare';
    case Rarity.CURSED: return 'rarity-border--cursed';
    case Rarity.BROKEN: return 'rarity-border--broken';
    default: return 'rarity-border--common';
  }
};

// Background color (with transparency)
export const getRarityBgColor = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.LEGENDARY: return 'rarity-bg--legendary';
    case Rarity.EPIC: return 'rarity-bg--epic';
    case Rarity.RARE: return 'rarity-bg--rare';
    case Rarity.CURSED: return 'rarity-bg--cursed';
    case Rarity.BROKEN: return 'rarity-bg--broken';
    default: return 'rarity-bg--common';
  }
};

// Combined: text + border (for Bag tooltips / craft names)
export const getRarityTextBorderColor = (rarity: Rarity): string => {
  return `${getRarityTextColor(rarity)} ${getRarityBorderColor(rarity)}`;
};

// Combined: border + background (for drag previews / plates)
export const getRarityDragPreviewColor = (rarity: Rarity): string => {
  return `${getRarityBorderColor(rarity)} ${getRarityBgColor(rarity)}`;
};

// Text color with special effects (for equipment panel)
export const getRarityTextColorWithEffects = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.LEGENDARY: return 'rarity-text--legendary rarity-text--glow';
    case Rarity.EPIC: return 'rarity-text--epic';
    case Rarity.RARE: return 'rarity-text--rare';
    case Rarity.CURSED: return 'rarity-text--cursed rarity-text--pulse';
    case Rarity.BROKEN: return 'rarity-text--broken';
    default: return 'rarity-text--common';
  }
};

// ============================================================================
// DANGER LEVEL COLORS
// Thresholds: 1-2 green, 3-4 yellow, 5 orange, 6-7 red
// ============================================================================

/** Text color for danger level display */
export const getDangerTextColor = (danger: number): string => {
  if (danger <= 2) return 'text-emerald-400';
  if (danger <= 4) return 'text-yellow-400';
  if (danger === 5) return 'text-orange-400';
  return 'text-red-400';
};

/** Background color for danger level panels */
export const getDangerBgColor = (danger: number): string => {
  if (danger <= 2) return 'bg-emerald-900/30';
  if (danger <= 4) return 'bg-yellow-900/30';
  if (danger === 5) return 'bg-orange-900/30';
  return 'bg-red-900/30';
};

/** Solid background color for danger level bars/dots */
export const getDangerDotColor = (danger: number): string => {
  if (danger <= 2) return 'bg-emerald-500';
  if (danger <= 4) return 'bg-yellow-500';
  if (danger === 5) return 'bg-orange-500';
  return 'bg-red-500';
};

/** Get color for a segment in a danger level bar */
export const getDangerSegmentColor = (segmentLevel: number, currentLevel: number | null): string => {
  if (currentLevel === null || segmentLevel > currentLevel) return 'bg-zinc-800';
  return getDangerDotColor(segmentLevel);
};

// ============================================================================
// LOCATION TYPE COLORS
// ============================================================================

/** Text color for location type labels */
export const getLocationTypeColor = (type: LocationType): string => {
  switch (type) {
    case LocationType.SETTLEMENT: return 'text-blue-400';
    case LocationType.WILDERNESS: return 'text-green-400';
    case LocationType.STRONGHOLD: return 'text-red-400';
    case LocationType.LANDMARK: return 'text-purple-400';
    case LocationType.SECRET: return 'text-yellow-400';
    case LocationType.BOSS: return 'text-orange-500';
    default: return 'text-zinc-400';
  }
};

/** Get label for location type */
export const getLocationTypeLabel = (type: LocationType): string => {
  switch (type) {
    case LocationType.SETTLEMENT: return 'Settlement';
    case LocationType.WILDERNESS: return 'Wilderness';
    case LocationType.STRONGHOLD: return 'Stronghold';
    case LocationType.LANDMARK: return 'Landmark';
    case LocationType.SECRET: return 'Veiled Route';
    case LocationType.BOSS: return 'Boss';
    default: return 'Unknown';
  }
};

// ============================================================================
// DAMAGE TYPE COLORS
// ============================================================================

// ============================================================================
// BIOME SLUG
// Shared by LocationCardDisplay and App (combat background resolution).
// ============================================================================

/**
 * Normalise a biome display name into the asset-slug format used by
 * `location_*.png`. Strips everything that isn't [a-z0-9], collapses
 * separators to underscores, and trims leading/trailing underscores.
 *
 * @example getBiomeSlug('Mist Covered Bridge') → 'mist_covered_bridge'
 */
export const getBiomeSlug = (biome: string): string =>
  biome.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** Public asset paths for the three-layer combat parallax stack (CinematicViewscreen). */
export interface LaminaPaths {
  /** Lámina 1 — `/assets/location_<slug>.png` */
  background: string;
  /** Lámina 2 — `/assets/lamina_mid_<slug>.png` (optional asset; onError hides) */
  midground: string;
  /** Lámina 3 — `/assets/lamina_fg_<slug>.png` (optional asset; onError hides) */
  foreground: string;
}

/**
 * Resolve biome display name → combat lámina asset paths.
 * Mid/fg assets may not exist yet; CinematicViewscreen hides missing layers.
 *
 * @example resolveLaminaPaths('Mist Covered Bridge')
 *   → { background: '/assets/location_mist_covered_bridge.png',
 *       midground:  '/assets/lamina_mid_mist_covered_bridge.png',
 *       foreground: '/assets/lamina_fg_mist_covered_bridge.png' }
 */
/** Bump when lamina PNGs are re-keyed so browsers/Vite pick up new pixels without hard-clear. */
const LAMINA_ASSET_REV = 'r2wave2a3';

/**
 * Region 1 default when biome is missing/blank — Coastal Harbor is the Waves
 * opener and always has a painted location plate under public/assets.
 */
const DEFAULT_BIOME_SLUG = 'coastal_harbor';

/**
 * Optional display-name / slug aliases → painted location plate slug.
 * Keep small: only real mismatches (not every synonym).
 */
const BIOME_SLUG_ALIASES: Record<string, string> = {
  // Common prose variants that may appear in copy or legacy data
  misty_beach: 'foggy_shoreline',
  misty_shoreline: 'foggy_shoreline',
  the_bridge: 'great_bridge',
  gato_mansion: 'fortified_mansion',
  gatos_mansion: 'fortified_mansion',
  sunken_wreck: 'shipwreck',
  fishing_village: 'rural_village',
  coastal_forest: 'dense_forest',
  the_docks: 'coastal_harbor',
};

export const resolveLaminaPaths = (biome: string): LaminaPaths => {
  const raw = getBiomeSlug(biome || '');
  const slug = (raw && BIOME_SLUG_ALIASES[raw]) || raw || DEFAULT_BIOME_SLUG;
  const q = `v=${LAMINA_ASSET_REV}`;
  return {
    background: `/assets/location_${slug}.png?${q}`,
    midground: `/assets/lamina_mid_${slug}.png?${q}`,
    foreground: `/assets/lamina_fg_${slug}.png?${q}`,
  };
};

export const getDamageTypeColor = (dt: any): string => {
  switch (dt) {
    case 'PHYSICAL': return 'text-orange-500';
    case 'ELEMENTAL': return 'text-purple-500';
    case 'MENTAL': return 'text-indigo-500';
    case 'TRUE': return 'text-red-500';
    default: return 'text-zinc-400';
  }
};

