import {
  ApproachType,
  ApproachOption,
  PrimaryStat,
  EffectType,
  TerrainType,
} from '../types';
import { approachHeatPenaltyPp } from '../systems/HeatSystem';

// ============================================================================
// APPROACH DEFINITIONS — Balance Overhaul
// ============================================================================
// Design goals:
// - Frontal Assault = safe zero-risk baseline (always correct default)
// - Risk approaches need meaningful fail states AND gated stats
// - Silent Strike is a DEX path (not free early power for everyone)
// - Success odds cluster mid-band for non-specialists; specialists cap ~80–88%
// - No free lunch: risky paths cost chakra or pay on failure
// ============================================================================

export const APPROACH_DEFINITIONS: Record<ApproachType, ApproachOption> = {
  // --------------------------------------------------------------------------
  // FRONTAL ASSAULT — Always available baseline
  // --------------------------------------------------------------------------
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
      heatDelta: 0,
    },
  },

  // --------------------------------------------------------------------------
  // SILENT STRIKE — DEX assassin path
  // Uchiha/Hyuga start ~18 DEX unlock; Lee/Uzu/Yamanaka need gear/levels.
  // Was too strong: free 2× hit + big init + XP + weak fail visibility.
  // --------------------------------------------------------------------------
  [ApproachType.STEALTH_AMBUSH]: {
    type: ApproachType.STEALTH_AMBUSH,
    name: 'Silent Strike',
    description:
      'Ambush from the shadows. DEX specialists land a sharper first blow — miss and you are exposed.',

    requirements: {
      // Primary identity: dexterity. Speed is secondary mobility gate.
      minStats: [
        { stat: PrimaryStat.DEXTERITY, value: 3 },
        { stat: PrimaryStat.SPEED, value: 2 },
      ],
    },

    successCalc: {
      // DEX 16 → ~48%; DEX 22 → ~54%; DEX 30 → ~62%; terrain can push higher
      baseChance: 32,
      scalingStat: PrimaryStat.DEXTERITY,
      scalingFactor: 1.0,
      terrainBonus: true,
      maxChance: 85,
    },

    successEffects: {
      initiativeBonus: 6,
      guaranteedFirst: false,
      firstHitMultiplier: 1.5, // was 2.0 — still strong, not free double damage
      playerBuffs: [
        {
          type: EffectType.BUFF,
          targetStat: PrimaryStat.DEXTERITY,
          value: 1.10,
          duration: 1,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [], // removed free 15% stun
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 8, // no longer free
      hpCost: 0,
      xpMultiplier: 1.05, // was 1.15
    },

    // Spotted: enemy seizes tempo; you eat more damage and lose footing
    failureEffects: {
      initiativeBonus: -10,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.CURSE,
          value: 1.20, // +20% damage taken
          duration: 2,
          chance: 1.0,
        },
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.DEXTERITY,
          value: 1.15,
          duration: 2,
          chance: 1.0,
        },
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.SPEED,
          value: 1.10,
          duration: 2,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 8, // still pay attempt cost
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // MIND TRAP — Calm / INT genjutsu path
  // Yamanaka starts open; Uchiha/Hyuga mid; Lee locked hard.
  // --------------------------------------------------------------------------
  [ApproachType.GENJUTSU_SETUP]: {
    type: ApproachType.GENJUTSU_SETUP,
    name: 'Mind Trap',
    description:
      'Plant an illusion first. Enemy starts fogged — backlash clouds your own mind if it breaks.',

    requirements: {
      minStats: [
        { stat: PrimaryStat.CALMNESS, value: 2 },
        { stat: PrimaryStat.INTELLIGENCE, value: 2 },
      ],
    },

    successCalc: {
      // INT 12 → ~50%; INT 22 → ~65%; cap 88
      baseChance: 32,
      scalingStat: PrimaryStat.INTELLIGENCE,
      scalingFactor: 1.5,
      terrainBonus: false,
      maxChance: 88,
    },

    successEffects: {
      initiativeBonus: 2,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.BUFF,
          targetStat: PrimaryStat.CALMNESS,
          value: 1.12,
          duration: 2,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [
        {
          type: EffectType.CONFUSION,
          duration: 1, // was 2
          chance: 1.0,
        },
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.SPEED,
          value: 1.20, // was 0.30
          duration: 2, // was 3
          chance: 1.0,
        },
      ],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 18, // was 15
      hpCost: 0,
      xpMultiplier: 1.10, // was 1.20
    },

    failureEffects: {
      initiativeBonus: -3,
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
          value: 1.15,
          duration: 2,
          chance: 1.0,
        },
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.CALMNESS,
          value: 1.10,
          duration: 2,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 18,
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // TERRAIN TRAP — ACC / INT battlefield control
  // --------------------------------------------------------------------------
  [ApproachType.ENVIRONMENTAL_TRAP]: {
    type: ApproachType.ENVIRONMENTAL_TRAP,
    name: 'Terrain Trap',
    description:
      'Weaponize the battlefield. Soften the foe before steel rings — or take the blast yourself.',

    requirements: {
      minStats: [
        { stat: PrimaryStat.INTELLIGENCE, value: 2 },
        { stat: PrimaryStat.ACCURACY, value: 2 },
      ],
      allowedTerrains: [
        TerrainType.TREE_CANOPY,
        TerrainType.DENSE_FOLIAGE,
        TerrainType.GIANT_ROOTS,
        TerrainType.CLIFF_EDGE,
        TerrainType.SWAMP,
        TerrainType.ALLEYWAY,
        TerrainType.ROOFTOPS,
        TerrainType.STONE_PILLARS,
        TerrainType.TRAINING_FIELD,
        TerrainType.WATERFALL,
        TerrainType.BRIDGE,
        TerrainType.FOG_BANK,
        TerrainType.SHORELINE,
        TerrainType.RAPIDS,
        TerrainType.CORRUPTED_ZONE,
        TerrainType.ROOT_NETWORK,
      ],
    },

    successCalc: {
      // ACC 11 → ~46%; ACC 19 → ~54%; ACC 28 → ~63%
      baseChance: 35,
      scalingStat: PrimaryStat.ACCURACY,
      scalingFactor: 1.0,
      terrainBonus: false,
      maxChance: 85,
    },

    successEffects: {
      initiativeBonus: 1,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.STRENGTH,
          value: 1.12,
          duration: 2,
          chance: 1.0,
        },
      ],
      skipCombat: false,
      enemyHpReduction: 0.12, // was 0.18
      chakraCost: 6,
      hpCost: 0,
      xpMultiplier: 1.08, // was 1.20
    },

    failureEffects: {
      initiativeBonus: -2,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.ACCURACY,
          value: 1.15,
          duration: 2,
          chance: 1.0,
        },
        {
          type: EffectType.CURSE,
          value: 1.10,
          duration: 1,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 6,
      hpCost: 15, // was 12 — misfire hurts more
      xpMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // IRON GUARD — Willpower tank path
  // Uzumaki / Lee open early; glass cannons wait.
  // --------------------------------------------------------------------------
  [ApproachType.IRON_GUARD]: {
    type: ApproachType.IRON_GUARD,
    name: 'Iron Guard',
    description:
      'Brace with chakra armor. Trade tempo for a shield — if it shatters, you bleed more.',

    requirements: {
      minStat: { stat: PrimaryStat.WILLPOWER, value: 2 },
    },

    successCalc: {
      // WILL 14 → ~54%; WILL 25 → ~65%; cap 90
      baseChance: 40,
      scalingStat: PrimaryStat.WILLPOWER,
      scalingFactor: 1.0,
      terrainBonus: false,
      maxChance: 90,
    },

    successEffects: {
      initiativeBonus: -1, // deliberate slow open (defensive)
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.SHIELD,
          value: 3, // was 25
          duration: 2, // was 3
          chance: 1.0,
        },
        {
          type: EffectType.BUFF,
          targetStat: PrimaryStat.WILLPOWER,
          value: 1.08,
          duration: 2,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 12, // was 10
      hpCost: 0,
      xpMultiplier: 1.0, // was 1.10 — tank path is safety, not XP farm
    },

    failureEffects: {
      initiativeBonus: -5,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.CURSE,
          value: 1.25, // was 0.20 — broken guard is scary
          duration: 2,
          chance: 1.0,
        },
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.WILLPOWER,
          value: 1.12,
          duration: 2,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 12,
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },

  // --------------------------------------------------------------------------
  // SHADOW PASSAGE — High Speed skip (elite/boss blocked in resolve)
  // Lee can open mid-run; others need heavy speed investment.
  // --------------------------------------------------------------------------
  [ApproachType.SHADOW_BYPASS]: {
    type: ApproachType.SHADOW_BYPASS,
    name: 'Shadow Passage',
    description:
      'Slip past the fight entirely. Expensive, unreliable, no XP or loot — and elites never fall for it.',

    requirements: {
      minStat: { stat: PrimaryStat.SPEED, value: 7 },
    },

    successCalc: {
      // SPD 30 → ~49%; SPD 40 → ~57%; max 78 with terrain
      baseChance: 25,
      scalingStat: PrimaryStat.SPEED,
      scalingFactor: 0.8,
      terrainBonus: true,
      maxChance: 78,
    },

    successEffects: {
      initiativeBonus: 0,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [],
      skipCombat: true,
      enemyHpReduction: 0,
      chakraCost: 30, // was 25
      hpCost: 0,
      xpMultiplier: 0,
    },

    failureEffects: {
      initiativeBonus: -14,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.SPEED,
          value: 1.25,
          duration: 2,
          chance: 1.0,
        },
        {
          type: EffectType.CURSE,
          value: 1.15,
          duration: 2,
          chance: 1.0,
        },
      ],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 30,
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
  else if (e.initiativeBonus >= 15) tags.push(`+${e.initiativeBonus} initiative`);
  else if (e.initiativeBonus > 0) tags.push(`+${e.initiativeBonus} init`);
  else if (e.initiativeBonus < 0) tags.push(`${e.initiativeBonus} init`);

  const hasShield = e.playerBuffs.some(b => b.type === EffectType.SHIELD);
  if (hasShield) {
    const shield = e.playerBuffs.find(b => b.type === EffectType.SHIELD);
    tags.push(shield?.value ? `Shield ${shield.value}` : 'Shield');
  }
  const hasConfusion = e.enemyDebuffs.some(b => b.type === EffectType.CONFUSION);
  if (hasConfusion) tags.push('Confuse enemy');
  const hasStun = e.enemyDebuffs.some(b => b.type === EffectType.STUN);
  if (hasStun) {
    const stun = e.enemyDebuffs.find(b => b.type === EffectType.STUN);
    const pct = Math.round((stun?.chance ?? 0) * 100);
    tags.push(pct > 0 && pct < 100 ? `${pct}% stun` : 'Stun');
  }
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
  terrainStealthBonus: number = 0,
  /** F3 visit heat — PP penalty after base calc, before clamp */
  heat: number = 0,
  /** Intel 0–100% — grants up to +15% success odds */
  intel: number = 0,
): number {
  const def = APPROACH_DEFINITIONS[approach];
  const calc = def.successCalc;

  const statKey = calc.scalingStat.toLowerCase();
  const statValue = stats[statKey] || 0;

  let chance = calc.baseChance + (statValue * calc.scalingFactor);

  if (calc.terrainBonus) {
    chance += terrainStealthBonus;
  }

  // Tactical Intel bonus: +0% to +15% based on location intel (0–100%)
  if (approach !== ApproachType.FRONTAL_ASSAULT) {
    const clampedIntel = Math.max(0, Math.min(100, intel));
    chance += (clampedIntel / 100) * 15;
  }

  // F3: heat PP penalties after normal chance, before clamp
  chance += approachHeatPenaltyPp(approach, heat);

  return Math.min(calc.maxChance, Math.max(0, chance));
}

function checkMinStatGate(
  gate: { stat: PrimaryStat; value: number },
  stats: Record<string, number>,
): { meets: boolean; reason?: string } {
  const statKey = gate.stat.toLowerCase();
  const playerStat = stats[statKey] || 0;
  if (playerStat < gate.value) {
    const statLabel = gate.stat.charAt(0) + gate.stat.slice(1).toLowerCase();
    return {
      meets: false,
      reason: `Need ${statLabel} ${gate.value}  ·  you have ${playerStat}`,
    };
  }
  return { meets: true };
}

/**
 * Check if player meets requirements for an approach
 * @param ignoreTerrain - when true (HUD preference picker), skip terrain gates so
 *   the player can lock an approach that only works on some rooms.
 */
export function meetsApproachRequirements(
  approach: ApproachType,
  stats: Record<string, number>,
  skills: string[],
  currentTerrain: TerrainType,
  ignoreTerrain: boolean = false,
): { meets: boolean; reason?: string } {
  const def = APPROACH_DEFINITIONS[approach];
  const req = def.requirements;

  // Multi-stat gates (checked first — show first failing stat)
  if (req.minStats && req.minStats.length > 0) {
    for (const gate of req.minStats) {
      const result = checkMinStatGate(gate, stats);
      if (!result.meets) return result;
    }
  } else if (req.minStat) {
    const result = checkMinStatGate(req.minStat, stats);
    if (!result.meets) return result;
  }

  if (req.requiredSkill) {
    if (!skills.includes(req.requiredSkill)) {
      return {
        meets: false,
        reason: `Requires skill: ${req.requiredSkill}`,
      };
    }
  }

  if (!ignoreTerrain && req.allowedTerrains && req.allowedTerrains.length > 0) {
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
 * Resolve the player's preferred approach for a concrete encounter.
 * Falls back to Frontal Assault when the preference is locked out
 * (elite/boss bypass, missing stats, wrong terrain).
 */
export function resolvePreferredApproach(
  preferred: ApproachType | undefined | null,
  stats: Record<string, number>,
  skills: string[],
  currentTerrain: TerrainType,
  isEliteOrBoss: boolean = false,
): { approach: ApproachType; fellBack: boolean; reason?: string } {
  const preferredSafe = preferred ?? ApproachType.FRONTAL_ASSAULT;

  if (preferredSafe === ApproachType.FRONTAL_ASSAULT) {
    return { approach: ApproachType.FRONTAL_ASSAULT, fellBack: false };
  }

  if (preferredSafe === ApproachType.SHADOW_BYPASS && isEliteOrBoss) {
    return {
      approach: ApproachType.FRONTAL_ASSAULT,
      fellBack: true,
      reason: 'Cannot bypass Elite or Boss — engaging frontally',
    };
  }

  const { meets, reason } = meetsApproachRequirements(
    preferredSafe,
    stats,
    skills,
    currentTerrain,
  );

  if (!meets) {
    return {
      approach: ApproachType.FRONTAL_ASSAULT,
      fellBack: true,
      reason: reason
        ? `${reason} — engaging frontally`
        : 'Preferred approach unavailable — engaging frontally',
    };
  }

  return { approach: preferredSafe, fellBack: false };
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
// APPROACH SCALING BY FLOOR (reference — live gates use flat minStats on defs)
// ============================================================================
export const APPROACH_FLOOR_REQUIREMENTS: Record<string, Record<ApproachType, number>> = {
  '1-10': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 16, // DEX
    [ApproachType.GENJUTSU_SETUP]: 14, // Calm
    [ApproachType.ENVIRONMENTAL_TRAP]: 12, // INT
    [ApproachType.IRON_GUARD]: 14, // WILL
    [ApproachType.SHADOW_BYPASS]: 999,
  },
  '11-25': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 18,
    [ApproachType.GENJUTSU_SETUP]: 16,
    [ApproachType.ENVIRONMENTAL_TRAP]: 14,
    [ApproachType.IRON_GUARD]: 16,
    [ApproachType.SHADOW_BYPASS]: 30,
  },
  '26-50': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 22,
    [ApproachType.GENJUTSU_SETUP]: 20,
    [ApproachType.ENVIRONMENTAL_TRAP]: 18,
    [ApproachType.IRON_GUARD]: 20,
    [ApproachType.SHADOW_BYPASS]: 34,
  },
  '51-75': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 28,
    [ApproachType.GENJUTSU_SETUP]: 26,
    [ApproachType.ENVIRONMENTAL_TRAP]: 24,
    [ApproachType.IRON_GUARD]: 26,
    [ApproachType.SHADOW_BYPASS]: 40,
  },
  '76+': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 34,
    [ApproachType.GENJUTSU_SETUP]: 32,
    [ApproachType.ENVIRONMENTAL_TRAP]: 30,
    [ApproachType.IRON_GUARD]: 32,
    [ApproachType.SHADOW_BYPASS]: 48,
  },
};

export function getFloorRange(floor: number): string {
  if (floor <= 10) return '1-10';
  if (floor <= 25) return '11-25';
  if (floor <= 50) return '26-50';
  if (floor <= 75) return '51-75';
  return '76+';
}
