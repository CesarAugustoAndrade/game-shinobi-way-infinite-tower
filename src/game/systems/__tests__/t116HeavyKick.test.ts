/**
 * T-116 AC: Heavy Kick ATTACK — 14 CLOSE; no Mode; explicit cardRole.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, ModeRuntimeState, SkillTag } from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { resolveCardRole } from '../CardContractSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const kick = SKILLS.HEAVY_KICK;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [kick],
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

const hit = { rollHit: () => ({ hit: true, damage: kick.baseDamage }) };

describe('T-116 authoring', () => {
  it('declares ATTACK AP2 CP0 CD1 14 CLOSE and no Mode', () => {
    expect(kick.id).toBe('heavy_kick');
    expect(kick.cardRole).toBe(CardRole.ATTACK);
    expect(kick.apCost).toBe(2);
    expect(kick.chakraCost).toBe(0);
    expect(kick.hpCost).toBe(0);
    expect(kick.cooldown).toBe(1);
    expect(kick.baseDamage).toBe(14);
    expect(kick.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(kick.modeInteraction).toBeUndefined();
    expect(kick.tags).toEqual(expect.arrayContaining([SkillTag.TAIJUTSU, SkillTag.PHYSICAL]));
  });
});

describe('T-116 hit', () => {
  it('from CLOSE deals 14 and leaves Mode charges unchanged', () => {
    const result = resolveSkill(
      { skill: kick },
      baseState({ modes: clonesOn(3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(14);
    expect(result.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges).toBe(3);

    const mid = resolveSkill(
      { skill: kick },
      baseState({ range: CombatRange.MEDIUM }),
      hit,
    );
    expect(mid.ok).toBe(false);
  });
});

describe('T-116 role', () => {
  it('resolveCardRole returns ATTACK without an authoringMap fallback', () => {
    expect(kick.cardRole).toBe(CardRole.ATTACK);
    expect(resolveCardRole(kick)).toEqual({ ok: true, role: CardRole.ATTACK });
    expect(resolveCardRole({ id: kick.id, cardRole: kick.cardRole })).toEqual({
      ok: true,
      role: CardRole.ATTACK,
    });
  });
});
