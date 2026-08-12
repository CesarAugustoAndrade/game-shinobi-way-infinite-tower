/**
 * Event CONTENT integrity + chain-behaviour smoke tests (T-010).
 *
 * These do not test the Event Engine (that lives in EventSystem.test.ts) — they
 * guard the DATA: that every authored event/choice/outcome is internally
 * consistent, that chains resolve to real events, that granted skills exist, and
 * that flag gates are actually reachable. Deterministic, no RNG.
 */

import { describe, it, expect } from 'vitest';
import { EVENTS } from '../../index';
import { SKILLS } from '../../skills';
import { Clan, GameEvent, EventChoice } from '../../../types';
import {
  resolveEventChoice,
  getAvailableChoices,
  isEventAvailableForPlayer,
  checkRequirements,
} from '../../../systems/EventSystem';
import { calculateDerivedStats } from '../../../systems/StatSystem';
import { createMockPlayer, BASE_STATS } from '../../../systems/__tests__/testFixtures';

const derived = calculateDerivedStats(BASE_STATS, {});
const playerStats = { primary: BASE_STATS, effectivePrimary: BASE_STATS, derived };

const findEvent = (id: string): GameEvent => {
  const event = EVENTS.find((e) => e.id === id);
  if (!event) throw new Error(`Event not found: ${id}`);
  return event;
};

const choiceByLabel = (event: GameEvent, label: string): EventChoice => {
  const choice = event.choices.find((c) => c.label === label);
  if (!choice) throw new Error(`Choice "${label}" not found in ${event.id}`);
  return choice;
};

// ============================================================================
// GLOBAL CONTENT INVARIANTS — hold across every authored event
// ============================================================================

describe('event content — global invariants', () => {
  it('has no duplicate event ids', () => {
    const ids = EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // T-041: clan identity must appear in story content (engine already supported requiredClan)
  it('authors at least 3 choices gated by requiredClan across multiple arcs', () => {
    const clanChoices: { eventId: string; label: string; clan: Clan }[] = [];
    for (const event of EVENTS) {
      for (const choice of event.choices) {
        if (choice.requirements?.requiredClan) {
          clanChoices.push({
            eventId: event.id,
            label: choice.label,
            clan: choice.requirements.requiredClan,
          });
        }
      }
    }
    expect(clanChoices.length).toBeGreaterThanOrEqual(3);
    const clans = new Set(clanChoices.map((c) => c.clan));
    expect(clans.size).toBeGreaterThanOrEqual(2);
    const arcs = new Set(
      clanChoices.flatMap((c) => {
        const ev = findEvent(c.eventId);
        return ev.allowedArcs ?? [];
      }),
    );
    expect(arcs.size).toBeGreaterThanOrEqual(2);
  });

  it('requiredClan choices pass for matching clan and fail for others', () => {
    const uchihaChoice = choiceByLabel(findEvent('mist_ambush_cache'), 'Predict Patrols with Sharingan');
    const uchiha = createMockPlayer({ clan: Clan.UCHIHA });
    const hyuga = createMockPlayer({ clan: Clan.HYUGA });
    expect(checkRequirements(uchiha, uchihaChoice.requirements, playerStats)).toBe(true);
    expect(checkRequirements(hyuga, uchihaChoice.requirements, playerStats)).toBe(false);

    const availableUchiha = getAvailableChoices(findEvent('mist_ambush_cache'), uchiha);
    const availableHyuga = getAvailableChoices(findEvent('mist_ambush_cache'), hyuga);
    expect(availableUchiha.some((c) => c.label === uchihaChoice.label)).toBe(true);
    // Disabled choices may still be listed — ensure resolve fails for wrong clan
    const resolveWrong = resolveEventChoice(hyuga, uchihaChoice, playerStats);
    expect(resolveWrong.success).toBe(false);
  });

  it('every outcome carries logMessage + logType and weights sum to 100 per choice', () => {
    for (const event of EVENTS) {
      for (const choice of event.choices) {
        const total = choice.outcomes.reduce((sum, o) => sum + o.weight, 0);
        expect(
          total,
          `${event.id} / "${choice.label}" weights should sum to 100`,
        ).toBe(100);

        for (const outcome of choice.outcomes) {
          expect(outcome.effects.logMessage, `${event.id} / "${choice.label}" missing logMessage`).toBeTruthy();
          expect(['gain', 'danger', 'info', 'loot']).toContain(outcome.effects.logType);
        }
      }
    }
  });

  it('every chainTo points to an event that exists in EVENTS', () => {
    const ids = new Set(EVENTS.map((e) => e.id));
    for (const event of EVENTS) {
      for (const choice of event.choices) {
        for (const outcome of choice.outcomes) {
          if (outcome.effects.chainTo) {
            expect(ids.has(outcome.effects.chainTo), `${event.id}: chainTo → ${outcome.effects.chainTo} does not exist`).toBe(true);
          }
        }
      }
    }
  });

  it('a chaining outcome never also triggers combat (they are mutually exclusive flows)', () => {
    for (const event of EVENTS) {
      for (const choice of event.choices) {
        for (const outcome of choice.outcomes) {
          if (outcome.effects.chainTo) {
            expect(outcome.effects.triggerCombat, `${event.id}: chainTo + triggerCombat on the same outcome`).toBeUndefined();
          }
        }
      }
    }
  });

  it('every grantSkillById references a real Skill.id in SKILLS', () => {
    const skillIds = new Set(Object.values(SKILLS).map((s) => s.id));
    for (const event of EVENTS) {
      for (const choice of event.choices) {
        for (const outcome of choice.outcomes) {
          if (outcome.effects.grantSkillById) {
            expect(skillIds.has(outcome.effects.grantSkillById), `${event.id}: grants unknown skill ${outcome.effects.grantSkillById}`).toBe(true);
          }
        }
      }
    }
  });

  it('every flag read by requires/excludesFlags is written by some setFlags (no dead gates)', () => {
    const written = new Set<string>();
    const read = new Set<string>();

    for (const event of EVENTS) {
      Object.keys(event.requiresFlags ?? {}).forEach((k) => read.add(k));
      Object.keys(event.excludesFlags ?? {}).forEach((k) => read.add(k));
      for (const choice of event.choices) {
        Object.keys(choice.requiresFlags ?? {}).forEach((k) => read.add(k));
        Object.keys(choice.excludesFlags ?? {}).forEach((k) => read.add(k));
        for (const outcome of choice.outcomes) {
          Object.keys(outcome.effects.setFlags ?? {}).forEach((k) => written.add(k));
        }
      }
    }

    const orphans = [...read].filter((flag) => !written.has(flag));
    expect(orphans, `flags read but never written: ${orphans.join(', ')}`).toEqual([]);
  });

  it('every event keeps at least one fully-ungated choice (anti-softlock)', () => {
    for (const event of EVENTS) {
      const hasEscape = event.choices.some(
        (c) => !c.requiresFlags && !c.excludesFlags && !c.requirements && !c.costs,
      );
      expect(hasEscape, `${event.id} has no ungated escape choice`).toBe(true);
    }
  });
});

// ============================================================================
// CHAIN A — reanimated_envoy → reanimated_envoy_fate (WAR arc)
// ============================================================================

describe('chain A — the reanimated envoy resolves and branches on flags', () => {
  it('the freed choice chains to the fate scene and persists both flags', () => {
    const player = createMockPlayer({ eventFlags: {} });
    const entry = findEvent('reanimated_envoy');
    const result = resolveEventChoice(player, choiceByLabel(entry, 'Sever the Tether'), playerStats);

    expect(result.success).toBe(true);
    expect(result.nextEventId).toBe('reanimated_envoy_fate');
    expect(result.player?.eventFlags.met_envoy).toBe(1);
    expect(result.player?.eventFlags.envoy_freed).toBe(1);
  });

  it('the fate scene shows the freed reward and hides the bound one', () => {
    const fate = findEvent('reanimated_envoy_fate');
    const freed = createMockPlayer({ eventFlags: { met_envoy: 1, envoy_freed: 1 } });
    const labels = getAvailableChoices(fate, freed).map((c) => c.label);

    expect(labels).toContain('Accept His Blessing');
    expect(labels).toContain('Let Him Fade'); // ungated escape always present
    expect(labels).not.toContain('Tear the Technique From Him');
  });

  it('the fate scene shows the bound path only when bound', () => {
    const fate = findEvent('reanimated_envoy_fate');
    const bound = createMockPlayer({ eventFlags: { met_envoy: 1, envoy_bound: 1 } });
    const labels = getAvailableChoices(fate, bound).map((c) => c.label);

    expect(labels).toContain('Tear the Technique From Him');
    expect(labels).not.toContain('Accept His Blessing');
  });

  it('the freed-only reward grants a real skill', () => {
    const fate = findEvent('reanimated_envoy_fate');
    const grant = choiceByLabel(fate, 'Accept His Blessing').outcomes[0].effects.grantSkillById;
    expect(Object.values(SKILLS).some((s) => s.id === grant)).toBe(true);
  });
});

// ============================================================================
// PERSISTENT CONSEQUENCE — envoy_gratitude_repaid remembers the freed envoy
// ============================================================================

describe('persistent consequence — the freed envoy is remembered later', () => {
  const debt = () => findEvent('envoy_gratitude_repaid');

  it('is unavailable to a player who never freed the envoy', () => {
    const player = createMockPlayer({ eventFlags: {} });
    expect(isEventAvailableForPlayer(debt(), player)).toBe(false);
  });

  it('becomes available once the envoy was freed', () => {
    const player = createMockPlayer({ eventFlags: { envoy_freed: 1 } });
    expect(isEventAvailableForPlayer(debt(), player)).toBe(true);
  });

  it('does not fire twice once the debt is settled', () => {
    const player = createMockPlayer({ eventFlags: { envoy_freed: 1, envoy_debt_settled: 1 } });
    expect(isEventAvailableForPlayer(debt(), player)).toBe(false);
  });
});

// ============================================================================
// CHAIN B — orochimaru_experiment → orochimaru_experiment_result (ROGUE arc)
// ============================================================================

describe('chain B — the abandoned laboratory resolves and branches on flags', () => {
  it('the harvest choice chains to the reckoning and sets the branch flag', () => {
    // Harvest needs 22 Intelligence — give the mock a stat bump so the gate passes.
    const smart = createMockPlayer({
      eventFlags: {},
      primaryStats: { ...BASE_STATS, intelligence: 3 },
    });
    const entry = findEvent('orochimaru_experiment');
    const result = resolveEventChoice(smart, choiceByLabel(entry, 'Harvest the Specimen'), playerStats);

    expect(result.success).toBe(true);
    expect(result.nextEventId).toBe('orochimaru_experiment_result');
    expect(result.player?.eventFlags.entered_lab).toBe(1);
    expect(result.player?.eventFlags.subject_harvested).toBe(1);
  });

  it('the reckoning offers the serum injection only on the harvested path', () => {
    const reckoning = findEvent('orochimaru_experiment_result');
    const harvested = createMockPlayer({ eventFlags: { entered_lab: 1, subject_harvested: 1 } });
    const freed = createMockPlayer({ eventFlags: { entered_lab: 1, subject_freed: 1 } });

    expect(getAvailableChoices(reckoning, harvested).map((c) => c.label)).toContain('Inject the Serum');
    expect(getAvailableChoices(reckoning, freed).map((c) => c.label)).not.toContain('Inject the Serum');
    // Both branches keep the ungated escape.
    expect(getAvailableChoices(reckoning, harvested).map((c) => c.label)).toContain('Destroy the Serum');
    expect(getAvailableChoices(reckoning, freed).map((c) => c.label)).toContain('Destroy the Serum');
  });
});
