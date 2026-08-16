/**
 * T-074 AC: Bunshin SUPPORT — Decoy 1 (−20); no clone charges; no SIDE weight.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  PrimaryStat,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { applyDecoyOutgoing } from '../MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const bunshin = SKILLS.BUNSHIN;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [bunshin],
    playerBuffs: [],
    enemyHp: 80,
    pendingSupportWeights: [],
    ...overrides,
  };
}

describe('T-074 authoring', () => {
  it('declares SUPPORT AP1 CP1 CD3 decoy 1/20 and not SPEED +0.2 or SIDE weight', () => {
    expect(bunshin.cardRole).toBe(CardRole.SUPPORT);
    expect(bunshin.apCost).toBe(1);
    expect(bunshin.chakraCost).toBe(1);
    expect(bunshin.cooldown).toBe(3);
    expect(bunshin.hpCost).toBe(0);
    expect(bunshin.baseDamage).toBe(0);
    expect(bunshin.nextDrawRoleBonus).toBeUndefined();
    expect(bunshin.modeInteraction).toBeUndefined();
    expect(bunshin.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'decoy',
          duration: 1,
          stacks: 20,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
        }),
      ]),
    );
    expect(
      bunshin.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.SPEED &&
          e.value === 0.2,
      ),
    ).toBeFalsy();
  });
});

describe('T-074 plant', () => {
  it('plants decoy, deals 0, and leaves Mode board empty', () => {
    const start = baseState();
    const result = resolveSkill({ skill: bunshin }, start);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const mark = result.state.marks.find((m) => m.id === 'decoy');
    expect(mark?.target).toBe(CombatActor.ENEMY);
    expect(mark?.duration).toBe(1);
    expect(mark?.stacks).toBe(20);
    expect(result.state.modes.instances).toHaveLength(0);
    expect(result.state.pendingSupportWeights ?? []).toHaveLength(0);
    const cut = applyDecoyOutgoing(40, result.state.marks);
    expect(cut.damage).toBe(20);
    expect(cut.consumed).toBe(true);
  });
});

describe('T-074 costs', () => {
  it('pays AP1 CP1 and sets readyOnTurn to T+CD+1', () => {
    const result = resolveSkill({ skill: bunshin }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.pools.ap).toBe(5);
    expect(result.state.pools.chakra).toBe(19);
    const used = result.state.skills.find((s) => s.id === bunshin.id);
    expect(used?.readyOnTurn).toBe(6);
  });
});
