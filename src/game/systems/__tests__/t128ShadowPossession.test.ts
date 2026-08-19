/**
 * T-128 AC: Shadow Possession SUPPORT — 80% Bound 1; next ATTACK +20% Setup; not Stun/Reflect.
 *
 * Policy: rng() < 0.8 → enemy Bound 1 (0 succeeds, 0.8 / 0.99 fail). Fail: no Bound, no self-stun.
 * ATTACK vs Bound: ×1.2 Setup, consume on ≥1 hit, keep on miss. SIDE ignores.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkConsumeTiming,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const possession = SKILLS.SHADOW_POSSESSION;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [possession],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const nextAttack = createMockSkill({
  id: 'next_attack',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  hitCount: 1,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const nextSide = createMockSkill({
  id: 'next_side',
  cardRole: CardRole.SIDE_ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  hitCount: 1,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const hit = (skill: { baseDamage: number }) => ({
  rollHit: () => ({ hit: true, damage: skill.baseDamage }),
});
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
): boolean {
  return (buffs ?? []).some((buff) => buff.effect.type === EffectType.STUN);
}

describe('T-128 authoring', () => {
  it('declares SUPPORT AP2 CP6 CD5 + 80% Bound 1 and not STUN+REFLECT', () => {
    expect(possession.id).toBe('shadow_possession');
    expect(possession.cardRole).toBe(CardRole.SUPPORT);
    expect(possession.actionType).toBe(ActionType.ACTIVE);
    expect(possession.apCost).toBe(2);
    expect(possession.chakraCost).toBe(6);
    expect(possession.cooldown).toBe(5);
    expect(possession.hpCost).toBe(0);
    expect(possession.baseDamage).toBe(0);
    expect(possession.tags).toEqual(
      expect.arrayContaining([SkillTag.GENJUTSU, SkillTag.MENTAL, SkillTag.MARK]),
    );
    expect(possession.controlBound).toEqual({ chance: 0.8, enemyDuration: 1 });
    expect(possession.controlStun).toBeUndefined();
    expect(possession.effects?.some((e) => e.type === EffectType.STUN)).toBeFalsy();
    expect(possession.effects?.some((e) => e.type === EffectType.REFLECTION)).toBeFalsy();
    expect(possession.modeInteraction).toBeUndefined();
  });
});

describe('T-128 plant', () => {
  it('plants enemy Bound 1 on success and nothing on fail; never stuns or damages', () => {
    const win = resolveSkill({ skill: possession }, baseState(), { rng: () => 0 });
    expect(win.ok).toBe(true);
    if (!win.ok) return;
    expect(win.damageDealt).toBe(0);
    expect(win.state.pools.ap).toBe(4);
    expect(win.state.pools.chakra).toBe(14);
    const mark = win.state.marks.find((m) => m.id === 'bound');
    expect(mark?.target).toBe(CombatActor.ENEMY);
    expect(mark?.duration).toBe(1);
    expect(mark?.stacks).toBe(1);
    expect(mark?.family).toBe(MarkFamily.HARD_CONTROL);
    expect(mark?.consume).toBe(MarkConsumeTiming.IMPACT);
    expect(hasStun(win.state.enemyBuffs)).toBe(false);
    expect(hasStun(win.state.playerBuffs)).toBe(false);

    const lose = resolveSkill({ skill: possession }, baseState(), { rng: () => 0.8 });
    expect(lose.ok).toBe(true);
    if (!lose.ok) return;
    expect(lose.damageDealt).toBe(0);
    expect(lose.state.marks.some((m) => m.id === 'bound')).toBe(false);
    expect(hasStun(lose.state.enemyBuffs)).toBe(false);
    expect(hasStun(lose.state.playerBuffs)).toBe(false);
    expect(lose.state.pools.ap).toBe(4);
  });
});

describe('T-128 setup', () => {
  it('boosts ATTACK 10→12 and consumes Bound on hit', () => {
    const planted = resolveSkill({ skill: possession }, baseState(), { rng: () => 0 });
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const armed = resolveSkill({ skill: nextAttack }, planted.state, hit(nextAttack));
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.damageDealt).toBe(12);
    expect(armed.state.marks.some((m) => m.id === 'bound')).toBe(false);
  });

  it('leaves Bound on a full ATTACK miss', () => {
    const planted = resolveSkill({ skill: possession }, baseState(), { rng: () => 0 });
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const whiff = resolveSkill({ skill: nextAttack }, planted.state, miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'bound')).toBe(true);
  });

  it('does not trigger on a SIDE hit', () => {
    const planted = resolveSkill({ skill: possession }, baseState(), { rng: () => 0 });
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const side = resolveSkill({ skill: nextSide }, planted.state, hit(nextSide));
    expect(side.ok).toBe(true);
    if (!side.ok) return;
    expect(side.damageDealt).toBe(10);
    expect(side.state.marks.some((m) => m.id === 'bound')).toBe(true);
  });

  it('does not apply this package without Bound', () => {
    const clean = resolveSkill({ skill: nextAttack }, baseState({ skills: [nextAttack] }), hit(nextAttack));
    expect(clean.ok).toBe(true);
    if (!clean.ok) return;
    expect(clean.damageDealt).toBe(10);
    expect(clean.state.marks.some((m) => m.id === 'bound')).toBe(false);
  });
});
