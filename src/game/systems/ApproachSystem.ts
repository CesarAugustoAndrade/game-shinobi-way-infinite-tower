/**
 * =============================================================================
 * APPROACH SYSTEM - Pre-Combat Engagement Options
 * =============================================================================
 *
 * This system handles the pre-combat approach selection phase where players
 * choose how to engage enemies. Different approaches offer unique advantages
 * and disadvantages based on success/failure.
 *
 * ## APPROACH TYPES (6 Options)
 *
 * | Approach          | Primary Stats          | Risk/Reward        |
 * |-------------------|------------------------|-------------------|
 * | FRONTAL_ASSAULT   | None (always works)    | Low risk, no bonus |
 * | STEALTH_AMBUSH    | Speed, Dexterity       | First hit bonus    |
 * | GENJUTSU_SETUP    | Intelligence, Calmness | Debuff enemy       |
 * | ENVIRONMENTAL_TRAP| Accuracy, Intelligence | HP reduction       |
 * | IRON_GUARD        | Willpower              | Pre-fight shield   |
 * | SHADOW_BYPASS     | Speed                  | Skip combat        |
 *
 * ## SUCCESS CHANCE CALCULATION
 *
 * Base formula varies by approach, but generally:
 * - Primary stat contributes most (×0.5 to ×1.0)
 * - Secondary stat provides smaller bonus (×0.3 to ×0.5)
 * - Terrain stealth modifier adds flat bonus
 * - Roll 1-100, success if roll ≤ successChance
 *
 * ## APPROACH EFFECTS
 *
 * On success, approaches can provide:
 * - **skipCombat**: Completely avoid the fight (SHADOW_BYPASS)
 * - **guaranteedFirst**: Player always acts first
 * - **initiativeBonus**: Bonus to initiative roll
 * - **firstHitMultiplier**: Damage multiplier on first attack
 * - **enemyHpReduction**: % of enemy HP removed before combat
 * - **playerBuffs**: Buffs applied to player
 * - **enemyDebuffs**: Debuffs applied to enemy
 *
 * On failure, some approaches may:
 * - Grant enemy first strike
 * - Consume chakra/HP without benefit
 * - Apply debuffs to player
 *
 * ## TERRAIN INTERACTION
 *
 * Terrain provides stealth modifiers that affect approach success:
 * - Dark areas: +10-20% stealth approaches
 * - Open areas: -10-20% stealth approaches
 * - Water: Bonus to water-element traps
 *
 * =============================================================================
 */

import {
  ApproachType,
  Player,
  Enemy,
  CharacterStats,
  TerrainDefinition,
  Buff,
  EffectType,
  PrimaryStat,
} from '../types';
import {
  APPROACH_DEFINITIONS,
  calculateApproachSuccessChance,
} from '../constants/approaches';
import { d100, chance, generateUniqueId, pick } from '../utils/rng';

// ============================================================================
// APPROACH RESULT TYPES
// ============================================================================

export interface ApproachResult {
  approach: ApproachType;
  success: boolean;
  successChance: number;
  roll: number;

  // Effects to apply
  skipCombat: boolean;
  guaranteedFirst: boolean;
  initiativeBonus: number;
  firstHitMultiplier: number;
  enemyHpReduction: number;
  playerBuffs: Buff[];
  enemyDebuffs: Buff[];

  // Costs applied
  chakraCost: number;
  hpCost: number;

  // Modifiers for post-combat
  xpMultiplier: number;

  // Narrative description
  description: string;
}

// ============================================================================
// APPROACH EXECUTION
// ============================================================================

/**
 * Execute an approach and determine outcome
 * Returns the result with all effects to be applied
 */
export function executeApproach(
  approach: ApproachType,
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  terrain: TerrainDefinition,
  /** T-063: extra stealth points from Location.terrainEffects stealth_bonus (fraction*100) */
  locationStealthBonusPts: number = 0,
): ApproachResult {
  const def = APPROACH_DEFINITIONS[approach];

  // Get player stats as flat object for calculations
  const stats: Record<string, number> = {
    speed: playerStats.primary.speed,
    dexterity: playerStats.primary.dexterity,
    intelligence: playerStats.primary.intelligence,
    calmness: playerStats.primary.calmness,
    accuracy: playerStats.primary.accuracy,
    willpower: playerStats.primary.willpower,
    strength: playerStats.primary.strength,
    spirit: playerStats.primary.spirit,
    chakra: playerStats.primary.chakra,
  };

  // Room terrain stealth (points) + location stealth_bonus (T-063)
  const terrainStealthBonus =
    (terrain.effects.stealthModifier || 0) + (locationStealthBonusPts || 0);
  const successChance = calculateApproachSuccessChance(approach, stats, terrainStealthBonus);

  // Roll for success (1-100)
  const roll = d100();
  const success = roll <= successChance;

  // Success vs failure effect block (Frontal has no failure path — always succeeds at 100%)
  const effects = success
    ? def.successEffects
    : (def.failureEffects ?? {
        // Safe fallback: no free success bonuses if failureEffects omitted
        initiativeBonus: 0,
        guaranteedFirst: false,
        firstHitMultiplier: 1.0,
        playerBuffs: [],
        enemyDebuffs: [],
        skipCombat: false,
        enemyHpReduction: 0,
        chakraCost: def.successEffects.chakraCost ?? 0,
        hpCost: def.successEffects.hpCost ?? 0,
        xpMultiplier: 1.0,
      });

  // Apply buffs/debuffs from the chosen path (failure penalties use playerBuffs as debuffs/curses)
  const playerBuffs = convertEffectsToBuffs(effects.playerBuffs || [], true);
  const enemyDebuffs = convertEffectsToBuffs(effects.enemyDebuffs || [], false);

  // Generate narrative description
  const description = generateApproachDescription(approach, success, enemy.name);

  return {
    approach,
    success,
    successChance: Math.round(successChance),
    roll,

    skipCombat: success && (effects.skipCombat ?? false),
    guaranteedFirst: success && (effects.guaranteedFirst ?? false),
    // May be negative on failure (enemy seizes initiative)
    initiativeBonus: effects.initiativeBonus ?? 0,
    firstHitMultiplier: success ? (effects.firstHitMultiplier ?? 1.0) : 1.0,
    enemyHpReduction: success ? (effects.enemyHpReduction ?? 0) : 0,
    playerBuffs,
    enemyDebuffs,

    chakraCost: effects.chakraCost ?? 0,
    hpCost: effects.hpCost ?? 0,

    xpMultiplier: success ? (effects.xpMultiplier ?? 1.0) : 1.0,

    description,
  };
}

/**
 * Convert effect definitions to actual Buff objects
 */
function convertEffectsToBuffs(
  effects: Array<{
    type: EffectType;
    targetStat?: PrimaryStat;
    value?: number;
    duration: number;
    chance: number;
  }>,
  isPlayerBuff: boolean
): Buff[] {
  const buffs: Buff[] = [];

  for (const effect of effects) {
    // Check if effect triggers based on chance
    if (!chance(effect.chance)) continue;

    buffs.push({
      id: generateUniqueId(`approach_${effect.type}`),
      name: getBuffName(effect.type, isPlayerBuff),
      duration: effect.duration,
      effect: {
        type: effect.type,
        value: effect.value,
        duration: effect.duration,
        targetStat: effect.targetStat,
        chance: effect.chance,
      },
      source: 'approach',
    });
  }

  return buffs;
}

/**
 * Get display name for a buff/debuff
 */
function getBuffName(type: EffectType, isPlayerBuff: boolean): string {
  switch (type) {
    case EffectType.STUN:
      return 'Stunned';
    case EffectType.CONFUSION:
      return isPlayerBuff ? 'Mental Fog' : 'Confused';
    case EffectType.SHIELD:
      return 'Chakra Guard';
    case EffectType.CURSE:
      return 'Exposed';
    case EffectType.BUFF:
      return isPlayerBuff ? 'Enhanced' : 'Weakened';
    case EffectType.DEBUFF:
      return isPlayerBuff ? 'Off-Balance' : 'Weakened';
    default:
      return isPlayerBuff ? 'Boosted' : 'Hindered';
  }
}

/**
 * Generate narrative description of approach outcome
 */
function generateApproachDescription(
  approach: ApproachType,
  success: boolean,
  enemyName: string
): string {
  const descriptions: Record<ApproachType, { success: string[]; failure: string[] }> = {
    [ApproachType.FRONTAL_ASSAULT]: {
      success: [
        `You charge directly at ${enemyName}!`,
        `No tricks. No hiding. You face ${enemyName} head-on.`,
        `Steel meets steel as you engage ${enemyName} directly.`,
      ],
      failure: [
        `You charge directly at ${enemyName}!`,
      ],
    },
    [ApproachType.STEALTH_AMBUSH]: {
      success: [
        `You melt into the shadows and strike ${enemyName} from behind!`,
        `${enemyName} never saw you coming. Your blade finds its mark.`,
        `Silent as death, you emerge from the darkness behind ${enemyName}.`,
      ],
      failure: [
        `A twig snaps. ${enemyName} whirls around, alerted to your presence.`,
        `Your shadow betrays you. ${enemyName} spots your approach.`,
        `${enemyName}'s instincts are sharp. They sense you before you strike.`,
      ],
    },
    [ApproachType.GENJUTSU_SETUP]: {
      success: [
        `Your illusion takes hold. ${enemyName}'s eyes glaze over in confusion.`,
        `Reality shifts for ${enemyName} as your genjutsu weaves its web.`,
        `${enemyName} stumbles, caught in your mental trap.`,
      ],
      failure: [
        `${enemyName} breaks free of your illusion with a surge of chakra!`,
        `Your genjutsu shatters against ${enemyName}'s mental defenses.`,
        `${enemyName}'s will proves too strong. The illusion disperses.`,
      ],
    },
    [ApproachType.ENVIRONMENTAL_TRAP]: {
      success: [
        `Your trap springs! ${enemyName} takes heavy damage from the terrain.`,
        `The environment becomes your weapon. ${enemyName} falls into your trap.`,
        `Using your surroundings, you catch ${enemyName} off guard.`,
      ],
      failure: [
        `${enemyName} notices the trap and sidesteps it easily.`,
        `Your trap fails to trigger. ${enemyName} remains unharmed.`,
        `The environment refuses to cooperate. Your trap misfires.`,
      ],
    },
    [ApproachType.IRON_GUARD]: {
      success: [
        `You harden your chakra into iron-like armor before facing ${enemyName}.`,
        `A shield of will forms around you as you meet ${enemyName}'s gaze.`,
        `Steadfast and ready, you brace against ${enemyName}'s opening blow.`,
      ],
      failure: [
        `Your guard wavers. ${enemyName} presses in before the armor solidifies.`,
        `The chakra shell cracks under pressure. You fight without its protection.`,
        `${enemyName} disrupts your stance — Iron Guard fails to hold.`,
      ],
    },
    [ApproachType.SHADOW_BYPASS]: {
      success: [
        `Like a shadow, you slip past ${enemyName} unnoticed.`,
        `Your Body Flicker is flawless. ${enemyName} never knew you were there.`,
        `You become one with the darkness, leaving ${enemyName} behind.`,
      ],
      failure: [
        `${enemyName} senses your chakra mid-technique! You're forced to engage.`,
        `Your Body Flicker falters at the critical moment. ${enemyName} blocks your path.`,
        `A flicker of movement catches ${enemyName}'s eye. Cover blown.`,
      ],
    },
  };

  const options = success ? descriptions[approach].success : descriptions[approach].failure;
  return pick(options) ?? options[0];
}

// ============================================================================
// APPLY APPROACH RESULTS
// ============================================================================

/**
 * Apply chakra and HP costs from an approach
 * Returns updated player state
 */
export function applyApproachCosts(
  player: Player,
  result: ApproachResult
): Player {
  return {
    ...player,
    currentChakra: Math.max(0, player.currentChakra - result.chakraCost),
    currentHp: Math.max(1, player.currentHp - result.hpCost),
  };
}

/**
 * Apply enemy HP reduction from approach
 * Returns updated enemy with reduced HP
 */
export function applyEnemyHpReduction(
  enemy: Enemy,
  result: ApproachResult
): Enemy {
  if (result.enemyHpReduction <= 0) return enemy;

  const hpLost = Math.floor(enemy.currentHp * result.enemyHpReduction);
  return {
    ...enemy,
    currentHp: Math.max(1, enemy.currentHp - hpLost),
  };
}

/**
 * Get combat modifiers from approach result
 * Used by CombatSystem to apply bonuses
 */
export interface CombatModifiers {
  playerGoesFirst: boolean;
  playerInitiativeBonus: number;
  firstHitMultiplier: number;
  playerBuffs: Buff[];
  enemyDebuffs: Buff[];
  xpMultiplier: number;
}

export function getCombatModifiers(result: ApproachResult): CombatModifiers {
  return {
    playerGoesFirst: result.guaranteedFirst,
    playerInitiativeBonus: result.initiativeBonus,
    firstHitMultiplier: result.firstHitMultiplier,
    playerBuffs: result.playerBuffs,
    enemyDebuffs: result.enemyDebuffs,
    xpMultiplier: result.xpMultiplier,
  };
}

// ============================================================================
// HELPER: CHECK IF APPROACH CAN BE USED
// ============================================================================

/**
 * Check if player has enough resources for an approach
 */
export function canAffordApproach(
  approach: ApproachType,
  player: Player
): { canAfford: boolean; reason?: string } {
  const def = APPROACH_DEFINITIONS[approach];
  const chakraCost = def.successEffects.chakraCost || 0;
  const hpCost = def.successEffects.hpCost || 0;

  if (player.currentChakra < chakraCost) {
    return {
      canAfford: false,
      reason: `Not enough chakra (need ${chakraCost}, have ${player.currentChakra})`,
    };
  }

  if (player.currentHp <= hpCost) {
    return {
      canAfford: false,
      reason: `Not enough HP (need ${hpCost + 1}, have ${player.currentHp})`,
    };
  }

  return { canAfford: true };
}
