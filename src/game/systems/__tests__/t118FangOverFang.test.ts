/**
 * T-118 AC: Fang Over Fang ATTACK — 2×7 CLOSE; +15% Setup if entered CLOSE this turn.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, ModeRuntimeState, SkillTag } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { resolveCardRole } from '../CardContractSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const fang = SKILLS.FANG_OVER_FANG;
const BASELINE = 2 * 7;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [fang],
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

const hit = { rollHit: () => ({ hit: true, damage: fang.baseDamage }) };

describe('T-118 authoring', () => {
  it('declares ATTACK AP2 CP5 CD3 2×7 CLOSE and no Mode', () => {
    expect(fang.id).toBe('fang_over_fang');
    expect(fang.cardRole).toBe(CardRole.ATTACK);
    expect(fang.apCost).toBe(2);
    expect(fang.chakraCost).toBe(5);
    expect(fang.hpCost).toBe(0);
    expect(fang.cooldown).toBe(3);
    expect(fang.hitCount).toBe(2);
    expect(fang.baseDamage).toBe(7);
    expect(fang.baseDamage).not.toBe(13);
    expect(fang.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(fang.modeInteraction).toBeUndefined();
    expect(fang.setupMultIfEnteredCloseThisTurn).toBe(0.15);
    expect(fang.tags).toEqual(
      expect.arrayContaining([SkillTag.TAIJUTSU, SkillTag.PHYSICAL, SkillTag.MULTI_HIT]),
    );
    expect(resolveCardRole(fang)).toEqual({ ok: true, role: CardRole.ATTACK });
  });
});

describe('T-118 multi-hit', () => {
  it('lands 2 hits for baseline 14 with Setup inactive', () => {
    const result = resolveSkill({ skill: fang }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(2);
    expect(result.damageDealt).toBe(BASELINE);
    expect(result.state.pools.ap).toBe(4);
    expect(result.state.pools.chakra).toBe(15);

    const mid = resolveSkill({ skill: fang }, baseState({ range: CombatRange.MEDIUM }), hit);
    expect(mid.ok).toBe(false);
  });
});

describe('T-118 setup or oos', () => {
  it('applies +15% only when enteredCloseThisTurn is true; never always-on', () => {
    const armed = resolveSkill(
      { skill: fang },
      baseState({ enteredCloseThisTurn: true, modes: clonesOn(3) }),
      hit,
    );
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.hitsLanded).toBe(2);
    expect(armed.damageDealt).toBe(Math.floor(BASELINE * 1.15));
    expect(armed.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges).toBe(3);

    const idle = resolveSkill({ skill: fang }, baseState({ enteredCloseThisTurn: false }), hit);
    expect(idle.ok).toBe(true);
    if (!idle.ok) return;
    expect(idle.damageDealt).toBe(BASELINE);

    const unset = resolveSkill({ skill: fang }, baseState(), hit);
    expect(unset.ok).toBe(true);
    if (!unset.ok) return;
    expect(unset.damageDealt).toBe(BASELINE);
  });
});
