/**
 * T-058 AC: Senbon — SIDE 7 MEDIUM/LONG; 35% Silence 1 on impact.
 *
 * Threshold: rng() < 0.35 → silence (0 succeeds, 0.35 fails).
 */

import { describe, it, expect } from 'vitest';
import {
  AttackMethod,
  CardRole,
  CombatRange,
  EffectType,
  ModeRuntimeState,
  SkillTag,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const needle = SKILLS.SENBON;

function clonesOn(charges: number) {
  return {
    instances: [
      {
        id: 'shadow_clone',
        family: MODE_FAMILY.CLONES,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [needle],
    playerBuffs: [],
    enemyBuffs: [],
    enemyModes: clonesOn(3),
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: needle.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function hasSilence(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration: number,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.SILENCE && buff.duration === duration,
  );
}

describe('T-058 authoring', () => {
  it('declares SIDE AP1 CD1 7 at MEDIUM/LONG + impactSilence 35% / 1', () => {
    expect(needle.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(needle.apCost).toBe(1);
    expect(needle.chakraCost).toBe(0);
    expect(needle.cooldown).toBe(1);
    expect(needle.hpCost).toBe(0);
    expect(needle.baseDamage).toBe(7);
    expect(needle.attackMethod).toBe(AttackMethod.RANGED);
    expect(needle.allowedRanges).toEqual([CombatRange.MEDIUM, CombatRange.LONG]);
    expect(needle.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(needle.tags).toEqual(
      expect.arrayContaining([SkillTag.TOOL, SkillTag.WEAPON, SkillTag.PHYSICAL]),
    );
    expect(needle.impactSilence).toEqual({ chance: 0.35, duration: 1 });
    expect(needle.controlStun).toBeUndefined();
    expect(needle.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.SILENCE, duration: 1, chance: 0.35 }),
      ]),
    );
    expect(
      needle.effects?.some(
        (effect) => effect.type === EffectType.SILENCE && effect.chance === 0.5,
      ),
    ).toBeFalsy();
  });
});

describe('T-058 silence', () => {
  it('deals 7 and plants enemy Silence 1 when rng < 0.35 without ending Modes', () => {
    const result = resolveSkill({ skill: needle }, baseState(), { ...hit, rng: () => 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(7);
    expect(hasSilence(result.state.enemyBuffs, 1)).toBe(true);
    expect(hasSilence(result.state.playerBuffs, 1)).toBe(false);
    const mode = result.state.enemyModes?.instances.find((m) => m.id === 'shadow_clone');
    expect(mode?.state).toBe(ModeRuntimeState.ON);
    expect(mode?.charges).toBe(3);
  });

  it('deals 7 and plants no Silence when rng >= 0.35', () => {
    const result = resolveSkill({ skill: needle }, baseState(), { ...hit, rng: () => 0.35 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(7);
    expect(hasSilence(result.state.enemyBuffs, 1)).toBe(false);
    expect(hasSilence(result.state.playerBuffs, 1)).toBe(false);
  });
});

describe('T-058 miss', () => {
  it('deals 0 and plants no Silence on miss even when rng would succeed', () => {
    const result = resolveSkill({ skill: needle }, baseState(), { ...miss, rng: () => 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(hasSilence(result.state.enemyBuffs, 1)).toBe(false);

    const close = resolveSkill(
      { skill: needle },
      baseState({ range: CombatRange.CLOSE }),
      { ...hit, rng: () => 0 },
    );
    expect(close.ok).toBe(false);
  });
});
