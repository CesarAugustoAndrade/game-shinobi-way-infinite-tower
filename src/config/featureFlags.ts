/**
 * Feature Flags and Launch Properties
 *
 * Configure game features, debug options, and runtime behavior.
 * These can be toggled during development or for testing.
 *
 * Dead / unused flags were purged in A-012. Only flags and properties
 * with real callers remain. Helpers `isFeatureEnabled` / `getProperty`
 * are the preferred access path for new code.
 */

export const FeatureFlags = {
  // ─────────────────────────────────────────────────────────────
  // Debug & Development
  // ─────────────────────────────────────────────────────────────

  /** Log combat calculations to console (`combatDebug.ts`) */
  DEBUG_COMBAT_LOG: false,

  /** Log exploration/state transitions (`explorationDebug.ts`). Off by default on mainline. */
  DEBUG_STATE_TRANSITIONS: false,

  /** Skip character selection (use DEFAULT_CLAN) */
  SKIP_CHAR_SELECT: false,

  // ─────────────────────────────────────────────────────────────
  // Gameplay Features
  // ─────────────────────────────────────────────────────────────

  /** Enable the synthesis/crafting system */
  ENABLE_SYNTHESIS: true,

  /** Enable elite challenge encounters */
  ENABLE_ELITE_CHALLENGES: true,

  /** Enable story arc events */
  ENABLE_STORY_EVENTS: true,

  /** Enable training rooms in exploration */
  ENABLE_TRAINING: true,

  /**
   * Enable manual/interactive combat. When false, combat is auto-simulated
   * (batch resolution — not the same as the in-combat "Auto" pass timer).
   */
  ENABLE_MANUAL_COMBAT: true,

  // ─────────────────────────────────────────────────────────────
  // UI Features
  // ─────────────────────────────────────────────────────────────

  /** Show floating damage numbers in combat */
  SHOW_FLOATING_TEXT: true,

  /** Show tooltips on hover */
  ENABLE_TOOLTIPS: true,

  /** Enable CRT overlay on the combat stage (scanline curvature + vignette depth).
   *  Default ON for the pixel-arcade aesthetic; set false to disable for screenshots/testing. */
  ENABLE_CRT_OVERLAY: true,
} as const;

export const LaunchProperties = {
  // ─────────────────────────────────────────────────────────────
  // Game Balance
  // ─────────────────────────────────────────────────────────────

  /** Starting gold amount */
  STARTING_RYO: 100,

  /** Default clan for SKIP_CHAR_SELECT (matches Clan enum value) */
  DEFAULT_CLAN: 'Uchiha' as const,

  /** XP multiplier for all gains */
  XP_MULTIPLIER: 1.0,

  /** Gold multiplier for all gains */
  RYO_MULTIPLIER: 1.0,

  /** Loot drop rate multiplier */
  LOOT_MULTIPLIER: 1.0,

  // ─────────────────────────────────────────────────────────────
  // Difficulty Modifiers
  // ─────────────────────────────────────────────────────────────

  /** Enemy stat scaling multiplier */
  ENEMY_SCALING_MULTIPLIER: 1.0,

  /** Enemy damage multiplier (T-006 B.2: kept at 1.0 — the endgame bite comes
   * from steeper danger scaling + the danger-keyed enemy HP wall, which keeps
   * low danger accessible instead of a flat lethality bump punishing it) */
  ENEMY_DAMAGE_MULTIPLIER: 1.0,

  /** Player damage multiplier (T-006 B.2: +10%. Converges from below — faster
   * kills cut attrition for slow-killing squishy/caster builds far more than for
   * one-shotters (who gain nothing from overkill). The caster lift also comes
   * from chakra regen; this stays modest to avoid re-inflating the bruisers) */
  PLAYER_DAMAGE_MULTIPLIER: 1.10,

  // ─────────────────────────────────────────────────────────────
  // System Limits
  // ─────────────────────────────────────────────────────────────

  /** Maximum bag capacity */
  MAX_BAG_SIZE: 12,

  /**
   * Legacy alias used by LIMITS.MAX_SKILLS — NOT the combat deck size.
   * Hand size is HAND_SIZE; deck cap is MAX_DECK_SIZE.
   */
  MAX_EQUIPPED_SKILLS: 4,

  /** Combat log max entries */
  COMBAT_LOG_MAX_ENTRIES: 50,

  // ─────────────────────────────────────────────────────────────
  // Treasure System Balance
  // ─────────────────────────────────────────────────────────────

  /** Treasure config by wealth level - choiceCount, artifactChance, ryoMultiplier */
  TREASURE_CONFIG: {
    LOW: { choiceCount: 2, artifactChance: 0, ryoMultiplier: 0.5 },      // Wealth 1-2
    MEDIUM: { choiceCount: 2, artifactChance: 0, ryoMultiplier: 1.0 },   // Wealth 3-4
    HIGH: { choiceCount: 3, artifactChance: 0.05, ryoMultiplier: 1.5 },  // Wealth 5-6
    RICH: { choiceCount: 3, artifactChance: 0.10, ryoMultiplier: 2.0 },  // Wealth 7
  },

  /** Map pieces required by danger level */
  TREASURE_MAP_PIECES: { lowDanger: 2, midDanger: 3, highDanger: 4 },

  // ─────────────────────────────────────────────────────────────
  // Combat Economy — Action Points, Hand & Postures (T-004)
  // ─────────────────────────────────────────────────────────────

  /** Base Action Points granted at the start of every player turn */
  AP_BASE: 3,

  /** Speed required per +1 bonus AP/turn → AP = AP_BASE + floor(speed / AP_PER_SPEED_DIV) */
  AP_PER_SPEED_DIV: 10,

  /** Number of cards drawn into the player's hand each turn */
  HAND_SIZE: 4,

  /** Target non-PASSIVE cards at character creation (academy kits). */
  START_DECK_TARGET: 8,

  /** Max non-PASSIVE skills a player may know (combat deck cap). */
  MAX_DECK_SIZE: 20,

  /**
   * Loot/scroll weight multiplier when a skill is on the player's
   * CLAN_FAVORITE_SKILLS list (bias only — not a hard gate).
   */
  CLAN_FAVORITE_SKILL_WEIGHT: 2.0,

  /** AP cost of manually switching posture (skills that shift posture do so for free) */
  POSTURE_SWITCH_AP_COST: 1,

  /**
   * Draw-weight multipliers per card category, keyed by posture.
   * The weighted hand draw multiplies a card's base weight by the multiplier
   * matching its category (offensive/utility/defensive). Keys mirror the
   * Posture enum string values (kept as string literals to avoid a circular
   * import between featureFlags and game/types).
   */
  POSTURE_DRAW_WEIGHTS: {
    Aggressive: { offensive: 2.0, utility: 1.0, defensive: 0.5 },
    Balanced:   { offensive: 1.0, utility: 1.0, defensive: 1.0 },
    Defensive:  { offensive: 0.5, utility: 1.4, defensive: 2.0 },
  },
} as const;

// Type exports for type-safe access
export type FeatureFlagKey = keyof typeof FeatureFlags;
export type LaunchPropertyKey = keyof typeof LaunchProperties;

/**
 * Type-safe feature flag check. Prefer this over direct FeatureFlags access
 * when the flag key is dynamic or when writing new call sites.
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return FeatureFlags[flag];
}

/**
 * Type-safe launch property getter. Prefer this over direct LaunchProperties
 * access when the key is dynamic or when writing new call sites.
 */
export function getProperty<K extends LaunchPropertyKey>(
  key: K
): (typeof LaunchProperties)[K] {
  return LaunchProperties[key];
}
