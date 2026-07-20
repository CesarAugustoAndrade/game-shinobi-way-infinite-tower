/**
 * T-102: Apply room CombatActivity.modifiers using COMBAT_MODIFIER_EFFECTS.
 * Pure — merges into approach CombatModifiers + optional pre-combat heal.
 */

import {
  CombatModifierType,
  Player,
  EffectType,
} from '../types';
import {
  COMBAT_MODIFIER_EFFECTS,
  type CombatModifierEffect,
} from '../constants/roomTypes';
import type { CombatModifiers } from './ApproachSystem';
import { generateId } from './CombatCalculationSystem';
import type { Buff } from '../types';

export interface RoomCombatModifierResult {
  modifiers: CombatModifiers;
  player: Player;
  logs: string[];
  /** Human labels for non-NONE active mods */
  activeNames: string[];
  /**
   * T-103: player evasion bonus (e.g. TERRAIN_FOREST +0.15) for dodge stack.
   */
  playerEvasionBonus: number;
  /**
   * T-105: enemy first-turn damage mult (e.g. AMBUSH 1.25).
   */
  enemyFirstHitMultiplier: number;
  /** Environment hooks */
  environment: {
    poisonDamagePerTurn: number;
    fallDamageOnMiss: number;
  };
}

function emptyEnv() {
  return { poisonDamagePerTurn: 0, fallDamageOnMiss: 0 };
}

/**
 * Merge authored room combat modifiers into approach combat mods.
 * Approach guaranteedFirst still wins for who acts first if set.
 * First-hit multipliers multiply (stack). Initiative bonuses sum.
 */
export function applyRoomCombatModifiers(
  roomMods: CombatModifierType[] | null | undefined,
  approachMods: CombatModifiers,
  player: Player,
  maxHp: number,
): RoomCombatModifierResult {
  const mods = (roomMods ?? []).filter((m) => m !== CombatModifierType.NONE);
  if (mods.length === 0) {
    return {
      modifiers: approachMods,
      player,
      logs: [],
      activeNames: [],
      playerEvasionBonus: 0,
      enemyFirstHitMultiplier: 1,
      environment: emptyEnv(),
    };
  }

  let playerGoesFirst = approachMods.playerGoesFirst;
  let playerInitiativeBonus = approachMods.playerInitiativeBonus;
  let firstHitMultiplier = approachMods.firstHitMultiplier;
  let playerBuffs = [...approachMods.playerBuffs];
  const enemyDebuffs = [...approachMods.enemyDebuffs];
  const logs: string[] = [];
  const activeNames: string[] = [];
  const environment = emptyEnv();
  let playerEvasionBonus = 0;
  let enemyFirstHitMultiplier = 1;

  let currentHp = player.currentHp;
  let totalHeal = 0;

  for (const mod of mods) {
    const effect: CombatModifierEffect = COMBAT_MODIFIER_EFFECTS[mod];
    if (!effect) continue;
    activeNames.push(effect.name);

    const pe = effect.playerEffects;
    const ee = effect.enemyEffects;

    if (pe.initiativeModifier) {
      playerInitiativeBonus += pe.initiativeModifier;
    }
    if (ee.initiativeModifier && ee.initiativeModifier > 0) {
      // Enemy advantage unless approach already guaranteed first
      if (!approachMods.playerGoesFirst) {
        playerGoesFirst = false;
      }
      playerInitiativeBonus -= Math.min(ee.initiativeModifier, 30);
    }
    if (pe.damageMultiplierFirstTurn && pe.damageMultiplierFirstTurn !== 1) {
      firstHitMultiplier *= pe.damageMultiplierFirstTurn;
    }
    // T-105: AMBUSH enemy first-strike damage
    if (ee.damageMultiplierFirstTurn && ee.damageMultiplierFirstTurn !== 1) {
      enemyFirstHitMultiplier *= ee.damageMultiplierFirstTurn;
    }
    if (pe.healBeforeCombat && pe.healBeforeCombat > 0 && maxHp > 0) {
      const heal = Math.floor(maxHp * pe.healBeforeCombat);
      if (heal > 0) {
        const before = currentHp;
        currentHp = Math.min(maxHp, currentHp + heal);
        totalHeal += Math.max(0, currentHp - before);
      }
    }
    // T-103: FOREST cover evasion (+fraction, stacks with room terrain evasion)
    if (pe.evasionModifier) {
      playerEvasionBonus += pe.evasionModifier;
    }
    // SWAMP speed: map to initiative so it affects turn order (lightweight)
    if (pe.speedModifier) {
      playerInitiativeBonus += pe.speedModifier;
    }
    if (ee.speedModifier) {
      // Enemy also slowed — slightly favors player initiative
      playerInitiativeBonus += Math.abs(ee.speedModifier) * 0.25;
    }

    if (effect.environmentEffects?.poisonDamagePerTurn) {
      environment.poisonDamagePerTurn += effect.environmentEffects.poisonDamagePerTurn;
    }
    if (effect.environmentEffects?.fallDamageOnMiss) {
      environment.fallDamageOnMiss = Math.max(
        environment.fallDamageOnMiss,
        effect.environmentEffects.fallDamageOnMiss,
      );
    }
  }

  if (activeNames.length > 0) {
    logs.push(`Room condition: ${activeNames.join(' · ')}.`);
  }
  if (totalHeal > 0) {
    logs.push(`Sacred ground restores ${totalHeal} HP.`);
  }
  if (playerEvasionBonus !== 0) {
    logs.push(`Cover grants +${Math.round(playerEvasionBonus * 100)}% evasion.`);
  }
  if (enemyFirstHitMultiplier > 1) {
    logs.push(`Enemy opening strike ×${enemyFirstHitMultiplier.toFixed(2)}.`);
  }
  if (environment.fallDamageOnMiss > 0) {
    logs.push(`Cliff edge: miss risks a fall (${Math.round(environment.fallDamageOnMiss * 100)}% max HP).`);
  }
  if (environment.poisonDamagePerTurn > 0) {
    // Light-weight: apply a short poison buff marker so player sees corruption
    const poisonBuff: Buff = {
      id: generateId(),
      name: 'Corrupted Air',
      duration: 99,
      effect: {
        type: EffectType.POISON,
        duration: 99,
        value: environment.poisonDamagePerTurn,
        chance: 1,
      },
      source: 'room-modifier',
    };
    playerBuffs = [...playerBuffs, poisonBuff];
    logs.push(`Corruption seeps in (${environment.poisonDamagePerTurn} poison/tick).`);
  }

  const nextPlayer: Player =
    currentHp !== player.currentHp
      ? { ...player, currentHp }
      : player;

  return {
    modifiers: {
      playerGoesFirst,
      playerInitiativeBonus,
      firstHitMultiplier,
      playerBuffs,
      enemyDebuffs,
      xpMultiplier: approachMods.xpMultiplier,
    },
    player: nextPlayer,
    logs,
    activeNames,
    playerEvasionBonus,
    enemyFirstHitMultiplier,
    environment,
  };
}
