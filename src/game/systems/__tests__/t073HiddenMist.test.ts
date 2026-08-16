/**
 * T-073 AC: Hidden Mist — SUPPORT mist (−20) + SIDE weight +1 next draw.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  Posture,
  PrimaryStat,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { effectiveWeight } from '../DeckSystem';
import { consumeSupportWeightBonuses } from '../SupportWeightSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { applyMistOutgoing } from '../MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const mist = SKILLS.HIDDEN_MIST;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [mist],
    playerBuffs: [],
    enemyHp: 50,
    pendingSupportWeights: [],
    ...overrides,
  };
}

const side = createMockSkill({
  id: 'wire_kunai_reel',
  cardRole: CardRole.SIDE_ATTACK,
  actionType: ActionType.ACTIVE,
  currentCooldown: 0,
});

const attack = createMockSkill({
  id: 'rasengan',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  currentCooldown: 0,
});

const ctx = { posture: Posture.BALANCED };

describe('T-073 authoring', () => {
  it('declares SUPPORT mist 2 / −20 + SIDE +1 and not SPEED/ACC % identity', () => {
    expect(mist.cardRole).toBe(CardRole.SUPPORT);
    expect(mist.apCost).toBe(2);
    expect(mist.chakraCost).toBe(5);
    expect(mist.cooldown).toBe(5);
    expect(mist.baseDamage).toBe(0);
    expect(mist.nextDrawRoleBonus).toEqual({ role: CardRole.SIDE_ATTACK, delta: 1 });
    expect(mist.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mist',
          duration: 2,
          stacks: 20,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
        }),
      ]),
    );
    expect(
      mist.effects?.some(
        (e) =>
          (e.type === EffectType.BUFF &&
            e.targetStat === PrimaryStat.SPEED &&
            e.value === 0.5) ||
          (e.type === EffectType.DEBUFF &&
            e.targetStat === PrimaryStat.ACCURACY &&
            e.value === 0.3),
      ),
    ).toBeFalsy();
  });
});

describe('T-073 weight mark', () => {
  it('plants mist and gives SIDE +1 once; ATTACK weight unchanged', () => {
    const result = resolveSkill({ skill: mist }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const mark = result.state.marks.find((m) => m.id === 'mist');
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(20);
    expect(mark?.target).toBe(CombatActor.ENEMY);

    const first = consumeSupportWeightBonuses(result.state.pendingSupportWeights ?? []);
    expect(first.roleBonuses[CardRole.SIDE_ATTACK]).toBe(1);
    const baseSide = effectiveWeight(side, { ...ctx, supportRoleBonuses: {} });
    const boosted = effectiveWeight(side, { ...ctx, supportRoleBonuses: first.roleBonuses });
    expect(boosted).toBe(baseSide + 1);

    const second = consumeSupportWeightBonuses(first.bag);
    expect(second.roleBonuses[CardRole.SIDE_ATTACK]).toBeUndefined();

    const empty = effectiveWeight(attack, { ...ctx, supportRoleBonuses: {} });
    const withBag = effectiveWeight(attack, { ...ctx, supportRoleBonuses: first.roleBonuses });
    expect(withBag).toBe(empty);

    const cut = applyMistOutgoing(40, result.state.marks);
    expect(cut.damage).toBe(20);
    expect(cut.consumed).toBe(true);
  });
});

describe('T-073 support only', () => {
  it('deals 0 and does not mutate Terrain', () => {
    const result = resolveSkill({ skill: mist }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect('terrain' in result.state).toBe(false);
    expect(result.state.marks.some((m) => m.id === 'smoke')).toBe(false);
  });
});
