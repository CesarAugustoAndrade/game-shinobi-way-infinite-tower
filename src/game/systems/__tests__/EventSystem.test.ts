/**
 * EventSystem Unit Tests
 * Tests requirement checking, cost validation, outcome rolling, and effect application
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  checkRequirements,
  checkEventCost,
  rollOutcome,
  applyOutcomeEffects,
  isEventValidForArc,
  getEventsForArc,
  checkEventFlags,
  isEventAvailableForPlayer,
  getAvailableEventsForPlayer,
  getAvailableChoices,
  resolveEventChoice,
  getEventSelectionWeight,
  selectWeightedEvent,
  getEventFlagRunModifiers,
} from '../EventSystem';
import { calculateDerivedStats } from '../StatSystem';
import { Clan, PrimaryStat, EffectType, GameEvent, EventChoice, Rarity } from '../../types';
import { SKILLS } from '../../constants/skills';
import { EVENT_RARITY_WEIGHTS, EVENTS } from '../../constants';
import { createMockPlayer, createMockComponent, BASE_STATS } from './testFixtures';
import { createSeededRng, resetGlobalRng, setGlobalRng } from '../../utils/rng';

describe('checkRequirements', () => {
  const player = createMockPlayer();
  const derived = calculateDerivedStats(player.primaryStats, {});
  const playerStats = {
    primary: player.primaryStats,
    effectivePrimary: player.primaryStats,
    derived,
  };

  it('returns true when no requirements', () => {
    expect(checkRequirements(player, undefined, playerStats)).toBe(true);
  });

  it('returns true when stat requirement met', () => {
    const requirements = {
      minStat: { stat: PrimaryStat.STRENGTH, value: 2 },
    };
    expect(checkRequirements(player, requirements, playerStats)).toBe(true);
  });

  it('returns false when stat requirement not met', () => {
    const requirements = {
      minStat: { stat: PrimaryStat.STRENGTH, value: 9 },
    };
    expect(checkRequirements(player, requirements, playerStats)).toBe(false);
  });

  it('returns true when clan requirement met', () => {
    const uzumakiPlayer = createMockPlayer({ clan: Clan.UZUMAKI });
    const requirements = {
      requiredClan: Clan.UZUMAKI,
    };
    expect(checkRequirements(uzumakiPlayer, requirements, playerStats)).toBe(true);
  });

  it('returns false when clan requirement not met', () => {
    const uzumakiPlayer = createMockPlayer({ clan: Clan.UZUMAKI });
    const requirements = {
      requiredClan: Clan.UCHIHA,
    };
    expect(checkRequirements(uzumakiPlayer, requirements, playerStats)).toBe(false);
  });
});

describe('checkEventCost', () => {
  it('returns true when no cost', () => {
    const player = createMockPlayer();
    expect(checkEventCost(player, undefined)).toBe(true);
  });

  it('returns true when player has enough ryo', () => {
    const player = createMockPlayer({ ryo: 100 });
    const cost = { ryo: 50 };
    expect(checkEventCost(player, cost)).toBe(true);
  });

  it('returns false when player lacks ryo', () => {
    const player = createMockPlayer({ ryo: 10 });
    const cost = { ryo: 50 };
    expect(checkEventCost(player, cost)).toBe(false);
  });
});

describe('rollOutcome', () => {
  afterEach(() => {
    resetGlobalRng();
  });

  it('returns an outcome from the choice', () => {
    const player = createMockPlayer();
    const choice = {
      outcomes: [
        { weight: 50, effects: { logMessage: 'Outcome 1' } },
        { weight: 50, effects: { logMessage: 'Outcome 2' } },
      ],
    } as any;

    const outcome = rollOutcome(choice, player);

    expect(outcome).toBeDefined();
    expect(outcome.effects).toBeDefined();
    expect(['Outcome 1', 'Outcome 2']).toContain(outcome.effects.logMessage);
  });

  it('respects weights (higher weight more likely)', () => {
    const player = createMockPlayer();
    const choice = {
      outcomes: [
        { weight: 99, effects: { logMessage: 'Common' } },
        { weight: 1, effects: { logMessage: 'Rare' } },
      ],
    } as any;

    // Roll many times and count outcomes
    let commonCount = 0;
    for (let i = 0; i < 100; i++) {
      const outcome = rollOutcome(choice, player);
      if (outcome.effects.logMessage === 'Common') commonCount++;
    }

    // Common should be rolled most of the time
    expect(commonCount).toBeGreaterThan(80);
  });

  it('handles non-100 total weights by normalizing over the actual total', () => {
    const player = createMockPlayer();
    const choice = {
      outcomes: [
        { weight: 30, effects: { logMessage: 'A' } },
        { weight: 10, effects: { logMessage: 'B' } },
      ],
    } as any;

    // Every roll must land on a real outcome despite weights summing to 40.
    for (let i = 0; i < 50; i++) {
      const outcome = rollOutcome(choice, player);
      expect(['A', 'B']).toContain(outcome.effects.logMessage);
    }
  });

  it('reproduces the same outcome sequence with a fixed seed (injectable rng)', () => {
    const player = createMockPlayer();
    const choice = {
      outcomes: [
        { weight: 50, effects: { logMessage: 'A' } },
        { weight: 50, effects: { logMessage: 'B' } },
      ],
    } as any;

    const seed = 42_001;
    const runWithSeed = (s: number) => {
      const rng = createSeededRng(s);
      return Array.from({ length: 20 }, () =>
        rollOutcome(choice, player, rng).effects.logMessage
      );
    };
    const firstRun = runWithSeed(seed);
    const secondRun = runWithSeed(seed);

    expect(firstRun).toEqual(secondRun);
    // Both outcomes should appear across a non-trivial sample (seed not degenerate)
    expect(new Set(firstRun).size).toBeGreaterThan(1);
  });

  it('uses the global seeded rng when no rng is passed', () => {
    const player = createMockPlayer();
    const choice = {
      outcomes: [
        { weight: 50, effects: { logMessage: 'A' } },
        { weight: 50, effects: { logMessage: 'B' } },
      ],
    } as any;

    setGlobalRng(createSeededRng(99_001));
    const a = rollOutcome(choice, player).effects.logMessage;
    setGlobalRng(createSeededRng(99_001));
    const b = rollOutcome(choice, player).effects.logMessage;
    expect(a).toBe(b);
  });
});

describe('rarity-weighted event selection (T-016)', () => {
  const makeEvent = (id: string, rarity?: Rarity): GameEvent => ({
    id,
    title: id,
    description: '',
    rarity,
    choices: [],
  });

  it('weights an event by its rarity, defaulting missing rarity to COMMON', () => {
    expect(getEventSelectionWeight(makeEvent('a', Rarity.COMMON))).toBe(
      EVENT_RARITY_WEIGHTS[Rarity.COMMON],
    );
    expect(getEventSelectionWeight(makeEvent('b', Rarity.EPIC))).toBe(
      EVENT_RARITY_WEIGHTS[Rarity.EPIC],
    );
    // No rarity → treated as COMMON so legacy content is unaffected.
    expect(getEventSelectionWeight(makeEvent('c'))).toBe(
      EVENT_RARITY_WEIGHTS[Rarity.COMMON],
    );
  });

  it('returns undefined for an empty pool', () => {
    expect(selectWeightedEvent([], 0.5)).toBeUndefined();
  });

  it('selects deterministically from the roll, respecting cumulative weights', () => {
    // COMMON weight 100 then RARE weight 45 → total 145.
    const common = makeEvent('common', Rarity.COMMON);
    const rare = makeEvent('rare', Rarity.RARE);
    const pool = [common, rare];

    // roll * 145: 0 lands in the first (common) band, 0.99 in the tail (rare).
    expect(selectWeightedEvent(pool, 0)?.id).toBe('common');
    expect(selectWeightedEvent(pool, 0.5)?.id).toBe('common'); // 72.5 < 100
    expect(selectWeightedEvent(pool, 0.99)?.id).toBe('rare'); // 143.55 > 100
  });

  // Advisory T-012 / T-016 SIS: roll=1.0 boundary guard.
  // cursor = 1.0 × 145 = 145; after common (−100 → 45) and rare (−45 → 0) the
  // loop exhausts without returning because 0 is not < 0.  The fallback must
  // return the last event rather than undefined.
  it('roll=1.0 falls back to the last event in the pool', () => {
    const common = makeEvent('common', Rarity.COMMON);
    const rare = makeEvent('rare', Rarity.RARE);
    expect(selectWeightedEvent([common, rare], 1.0)?.id).toBe('rare');
  });

  it('surfaces the common event far more often than the rare one', () => {
    const common = makeEvent('common', Rarity.COMMON);
    const rare = makeEvent('rare', Rarity.EPIC); // 100 vs 18
    const pool = [common, rare];

    let commonCount = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      if (selectWeightedEvent(pool, Math.random())?.id === 'common') commonCount++;
    }
    // Expected ~100/118 ≈ 0.847 of draws; assert a comfortable lower bound.
    expect(commonCount / N).toBeGreaterThan(0.75);
  });
});

describe('applyOutcomeEffects', () => {
  const derived = calculateDerivedStats(BASE_STATS, {});
  const playerStats = {
    primary: BASE_STATS,
    effectivePrimary: BASE_STATS,
    derived,
  };

  it('applies stat changes', () => {
    const player = createMockPlayer();
    const outcome = {
      effects: {
        statChanges: { strength: 5 },
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.primaryStats.strength).toBe(player.primaryStats.strength + 5);
  });

  it('applies ryo changes', () => {
    const player = createMockPlayer({ ryo: 100 });
    const outcome = {
      effects: {
        ryo: 50,
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.ryo).toBe(150);
  });

  it('applies exp changes', () => {
    const player = createMockPlayer({ exp: 0 });
    const outcome = {
      effects: {
        exp: 25,
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.exp).toBe(25);
  });

  it('applies HP changes (flat)', () => {
    const player = createMockPlayer({ currentHp: 50 });
    const outcome = {
      effects: {
        hpChange: 20,
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.currentHp).toBe(70);
  });

  it('does not reduce HP below 1', () => {
    const player = createMockPlayer({ currentHp: 10 });
    const outcome = {
      effects: {
        hpChange: -100,
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.currentHp).toBe(1);
  });

  it('does not exceed max HP', () => {
    const maxHp = playerStats.derived.maxHp;
    const player = createMockPlayer({ currentHp: maxHp - 5 });
    const outcome = {
      effects: {
        hpChange: 100,
        logMessage: 'Test',
      },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, playerStats);

    expect(updated.currentHp).toBe(maxHp);
  });
});

describe('isEventValidForArc', () => {
  it('returns true when no arc restrictions', () => {
    const event = { allowedArcs: [] } as any;
    expect(isEventValidForArc(event, 'ACADEMY_ARC')).toBe(true);
  });

  it('returns true when event is undefined allowedArcs', () => {
    const event = {} as any;
    expect(isEventValidForArc(event, 'ACADEMY_ARC')).toBe(true);
  });

  it('returns true when arc is in allowedArcs', () => {
    const event = { allowedArcs: ['ACADEMY_ARC', 'WAVES_ARC'] } as any;
    expect(isEventValidForArc(event, 'ACADEMY_ARC')).toBe(true);
  });

  it('returns false when arc is not in allowedArcs', () => {
    const event = { allowedArcs: ['ACADEMY_ARC'] } as any;
    expect(isEventValidForArc(event, 'WAR_ARC')).toBe(false);
  });
});

describe('getEventsForArc', () => {
  const events = [
    { id: 'event1', allowedArcs: ['ACADEMY_ARC'] },
    { id: 'event2', allowedArcs: ['WAVES_ARC'] },
    { id: 'event3', allowedArcs: ['ACADEMY_ARC', 'WAVES_ARC'] },
    { id: 'event4', allowedArcs: [] }, // Available everywhere
  ] as any[];

  it('filters events by arc', () => {
    const academyEvents = getEventsForArc(events, 'ACADEMY_ARC');

    expect(academyEvents.length).toBe(3);
    expect(academyEvents.map(e => e.id)).toContain('event1');
    expect(academyEvents.map(e => e.id)).toContain('event3');
    expect(academyEvents.map(e => e.id)).toContain('event4');
  });

  it('excludes events from other arcs', () => {
    const academyEvents = getEventsForArc(events, 'ACADEMY_ARC');

    expect(academyEvents.map(e => e.id)).not.toContain('event2');
  });

  // T-012 A2 (optional): contract test — abandoned_supply_cache has no arc
  // restriction so it must surface in every arc via getEventsForArc.
  it('abandoned_supply_cache is available in at least 2 distinct arcs', () => {
    const arcs = ['ACADEMY_ARC', 'WAVES_ARC', 'EXAMS_ARC', 'ROGUE_ARC', 'WAR_ARC'];
    const arcsWithCache = arcs.filter(arc =>
      getEventsForArc(EVENTS, arc).some(e => e.id === 'abandoned_supply_cache'),
    );
    expect(arcsWithCache.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// T-008 — EVENT ENGINE 2.0: FLAGS, GATING, CHAINS, NEW EFFECTS
// ============================================================================

const derivedForEffects = calculateDerivedStats(BASE_STATS, {});
const statsForEffects = {
  primary: BASE_STATS,
  effectivePrimary: BASE_STATS,
  derived: derivedForEffects,
};

describe('checkEventFlags', () => {
  it('passes when no gates are provided', () => {
    const player = createMockPlayer();
    expect(checkEventFlags(player, undefined, undefined)).toBe(true);
  });

  it('passes requiresFlags when the flag meets the threshold', () => {
    const player = createMockPlayer({ eventFlags: { met_orochimaru: 1 } });
    expect(checkEventFlags(player, { met_orochimaru: 1 })).toBe(true);
  });

  it('passes requiresFlags when the flag exceeds the threshold', () => {
    const player = createMockPlayer({ eventFlags: { favor: 3 } });
    expect(checkEventFlags(player, { favor: 2 })).toBe(true);
  });

  it('fails requiresFlags when the flag is missing', () => {
    const player = createMockPlayer({ eventFlags: {} });
    expect(checkEventFlags(player, { met_orochimaru: 1 })).toBe(false);
  });

  it('fails requiresFlags when the flag is below the threshold', () => {
    const player = createMockPlayer({ eventFlags: { favor: 1 } });
    expect(checkEventFlags(player, { favor: 2 })).toBe(false);
  });

  it('fails excludesFlags when the flag meets the excluded value', () => {
    const player = createMockPlayer({ eventFlags: { betrayed: 1 } });
    expect(checkEventFlags(player, undefined, { betrayed: 1 })).toBe(false);
  });

  it('passes excludesFlags when the flag is below the excluded value', () => {
    const player = createMockPlayer({ eventFlags: { betrayed: 0 } });
    expect(checkEventFlags(player, undefined, { betrayed: 1 })).toBe(true);
  });

  it('requires ALL requiresFlags to be satisfied', () => {
    const player = createMockPlayer({ eventFlags: { a: 1 } });
    expect(checkEventFlags(player, { a: 1, b: 1 })).toBe(false);
  });
});

describe('event flag gating (events & choices)', () => {
  const gatedEvent: GameEvent = {
    id: 'orochimaru_returns',
    title: 'A Familiar Menace',
    description: 'The Sannin returns.',
    requiresFlags: { met_orochimaru: 1 },
    excludesFlags: { killed_orochimaru: 1 },
    choices: [],
  };

  it('isEventAvailableForPlayer returns false without the required flag', () => {
    const player = createMockPlayer({ eventFlags: {} });
    expect(isEventAvailableForPlayer(gatedEvent, player)).toBe(false);
  });

  it('isEventAvailableForPlayer returns true when required flag is set', () => {
    const player = createMockPlayer({ eventFlags: { met_orochimaru: 1 } });
    expect(isEventAvailableForPlayer(gatedEvent, player)).toBe(true);
  });

  it('isEventAvailableForPlayer returns false when an excludes flag is set', () => {
    const player = createMockPlayer({ eventFlags: { met_orochimaru: 1, killed_orochimaru: 1 } });
    expect(isEventAvailableForPlayer(gatedEvent, player)).toBe(false);
  });

  it('getAvailableEventsForPlayer filters the pool by flags', () => {
    const openEvent: GameEvent = { id: 'open', title: 'Open', description: '', choices: [] };
    const player = createMockPlayer({ eventFlags: {} });
    const pool = getAvailableEventsForPlayer([openEvent, gatedEvent], player);
    expect(pool.map(e => e.id)).toEqual(['open']);
  });

  it('getAvailableChoices hides choices gated out by flags', () => {
    const event: GameEvent = {
      id: 'branch',
      title: 'Branch',
      description: '',
      choices: [
        { label: 'Always', description: '', riskLevel: 'SAFE', outcomes: [] } as unknown as EventChoice,
        {
          label: 'Secret',
          description: '',
          riskLevel: 'SAFE',
          requiresFlags: { learned_secret: 1 },
          outcomes: [],
        } as unknown as EventChoice,
      ],
    };

    const ignorant = createMockPlayer({ eventFlags: {} });
    expect(getAvailableChoices(event, ignorant).map(c => c.label)).toEqual(['Always']);

    const initiated = createMockPlayer({ eventFlags: { learned_secret: 1 } });
    expect(getAvailableChoices(event, initiated).map(c => c.label)).toEqual(['Always', 'Secret']);
  });
});

describe('applyOutcomeEffects — T-008 effects', () => {
  it('sets flags and merges immutably with existing flags', () => {
    const player = createMockPlayer({ eventFlags: { existing: 1 } });
    const outcome = {
      effects: { setFlags: { met_orochimaru: 1 }, logMessage: 'flagged' },
    } as any;

    const updated = applyOutcomeEffects(player, outcome, statsForEffects);

    expect(updated.eventFlags).toEqual({ existing: 1, met_orochimaru: 1 });
    // Original player state is not mutated
    expect(player.eventFlags).toEqual({ existing: 1 });
  });

  it('overwrites an existing flag value when set again', () => {
    const player = createMockPlayer({ eventFlags: { favor: 1 } });
    const outcome = { effects: { setFlags: { favor: 3 }, logMessage: 'x' } } as any;

    const updated = applyOutcomeEffects(player, outcome, statsForEffects);

    expect(updated.eventFlags.favor).toBe(3);
  });

  it('grants a skill by id and does not duplicate it', () => {
    const skill = SKILLS.FIREBALL;
    const player = createMockPlayer({ skills: [] });
    const outcome = { effects: { grantSkillById: skill.id, logMessage: 'granted' } } as any;

    const updated = applyOutcomeEffects(player, outcome, statsForEffects);
    expect(updated.skills.some(s => s.id === skill.id)).toBe(true);

    // Applying again is a no-op (deduped by id)
    const again = applyOutcomeEffects(updated, outcome, statsForEffects);
    expect(again.skills.filter(s => s.id === skill.id).length).toBe(1);
  });

  it('ignores grantSkillById for an unknown skill id', () => {
    const player = createMockPlayer({ skills: [] });
    const outcome = { effects: { grantSkillById: 'does_not_exist', logMessage: 'x' } } as any;

    const updated = applyOutcomeEffects(player, outcome, statsForEffects);
    expect(updated.skills.length).toBe(0);
  });

  it('applies a curse as a CURSE buff on activeBuffs', () => {
    const player = createMockPlayer({ activeBuffs: [] });
    const outcome = { effects: { curse: { value: 0.75, duration: 4 }, logMessage: 'cursed' } } as any;

    const updated = applyOutcomeEffects(player, outcome, statsForEffects);
    const curse = updated.activeBuffs.find(b => b.effect.type === EffectType.CURSE);

    expect(curse).toBeDefined();
    expect(curse?.effect.value).toBe(0.75);
    expect(curse?.effect.duration).toBe(4);
    expect(player.activeBuffs.length).toBe(0); // original untouched
  });

  it('applies a curse with default value/duration when omitted', () => {
    const player = createMockPlayer({ activeBuffs: [] });
    const outcome = { effects: { curse: {}, logMessage: 'cursed' } } as any;

    const updated = applyOutcomeEffects(player, outcome, statsForEffects);
    const curse = updated.activeBuffs.find(b => b.effect.type === EffectType.CURSE);

    expect(curse?.effect.value).toBe(0.5);
    expect(curse?.effect.duration).toBe(3);
  });

  it('removes exactly one random item from the bag', () => {
    const bag = Array(12).fill(null);
    bag[0] = createMockComponent();
    bag[1] = createMockComponent();
    bag[2] = createMockComponent();
    const player = createMockPlayer({ bag });
    const outcome = { effects: { removeRandomItem: true, logMessage: 'lost' } } as any;

    const before = player.bag.filter(Boolean).length;
    const updated = applyOutcomeEffects(player, outcome, statsForEffects);
    const after = updated.bag.filter(Boolean).length;

    expect(after).toBe(before - 1);
    // original bag untouched
    expect(player.bag.filter(Boolean).length).toBe(before);
  });

  it('removeRandomItem is a safe no-op on an empty bag', () => {
    const player = createMockPlayer({ bag: Array(12).fill(null) });
    const outcome = { effects: { removeRandomItem: true, logMessage: 'x' } } as any;

    const updated = applyOutcomeEffects(player, outcome, statsForEffects);
    expect(updated.bag.filter(Boolean).length).toBe(0);
  });
});

describe('resolveEventChoice — chains & flag gating', () => {
  it('surfaces nextEventId when the rolled outcome chains', () => {
    const player = createMockPlayer();
    const choice: EventChoice = {
      label: 'Follow the trail',
      description: '',
      riskLevel: 'SAFE' as any,
      outcomes: [
        { weight: 100, effects: { chainTo: 'ambush_part_two', logMessage: 'onward' } },
      ],
    } as unknown as EventChoice;

    const result = resolveEventChoice(player, choice, statsForEffects);

    expect(result.success).toBe(true);
    expect(result.nextEventId).toBe('ambush_part_two');
  });

  it('leaves nextEventId undefined for a non-chaining outcome', () => {
    const player = createMockPlayer();
    const choice: EventChoice = {
      label: 'Rest',
      description: '',
      riskLevel: 'SAFE' as any,
      outcomes: [{ weight: 100, effects: { exp: 10, logMessage: 'rested' } }],
    } as unknown as EventChoice;

    const result = resolveEventChoice(player, choice, statsForEffects);

    expect(result.success).toBe(true);
    expect(result.nextEventId).toBeUndefined();
  });

  it('writes setFlags through resolveEventChoice into the returned player', () => {
    const player = createMockPlayer({ eventFlags: {} });
    const choice: EventChoice = {
      label: 'Make a pact',
      description: '',
      riskLevel: 'SAFE' as any,
      outcomes: [{ weight: 100, effects: { setFlags: { pact: 1 }, logMessage: 'sealed' } }],
    } as unknown as EventChoice;

    const result = resolveEventChoice(player, choice, statsForEffects);

    expect(result.success).toBe(true);
    expect(result.player?.eventFlags.pact).toBe(1);
  });

  it('rejects a choice whose flag gating the player does not satisfy', () => {
    const player = createMockPlayer({ eventFlags: {} });
    const choice: EventChoice = {
      label: 'Secret path',
      description: '',
      riskLevel: 'SAFE' as any,
      requiresFlags: { learned_secret: 1 },
      outcomes: [{ weight: 100, effects: { exp: 10, logMessage: 'secret' } }],
    } as unknown as EventChoice;

    const result = resolveEventChoice(player, choice, statsForEffects);

    expect(result.success).toBe(false);
    expect(result.player).toBeNull();
  });
});

describe('getEventFlagRunModifiers (T-034)', () => {
  it('returns neutral mods with empty flags', () => {
    const mods = getEventFlagRunModifiers(createMockPlayer({ eventFlags: {} }));
    expect(mods.damageBonus).toBe(0);
    expect(mods.ryoMultiplier).toBe(1);
    expect(mods.activeLabels).toEqual([]);
  });

  it('envoy_freed boosts ryo; debt_settled boosts damage', () => {
    const freed = getEventFlagRunModifiers(
      createMockPlayer({ eventFlags: { envoy_freed: 1 } }),
    );
    expect(freed.ryoMultiplier).toBeCloseTo(1.1);
    expect(freed.damageBonus).toBe(0);
    expect(freed.activeLabels.some((l) => l.includes('Envoy') || l.includes('Ryō'))).toBe(true);

    const settled = getEventFlagRunModifiers(
      createMockPlayer({ eventFlags: { envoy_freed: 1, envoy_debt_settled: 1 } }),
    );
    expect(settled.damageBonus).toBeCloseTo(0.05);
    expect(settled.ryoMultiplier).toBeCloseTo(1.1);
  });

  it('subject_harvested adds damage; subject_freed adds ryo', () => {
    const harvested = getEventFlagRunModifiers(
      createMockPlayer({ eventFlags: { subject_harvested: 1 } }),
    );
    expect(harvested.damageBonus).toBeCloseTo(0.08);
    expect(harvested.activeLabels.some((l) => l.includes('DMG'))).toBe(true);

    const freed = getEventFlagRunModifiers(
      createMockPlayer({ eventFlags: { subject_freed: 1 } }),
    );
    expect(freed.ryoMultiplier).toBeCloseTo(1.05);
  });

  it('secret intel flags stack ryo mult', () => {
    const mods = getEventFlagRunModifiers(
      createMockPlayer({
        eventFlags: { sunken_ship_discovered: 1, hidden_cove_discovered: 1 },
      }),
    );
    // both secrets share one +5% bucket (OR)
    expect(mods.ryoMultiplier).toBeCloseTo(1.05);
    expect(mods.activeLabels.some((l) => l.includes('Secret'))).toBe(true);
  });
});
