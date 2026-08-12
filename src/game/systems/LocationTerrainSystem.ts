/**
 * =============================================================================
 * LOCATION TERRAIN EFFECTS (T-063)
 * =============================================================================
 *
 * Pure helpers that resolve Location.terrainEffects (authored region data) into
 * combat/approach modifiers. Room TerrainDefinition remains a separate layer.
 *
 * Wired types (T-063..T-066):
 *   water/fire/mental dmg, stealth, enemy def/atk, ambush,
 *   poison_hazard, fall_hazard, chakra_drain, evasion_bonus
 *
 * Wired: combat dmg/stealth/ambush/hazards/evasion + T-067 movement/visibility.
 */

import {
  DamageType,
  ElementType,
  LocationTerrainEffect,
  Player,
  Skill,
  TerrainDefinition,
} from '../types';
import { chance } from '../utils/rng';
import { getHazardLabel } from '../constants/terrain';

/** Aggregated location terrain mods (fractions unless noted). */
export interface LocationTerrainMods {
  waterDamageBonus: number;
  fireDamagePenalty: number;
  mentalDamageBonus: number;
  /** Fraction; convert *100 for approach stealth points */
  stealthBonus: number;
  enemyDefenseBonus: number;
  enemyAttackBonus: number;
  ambushChance: number;
  /** T-066: end-of-turn player HP hazards (fraction of maxHp) */
  poisonHazard: number;
  fallHazard: number;
  /** T-066: chance-weighted chakra drain (fraction of maxChakra) */
  chakraDrain: number;
  /** T-066: additive player evade chance vs enemy attacks */
  evasionBonus: number;
  /** T-067: reduces combat max AP (fraction of budget) */
  movementPenalty: number;
  /**
   * T-067: visibility (usually negative). Multiplies intel gains as (1 + value).
   * e.g. -0.2 → 80% intel from activities.
   */
  visibilityPenalty: number;
}

export function emptyLocationTerrainMods(): LocationTerrainMods {
  return {
    waterDamageBonus: 0,
    fireDamagePenalty: 0,
    mentalDamageBonus: 0,
    stealthBonus: 0,
    enemyDefenseBonus: 0,
    enemyAttackBonus: 0,
    ambushChance: 0,
    poisonHazard: 0,
    fallHazard: 0,
    chakraDrain: 0,
    evasionBonus: 0,
    movementPenalty: 0,
    visibilityPenalty: 0,
  };
}

/**
 * Sum location terrain effect values by type.
 * Unknown types are ignored (forward-compatible).
 */
export function getLocationTerrainMods(
  effects: LocationTerrainEffect[] | null | undefined,
): LocationTerrainMods {
  const m = emptyLocationTerrainMods();
  if (!effects || effects.length === 0) return m;

  for (const e of effects) {
    if (!e || typeof e.value !== 'number') continue;
    switch (e.type) {
      case 'water_damage_bonus':
        m.waterDamageBonus += e.value;
        break;
      case 'fire_damage_penalty':
        m.fireDamagePenalty += e.value;
        break;
      case 'mental_damage_bonus':
        m.mentalDamageBonus += e.value;
        break;
      case 'stealth_bonus':
        m.stealthBonus += e.value;
        break;
      case 'enemy_defense_bonus':
        m.enemyDefenseBonus += e.value;
        break;
      case 'enemy_attack_bonus':
        m.enemyAttackBonus += e.value;
        break;
      case 'ambush_chance':
        m.ambushChance += e.value;
        break;
      case 'poison_hazard':
        m.poisonHazard += e.value;
        break;
      case 'fall_hazard':
        m.fallHazard += e.value;
        break;
      case 'chakra_drain':
        m.chakraDrain += e.value;
        break;
      case 'evasion_bonus':
        m.evasionBonus += e.value;
        break;
      case 'movement_penalty':
        m.movementPenalty += e.value;
        break;
      case 'visibility_penalty':
        m.visibilityPenalty += e.value;
        break;
      default:
        break;
    }
  }
  return m;
}

/**
 * T-067: reduce combat AP budget by movement_penalty (min 1 AP).
 */
export function applyMovementPenaltyToMaxAp(
  maxAp: number,
  mods: LocationTerrainMods | null | undefined,
): number {
  if (!mods || mods.movementPenalty <= 0 || maxAp <= 1) return maxAp;
  const reduced = Math.floor(maxAp * (1 - mods.movementPenalty));
  return Math.max(1, reduced);
}

/**
 * T-067: scale intel gain by visibility (1 + visibilityPenalty).
 * Negative penalty reduces gain; floored at 1 if base gain > 0.
 */
export function applyVisibilityToIntelGain(
  baseGain: number,
  mods: LocationTerrainMods | null | undefined,
): number {
  if (!mods || mods.visibilityPenalty === 0 || baseGain <= 0) return baseGain;
  const scaled = Math.floor(baseGain * (1 + mods.visibilityPenalty));
  return Math.max(1, scaled);
}

/** Approach stealth points from location (fraction 0.15 → 15). */
export function locationStealthBonusPoints(mods: LocationTerrainMods): number {
  return Math.round(mods.stealthBonus * 100);
}

/**
 * Multiplier for player outgoing skill damage from location terrain.
 * fire_damage_penalty values are already negative fractions.
 */
export function skillLocationDamageMult(
  skill: Skill,
  mods: LocationTerrainMods | null | undefined,
): number {
  if (!mods) return 1;
  let mult = 1;
  if (skill.element === ElementType.WATER && mods.waterDamageBonus !== 0) {
    mult *= 1 + mods.waterDamageBonus;
  }
  if (skill.element === ElementType.FIRE && mods.fireDamagePenalty !== 0) {
    mult *= 1 + mods.fireDamagePenalty;
  }
  if (
    (skill.damageType === DamageType.MENTAL || skill.element === ElementType.MENTAL) &&
    mods.mentalDamageBonus !== 0
  ) {
    mult *= 1 + mods.mentalDamageBonus;
  }
  return Math.max(0, mult);
}

/**
 * Apply enemy_defense_bonus as damage reduction for player → enemy hits.
 * Uses ×(1 - bonus) clamped so 0.2 → 80% damage dealt.
 */
export function applyEnemyDefenseBonus(
  damage: number,
  mods: LocationTerrainMods | null | undefined,
): number {
  if (!mods || mods.enemyDefenseBonus === 0) return damage;
  const mult = Math.max(0.25, 1 - mods.enemyDefenseBonus);
  return Math.floor(damage * mult);
}

/**
 * T-066: end-of-turn location hazards on the player (poison/fall HP, chakra drain).
 * Trigger chance ~35% per active hazard type when value > 0.
 * HP damage floors at 1 remaining (not a full kill without guts elsewhere).
 */
export function applyLocationHazardsToPlayer(
  player: Player,
  maxHp: number,
  maxChakra: number,
  mods: LocationTerrainMods | null | undefined,
): { player: Player; logs: string[] } {
  if (!mods) return { player, logs: [] };
  let currentHp = player.currentHp;
  let currentChakra = player.currentChakra;
  const logs: string[] = [];

  const tryHpHazard = (value: number, label: string) => {
    if (value <= 0) return;
    if (!chance(0.35)) return;
    const dmg = Math.max(1, Math.floor(maxHp * value));
    currentHp = Math.max(1, currentHp - dmg);
    logs.push(`You were ${label} for ${dmg} damage!`);
  };

  tryHpHazard(mods.poisonHazard, 'poisoned by toxic miasma');
  tryHpHazard(mods.fallHazard, 'hit by falling debris');

  if (mods.chakraDrain > 0 && chance(0.4)) {
    const drain = Math.max(1, Math.floor(maxChakra * mods.chakraDrain));
    const next = Math.max(0, currentChakra - drain);
    if (next < currentChakra) {
      currentChakra = next;
      logs.push(`The terrain drains ${drain} chakra!`);
    }
  }

  if (logs.length === 0) return { player, logs: [] };
  return {
    player: { ...player, currentHp, currentChakra },
    logs,
  };
}

/** Human-readable short labels for FULL intel UI (optional). */
export function formatLocationTerrainEffectLines(
  effects: LocationTerrainEffect[] | null | undefined,
): string[] {
  if (!effects || effects.length === 0) return [];
  return effects.map((e) => {
    const pct = Math.round(e.value * 100);
    const sign = pct > 0 ? `+${pct}%` : `${pct}%`;
    switch (e.type) {
      case 'water_damage_bonus':
        return `Water dmg ${sign}`;
      case 'fire_damage_penalty':
        return `Fire dmg ${sign}`;
      case 'mental_damage_bonus':
        return `Mental dmg ${sign}`;
      case 'stealth_bonus':
        return `Stealth ${sign}`;
      case 'enemy_defense_bonus':
        return `Enemy def ${sign}`;
      case 'enemy_attack_bonus':
        return `Enemy atk ${sign}`;
      case 'ambush_chance':
        return `Ambush ${sign}`;
      case 'poison_hazard':
        return `Poison hazard ${sign}`;
      case 'fall_hazard':
        return `Fall hazard ${sign}`;
      case 'chakra_drain':
        return `Chakra drain ${sign}`;
      case 'evasion_bonus':
        return `Evasion ${sign}`;
      case 'movement_penalty':
        return `Movement ${sign}`;
      case 'visibility_penalty':
        return `Visibility ${sign}`;
      default:
        return `${e.type.replace(/_/g, ' ')} ${sign}`;
    }
  });
}

/**
 * T-079: short labels for room TerrainDefinition combat effects
 * (evasion, element amp, initiative, hazard) — parity with ApproachSelector.
 */
export function formatRoomTerrainEffectLines(
  terrain: TerrainDefinition | null | undefined,
): string[] {
  if (!terrain) return [];
  const e = terrain.effects;
  const lines: string[] = [];
  if (e.evasionModifier) {
    const pct = Math.round(e.evasionModifier * 100);
    lines.push(`Room evade ${pct > 0 ? '+' : ''}${pct}%`);
  }
  if (e.initiativeModifier) {
    lines.push(
      `Init ${e.initiativeModifier > 0 ? '+' : ''}${e.initiativeModifier}`,
    );
  }
  if (e.elementAmplify) {
    // Authoring uses percent points (25 = +25%), same as getTerrainElementAmplification
    const raw = e.elementAmplifyPercent ?? 25;
    const shown = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
    lines.push(`${e.elementAmplify} +${shown}%`);
  }
  if (e.hazard) {
    lines.push(`${getHazardLabel(e.hazard.type)} hazard`);
  }
  if (e.stealthModifier) {
    lines.push(`Stealth ${e.stealthModifier > 0 ? '+' : ''}${e.stealthModifier}%`);
  }
  // T-083: movementCost is live combat AP footing (T-082)
  if (e.movementCost && e.movementCost !== 1) {
    lines.push(`Pace ×${e.movementCost.toFixed(1)}`);
  }
  return lines;
}

/**
 * T-080: how many map levels ahead the player can see from current room terrain.
 * Authored as 1–3 on TerrainEffects; default 2 matches historical always-show-grandchildren.
 */
export function getRoomVisibilityRange(
  terrain: TerrainDefinition | null | undefined,
): number {
  if (!terrain) return 2;
  const v = terrain.effects.visibilityRange;
  if (typeof v !== 'number' || Number.isNaN(v)) return 2;
  return Math.max(1, Math.min(3, Math.floor(v)));
}

/**
 * T-081: hiddenRoomBonus as fraction for exit discovery rolls (authored as percent points).
 * e.g. 20 → +0.20 absolute on exit probability. Clamped ±0.35 so it cannot force 100% exits.
 */
export function getRoomHiddenRoomBonus(
  terrain: TerrainDefinition | null | undefined,
): number {
  if (!terrain) return 0;
  const raw = terrain.effects.hiddenRoomBonus;
  if (typeof raw !== 'number' || Number.isNaN(raw)) return 0;
  // Authoring is percent points (0–40 typical); convert to 0–1 fraction
  const fraction = raw > 1 || raw < -1 ? raw / 100 : raw;
  return Math.max(-0.35, Math.min(0.35, fraction));
}

/**
 * T-082: room movementCost multiplier (authored 0.8–1.5). Default 1.0.
 * Higher cost = slower footing → less combat AP. Never blocks movement.
 */
export function getRoomMovementCost(
  terrain: TerrainDefinition | null | undefined,
): number {
  if (!terrain) return 1;
  const raw = terrain.effects.movementCost;
  if (typeof raw !== 'number' || Number.isNaN(raw) || raw <= 0) return 1;
  return Math.max(0.8, Math.min(1.5, raw));
}

/**
 * T-082: apply room movementCost to max AP budget.
 * maxAp' = max(1, round(maxAp / cost)). cost 1.0 → no change; 1.5 → lower; 0.8 → higher.
 */
export function applyRoomMovementCostToMaxAp(
  maxAp: number,
  terrain: TerrainDefinition | null | undefined,
): number {
  if (maxAp <= 1) return Math.max(1, maxAp);
  const cost = getRoomMovementCost(terrain);
  if (cost === 1) return maxAp;
  return Math.max(1, Math.round(maxAp / cost));
}
