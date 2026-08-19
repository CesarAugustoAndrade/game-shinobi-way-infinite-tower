/**
 * T-117 AC: Basic Strike ATTACK — 12 CLOSE; CD 0; no Mode; explicit cardRole.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, ModeRuntimeState, SkillTag } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { resolveCardRole } from '../CardContractSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const strike = SKILLS.BASIC_ATTACK;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [strike],
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

const hit = { rollHit: () => ({ hit: true, damage: strike.baseDamage }) };

describe('T-117 authoring', () => {
  it('declares ATTACK AP2 CP0 CD0 12 CLOSE and no Mode', () => {
    expect(strike.id).toBe('basic_atk');
    expect(strike.cardRole).toBe(CardRole.ATTACK);
    expect(strike.apCost).toBe(2);
    expect(strike.chakraCost).toBe(0);
    expect(strike.hpCost).toBe(0);
    expect(strike.cooldown).toBe(0);
    expect(strike.baseDamage).toBe(12);
    expect(strike.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(strike.modeInteraction).toBeUndefined();
    expect(strike.tags).toEqual(expect.arrayContaining([SkillTag.TAIJUTSU, SkillTag.PHYSICAL]));
  });
});

describe('T-117 hit', () => {
  it('from CLOSE deals 12 and leaves Mode charges unchanged', () => {
    const result = resolveSkill(
      { skill: strike },
      baseState({ modes: clonesOn(3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(12);
    expect(result.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges).toBe(3);

    const mid = resolveSkill(
      { skill: strike },
      baseState({ range: CombatRange.MEDIUM }),
      hit,
    );
    expect(mid.ok).toBe(false);
  });
});

describe('T-117 role', () => {
  it('resolveCardRole returns ATTACK without an authoringMap fallback', () => {
    expect(strike.cardRole).toBe(CardRole.ATTACK);
    expect(resolveCardRole(strike)).toEqual({ ok: true, role: CardRole.ATTACK });
    expect(resolveCardRole({ id: strike.id, cardRole: strike.cardRole })).toEqual({
      ok: true,
      role: CardRole.ATTACK,
    });
  });
});
