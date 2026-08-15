/**
 * T-063 AC: Iaido ATTACK 12 CLOSE — Cloaked Setup ×1.5 after T-062 crit.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, SkillTag } from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const iaido = SKILLS.IAIDO;
const cloak = SKILLS.CLOAK_INVIS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [iaido, cloak],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: iaido.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-063 authoring', () => {
  it('declares ATTACK AP2 CP1 CD3 CLOSE 12 and not critBonus 40', () => {
    expect(iaido.cardRole).toBe(CardRole.ATTACK);
    expect(iaido.apCost).toBe(2);
    expect(iaido.chakraCost).toBe(1);
    expect(iaido.cooldown).toBe(3);
    expect(iaido.hpCost).toBe(0);
    expect(iaido.baseDamage).toBe(12);
    expect(iaido.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(iaido.tags).toEqual(expect.arrayContaining([SkillTag.WEAPON, SkillTag.PHYSICAL]));
    expect(iaido.critBonus).not.toBe(40);
    expect(iaido.hitCount ?? 1).toBe(1);
  });
});

describe('T-063 base', () => {
  it('deals 12 without Cloak', () => {
    const result = resolveSkill({ skill: iaido }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(12);
    expect(result.state.marks.some((m) => m.id === 'cloaked')).toBe(false);
  });
});

describe('T-063 cloak', () => {
  it('applies Setup 12→28 and consumes Cloaked on hit', () => {
    const planted = resolveSkill({ skill: cloak }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    expect(planted.state.marks.some((m) => m.id === 'cloaked')).toBe(true);
    const armed = resolveSkill({ skill: iaido }, planted.state, hit);
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.damageDealt).toBeGreaterThanOrEqual(18);
    expect(armed.damageDealt).toBe(28);
    expect(armed.state.marks.some((m) => m.id === 'cloaked')).toBe(false);
  });

  it('consumes Cloaked on a full miss with no damage', () => {
    const planted = resolveSkill({ skill: cloak }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const whiff = resolveSkill({ skill: iaido }, planted.state, miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'cloaked')).toBe(false);
  });
});
