/**
 * T-130 AC: Edo Tensei SUPPORT — Reanimation 3 lethal→1 + Shield 40; ATTACK +1 while armed.
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
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { effectiveWeight } from '../DeckSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import {
  applyReanimationLethal,
  reanimationRoleBonuses,
  REANIMATION_MARK_ID,
  REANIMATION_SHIELD_MARK_ID,
} from '../MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const edo = SKILLS.EDO_TENSEI;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [edo],
    playerBuffs: [],
    enemyHp: 80,
    pendingSupportWeights: [],
    ...overrides,
  };
}

const attack = createMockSkill({
  id: 'basic_atk',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  currentCooldown: 0,
});

const side = createMockSkill({
  id: 'wire_kunai_reel',
  cardRole: CardRole.SIDE_ATTACK,
  actionType: ActionType.ACTIVE,
  currentCooldown: 0,
});

const ctx = { posture: Posture.BALANCED };

describe('T-130 authoring', () => {
  it('declares SUPPORT AP4 CP18 HP30 CD10 Reanimation 3 and not STR/SPD 0.5', () => {
    expect(edo.id).toBe('edo_tensei');
    expect(edo.cardRole).toBe(CardRole.SUPPORT);
    expect(edo.apCost).toBe(4);
    expect(edo.chakraCost).toBe(18);
    expect(edo.hpCost).toBe(30);
    expect(edo.cooldown).toBe(10);
    expect(edo.baseDamage).toBe(0);
    expect(edo.nextDrawRoleBonus).toBeUndefined();
    expect(edo.tags).toEqual(
      expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.MENTAL, SkillTag.MARK]),
    );
    expect(edo.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: REANIMATION_MARK_ID,
          duration: 3,
          stacks: 1,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      edo.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.STRENGTH &&
          e.value === 0.5,
      ),
    ).toBeFalsy();
    expect(
      edo.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.SPEED &&
          e.value === 0.5,
      ),
    ).toBeFalsy();
  });
});

describe('T-130 plant', () => {
  it('plants reanimation on self duration 3, pays HP 30, deals 0', () => {
    const result = resolveSkill({ skill: edo }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.ap).toBe(2);
    expect(result.state.pools.chakra).toBe(2);
    expect(result.state.pools.hp).toBe(10);
    const mark = result.state.marks.find((m) => m.id === REANIMATION_MARK_ID);
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.duration).toBe(3);
    expect(mark?.stacks).toBe(1);
    expect(mark?.family).toBe(MarkFamily.STAT);
    expect(result.state.modes.instances).toHaveLength(0);
    const used = result.state.skills.find((s) => s.id === edo.id);
    expect(used?.readyOnTurn).toBe(13);

    const broke = resolveSkill(
      { skill: edo },
      baseState({ pools: { ap: 6, chakra: 20, hp: 29, maxHp: 40 } }),
    );
    expect(broke.ok).toBe(false);
    if (broke.ok) return;
    expect(broke.reason).toBe('hp');
    expect(broke.state.pools.hp).toBe(29);
    expect(broke.state.pools.ap).toBe(6);
    expect(broke.state.pools.chakra).toBe(20);
  });
});

describe('T-130 reanimation', () => {
  it('on lethal with mark: HP 1, consume, Shield 40; ATTACK weight +1 while armed', () => {
    const planted = resolveSkill({ skill: edo }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const armedBonuses = reanimationRoleBonuses(planted.state.marks);
    const baseAtk = effectiveWeight(attack, { ...ctx, supportRoleBonuses: {} });
    const armedAtk = effectiveWeight(attack, { ...ctx, supportRoleBonuses: armedBonuses });
    expect(armedAtk).toBe(baseAtk + 1);
    expect(armedBonuses[CardRole.ATTACK]).toBe(1);

    const baseSide = effectiveWeight(side, { ...ctx, supportRoleBonuses: {} });
    const armedSide = effectiveWeight(side, { ...ctx, supportRoleBonuses: armedBonuses });
    expect(armedSide).toBe(baseSide);

    const fired = applyReanimationLethal(10, 40, planted.state.marks);
    expect(fired.newHp).toBe(1);
    expect(fired.survived).toBe(true);
    expect(fired.consumed).toBe(true);
    expect(fired.grantShield).toBe(40);
    expect(fired.marks.some((m) => m.id === REANIMATION_MARK_ID)).toBe(false);
    const shield = fired.marks.find((m) => m.id === REANIMATION_SHIELD_MARK_ID);
    expect(shield?.family).toBe(MarkFamily.SHIELD);
    expect(shield?.stacks).toBe(40);
    expect(shield?.target).toBe(CombatActor.PLAYER);
    expect(shield?.duration).toBe(99);

    const after = reanimationRoleBonuses(fired.marks);
    expect(after[CardRole.ATTACK]).toBeUndefined();
    const consumedAtk = effectiveWeight(attack, { ...ctx, supportRoleBonuses: after });
    expect(consumedAtk).toBe(baseAtk);
  });

  it('passthrough when unarmed or non-lethal; does not consume on damage 0', () => {
    const bare = applyReanimationLethal(10, 40, []);
    expect(bare.newHp).toBe(-30);
    expect(bare.survived).toBe(false);
    expect(bare.consumed).toBe(false);
    expect(bare.grantShield).toBe(0);

    const planted = resolveSkill({ skill: edo }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const chip = applyReanimationLethal(50, 20, planted.state.marks);
    expect(chip.newHp).toBe(30);
    expect(chip.survived).toBe(true);
    expect(chip.consumed).toBe(false);
    expect(chip.grantShield).toBe(0);
    expect(chip.marks.some((m) => m.id === REANIMATION_MARK_ID)).toBe(true);

    const zero = applyReanimationLethal(10, 0, planted.state.marks);
    expect(zero.newHp).toBe(10);
    expect(zero.consumed).toBe(false);
    expect(zero.grantShield).toBe(0);
    expect(zero.marks.some((m) => m.id === REANIMATION_MARK_ID)).toBe(true);
  });
});
