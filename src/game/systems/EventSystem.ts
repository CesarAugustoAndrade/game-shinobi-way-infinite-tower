/**
 * =============================================================================
 * EVENT SYSTEM - Narrative Events & Choice Resolution
 * =============================================================================
 *
 * This system handles branching narrative events with player choices,
 * requirements, costs, and weighted random outcomes.
 *
 * ## EVENT STRUCTURE
 *
 * Events consist of:
 * 1. **Description**: Narrative text describing the situation
 * 2. **Choices**: Available player responses (may be restricted)
 * 3. **Outcomes**: Weighted random results for each choice
 * 4. **Effects**: Stat changes, items, buffs applied on resolution
 *
 * ## CHOICE VALIDATION
 *
 * Choices can have requirements and costs:
 *
 * ### Requirements (must be met to select)
 * - **minStat**: Minimum value for a primary stat
 * - **requiredClan**: Must be a specific clan
 *
 * ### Costs (deducted when choice is made)
 * - **ryo**: Currency cost
 *
 * ## OUTCOME ROLLING
 *
 * Each choice has weighted outcomes:
 * - Higher weight = more likely to occur
 * - Clan bonuses can reweight outcomes for matching clans
 *
 * Weighted roll algorithm:
 * 1. Sum all outcome weights
 * 2. Roll random value 0 to total
 * 3. Iterate outcomes, subtracting weights until roll ≤ 0
 * 4. Return that outcome
 *
 * ## OUTCOME EFFECTS
 *
 * Effects that can be applied:
 * - **statChanges**: Modify primary stats (+/-)
 * - **exp**: Grant experience points
 * - **ryo**: Grant/deduct currency
 * - **hpChange**: Heal/damage (flat or % of max)
 * - **chakraChange**: Restore/drain (flat or % of max)
 * - **buffs**: Apply temporary effects
 * - **triggerCombat**: Start a fight after event
 *
 * ## STORY ARC FILTERING
 *
 * Events can be restricted to specific story arcs:
 * - ACADEMY_ARC (floors 1-10)
 * - WAVES_ARC (floors 11-25)
 * - EXAMS_ARC (floors 26-50)
 * - ROGUE_ARC (floors 51-75)
 * - WAR_ARC (floors 76+)
 *
 * =============================================================================
 */

import {
  EventChoice,
  EventOutcome,
  Player,
  RequirementCheck,
  EventCost,
  PrimaryStat,
  GameEvent,
  CharacterStats,
  TreasureQuality,
  MAX_MERCHANT_SLOTS,
  Buff,
  EffectType,
  Rarity,
} from '../types';
import { SKILLS } from '../constants/skills';
import { EVENT_RARITY_WEIGHTS } from '../constants';
import { pick, generateId, random, type RandomGenerator } from '../utils/rng';

/**
 * Check if a player meets all requirements for an event choice.
 * Used to determine if a choice should be enabled or disabled.
 *
 * @param player - Current player state
 * @param requirements - Optional requirements to check
 * @param playerStats - Derived stats for HP/Chakra calculations
 * @returns true if all requirements are met
 */
export const checkRequirements = (
  player: Player,
  requirements: RequirementCheck | undefined,
  playerStats?: CharacterStats | null,
): boolean => {
  if (!requirements) return true;

  // Check stat requirement
  if (requirements.minStat) {
    const stat = requirements.minStat.stat;
    const requiredValue = requirements.minStat.value;
    const currentValue = player.primaryStats[stat.toLowerCase() as keyof typeof player.primaryStats];

    if (typeof currentValue !== 'number' || currentValue < requiredValue) {
      return false;
    }
  }

  // Check clan requirement
  if (requirements.requiredClan && player.clan !== requirements.requiredClan) {
    return false;
  }

  return true;
};

/**
 * Event Engine 2.0 (T-008) — flag gating.
 *
 * Flags live in `player.eventFlags` as counters (0 = unset/absent). A gate
 * passes when:
 *   - every `requiresFlags` entry is satisfied: flag value >= required value, and
 *   - no `excludesFlags` entry is satisfied: flag value < the excluded value.
 *
 * Undefined gates always pass, so existing events/choices are unaffected.
 */
export const checkEventFlags = (
  player: Player,
  requiresFlags?: Record<string, number>,
  excludesFlags?: Record<string, number>,
): boolean => {
  const flags = player.eventFlags ?? {};

  if (requiresFlags) {
    for (const [key, needed] of Object.entries(requiresFlags)) {
      if ((flags[key] ?? 0) < needed) return false;
    }
  }

  if (excludesFlags) {
    for (const [key, blocked] of Object.entries(excludesFlags)) {
      if ((flags[key] ?? 0) >= blocked) return false;
    }
  }

  return true;
};

/**
 * Whether an event is eligible for a player given its flag gating.
 */
export const isEventAvailableForPlayer = (event: GameEvent, player: Player): boolean =>
  checkEventFlags(player, event.requiresFlags, event.excludesFlags);

/**
 * Filter a pool of events down to those whose flag gating the player satisfies.
 */
export const getAvailableEventsForPlayer = (
  events: GameEvent[],
  player: Player,
): GameEvent[] => events.filter((event) => isEventAvailableForPlayer(event, player));

/**
 * Return only the choices of an event whose flag gating the player satisfies.
 * Requirement/cost gating is handled separately (choices stay visible but
 * disabled); flag gating removes the choice from the offering entirely.
 */
export const getAvailableChoices = (
  event: GameEvent,
  player: Player,
): EventChoice[] =>
  event.choices.filter((choice) =>
    checkEventFlags(player, choice.requiresFlags, choice.excludesFlags),
  );

/**
 * Check if a player can afford the cost of a choice
 */
export const checkEventCost = (
  player: Player,
  cost: EventCost | undefined,
): boolean => {
  if (!cost) return true;

  if (cost.ryo && player.ryo < cost.ryo) {
    return false;
  }

  return true;
};

/**
 * Get description of why a choice is disabled
 */
export const getDisabledReason = (
  player: Player,
  requirements: RequirementCheck | undefined,
  cost: EventCost | undefined,
  playerStats?: CharacterStats | null,
): string => {
  if (!requirements && !cost) return '';

  if (requirements) {
    if (requirements.minStat) {
      return `Requires ${requirements.minStat.value} ${requirements.minStat.stat}`;
    }

    if (requirements.requiredClan) {
      return `Clan restriction: ${requirements.requiredClan}`;
    }
  }

  if (cost) {
    if (cost.ryo && player.ryo < cost.ryo) {
      return `Not enough Ryo (Costs: ${cost.ryo}, Have: ${player.ryo})`;
    }
  }

  return 'Cannot perform this action';
};

/**
 * Roll an outcome from a choice's weighted outcomes.
 *
 * By convention a choice's outcome weights sum to 100, but the roll normalizes
 * by the actual total so any positive weights work. `player` is kept in the
 * signature for callers/future gating; the roll itself only depends on weights.
 *
 * Uses the project RNG (`utils/rng`) so runs are seedable/reproducible.
 * Pass an optional `rng` for deterministic tests; defaults to the global RNG.
 */
export const rollOutcome = (
  choice: EventChoice,
  _player: Player,
  rng?: RandomGenerator,
): EventOutcome => {
  const outcomes = choice.outcomes;

  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
  let roll = random(rng) * totalWeight;

  for (const outcome of outcomes) {
    roll -= outcome.weight;
    if (roll <= 0) {
      return outcome;
    }
  }

  // Fallback to last outcome (shouldn't happen if weights are correct)
  return outcomes[outcomes.length - 1];
};

/**
 * Relative selection weight of an event, driven by its rarity (T-016). Events
 * without an explicit rarity fall back to the COMMON weight so legacy content is
 * unaffected. Pure lookup into EVENT_RARITY_WEIGHTS (balance data in constants).
 */
export const getEventSelectionWeight = (event: GameEvent): number =>
  EVENT_RARITY_WEIGHTS[event.rarity ?? Rarity.COMMON] ??
  EVENT_RARITY_WEIGHTS[Rarity.COMMON];

/**
 * Pick one event from a pool, weighted by rarity (T-016). The caller supplies
 * the random roll in [0, 1) so selection stays pure and unit-testable; rarer
 * events surface proportionally less often. Returns undefined for an empty pool.
 */
export const selectWeightedEvent = (
  events: GameEvent[],
  roll: number,
): GameEvent | undefined => {
  if (events.length === 0) return undefined;

  const totalWeight = events.reduce((sum, e) => sum + getEventSelectionWeight(e), 0);
  let cursor = roll * totalWeight;

  for (const event of events) {
    cursor -= getEventSelectionWeight(event);
    if (cursor < 0) return event;
  }

  // Fallback to last event (guards against floating-point roll === total).
  return events[events.length - 1];
};

/**
 * Apply outcome effects to a player
 * Returns updated player or null if validation fails
 */
export const applyOutcomeEffects = (
  player: Player,
  outcome: EventOutcome,
  playerStats: any, // DerivedStats
): Player => {
  let updated = { ...player };
  const effects = outcome.effects;

  // Apply stat changes (only known primary attributes — skip typos / garbage keys)
  if (effects.statChanges) {
    updated.primaryStats = { ...updated.primaryStats };
    for (const [stat, value] of Object.entries(effects.statChanges)) {
      if (typeof value !== 'number') continue;
      const key = stat as keyof typeof updated.primaryStats;
      if (key in updated.primaryStats && typeof updated.primaryStats[key] === 'number') {
        updated.primaryStats[key] = Math.max(1, updated.primaryStats[key] + value);
      }
    }
  }

  // Apply XP
  if (effects.exp) {
    updated.exp += effects.exp;
  }

  // Apply Ryo (never go negative from event effects)
  if (effects.ryo) {
    updated.ryo = Math.max(0, updated.ryo + effects.ryo);
  }

  // Apply HP changes
  if (effects.hpChange) {
    if (typeof effects.hpChange === 'number') {
      updated.currentHp = Math.max(1, updated.currentHp + effects.hpChange);
    } else if (effects.hpChange.percent) {
      const hpChange = Math.floor(playerStats.derived.maxHp * (effects.hpChange.percent / 100));
      updated.currentHp = Math.max(1, updated.currentHp + hpChange);
    }
    updated.currentHp = Math.min(playerStats.derived.maxHp, updated.currentHp);
  }

  // Apply Chakra changes
  if (effects.chakraChange) {
    if (typeof effects.chakraChange === 'number') {
      updated.currentChakra = Math.max(0, updated.currentChakra + effects.chakraChange);
    } else if (effects.chakraChange.percent) {
      const chakraChange = Math.floor(
        playerStats.derived.maxChakra * (effects.chakraChange.percent / 100),
      );
      updated.currentChakra = Math.max(0, updated.currentChakra + chakraChange);
    }
    updated.currentChakra = Math.min(playerStats.derived.maxChakra, updated.currentChakra);
  }

  // Apply buffs (store for combat system)
  if (effects.buffs) {
    updated.activeBuffs = [...updated.activeBuffs, ...effects.buffs];
  }

  // Upgrade treasure quality (BROKEN → COMMON → RARE)
  if (effects.upgradeTreasureQuality) {
    if (updated.treasureQuality === TreasureQuality.BROKEN) {
      updated.treasureQuality = TreasureQuality.COMMON;
    } else if (updated.treasureQuality === TreasureQuality.COMMON) {
      updated.treasureQuality = TreasureQuality.RARE;
    }
    // Already at RARE - no change (alternative reward should be given)
  }

  // Add merchant slot (up to MAX_MERCHANT_SLOTS)
  if (effects.addMerchantSlot && updated.merchantSlots < MAX_MERCHANT_SLOTS) {
    updated.merchantSlots += 1;
  }

  // --- Event Engine 2.0 (T-008) effects ---

  // Persist narrative flags for the run (immutable merge into eventFlags).
  if (effects.setFlags) {
    updated.eventFlags = { ...(updated.eventFlags ?? {}), ...effects.setFlags };
  }

  // Grant a skill by its Skill.id (from the SKILLS table). Deduped by id so a
  // repeat grant is a no-op rather than a duplicate loadout entry.
  if (effects.grantSkillById) {
    const granted = Object.values(SKILLS).find((s) => s.id === effects.grantSkillById);
    if (granted && !updated.skills.some((s) => s.id === granted.id)) {
      updated.skills = [...updated.skills, { ...granted, level: 1 }];
    }
  }

  // Brand the player with a curse: a damage-amplification Buff (EffectType.CURSE)
  // stored in activeBuffs so the existing combat mitigation pipeline applies it.
  if (effects.curse) {
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
    updated.activeBuffs = [...updated.activeBuffs, curseBuff];
  }

  // Remove one random item from the bag using the game PRNG (immutable slot clear).
  if (effects.removeRandomItem) {
    const filledIndices = updated.bag.reduce<number[]>((acc, item, idx) => {
      if (item) acc.push(idx);
      return acc;
    }, []);
    if (filledIndices.length > 0) {
      const targetIndex = pick(filledIndices) ?? filledIndices[0];
      updated.bag = [...updated.bag];
      updated.bag[targetIndex] = null;
    }
  }

  return updated;
};

/**
 * Resolve a complete event choice
 * Returns { player, outcome, message, triggerCombat? }
 */
export const resolveEventChoice = (
  player: Player,
  choice: EventChoice,
  playerStats: any,
): {
  success: boolean;
  player: Player | null;
  outcome: EventOutcome | null;
  message: string;
  triggerCombat?: boolean;
  /** T-008: id of the next event to open when the outcome chains (effects.chainTo). */
  nextEventId?: string;
} => {
  // Check flag gating (T-008) — a flag-locked choice cannot be resolved.
  if (!checkEventFlags(player, choice.requiresFlags, choice.excludesFlags)) {
    return {
      success: false,
      player: null,
      outcome: null,
      message: 'This path is not available to you.',
    };
  }

  // Check requirements
  if (!checkRequirements(player, choice.requirements, playerStats)) {
    return {
      success: false,
      player: null,
      outcome: null,
      message: getDisabledReason(player, choice.requirements, choice.costs, playerStats),
    };
  }

  // Check cost
  if (!checkEventCost(player, choice.costs)) {
    return {
      success: false,
      player: null,
      outcome: null,
      message: getDisabledReason(player, choice.requirements, choice.costs, playerStats),
    };
  }

  // Apply costs first
  let updated = { ...player };
  if (choice.costs) {
    if (choice.costs.ryo) {
      updated.ryo = Math.max(0, updated.ryo - choice.costs.ryo);
    }
  }

  // Roll outcome
  const outcome = rollOutcome(choice, updated);

  // Apply outcome effects
  updated = applyOutcomeEffects(updated, outcome, playerStats);

  return {
    success: true,
    player: updated,
    outcome,
    message: outcome.effects.logMessage,
    triggerCombat: !!outcome.effects.triggerCombat,
    nextEventId: outcome.effects.chainTo,
  };
};

/**
 * Check if an event is valid for a story arc
 */
export const isEventValidForArc = (event: GameEvent, arcName: string): boolean => {
  if (!event.allowedArcs || event.allowedArcs.length === 0) {
    return true; // No restrictions
  }

  return event.allowedArcs.includes(arcName);
};

/**
 * Filter events by arc
 */
export const getEventsForArc = (
  allEvents: GameEvent[],
  arcName: string,
): GameEvent[] => {
  return allEvents.filter((event) => isEventValidForArc(event, arcName));
};

// ============================================================================
// RUN FLAG → COMBAT / LOOT (T-034)
// ============================================================================

/**
 * Mechanical run modifiers derived from narrative eventFlags.
 * Pure; stacks additively for damage, multiplicatively for ryo.
 */
export interface EventFlagRunModifiers {
  /** Additive damage mult (0.05 = +5% damage). */
  damageBonus: number;
  /** Multiplier on combat ryo rewards (1.1 = +10%). */
  ryoMultiplier: number;
  /** Short labels for optional UI/log (which flags are active). */
  activeLabels: string[];
}

/**
 * Map known story flags to combat/loot bonuses so event choices matter beyond gating.
 */
export function getEventFlagRunModifiers(player: {
  eventFlags?: Record<string, number>;
}): EventFlagRunModifiers {
  const f = player.eventFlags ?? {};
  let damageBonus = 0;
  let ryoMultiplier = 1;
  const activeLabels: string[] = [];

  // T-037: labels are player-facing (HUD chips), not raw flag keys
  if ((f.envoy_freed ?? 0) > 0) {
    ryoMultiplier *= 1.1;
    activeLabels.push('Envoy bond +10% Ryō');
  }
  if ((f.envoy_debt_settled ?? 0) > 0) {
    damageBonus += 0.05;
    activeLabels.push('Debt settled +5% DMG');
  }
  if ((f.subject_harvested ?? 0) > 0) {
    damageBonus += 0.08;
    activeLabels.push('Harvested power +8% DMG');
  }
  if ((f.subject_freed ?? 0) > 0) {
    ryoMultiplier *= 1.05;
    activeLabels.push('Mercy karma +5% Ryō');
  }
  if ((f.sunken_ship_discovered ?? 0) > 0 || (f.hidden_cove_discovered ?? 0) > 0) {
    ryoMultiplier *= 1.05;
    activeLabels.push('Secret intel +5% Ryō');
  }

  return { damageBonus, ryoMultiplier, activeLabels };
}
