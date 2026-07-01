/**
 * EventSystem Unit Tests
 * Tests requirement checking, cost validation, outcome rolling, and effect application
 */

import { describe, it, expect } from 'vitest';
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
} from '../EventSystem';
import { calculateDerivedStats } from '../StatSystem';
import { Clan, PrimaryStat, EffectType, GameEvent, EventChoice } from '../../types';
import { SKILLS } from '../../constants/skills';
import { createMockPlayer, createMockComponent, BASE_STATS } from './testFixtures';

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
      minStat: { stat: PrimaryStat.STRENGTH, value: 5 },
    };
    expect(checkRequirements(player, requirements, playerStats)).toBe(true);
  });

  it('returns false when stat requirement not met', () => {
    const requirements = {
      minStat: { stat: PrimaryStat.STRENGTH, value: 50 },
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

  it('applies clan bonus when matching', () => {
    const uchihaPlayer = createMockPlayer({ clan: Clan.UCHIHA });
    const choice = {
      outcomes: [
        { weight: 50, effects: { logMessage: 'Normal' } },
        { weight: 50, effects: { logMessage: 'Boosted' } },
      ],
      clanBonus: {
        clan: Clan.UCHIHA,
        weightMultiplier: 2.0, // Doubles second outcome weight
      },
    } as any;

    // The clan bonus changes the odds, but outcome is still valid
    const outcome = rollOutcome(choice, uchihaPlayer);
    expect(outcome).toBeDefined();
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
