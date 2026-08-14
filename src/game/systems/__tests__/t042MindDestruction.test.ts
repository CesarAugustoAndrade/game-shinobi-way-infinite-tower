/**
 * T-042 AC: Mind Destruction — ATTACK 15 + 65% Confusion 2; Read Mind Setup +50% no consume.
 *
 * Setup read is mark-only (no Mode ON). Threshold: rng() < 0.65 → Confusion.
 * Rounding: Math.floor(15 * 1.5) === 22.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatActor, CombatRange, EffectType } from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const mind = SKILLS.MIND_DESTRUCTION;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [mind],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const readMind = {
  id: 'read_mind',
  sourceSkillId: 'false_surroundings',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 2,
  stacks: 1,
};

const hit = { rollHit: () => ({ hit: true, damage: mind.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function hasConfusion(buffs: { effect: { type: EffectType }; duration: number }[] | undefined): boolean {
  return (buffs ?? []).some((b) => b.effect.type === EffectType.CONFUSION && b.duration === 2);
}

describe('T-042 authoring', () => {
  it('declares ATTACK 15 + Confusion 2 @0.65 + Read Mind Setup +50% no consume', () => {
    expect(mind.cardRole).toBe(CardRole.ATTACK);
    expect(mind.apCost).toBe(3);
    expect(mind.chakraCost).toBe(6);
    expect(mind.cooldown).toBe(4);
    expect(mind.hpCost).toBe(0);
    expect(mind.baseDamage).toBe(15);
    expect(mind.controlConfusion).toEqual({ chance: 0.65, enemyDuration: 2 });
    expect(mind.setupRead).toEqual({
      markId: 'read_mind',
      damageMultBonus: 0.5,
      consume: false,
    });
    expect(mind.modeInteraction).toBeUndefined();
    expect(
      mind.effects?.some((e) => e.type === EffectType.CONFUSION && e.duration === 3 && e.chance === 1.0),
    ).toBeFalsy();
  });
});

describe('T-042 baseline', () => {
  it('deals 15 with no Read Mind; Confusion only when rng < 0.65', () => {
    const win = resolveSkill({ skill: mind }, baseState(), { ...hit, rng: () => 0 });
    expect(win.ok).toBe(true);
    if (!win.ok) return;
    expect(win.damageDealt).toBe(15);
    expect(hasConfusion(win.state.enemyBuffs)).toBe(true);
    expect(win.state.modes.instances).toHaveLength(0);

    const lose = resolveSkill({ skill: mind }, baseState(), { ...hit, rng: () => 0.65 });
    expect(lose.ok).toBe(true);
    if (!lose.ok) return;
    expect(lose.damageDealt).toBe(15);
    expect(hasConfusion(lose.state.enemyBuffs)).toBe(false);

    const whiff = resolveSkill({ skill: mind }, baseState(), { ...miss, rng: () => 0 });
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(hasConfusion(whiff.state.enemyBuffs)).toBe(false);
  });
});

describe('T-042 setup read', () => {
  it('applies Setup +50% without consuming read_mind and without Mode', () => {
    const planted = baseState({ marks: [{ ...readMind }] });
    const result = resolveSkill({ skill: mind }, planted, { ...hit, rng: () => 0.99 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(22);
    const remaining = result.state.marks.find((m) => m.id === 'read_mind');
    expect(remaining?.duration).toBe(2);
    expect(remaining?.stacks).toBe(1);
    expect(remaining?.target).toBe(CombatActor.ENEMY);
    expect(result.state.modes.instances).toHaveLength(0);
    expect(hasConfusion(result.state.enemyBuffs)).toBe(false);

    const inputMark = planted.marks[0];
    expect(inputMark.duration).toBe(2);
    expect(result.state.marks).not.toBe(planted.marks);
  });
});
