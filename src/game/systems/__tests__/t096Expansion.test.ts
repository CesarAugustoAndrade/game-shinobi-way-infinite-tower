/**
 * T-096 AC: Expansion ATTACK — 16 CLOSE + self +2 STR until next enemy response.
 *
 * +2 STR is a STAT mark (stacks 2, duration 1). StatSystem does not yet read
 * marks into primary STRENGTH — that hook is deferred; the integer contract
 * lives on the mark so we do not keep STR % identity.
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

const jutsu = SKILLS.EXPANSION;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [jutsu],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: jutsu.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-096 authoring', () => {
  it('declares ATTACK AP3 CP6 CD4 16 CLOSE + STR +2/1 and not STR 0.5', () => {
    expect(jutsu.id).toBe('expansion');
    expect(jutsu.cardRole).toBe(CardRole.ATTACK);
    expect(jutsu.apCost).toBe(3);
    expect(jutsu.chakraCost).toBe(6);
    expect(jutsu.cooldown).toBe(4);
    expect(jutsu.hpCost).toBe(0);
    expect(jutsu.baseDamage).toBe(16);
    expect(jutsu.allowedRanges).toEqual([CombatRange.CLOSE]);
    expect(jutsu.stanceShift).toBeUndefined();
    expect(jutsu.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.PHYSICAL]));
    expect(jutsu.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'expansion_str',
          duration: 1,
          stacks: 2,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      jutsu.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.STRENGTH &&
          e.value === 0.5,
      ),
    ).toBeFalsy();
  });
});

describe('T-096 resolve', () => {
  it('deals 16 at CLOSE and plants self +2 STR duration 1 (also on miss)', () => {
    const result = resolveSkill({ skill: jutsu }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(16);
    const mark = result.state.marks.find((m) => m.id === 'expansion_str');
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.family).toBe(MarkFamily.STAT);
    expect(mark?.stacks).toBe(2);
    expect(mark?.duration).toBe(1);

    const whiff = resolveSkill({ skill: jutsu }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    const missMark = whiff.state.marks.find((m) => m.id === 'expansion_str');
    expect(missMark?.stacks).toBe(2);
    expect(missMark?.duration).toBe(1);
  });
});

describe('T-096 range', () => {
  it('rejects MEDIUM and consumes nothing', () => {
    const start = baseState({ range: CombatRange.MEDIUM });
    const result = resolveSkill({ skill: jutsu }, start, hit);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.state.pools.ap).toBe(6);
    expect(result.state.pools.chakra).toBe(20);
    expect(result.state.marks).toHaveLength(0);
  });
});
