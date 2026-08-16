/**
 * T-088 AC1: resolveSkill ATTACK/SIDE connected hit matches
 * calculateDamage + resolveSuccessfulHit on a known-stats fixture.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatRange,
  ElementType,
  ModeRuntimeState,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { emptyModeBoard } from '../CombatModeSystem';
import {
  resolveSkill,
  type ResolveSkillCombatants,
  type ResolveSkillState,
} from '../ResolveSkillSystem';
import { calculateDamage, calculateDerivedStats } from '../StatSystem';
import { resolveSuccessfulHit } from '../SkillResolutionSystem';
import { BASE_STATS, createMockSkill } from './testFixtures';

const derived = calculateDerivedStats(BASE_STATS);

const combatants: ResolveSkillCombatants = {
  attackerPrimary: BASE_STATS,
  attackerDerived: derived,
  defenderPrimary: BASE_STATS,
  defenderDerived: derived,
  attackerElement: ElementType.PHYSICAL,
  defenderElement: ElementType.PHYSICAL,
};

const damageOptions = { forceHit: true, forceCrit: false } as const;

const attack = createMockSkill({
  id: 't088-strike',
  name: 'T088 Strike',
  cardRole: CardRole.ATTACK,
  apCost: 2,
  chakraCost: 4,
  hpCost: 0,
  cooldown: 0,
  currentCooldown: 0,
  hitCount: 1,
  allowedRanges: [CombatRange.CLOSE],
});

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [attack],
    playerBuffs: [],
    enemyHp: 200,
    ...overrides,
  };
}

function coreInteger(skill: typeof attack, preMitigation: number[]): number {
  const rolled = calculateDamage(
    combatants.attackerPrimary,
    combatants.attackerDerived,
    combatants.defenderPrimary,
    combatants.defenderDerived,
    skill,
    combatants.attackerElement ?? ElementType.PHYSICAL,
    combatants.defenderElement ?? ElementType.PHYSICAL,
    damageOptions,
  );
  expect(rolled.isMiss).toBe(false);
  expect(rolled.isEvaded).toBe(false);
  return resolveSuccessfulHit({
    rawDamage: rolled.finalDamage,
    preMitigationMultipliers: preMitigation,
    defenderBuffs: [],
    defenderLabel: 'enemy',
  }).finalDamage;
}

describe('T-088 hit core', () => {
  it('ATTACK with known stats matches calculateDamage + resolveSuccessfulHit', () => {
    const expected = coreInteger(attack, []);
    expect(expected).toBeGreaterThan(0);

    const result = resolveSkill({ skill: attack }, baseState(), {
      combatants,
      damageOptions,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(1);
    expect(result.damageDealt).toBe(expected);
    expect(result.state.enemyHp).toBe(200 - expected);
  });

  it('folds mode damageMultBonus into pre-mitigation (same integer as core)', () => {
    const enhanced = {
      ...attack,
      id: 't088-enhanced',
      modeInteraction: {
        modeId: 'sharingan_2',
        family: MODE_FAMILY.SHARINGAN,
        consumeCharges: 1,
        damageMultBonus: 0.5,
      },
    };
    const expected = coreInteger(enhanced, [1.5]);
    expect(expected).toBeGreaterThan(0);

    const result = resolveSkill(
      { skill: enhanced },
      baseState({
        skills: [enhanced],
        modes: {
          instances: [
            {
              id: 'sharingan_2',
              family: MODE_FAMILY.SHARINGAN,
              charges: 3,
              state: ModeRuntimeState.ON,
            },
          ],
        },
      }),
      { combatants, damageOptions },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(expected);
    expect(result.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges).toBe(2);
  });
});
