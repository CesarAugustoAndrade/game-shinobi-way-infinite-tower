/**
 * T-105 AC: Clone Explosion ATTACK — 20 ANY; clones ON +50% + 1 charge + Burn 5×2.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatRange,
  MarkFamily,
  ModeRuntimeState,
  SkillTag,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const blast = SKILLS.CLONE_EXPLOSION;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [blast],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const clonesOn = {
  instances: [
    {
      id: 'shadow_clone',
      family: MODE_FAMILY.CLONES,
      charges: 3,
      state: ModeRuntimeState.ON,
    },
  ],
};

const hit = { rollHit: () => ({ hit: true, damage: blast.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

function burnMark(marks: { id: string; stacks: number; duration: number }[] | undefined) {
  return (marks ?? []).find((m) => m.id === 'burn');
}

describe('T-105 authoring', () => {
  it('declares ATTACK AP4 CP7 HP10 CD5 20 ANY + clones 0.5 + Burn 5×2 gated', () => {
    expect(blast.id).toBe('clone_explosion');
    expect(blast.cardRole).toBe(CardRole.ATTACK);
    expect(blast.apCost).toBe(4);
    expect(blast.chakraCost).toBe(7);
    expect(blast.hpCost).toBe(10);
    expect(blast.cooldown).toBe(5);
    expect(blast.baseDamage).toBe(20);
    expect(blast.allowedRanges).toBeUndefined();
    expect(blast.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'shadow_clone',
        family: MODE_FAMILY.CLONES,
        consumeCharges: 1,
        damageMultBonus: 0.5,
      }),
    );
    expect(blast.modeInteraction?.requireOn).toBeFalsy();
    expect(blast.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'burn',
          stacks: 5,
          duration: 2,
          family: MarkFamily.DOT,
          requireHit: true,
          requireModeEnhance: true,
        }),
      ]),
    );
    expect(blast.tags).toEqual(
      expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.FIRE, SkillTag.UZUMAKI]),
    );
  });
});

describe('T-105 base', () => {
  it('deals 20 with no Mode, spends no charges, plants no burn', () => {
    const result = resolveSkill({ skill: blast }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(20);
    expect(result.state.pools.ap).toBe(2);
    expect(result.state.pools.chakra).toBe(13);
    expect(result.state.pools.hp).toBe(30);
    expect(result.state.modes.instances).toHaveLength(0);
    expect(burnMark(result.state.marks)).toBeUndefined();
  });
});

describe('T-105 clones', () => {
  it('spends 1 charge, deals floor(20*1.5), plants Burn 5×2; miss spends charge without burn', () => {
    const landed = resolveSkill(
      { skill: blast },
      baseState({ modes: clonesOn, range: CombatRange.LONG }),
      hit,
    );
    expect(landed.ok).toBe(true);
    if (!landed.ok) return;
    expect(landed.damageDealt).toBe(Math.floor(20 * 1.5));
    expect(landed.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges).toBe(2);
    const burn = burnMark(landed.state.marks);
    expect(burn?.stacks).toBe(5);
    expect(burn?.duration).toBe(2);

    const whiff = resolveSkill({ skill: blast }, baseState({ modes: clonesOn }), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges).toBe(2);
    expect(burnMark(whiff.state.marks)).toBeUndefined();
  });
});
