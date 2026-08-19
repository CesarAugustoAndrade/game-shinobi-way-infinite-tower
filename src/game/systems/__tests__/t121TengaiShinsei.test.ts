/**
 * T-121 AC: Tengai Shinsei ATTACK — 35 LONG; Stun 1; PUSH 2 to LONG; no Mode.
 *
 * Playable LONG-only. Force-LONG from closer bands uses a range-override fixture.
 * Stun and PUSH are hit-gated.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, DamageType, EffectType, SkillTag } from '../../types';
import { SKILLS } from '../../constants/skills';
import { resolveCardRole } from '../CardContractSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const meteor = SKILLS.TENGAI_SHINSEI;
const closer = {
  ...meteor,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
};

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 8, chakra: 30, hp: 40, maxHp: 40 },
    range: CombatRange.LONG,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [meteor],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: meteor.baseDamage }), rng: () => 0 };
const miss = { rollHit: () => ({ hit: false, damage: 0 }), rng: () => 0 };

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration = 1,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

describe('T-121 authoring', () => {
  it('declares ATTACK AP6 CP27 CD8 35 LONG + Stun 1 + PUSH 2, not TRUE 27', () => {
    expect(meteor.id).toBe('tengai_shinsei');
    expect(meteor.cardRole).toBe(CardRole.ATTACK);
    expect(meteor.apCost).toBe(6);
    expect(meteor.chakraCost).toBe(27);
    expect(meteor.hpCost).toBe(0);
    expect(meteor.cooldown).toBe(8);
    expect(meteor.baseDamage).toBe(35);
    expect(meteor.baseDamage).not.toBe(27);
    expect(meteor.damageType).toBe(DamageType.ELEMENTAL);
    expect(meteor.damageType).not.toBe(DamageType.TRUE);
    expect(meteor.element).toBeDefined();
    expect(meteor.allowedRanges).toEqual([CombatRange.LONG]);
    expect(meteor.bandMove).toEqual({ kind: 'PUSH', steps: 2, requireHit: true });
    expect(meteor.impactStun).toEqual({ chance: 1, duration: 1 });
    expect(meteor.modeInteraction).toBeUndefined();
    expect(meteor.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.EARTH]));
    expect(resolveCardRole(meteor)).toEqual({ ok: true, role: CardRole.ATTACK });
  });
});

describe('T-121 hit', () => {
  it('from LONG deals 35, Stuns 1, stays LONG; CLOSE/MEDIUM reject; miss no Stun', () => {
    const result = resolveSkill({ skill: meteor }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(1);
    expect(result.damageDealt).toBe(35);
    expect(result.state.range).toBe(CombatRange.LONG);
    expect(hasStun(result.state.enemyBuffs, 1)).toBe(true);
    expect(result.state.pools.ap).toBe(2);
    expect(result.state.pools.chakra).toBe(3);
    expect(result.state.playerMoveUsedThisTurn).toBe(true);

    const close = resolveSkill({ skill: meteor }, baseState({ range: CombatRange.CLOSE }), hit);
    expect(close.ok).toBe(false);
    const mid = resolveSkill({ skill: meteor }, baseState({ range: CombatRange.MEDIUM }), hit);
    expect(mid.ok).toBe(false);

    const whiff = resolveSkill({ skill: meteor }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.range).toBe(CombatRange.LONG);
    expect(hasStun(whiff.state.enemyBuffs, 1)).toBe(false);
    expect(whiff.state.pools.ap).toBe(2);
  });
});

describe('T-121 long', () => {
  it('PUSH 2 from CLOSE/MEDIUM fixture ends at LONG; LONG hit stays LONG', () => {
    const fromClose = resolveSkill(
      { skill: closer },
      baseState({ range: CombatRange.CLOSE, skills: [closer] }),
      hit,
    );
    expect(fromClose.ok).toBe(true);
    if (!fromClose.ok) return;
    expect(fromClose.damageDealt).toBe(35);
    expect(fromClose.state.range).toBe(CombatRange.LONG);
    expect(hasStun(fromClose.state.enemyBuffs, 1)).toBe(true);

    const fromMid = resolveSkill(
      { skill: closer },
      baseState({ range: CombatRange.MEDIUM, skills: [closer] }),
      hit,
    );
    expect(fromMid.ok).toBe(true);
    if (!fromMid.ok) return;
    expect(fromMid.state.range).toBe(CombatRange.LONG);

    const atLong = resolveSkill({ skill: meteor }, baseState(), hit);
    expect(atLong.ok).toBe(true);
    if (!atLong.ok) return;
    expect(atLong.state.range).toBe(CombatRange.LONG);
  });
});
