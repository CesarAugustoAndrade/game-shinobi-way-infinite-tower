/**
 * EncounterChainSystem — pure deferred victory transaction (F3)
 *
 * Separates accumulate vs commit so a heat-triggered second fight never
 * pays XP/Ryo/intel, heals, levels, or completes activities mid-chain.
 *
 * Death policy (explicit): if the player dies on fight 2, the uncommitted
 * buffer is forfeited (GAME_OVER). Fight-1 rewards are not banked on death.
 *
 * Zero React/DOM.
 */

import type { Item } from '../types';
import {
  eliteChainChance,
  isHeatChainEligibleEnemy,
  rollEliteChain,
} from './HeatSystem';

export type EncounterActivityKey = 'combat' | 'eliteChallenge';

/** One fight's reward slice (not yet applied to Player). */
export interface EncounterRewardSlice {
  expGain: number;
  ryoGain: number;
  intelGain: number;
  baseIntelGain: number;
  fogNote: string | null;
  ryoNote: string | null;
  lootPreviews: Item[];
  /** Approach XP mult for this fight only (elite chain fight 2 = 1.0). */
  xpMultiplier: number;
  enemyName: string;
  enemyTier: string;
  /** True when this stage is the heat ambush elite (not authored Elite Challenge). */
  isHeatChainElite: boolean;
}

export interface EncounterActivityPending {
  roomId: string;
  activityType: EncounterActivityKey;
  /** Which floor store owns the room */
  floorKind: 'branching' | 'location';
}

export interface EncounterChainState {
  stages: EncounterRewardSlice[];
  activity: EncounterActivityPending | null;
  /** True while waiting for fight 2 after fight 1 accumulate */
  awaitingSecondFight: boolean;
  /** Heat at roll time (for logs) */
  heatAtRoll: number;
}

export interface MergedEncounterRewards {
  expGain: number;
  ryoGain: number;
  intelGain: number;
  baseIntelGain: number;
  fogNote: string | null;
  ryoNote: string | null;
  lootPreviews: Item[];
  stages: number;
  enemyNames: string[];
}

export function createEmptyEncounterChain(): EncounterChainState {
  return {
    stages: [],
    activity: null,
    awaitingSecondFight: false,
    heatAtRoll: 0,
  };
}

export function accumulateEncounterStage(
  chain: EncounterChainState,
  slice: EncounterRewardSlice,
  activity?: EncounterActivityPending | null,
): EncounterChainState {
  return {
    ...chain,
    stages: [...chain.stages, slice],
    activity: activity ?? chain.activity,
  };
}

export function markAwaitingSecondFight(
  chain: EncounterChainState,
  heatAtRoll: number,
): EncounterChainState {
  return {
    ...chain,
    awaitingSecondFight: true,
    heatAtRoll,
  };
}

export function mergeEncounterRewards(chain: EncounterChainState): MergedEncounterRewards {
  let expGain = 0;
  let ryoGain = 0;
  let intelGain = 0;
  let baseIntelGain = 0;
  let fogNote: string | null = null;
  let ryoNote: string | null = null;
  const lootPreviews: Item[] = [];
  const enemyNames: string[] = [];

  for (const s of chain.stages) {
    expGain += s.expGain;
    ryoGain += s.ryoGain;
    intelGain += s.intelGain;
    baseIntelGain += s.baseIntelGain;
    if (s.fogNote) fogNote = s.fogNote;
    if (s.ryoNote) ryoNote = s.ryoNote;
    lootPreviews.push(...s.lootPreviews);
    enemyNames.push(s.enemyName);
  }

  return {
    expGain,
    ryoGain,
    intelGain,
    baseIntelGain,
    fogNote,
    ryoNote,
    lootPreviews,
    stages: chain.stages.length,
    enemyNames,
  };
}

/**
 * Whether this Normal victory may roll a heat elite chain.
 * Excludes authored Elite Challenge (caller), Guardians, Hunters, bosses, tutorial flag.
 */
export function canRollHeatEliteChain(opts: {
  heat: number;
  enemy: { tier?: string; isBoss?: boolean; isHunter?: boolean };
  wasAuthoredEliteChallenge: boolean;
  isTutorial?: boolean;
  /** Already mid-chain — never triple-chain */
  alreadyInChain: boolean;
}): boolean {
  if (opts.alreadyInChain) return false;
  if (opts.wasAuthoredEliteChallenge) return false;
  if (opts.isTutorial) return false;
  if (!isHeatChainEligibleEnemy(opts.enemy)) return false;
  return eliteChainChance(opts.heat) > 0;
}

export function tryRollHeatEliteChain(
  heat: number,
  rng01?: number,
): boolean {
  return rollEliteChain(heat, rng01);
}

/** Public re-export for callers that only import this module. */
export { eliteChainChance, isHeatChainEligibleEnemy };
