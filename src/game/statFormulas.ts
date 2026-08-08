// ============================================================================
// STAT CALCULATION FORMULAS (runtime knobs for the calculator)
// Pure module — no imports (Sprint C: moved out of types.ts)
// ============================================================================
/**
 * F1 stat economy formulas (see docs/combat-distance-heat-stat-migration-plan.md).
 * Primaries are small integers (start 1, clan affinity 3); no dual-scale conversion.
 */
export const STAT_FORMULAS = {
  // Resource Pools: HP = 100 + 20×WILL; Chakra = 30 + 15×CHA
  // Early combat: slightly lower pools for player and enemies (shared formula).
  HP_PER_WILLPOWER: 20,
  HP_BASE: 100,
  CHAKRA_PER_CHAKRA: 15,
  CHAKRA_BASE: 30,

  // Regeneration
  // HP: max(1, floor(maxHP × (0.01 + 0.04 × WILL/(WILL+10))))
  HP_REGEN_BASE_FRACTION: 0.01,
  HP_REGEN_WILL_FRACTION: 0.04,
  HP_REGEN_WILL_SOFT: 10,
  // Chakra: 1 + 2×INTELLIGENCE
  CHAKRA_REGEN_BASE: 1,
  CHAKRA_REGEN_PER_INT: 2,

  // Defense: flat 1×stat; % = stat/(stat+18) cap 65%
  PHYSICAL_DEF_SOFT_CAP: 18,
  ELEMENTAL_DEF_SOFT_CAP: 18,
  MENTAL_DEF_SOFT_CAP: 18,
  PERCENT_DEF_CAP: 0.65,
  FLAT_PHYS_DEF_PER_STR: 1,
  FLAT_ELEM_DEF_PER_SPIRIT: 1,
  FLAT_MENTAL_DEF_PER_CALM: 1,

  // Impact: clamp(60, 98, 90 + 6×(atkStat − defSPEED)) — no separate evasion
  IMPACT_BASE: 90,
  IMPACT_PER_DIFF: 6,
  IMPACT_MIN: 60,
  IMPACT_MAX: 98,

  // Critical: 5% + 50%×DEX/(DEX+12), max 55%
  BASE_CRIT_CHANCE: 5,
  CRIT_SOFT_CAP: 12,
  CRIT_SCALE: 0.5,
  CRIT_CHANCE_CAP: 55,
  BASE_CRIT_MULT: 1.75,
  RANGED_CRIT_BONUS_PER_ACC: 0.008,

  // Survival: guts 30%×WILL/(WILL+18); resist 60%×CAL/(CAL+12)
  GUTS_SCALE: 0.3,
  GUTS_SOFT_CAP: 18,
  STATUS_RESIST_SCALE: 0.6,
  STATUS_RESIST_SOFT_CAP: 12,

  // Initiative: 10 + 5×SPEED
  INIT_BASE: 10,
  INIT_PER_SPEED: 5,

  // AP: min(9, 3 + floor((SPEED−1)/2))
  AP_BASE: 3,
  AP_MAX: 9,
  AP_SPEED_STEP: 2,
} as const;
