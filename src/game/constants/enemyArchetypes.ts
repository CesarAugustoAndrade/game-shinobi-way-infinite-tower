/**
 * Enemy Archetype Definitions — T-014
 *
 * One-line behavior descriptions keyed by archetype identifier.
 * Used by the floating enemy info panel in the combat scene.
 * Do NOT hardcode these strings in UI components.
 */

export const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  TANK: 'Endures punishment. Retaliates hard when pressured.',
  ASSASSIN: 'Highly mobile. Prefers quick strikes and critical hits.',
  BALANCED: 'Versatile fighter with no clear weakness.',
  CASTER: 'Channels chakra for powerful elemental ninjutsu.',
  GENJUTSU: 'Masters illusions. Targets the mind over the body.',
};

/** Element icons for the affinity badge in the enemy info panel. */
export const ELEMENT_ICONS: Record<string, string> = {
  Fire: '🔥',
  Wind: '🌬',
  Lightning: '⚡',
  Earth: '🪨',
  Water: '💧',
  Physical: '💢',
  Mental: '👁',
};

/** Raster affinity icons (Imagine UI set) — emoji remains a11y / missing-art fallback. */
export const ELEMENT_AFFINITY_ART: Record<string, string> = {
  Fire: '/assets/icons/ui/affinity_fire.jpg',
  Wind: '/assets/icons/ui/affinity_wind.jpg',
  Lightning: '/assets/icons/ui/affinity_lightning.jpg',
  Earth: '/assets/icons/ui/affinity_earth.jpg',
  Water: '/assets/icons/ui/affinity_water.jpg',
};

/** CSS inline color values for each element (used in the panel without Tailwind classes). */
export const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#ef4444',
  Wind: '#34d399',
  Lightning: '#facc15',
  Earth: '#d97706',
  Water: '#60a5fa',
  Physical: '#fb923c',
  Mental: '#c084fc',
};
