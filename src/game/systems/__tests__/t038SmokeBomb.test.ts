/**
 * T-038 AC: Smoke Bomb — SUPPORT smoke mark (−25) + SIDE weight +1 next draw.
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
import { applySmokeOutgoing } from '../MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const smoke = SKILLS.SMOKE_BOMB;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [smoke],
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

describe('T-038 authoring', () => {
  it('declares SUPPORT smoke 2 / −25 and no SPEED/ACC % identity', () => {
    expect(smoke.cardRole).toBe(CardRole.SUPPORT);
    expect(smoke.apCost).toBe(1);
    expect(smoke.chakraCost).toBe(0);
    expect(smoke.cooldown).toBe(3);
    expect(smoke.baseDamage).toBe(0);
    expect(smoke.nextDrawRoleBonus).toEqual({ role: CardRole.SIDE_ATTACK, delta: 1 });
    expect(smoke.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'smoke',
          duration: 2,
          stacks: 25,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
        }),
      ]),
    );
    expect(
      smoke.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.SPEED &&
          e.value === 0.35,
      ),
    ).toBeFalsy();
  });
});

describe('T-038 weight mark', () => {
  it('plants smoke and gives SIDE +1 once', () => {
    const result = resolveSkill({ skill: smoke }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const mark = result.state.marks.find((m) => m.id === 'smoke');
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(25);
    expect(mark?.target).toBe(CombatActor.ENEMY);

    const first = consumeSupportWeightBonuses(result.state.pendingSupportWeights ?? []);
    expect(first.roleBonuses[CardRole.SIDE_ATTACK]).toBe(1);
    const baseSide = effectiveWeight(side, { ...ctx, supportRoleBonuses: {} });
    const boosted = effectiveWeight(side, { ...ctx, supportRoleBonuses: first.roleBonuses });
    expect(boosted).toBe(baseSide + 1);

    const second = consumeSupportWeightBonuses(first.bag);
    expect(second.roleBonuses[CardRole.SIDE_ATTACK]).toBeUndefined();

    const feared = applySmokeOutgoing(40, result.state.marks);
    expect(feared.damage).toBe(15);
    expect(feared.consumed).toBe(true);
  });
});

describe('T-038 side only', () => {
  it('does not change ATTACK weight when SIDE +1 is applied', () => {
    const result = resolveSkill({ skill: smoke }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { roleBonuses } = consumeSupportWeightBonuses(result.state.pendingSupportWeights ?? []);
    const empty = effectiveWeight(attack, { ...ctx, supportRoleBonuses: {} });
    const withBag = effectiveWeight(attack, { ...ctx, supportRoleBonuses: roleBonuses });
    expect(withBag).toBe(empty);
  });
});
