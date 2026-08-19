/**
 * T-114 AC: Rasenshuriken ATTACK — 6×5 M/L; clones ON +50% + consume 2 charges.
 *
 * Enhance floor on total: Math.floor(6 * 5 * 1.5) (T-018 / T-033 convention).
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatRange,
  DamageProperty,
  DamageType,
  ModeRuntimeState,
  SkillTag,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const shuriken = SKILLS.RASENSHURIKEN;
const BASELINE = 6 * 5;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 8, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [shuriken],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

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

const hit = { rollHit: () => ({ hit: true, damage: shuriken.baseDamage }) };

describe('T-114 authoring', () => {
  it('declares ATTACK AP6 CP20 CD5 6×5 MEDIUM·LONG + clones consume 2 +50%', () => {
    expect(shuriken.id).toBe('rasenshuriken');
    expect(shuriken.cardRole).toBe(CardRole.ATTACK);
    expect(shuriken.apCost).toBe(6);
    expect(shuriken.chakraCost).toBe(20);
    expect(shuriken.hpCost).toBe(0);
    expect(shuriken.cooldown).toBe(5);
    expect(shuriken.hitCount).toBe(6);
    expect(shuriken.baseDamage).toBe(5);
    expect(shuriken.damageType).toBe(DamageType.ELEMENTAL);
    expect(shuriken.damageProperty).toBe(DamageProperty.PIERCING);
    expect(shuriken.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(shuriken.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(shuriken.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'shadow_clone',
        family: MODE_FAMILY.CLONES,
        consumeCharges: 2,
        damageMultBonus: 0.5,
      }),
    );
    expect(shuriken.modeInteraction?.requireOn).toBeFalsy();
    expect(shuriken.tags).toEqual(
      expect.arrayContaining([
        SkillTag.UZUMAKI,
        SkillTag.NINJUTSU,
        SkillTag.WIND,
        SkillTag.MULTI_HIT,
      ]),
    );
    expect(shuriken.damageType).not.toBe(DamageType.TRUE);
    expect(shuriken.baseDamage).not.toBe(15);
  });
});

describe('T-114 base', () => {
  it('lands 6 hits for baseline 30 with no Mode and spends nothing', () => {
    const result = resolveSkill({ skill: shuriken }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(6);
    expect(result.damageDealt).toBe(BASELINE);
    expect(result.state.modes.instances).toHaveLength(0);
    expect(result.state.pools.ap).toBe(2);
    expect(result.state.pools.chakra).toBe(0);

    const close = resolveSkill(
      { skill: shuriken },
      baseState({ range: CombatRange.CLOSE }),
      hit,
    );
    expect(close.ok).toBe(false);
  });
});

describe('T-114 clones', () => {
  it('applies +50% on the 6-hit total and spends 2 clone charges', () => {
    const result = resolveSkill(
      { skill: shuriken },
      baseState({ modes: clonesOn(3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(6);
    expect(result.damageDealt).toBe(Math.floor(BASELINE * 1.5));
    const mode = result.state.modes.instances.find((m) => m.id === 'shadow_clone');
    expect(mode?.charges).toBe(1);
    expect(mode?.state).toBe(ModeRuntimeState.ON);

    const short = resolveSkill(
      { skill: shuriken },
      baseState({ modes: clonesOn(1) }),
      hit,
    );
    expect(short.ok).toBe(true);
    if (!short.ok) return;
    expect(short.damageDealt).toBe(BASELINE);
    expect(short.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges).toBe(1);
  });
});
