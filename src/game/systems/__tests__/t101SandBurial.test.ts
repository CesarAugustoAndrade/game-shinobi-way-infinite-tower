/**
 * T-101 AC: Sand Burial ATTACK — 18 M/L; +50% vs Coffined/Stunned; consume Coffined only.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const burial = SKILLS.SAND_BURIAL;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [burial],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const coffined = {
  id: 'coffined',
  sourceSkillId: 'sand_coffin',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 2,
  stacks: 1,
  family: MarkFamily.HARD_CONTROL,
};

const stun = {
  id: 'stun-enemy-sand_coffin',
  name: 'Stun',
  duration: 1,
  effect: { type: EffectType.STUN, duration: 1, chance: 1 },
  source: 'sand_coffin',
};

const hit = { rollHit: () => ({ hit: true, damage: burial.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function hasStun(buffs: { effect: { type: EffectType }; duration: number }[] | undefined): boolean {
  return (buffs ?? []).some((b) => b.effect.type === EffectType.STUN && b.duration === 1);
}

describe('T-101 authoring', () => {
  it('declares ATTACK AP3 CP6 CD3 18 MEDIUM·LONG + setupRead coffined 0.5 consume + stun OR', () => {
    expect(burial.id).toBe('sand_burial');
    expect(burial.cardRole).toBe(CardRole.ATTACK);
    expect(burial.apCost).toBe(3);
    expect(burial.chakraCost).toBe(6);
    expect(burial.cooldown).toBe(3);
    expect(burial.hpCost).toBe(0);
    expect(burial.baseDamage).toBe(18);
    expect(burial.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(burial.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(burial.setupRead).toEqual({
      markId: 'coffined',
      damageMultBonus: 0.5,
      consume: true,
      alsoIfEnemyStunned: true,
    });
    expect(burial.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.EARTH]));
    expect(burial.description.toLowerCase()).not.toContain('25%');
    expect(burial.description.toLowerCase()).not.toContain('+100%');
  });
});

describe('T-101 coffined', () => {
  it('deals floor(18*1.5) and consumes coffined; miss leaves the mark', () => {
    const result = resolveSkill({ skill: burial }, baseState({ marks: [{ ...coffined }] }), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(Math.floor(18 * 1.5));
    expect(result.state.marks.some((m) => m.id === 'coffined')).toBe(false);

    const whiff = resolveSkill({ skill: burial }, baseState({ marks: [{ ...coffined }] }), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'coffined')).toBe(true);

    const close = resolveSkill({ skill: burial }, baseState({ range: CombatRange.CLOSE }), hit);
    expect(close.ok).toBe(false);
  });
});

describe('T-101 stun baseline', () => {
  it('stunned-only pays 1.5 and keeps Stun; neither Coffined nor Stun is baseline 18', () => {
    const stunned = resolveSkill(
      { skill: burial },
      baseState({ enemyBuffs: [{ ...stun, effect: { ...stun.effect } }] }),
      hit,
    );
    expect(stunned.ok).toBe(true);
    if (!stunned.ok) return;
    expect(stunned.damageDealt).toBe(Math.floor(18 * 1.5));
    expect(hasStun(stunned.state.enemyBuffs)).toBe(true);
    expect(stunned.state.marks.some((m) => m.id === 'coffined')).toBe(false);

    const both = resolveSkill(
      { skill: burial },
      baseState({
        marks: [{ ...coffined }],
        enemyBuffs: [{ ...stun, effect: { ...stun.effect } }],
      }),
      hit,
    );
    expect(both.ok).toBe(true);
    if (!both.ok) return;
    expect(both.damageDealt).toBe(Math.floor(18 * 1.5));
    expect(both.state.marks.some((m) => m.id === 'coffined')).toBe(false);
    expect(hasStun(both.state.enemyBuffs)).toBe(true);

    const bare = resolveSkill({ skill: burial }, baseState(), hit);
    expect(bare.ok).toBe(true);
    if (!bare.ok) return;
    expect(bare.damageDealt).toBe(18);

    const atLong = resolveSkill(
      { skill: burial },
      baseState({ range: CombatRange.LONG }),
      hit,
    );
    expect(atLong.ok).toBe(true);
    if (!atLong.ok) return;
    expect(atLong.damageDealt).toBe(18);
  });
});
