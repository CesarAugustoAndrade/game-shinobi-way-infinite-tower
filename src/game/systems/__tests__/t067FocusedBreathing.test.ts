/**
 * T-067 AC: Focused Breathing SUPPORT — +8 CP + next CP upkeep −2 once.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatRange,
  EffectType,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { MODE_DEFINITIONS } from '../../constants/modes';
import { activateMode, applyModeUpkeep, emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { applyCpUpkeepDiscount } from '../FocusedBreathingDiscountSystem';

const breath = SKILLS.FOCUSED_BREATHING;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 5, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [breath],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

describe('T-067 authoring', () => {
  it('declares SUPPORT AP1 CP0 CD2 and not CHAKRA_REGEN 10', () => {
    expect(breath.cardRole).toBe(CardRole.SUPPORT);
    expect(breath.apCost).toBe(1);
    expect(breath.chakraCost).toBe(0);
    expect(breath.cooldown).toBe(2);
    expect(breath.hpCost).toBe(0);
    expect(breath.baseDamage).toBe(0);
    expect(
      breath.effects?.some((e) => e.type === EffectType.CHAKRA_REGEN && e.value === 10),
    ).toBeFalsy();
  });
});

describe('T-067 grant', () => {
  it('grants +8 CP, arms pending 2, pays AP1, and deals no damage', () => {
    const result = resolveSkill({ skill: breath }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.chakra).toBe(13);
    expect(result.state.pendingCpUpkeepDiscount).toBe(2);
    expect(result.state.pools.ap).toBe(5);
    const used = result.state.skills.find((s) => s.id === breath.id);
    expect(used?.readyOnTurn).toBe(5);
  });
});

describe('T-067 discount', () => {
  it('cuts first CP upkeep 4→2 and leaves the second full', () => {
    const hpOnly = applyCpUpkeepDiscount({ hp: 8 }, 2);
    expect(hpOnly.consumed).toBe(false);
    expect(hpOnly.remaining).toBe(2);
    expect(hpOnly.cost.hp).toBe(8);

    const on = activateMode(emptyModeBoard(), MODE_DEFINITIONS.byakugan, {
      ap: 10,
      chakra: 20,
      hp: 40,
    }, 1);
    expect(on.ok).toBe(true);

    const first = applyModeUpkeep(
      on.board,
      ['byakugan'],
      { ap: 10, chakra: 20, hp: 40 },
      2,
      { cpUpkeepDiscount: 2 },
    );
    expect(first.ok).toBe(true);
    expect(first.pools.chakra).toBe(18);
    expect(first.cpUpkeepDiscount).toBe(0);

    const second = applyModeUpkeep(
      first.board,
      ['byakugan'],
      { ap: 10, chakra: 20, hp: 40 },
      3,
    );
    expect(second.ok).toBe(true);
    expect(second.pools.chakra).toBe(16);
    expect(second.cpUpkeepDiscount).toBeUndefined();
  });
});
