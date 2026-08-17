/**
 * T-097 AC: Adamantine Chains ATTACK — 20 M/L; PULL to CLOSE; 70% Stun 1; −1 SPD×2.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  PrimaryStat,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const chains = SKILLS.ADAMANTINE_CHAINS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.LONG,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [chains],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: chains.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function hasStun(buffs: { effect: { type: EffectType }; duration: number }[] | undefined): boolean {
  return (buffs ?? []).some((b) => b.effect.type === EffectType.STUN && b.duration === 1);
}

describe('T-097 authoring', () => {
  it('declares ATTACK AP3 CP6 CD4 20 MEDIUM·LONG + PULL 2 + Stun 0.7 + SPD −1×2', () => {
    expect(chains.id).toBe('adamantine_chains');
    expect(chains.cardRole).toBe(CardRole.ATTACK);
    expect(chains.apCost).toBe(3);
    expect(chains.chakraCost).toBe(6);
    expect(chains.cooldown).toBe(4);
    expect(chains.hpCost).toBe(0);
    expect(chains.baseDamage).toBe(20);
    expect(chains.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(chains.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(chains.bandMove).toEqual({ kind: 'PULL', steps: 2, requireHit: true });
    expect(chains.impactStun).toEqual({ chance: 0.7, duration: 1 });
    expect(chains.tags).toEqual(
      expect.arrayContaining([SkillTag.UZUMAKI, SkillTag.NINJUTSU, SkillTag.PHYSICAL]),
    );
    expect(chains.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'adamantine_spd',
          duration: 2,
          stacks: 1,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
          requireHit: true,
        }),
      ]),
    );
    expect(chains.effects?.some((e) => e.type === EffectType.STUN && e.chance === 0.35)).toBeFalsy();
    expect(
      chains.effects?.some(
        (e) =>
          e.type === EffectType.DEBUFF &&
          e.targetStat === PrimaryStat.CHAKRA &&
          e.value === 0.2,
      ),
    ).toBeFalsy();
  });
});

describe('T-097 pull', () => {
  it('from LONG deals 20, PULLs to CLOSE, and does not spend the manual move', () => {
    const result = resolveSkill({ skill: chains }, baseState(), {
      ...hit,
      rng: () => 0.99,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(20);
    expect(result.state.range).toBe(CombatRange.CLOSE);
    expect(result.state.playerMoveUsedThisTurn).toBe(true);

    const fromMedium = resolveSkill(
      { skill: chains },
      baseState({ range: CombatRange.MEDIUM }),
      { ...hit, rng: () => 0.99 },
    );
    expect(fromMedium.ok).toBe(true);
    if (!fromMedium.ok) return;
    expect(fromMedium.state.range).toBe(CombatRange.CLOSE);
    expect(fromMedium.state.playerMoveUsedThisTurn).toBe(true);

    const close = resolveSkill({ skill: chains }, baseState({ range: CombatRange.CLOSE }), hit);
    expect(close.ok).toBe(false);
  });
});

describe('T-097 control', () => {
  it('plants Stun 1 when rng < 0.7, always −1 SPD×2 on hit, and miss plants nothing', () => {
    const stunned = resolveSkill({ skill: chains }, baseState(), { ...hit, rng: () => 0 });
    expect(stunned.ok).toBe(true);
    if (!stunned.ok) return;
    expect(hasStun(stunned.state.enemyBuffs)).toBe(true);
    const spd = stunned.state.marks.find((m) => m.id === 'adamantine_spd');
    expect(spd?.target).toBe(CombatActor.ENEMY);
    expect(spd?.family).toBe(MarkFamily.STAT);
    expect(spd?.stacks).toBe(1);
    expect(spd?.duration).toBe(2);

    const fail = resolveSkill({ skill: chains }, baseState(), { ...hit, rng: () => 0.7 });
    expect(fail.ok).toBe(true);
    if (!fail.ok) return;
    expect(hasStun(fail.state.enemyBuffs)).toBe(false);
    expect(fail.state.marks.some((m) => m.id === 'adamantine_spd')).toBe(true);

    const whiff = resolveSkill({ skill: chains }, baseState(), { ...miss, rng: () => 0 });
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.range).toBe(CombatRange.LONG);
    expect(hasStun(whiff.state.enemyBuffs)).toBe(false);
    expect(whiff.state.marks.some((m) => m.id === 'adamantine_spd')).toBe(false);
    expect(whiff.state.playerMoveUsedThisTurn).toBe(true);
  });
});
