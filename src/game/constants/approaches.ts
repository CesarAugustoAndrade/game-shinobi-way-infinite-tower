import {
  ApproachType,
  ApproachOption,
  PrimaryStat,
  EffectType,
  TerrainType,
} from '../types';

// ============================================================================
// APPROACH DEFINITIONS
// Pre-combat engagement options. Tuned so early-mid builds have 2–4 real choices.
// ============================================================================

export const APPROACH_DEFINITIONS: Record<ApproachType, ApproachOption> = {
  // ============================================================================
  // FRONTAL ASSAULT - Always available baseline
  // ============================================================================
  [ApproachType.FRONTAL_ASSAULT]: {
    type: ApproachType.FRONTAL_ASSAULT,
    name: 'Frontal Assault',
    description: 'Charge head-on. Safe, always works, no bonuses.',

    requirements: {},

    successCalc: {
      baseChance: 100,
      scalingStat: PrimaryStat.STRENGTH,
      scalingFactor: 0,
      terrainBonus: false,
      maxChance: 100,
    },

    successEffects: {
      initiativeBonus: 0,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 0,
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },

  // ============================================================================
  // STEALTH AMBUSH - Speed/Dex first-strike
  // Early-accessible (Speed 10). Reward: 2× first hit + initiative.
  // ============================================================================
  [ApproachType.STEALTH_AMBUSH]: {
    type: ApproachType.STEALTH_AMBUSH,
    name: 'Silent Strike',
    description: 'Ambush from the shadows. First hit hits harder; you open aggressive.',

    requirements: {
      minStat: { stat: PrimaryStat.SPEED, value: 10 },
    },

    successCalc: {
      baseChance: 45,
      scalingStat: PrimaryStat.DEXTERITY,
      scalingFactor: 1.5,           // +1.5% per DEX
      terrainBonus: true,           // Room/location stealth applies
      maxChance: 95,
    },

    successEffects: {
      initiativeBonus: 45,
      guaranteedFirst: false,
      firstHitMultiplier: 2.0,
      playerBuffs: [
        {
          type: EffectType.BUFF,
          targetStat: PrimaryStat.DEXTERITY,
          value: 0.15,
          duration: 1,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [
        {
          type: EffectType.STUN,
          duration: 1,
          chance: 0.15,
        },
      ],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 0,
      hpCost: 0,
      xpMultiplier: 1.15,
    },

    // Caught mid-ambush: enemy seizes initiative; you are exposed
    failureEffects: {
      initiativeBonus: -35,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.CURSE,
          value: 0.15,              // +15% damage taken
          duration: 2,
          chance: 1.0,
        },
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.SPEED,
          value: 0.15,
          duration: 2,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 0,
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },

  // ============================================================================
  // GENJUTSU SETUP - Calmness/INT mental control
  // Lowered req so genjutsu/INT builds unlock mid-early (Calmness 11).
  // ============================================================================
  [ApproachType.GENJUTSU_SETUP]: {
    type: ApproachType.GENJUTSU_SETUP,
    name: 'Mind Trap',
    description: 'Plant an illusion first. Enemy starts confused and slowed.',

    requirements: {
      minStat: { stat: PrimaryStat.CALMNESS, value: 11 },
    },

    successCalc: {
      baseChance: 40,
      scalingStat: PrimaryStat.INTELLIGENCE,
      scalingFactor: 2.0,           // +2% per INT
      terrainBonus: false,
      maxChance: 95,
    },

    successEffects: {
      initiativeBonus: 10,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.BUFF,
          targetStat: PrimaryStat.CALMNESS,
          value: 0.2,
          duration: 3,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [
        {
          type: EffectType.CONFUSION,
          duration: 2,
          chance: 1.0,
        },
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.SPEED,
          value: 0.30,
          duration: 3,
          chance: 1.0,
        },
      ],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 15,
      hpCost: 0,
      xpMultiplier: 1.20,
    },

    // Illusion backlash: chakra spent + mental fog on you
    failureEffects: {
      initiativeBonus: -10,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.CONFUSION,
          duration: 1,
          chance: 1.0,
        },
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.INTELLIGENCE,
          value: 0.15,
          duration: 2,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 15,
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },

  // ============================================================================
  // ENVIRONMENTAL TRAP - INT/ACC, most terrains
  // Expanded terrain list so Stone Pillars / common biomes work.
  // ============================================================================
  [ApproachType.ENVIRONMENTAL_TRAP]: {
    type: ApproachType.ENVIRONMENTAL_TRAP,
    name: 'Terrain Trap',
    description: 'Weaponize the battlefield. Enemy loses HP before the fight.',

    requirements: {
      minStat: { stat: PrimaryStat.INTELLIGENCE, value: 11 },
      allowedTerrains: [
        // Forest / vertical
        TerrainType.TREE_CANOPY,
        TerrainType.DENSE_FOLIAGE,
        TerrainType.GIANT_ROOTS,
        TerrainType.CLIFF_EDGE,
        TerrainType.SWAMP,
        // Urban / academy
        TerrainType.ALLEYWAY,
        TerrainType.ROOFTOPS,
        TerrainType.STONE_PILLARS,
        TerrainType.TRAINING_FIELD,
        // Waves / water
        TerrainType.WATERFALL,
        TerrainType.BRIDGE,
        TerrainType.FOG_BANK,
        TerrainType.SHORELINE,
        TerrainType.RAPIDS,
        // War
        TerrainType.CORRUPTED_ZONE,
        TerrainType.ROOT_NETWORK,
      ],
    },

    successCalc: {
      baseChance: 48,
      scalingStat: PrimaryStat.ACCURACY,
      scalingFactor: 1.2,
      terrainBonus: false,
      maxChance: 90,
    },

    successEffects: {
      initiativeBonus: 5,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.STRENGTH,
          value: 0.15,
          duration: 3,
          chance: 1.0,
        },
      ],
      skipCombat: false,
      enemyHpReduction: 0.18,       // 18% pre-fight HP (was 20; more terrains)
      chakraCost: 0,
      hpCost: 0,
      xpMultiplier: 1.20,
    },

    // Trap backfires: you take the hit
    failureEffects: {
      initiativeBonus: -5,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.ACCURACY,
          value: 0.15,
          duration: 2,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 0,
      hpCost: 12,                    // Flat HP cost from misfire
      xpMultiplier: 1.0,
    },
  },

  // ============================================================================
  // IRON GUARD (NEW) - Willpower tank setup
  // Fills the missing defensive/tank path for WILL-heavy builds.
  // ============================================================================
  [ApproachType.IRON_GUARD]: {
    type: ApproachType.IRON_GUARD,
    name: 'Iron Guard',
    description: 'Brace with chakra armor. Start with a shield; open defensive.',

    requirements: {
      minStat: { stat: PrimaryStat.WILLPOWER, value: 10 },
    },

    successCalc: {
      baseChance: 50,
      scalingStat: PrimaryStat.WILLPOWER,
      scalingFactor: 1.2,           // +1.2% per WILL
      terrainBonus: false,
      maxChance: 95,
    },

    successEffects: {
      initiativeBonus: 0,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.SHIELD,
          value: 25,                // Flat shield absorb (early-game meaningful)
          duration: 3,
          chance: 1.0,
        },
        {
          type: EffectType.BUFF,
          targetStat: PrimaryStat.WILLPOWER,
          value: 0.10,
          duration: 2,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 10,
      hpCost: 0,
      xpMultiplier: 1.10,
    },

    // Guard shattered: chakra spent + take more damage
    failureEffects: {
      initiativeBonus: -15,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.CURSE,
          value: 0.20,              // +20% damage taken — broken guard
          duration: 2,
          chance: 1.0,
        },
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.WILLPOWER,
          value: 0.10,
          duration: 2,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 10,
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },

  // ============================================================================
  // SHADOW BYPASS - High Speed escape (no skill gate)
  // Speed 28 — late-mid unlock; still blocked on elite/boss.
  // ============================================================================
  [ApproachType.SHADOW_BYPASS]: {
    type: ApproachType.SHADOW_BYPASS,
    name: 'Shadow Passage',
    description: 'Slip past the fight entirely. Costs chakra; no XP or loot.',

    requirements: {
      minStat: { stat: PrimaryStat.SPEED, value: 28 },
      // Skill gate removed — pure Speed mastery is enough
    },

    successCalc: {
      baseChance: 35,
      scalingStat: PrimaryStat.SPEED,
      scalingFactor: 1.0,
      terrainBonus: true,
      maxChance: 90,
    },

    successEffects: {
      initiativeBonus: 0,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [],
      skipCombat: true,
      enemyHpReduction: 0,
      chakraCost: 25,
      hpCost: 0,
      xpMultiplier: 0,
    },

    // Spotted mid-escape: chakra spent, enemy acts first, you are off-balance
    failureEffects: {
      initiativeBonus: -50,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.SPEED,
          value: 0.20,
          duration: 2,
          chance: 1.0,
        },
        {
          type: EffectType.CURSE,
          value: 0.10,
          duration: 1,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 25,
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get approach definition
 */
export function getApproach(type: ApproachType): ApproachOption {
  return APPROACH_DEFINITIONS[type];
}

/**
 * Short benefit chips for UI cards (readable trade-offs at a glance).
 */
export function getApproachBenefitTags(type: ApproachType): string[] {
  const e = APPROACH_DEFINITIONS[type].successEffects;
  const tags: string[] = [];

  if (e.skipCombat) tags.push('Skip combat');
  if (e.firstHitMultiplier > 1) tags.push(`${e.firstHitMultiplier}× first hit`);
  if (e.enemyHpReduction > 0) tags.push(`−${Math.round(e.enemyHpReduction * 100)}% enemy HP`);
  if (e.guaranteedFirst) tags.push('Act first');
  else if (e.initiativeBonus >= 20) tags.push(`+${e.initiativeBonus} initiative`);
  else if (e.initiativeBonus > 0) tags.push(`+${e.initiativeBonus} init`);

  const hasShield = e.playerBuffs.some(b => b.type === EffectType.SHIELD);
  if (hasShield) {
    const shield = e.playerBuffs.find(b => b.type === EffectType.SHIELD);
    tags.push(shield?.value ? `Shield ${shield.value}` : 'Shield');
  }
  const hasConfusion = e.enemyDebuffs.some(b => b.type === EffectType.CONFUSION);
  if (hasConfusion) tags.push('Confuse enemy');
  const hasStun = e.enemyDebuffs.some(b => b.type === EffectType.STUN);
  if (hasStun) tags.push('15% stun');
  const hasSlow = e.enemyDebuffs.some(
    b => b.type === EffectType.DEBUFF && b.targetStat === PrimaryStat.SPEED,
  );
  if (hasSlow) tags.push('Slow enemy');

  if (e.xpMultiplier > 1) tags.push(`+${Math.round((e.xpMultiplier - 1) * 100)}% XP`);
  if (e.xpMultiplier === 0) tags.push('No XP/loot');
  if (tags.length === 0) tags.push('No modifiers');

  return tags;
}

/**
 * Failure penalty chips for UI (all approaches except Frontal Assault).
 */
export function getApproachFailureTags(type: ApproachType): string[] {
  if (type === ApproachType.FRONTAL_ASSAULT) return [];

  const e = APPROACH_DEFINITIONS[type].failureEffects;
  if (!e) return ['Normal combat'];

  const tags: string[] = [];

  if ((e.initiativeBonus ?? 0) <= -30) tags.push('Enemy seizes initiative');
  else if ((e.initiativeBonus ?? 0) < 0) tags.push(`${e.initiativeBonus} init`);

  if ((e.hpCost ?? 0) > 0) tags.push(`−${e.hpCost} HP`);
  if ((e.chakraCost ?? 0) > 0) tags.push(`Still pay ${e.chakraCost} Chakra`);

  for (const b of e.playerBuffs ?? []) {
    if (b.type === EffectType.CURSE) {
      tags.push(`+${Math.round((b.value ?? 0) * 100)}% dmg taken`);
    } else if (b.type === EffectType.CONFUSION) {
      tags.push('Self confusion');
    } else if (b.type === EffectType.SILENCE) {
      tags.push('Silenced');
    } else if (b.type === EffectType.DEBUFF && b.targetStat) {
      const stat = b.targetStat.charAt(0) + b.targetStat.slice(1).toLowerCase();
      tags.push(`−${Math.round((b.value ?? 0) * 100)}% ${stat}`);
    }
  }

  if (tags.length === 0) tags.push('No bonuses');
  return tags;
}

/**
 * Calculate success chance for an approach
 */
export function calculateApproachSuccessChance(
  approach: ApproachType,
  stats: Record<string, number>,
  terrainStealthBonus: number = 0
): number {
  const def = APPROACH_DEFINITIONS[approach];
  const calc = def.successCalc;

  const statKey = calc.scalingStat.toLowerCase();
  const statValue = stats[statKey] || 0;

  let chance = calc.baseChance + (statValue * calc.scalingFactor);

  if (calc.terrainBonus) {
    chance += terrainStealthBonus;
  }

  return Math.min(calc.maxChance, Math.max(0, chance));
}

/**
 * Check if player meets requirements for an approach
 */
export function meetsApproachRequirements(
  approach: ApproachType,
  stats: Record<string, number>,
  skills: string[],
  currentTerrain: TerrainType
): { meets: boolean; reason?: string } {
  const def = APPROACH_DEFINITIONS[approach];
  const req = def.requirements;

  if (req.minStat) {
    const statKey = req.minStat.stat.toLowerCase();
    const playerStat = stats[statKey] || 0;
    if (playerStat < req.minStat.value) {
      const statLabel = req.minStat.stat.charAt(0) + req.minStat.stat.slice(1).toLowerCase();
      return {
        meets: false,
        reason: `Need ${statLabel} ${req.minStat.value}  ·  you have ${playerStat}`,
      };
    }
  }

  if (req.requiredSkill) {
    if (!skills.includes(req.requiredSkill)) {
      return {
        meets: false,
        reason: `Requires skill: ${req.requiredSkill}`,
      };
    }
  }

  if (req.allowedTerrains && req.allowedTerrains.length > 0) {
    if (!req.allowedTerrains.includes(currentTerrain)) {
      return {
        meets: false,
        reason: 'Not available on this terrain',
      };
    }
  }

  return { meets: true };
}

/**
 * Get all available approaches for given context
 */
export function getAvailableApproaches(
  stats: Record<string, number>,
  skills: string[],
  currentTerrain: TerrainType,
  isEliteOrBoss: boolean = false
): Array<{ approach: ApproachType; available: boolean; reason?: string; successChance?: number }> {
  const terrainStealthMod = 0;

  return Object.values(ApproachType).map((approach) => {
    if (approach === ApproachType.SHADOW_BYPASS && isEliteOrBoss) {
      return {
        approach,
        available: false,
        reason: 'Cannot bypass Elite or Boss encounters',
      };
    }

    const { meets, reason } = meetsApproachRequirements(approach, stats, skills, currentTerrain);

    if (!meets) {
      return { approach, available: false, reason };
    }

    const successChance = calculateApproachSuccessChance(approach, stats, terrainStealthMod);

    return { approach, available: true, successChance };
  });
}

// ============================================================================
// APPROACH SCALING BY FLOOR (reference table — base defs use flat mins)
// ============================================================================
export const APPROACH_FLOOR_REQUIREMENTS: Record<string, Record<ApproachType, number>> = {
  '1-10': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 10,
    [ApproachType.GENJUTSU_SETUP]: 11,
    [ApproachType.ENVIRONMENTAL_TRAP]: 11,
    [ApproachType.IRON_GUARD]: 10,
    [ApproachType.SHADOW_BYPASS]: 999,
  },
  '11-25': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 14,
    [ApproachType.GENJUTSU_SETUP]: 16,
    [ApproachType.ENVIRONMENTAL_TRAP]: 16,
    [ApproachType.IRON_GUARD]: 14,
    [ApproachType.SHADOW_BYPASS]: 28,
  },
  '26-50': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 20,
    [ApproachType.GENJUTSU_SETUP]: 22,
    [ApproachType.ENVIRONMENTAL_TRAP]: 22,
    [ApproachType.IRON_GUARD]: 20,
    [ApproachType.SHADOW_BYPASS]: 34,
  },
  '51-75': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 28,
    [ApproachType.GENJUTSU_SETUP]: 30,
    [ApproachType.ENVIRONMENTAL_TRAP]: 28,
    [ApproachType.IRON_GUARD]: 28,
    [ApproachType.SHADOW_BYPASS]: 42,
  },
  '76+': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 36,
    [ApproachType.GENJUTSU_SETUP]: 38,
    [ApproachType.ENVIRONMENTAL_TRAP]: 36,
    [ApproachType.IRON_GUARD]: 36,
    [ApproachType.SHADOW_BYPASS]: 50,
  },
};

export function getFloorRange(floor: number): string {
  if (floor <= 10) return '1-10';
  if (floor <= 25) return '11-25';
  if (floor <= 50) return '26-50';
  if (floor <= 75) return '51-75';
  return '76+';
}
