/**
 * Event outcome effect handlers — pure, order-preserving pipeline.
 *
 * Each handler inspects one (or a related group of) effect key(s) on
 * `EventOutcome['effects']` and returns either the player unchanged or a
 * new player with that effect applied. Behavior matches the former
 * monolithic `applyOutcomeEffects` body in EventSystem.
 */

import {
  Player,
  EventOutcome,
  CharacterStats,
  TreasureQuality,
  MAX_MERCHANT_SLOTS,
  Buff,
  EffectType,
} from '../types';
import { SKILLS } from '../constants/skills';
import { pick, generateId } from '../utils/rng';

export type EventEffectHandler = (
  player: Player,
  effects: EventOutcome['effects'],
  playerStats: CharacterStats | any,
) => Player;

/** Apply primary-stat deltas; unknown keys skipped; floor at 1. */
const applyStatChanges: EventEffectHandler = (player, effects) => {
  if (!effects.statChanges) return player;

  const primaryStats = { ...player.primaryStats };
  for (const [stat, value] of Object.entries(effects.statChanges)) {
    if (typeof value !== 'number') continue;
    const key = stat as keyof typeof primaryStats;
    if (key in primaryStats && typeof primaryStats[key] === 'number') {
      primaryStats[key] = Math.max(1, primaryStats[key] + value);
    }
  }
  return { ...player, primaryStats };
};

/** Flat exp grant (truthy check — 0 is a no-op). */
const applyExp: EventEffectHandler = (player, effects) => {
  if (!effects.exp) return player;
  return { ...player, exp: player.exp + effects.exp };
};

/** Ryo grant/deduct; never go negative from event effects. */
const applyRyo: EventEffectHandler = (player, effects) => {
  if (!effects.ryo) return player;
  return { ...player, ryo: Math.max(0, player.ryo + effects.ryo) };
};

/** HP flat or % of max; floor 1, clamp to maxHp. */
const applyHpChange: EventEffectHandler = (player, effects, playerStats) => {
  if (!effects.hpChange) return player;

  let currentHp = player.currentHp;
  if (typeof effects.hpChange === 'number') {
    currentHp = Math.max(1, currentHp + effects.hpChange);
  } else if (effects.hpChange.percent) {
    const hpChange = Math.floor(playerStats.derived.maxHp * (effects.hpChange.percent / 100));
    currentHp = Math.max(1, currentHp + hpChange);
  }
  currentHp = Math.min(playerStats.derived.maxHp, currentHp);
  return { ...player, currentHp };
};

/** Chakra flat or % of max; floor 0, clamp to maxChakra. */
const applyChakraChange: EventEffectHandler = (player, effects, playerStats) => {
  if (!effects.chakraChange) return player;

  let currentChakra = player.currentChakra;
  if (typeof effects.chakraChange === 'number') {
    currentChakra = Math.max(0, currentChakra + effects.chakraChange);
  } else if (effects.chakraChange.percent) {
    const chakraChange = Math.floor(
      playerStats.derived.maxChakra * (effects.chakraChange.percent / 100),
    );
    currentChakra = Math.max(0, currentChakra + chakraChange);
  }
  currentChakra = Math.min(playerStats.derived.maxChakra, currentChakra);
  return { ...player, currentChakra };
};

/** Append buffs for combat system. */
const applyBuffs: EventEffectHandler = (player, effects) => {
  if (!effects.buffs) return player;
  return { ...player, activeBuffs: [...player.activeBuffs, ...effects.buffs] };
};

/** Upgrade treasure quality BROKEN → COMMON → RARE (RARE is no-op). */
const applyTreasureQuality: EventEffectHandler = (player, effects) => {
  if (!effects.upgradeTreasureQuality) return player;

  if (player.treasureQuality === TreasureQuality.BROKEN) {
    return { ...player, treasureQuality: TreasureQuality.COMMON };
  }
  if (player.treasureQuality === TreasureQuality.COMMON) {
    return { ...player, treasureQuality: TreasureQuality.RARE };
  }
  // Already at RARE - no change
  return player;
};

/** Add one merchant slot up to MAX_MERCHANT_SLOTS. */
const applyMerchantSlot: EventEffectHandler = (player, effects) => {
  if (!effects.addMerchantSlot || player.merchantSlots >= MAX_MERCHANT_SLOTS) {
    return player;
  }
  return { ...player, merchantSlots: player.merchantSlots + 1 };
};

/** Persist narrative flags for the run (immutable merge). */
const applySetFlags: EventEffectHandler = (player, effects) => {
  if (!effects.setFlags) return player;
  return {
    ...player,
    eventFlags: { ...(player.eventFlags ?? {}), ...effects.setFlags },
  };
};

/** Grant a skill by Skill.id; deduped by id. */
const applyGrantSkill: EventEffectHandler = (player, effects) => {
  if (!effects.grantSkillById) return player;

  const granted = Object.values(SKILLS).find((s) => s.id === effects.grantSkillById);
  if (granted && !player.skills.some((s) => s.id === granted.id)) {
    return { ...player, skills: [...player.skills, { ...granted, level: 1 }] };
  }
  return player;
};

/**
 * Brand the player with a curse: damage-amplification Buff (EffectType.CURSE)
 * stored in activeBuffs so the combat mitigation pipeline applies it.
 */
const applyCurse: EventEffectHandler = (player, effects) => {
  if (!effects.curse) return player;

  const value = effects.curse.value ?? 0.5;
  const duration = effects.curse.duration ?? 3;
  const curseBuff: Buff = {
    id: `event-curse-${generateId()}`,
    name: 'Cursed Mark',
    duration,
    effect: {
      type: EffectType.CURSE,
      value,
      duration,
      chance: 1,
    },
    source: 'event',
  };
  return { ...player, activeBuffs: [...player.activeBuffs, curseBuff] };
};

/** Remove one random bag item via game PRNG (immutable slot clear). */
const applyRemoveRandomItem: EventEffectHandler = (player, effects) => {
  if (!effects.removeRandomItem) return player;

  const filledIndices = player.bag.reduce<number[]>((acc, item, idx) => {
    if (item) acc.push(idx);
    return acc;
  }, []);
  if (filledIndices.length === 0) return player;

  const targetIndex = pick(filledIndices) ?? filledIndices[0];
  const bag = [...player.bag];
  bag[targetIndex] = null;
  return { ...player, bag };
};

/**
 * Registered effect handlers in application order.
 * Order matches the historical applyOutcomeEffects body.
 */
export const EVENT_EFFECT_HANDLERS: EventEffectHandler[] = [
  applyStatChanges,
  applyExp,
  applyRyo,
  applyHpChange,
  applyChakraChange,
  applyBuffs,
  applyTreasureQuality,
  applyMerchantSlot,
  applySetFlags,
  applyGrantSkill,
  applyCurse,
  applyRemoveRandomItem,
];

/**
 * Apply outcome effects to a player via the handler pipeline.
 * Returns a shallow-copied player with effects applied (same contract as before).
 */
export const applyOutcomeEffects = (
  player: Player,
  outcome: EventOutcome,
  playerStats: any, // DerivedStats / CharacterStats
): Player => {
  let updated = { ...player };
  const effects = outcome.effects;
  for (const handler of EVENT_EFFECT_HANDLERS) {
    updated = handler(updated, effects, playerStats);
  }
  return updated;
};
