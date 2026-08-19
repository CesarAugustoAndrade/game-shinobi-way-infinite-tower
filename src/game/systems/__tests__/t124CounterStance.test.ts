/**
 * T-124 AC: Counter Stance SUPPORT — Counter 1 (30% first MELEE reflect) + SIDE +1; no instant dmg.
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
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { effectiveWeight } from '../DeckSystem';
import { consumeSupportWeightBonuses } from '../SupportWeightSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const stance = SKILLS.COUNTER_STANCE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [stance],
    playerBuffs: [],
    enemyHp: 80,
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
  id: 'basic_atk',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  currentCooldown: 0,
});

const ctx = { posture: Posture.BALANCED };

describe('T-124 authoring', () => {
  it('declares SUPPORT AP1 CP1 CD4 Counter 30% + SIDE +1, not AP2/base8', () => {
    expect(stance.id).toBe('counter_stance');
    expect(stance.cardRole).toBe(CardRole.SUPPORT);
    expect(stance.apCost).toBe(1);
    expect(stance.chakraCost).toBe(1);
    expect(stance.hpCost).toBe(0);
    expect(stance.cooldown).toBe(4);
    expect(stance.baseDamage).toBe(0);
    expect(stance.baseDamage).not.toBe(8);
    expect(stance.stanceShift).toBeUndefined();
    expect(stance.modeInteraction).toBeUndefined();
    expect(stance.nextDrawRoleBonus).toEqual({ role: CardRole.SIDE_ATTACK, delta: 1 });
    expect(stance.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'counter_reflect',
          duration: 1,
          stacks: 30,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(stance.effects?.some((e) => e.type === EffectType.REFLECTION)).toBeFalsy();
  });
});

describe('T-124 plant', () => {
  it('plants Counter on the player, enqueues SIDE +1, and deals 0', () => {
    const result = resolveSkill({ skill: stance }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.ap).toBe(5);
    expect(result.state.pools.chakra).toBe(19);
    const mark = result.state.marks.find((m) => m.id === 'counter_reflect');
    expect(mark?.duration).toBe(1);
    expect(mark?.stacks).toBe(30);
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.owner).toBe(CombatActor.PLAYER);

    const first = consumeSupportWeightBonuses(result.state.pendingSupportWeights ?? []);
    expect(first.roleBonuses[CardRole.SIDE_ATTACK]).toBe(1);
  });
});

describe('T-124 weight', () => {
  it('does not deal 8 and SIDE bonus is one-shot next-draw', () => {
    const result = resolveSkill({ skill: stance }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.enemyHp).toBe(80);

    const first = consumeSupportWeightBonuses(result.state.pendingSupportWeights ?? []);
    const baseSide = effectiveWeight(side, { ...ctx, supportRoleBonuses: {} });
    const boosted = effectiveWeight(side, { ...ctx, supportRoleBonuses: first.roleBonuses });
    expect(boosted).toBe(baseSide + 1);

    const second = consumeSupportWeightBonuses(first.bag);
    expect(second.roleBonuses[CardRole.SIDE_ATTACK]).toBeUndefined();

    const empty = effectiveWeight(attack, { ...ctx, supportRoleBonuses: {} });
    const withBag = effectiveWeight(attack, { ...ctx, supportRoleBonuses: first.roleBonuses });
    expect(withBag).toBe(empty);
  });
});
