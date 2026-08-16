/**
 * T-080 AC: Water Prison SIDE — 9 MEDIUM; 70% Stun 1; voluntary range-up lock.
 *
 * Threshold: rng() < 0.7 → stun (0 succeeds, 0.7 fails).
 * Lock is a self mark `water_prison_lock` duration 1, planted only when Stun lands.
 */

import { describe, it, expect } from 'vitest';
import {
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  RangeMoveDirection,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import {
  WATER_PRISON_LOCK_ID,
  voluntaryRangeIncreaseBlocked,
} from '../RangeSystem';
import { createCombatState } from '../CombatWorkflowSystem';
import { voluntaryPlayerMove } from '../PlayerTurnSystem';

const prison = SKILLS.WATER_PRISON;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [prison],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: prison.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration: number,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

describe('T-080 authoring', () => {
  it('declares SIDE AP2 CP6 CD5 MEDIUM 9 + 70% Stun 1 lock and not STUN×2', () => {
    expect(prison.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(prison.apCost).toBe(2);
    expect(prison.chakraCost).toBe(6);
    expect(prison.cooldown).toBe(5);
    expect(prison.hpCost).toBe(0);
    expect(prison.baseDamage).toBe(9);
    expect(prison.attackMethod).toBe(AttackMethod.RANGED);
    expect(prison.allowedRanges).toEqual([CombatRange.MEDIUM]);
    expect(prison.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.WATER]));
    expect(prison.impactStun).toEqual({
      chance: 0.7,
      duration: 1,
      lockVoluntaryRangeUp: true,
    });
    expect(
      prison.effects?.some((e) => e.type === EffectType.STUN && e.duration === 2),
    ).toBeFalsy();
  });
});

describe('T-080 hit stun', () => {
  it('deals 9 and stuns on success; deals 9 without stun on fail; miss is clean', () => {
    const win = resolveSkill({ skill: prison }, baseState(), { ...hit, rng: () => 0 });
    expect(win.ok).toBe(true);
    if (!win.ok) return;
    expect(win.damageDealt).toBe(9);
    expect(hasStun(win.state.enemyBuffs, 1)).toBe(true);
    expect(hasStun(win.state.playerBuffs, 1)).toBe(false);

    const lose = resolveSkill({ skill: prison }, baseState(), { ...hit, rng: () => 0.7 });
    expect(lose.ok).toBe(true);
    if (!lose.ok) return;
    expect(lose.damageDealt).toBe(9);
    expect(hasStun(lose.state.enemyBuffs, 1)).toBe(false);
    expect(lose.state.marks.some((m) => m.id === WATER_PRISON_LOCK_ID)).toBe(false);

    const whiff = resolveSkill({ skill: prison }, baseState(), { ...miss, rng: () => 0 });
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(hasStun(whiff.state.enemyBuffs, 1)).toBe(false);

    const close = resolveSkill(
      { skill: prison },
      baseState({ range: CombatRange.CLOSE }),
      { ...hit, rng: () => 0 },
    );
    expect(close.ok).toBe(false);
  });
});

describe('T-080 lock', () => {
  it('blocks voluntary range-up after Stun and releases when the lock is gone', () => {
    const win = resolveSkill({ skill: prison }, baseState(), { ...hit, rng: () => 0 });
    expect(win.ok).toBe(true);
    if (!win.ok) return;
    const lock = win.state.marks.find((m) => m.id === WATER_PRISON_LOCK_ID);
    expect(lock?.target).toBe(CombatActor.PLAYER);
    expect(lock?.duration).toBe(1);
    expect(voluntaryRangeIncreaseBlocked(win.state.marks, RangeMoveDirection.RETREAT)).toBe(true);
    expect(voluntaryRangeIncreaseBlocked(win.state.marks, RangeMoveDirection.APPROACH)).toBe(false);

    const locked = {
      ...createCombatState(),
      currentAp: 6,
      currentRange: CombatRange.MEDIUM,
      marks: win.state.marks,
    };
    const retreat = voluntaryPlayerMove(locked, RangeMoveDirection.RETREAT);
    expect(retreat.success).toBe(false);
    expect(retreat.blocked).toBe(true);
    expect(retreat.combatState.currentRange).toBe(CombatRange.MEDIUM);

    const approach = voluntaryPlayerMove(locked, RangeMoveDirection.APPROACH);
    expect(approach.success).toBe(true);
    expect(approach.combatState.currentRange).toBe(CombatRange.CLOSE);

    const free = {
      ...createCombatState(),
      currentAp: 6,
      currentRange: CombatRange.MEDIUM,
      marks: [],
    };
    const after = voluntaryPlayerMove(free, RangeMoveDirection.RETREAT);
    expect(after.success).toBe(true);
    expect(after.combatState.currentRange).toBe(CombatRange.LONG);
  });
});
