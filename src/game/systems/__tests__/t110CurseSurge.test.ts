/**
 * T-110 AC: Curse Mark Surge SUPPORT — require CURSE ON; restore 2; self Vulnerable 10×2.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  ModeRuntimeState,
  PrimaryStat,
  SkillTag,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const surge = SKILLS.CURSE_SURGE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [surge],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

function curseOn(id: 'curse_mark_1' | 'curse_mark_2', charges: number) {
  return {
    instances: [
      {
        id,
        family: MODE_FAMILY.CURSE,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

describe('T-110 authoring', () => {
  it('declares SUPPORT AP1 HP10 CD4 require CURSE + restore 2 + self Vulnerable 10×2', () => {
    expect(surge.id).toBe('curse_surge');
    expect(surge.cardRole).toBe(CardRole.SUPPORT);
    expect(surge.apCost).toBe(1);
    expect(surge.chakraCost).toBe(0);
    expect(surge.hpCost).toBe(10);
    expect(surge.cooldown).toBe(4);
    expect(surge.baseDamage).toBe(0);
    expect(surge.modeInteraction).toEqual(
      expect.objectContaining({
        family: MODE_FAMILY.CURSE,
        requireFamily: MODE_FAMILY.CURSE,
        requireOn: true,
        restoreCharges: 2,
      }),
    );
    expect(surge.modeInteraction?.consumeCharges).toBeUndefined();
    expect(surge.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'vulnerable',
          duration: 2,
          stacks: 10,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(surge.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.MODE]));
    expect(
      surge.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.STRENGTH && e.value === 0.3,
      ),
    ).toBeFalsy();
  });
});

describe('T-110 restore', () => {
  it('restores 2 charges (cap-safe), plants Vulnerable 10×2, and pays HP 10', () => {
    const low = resolveSkill({ skill: surge }, baseState({ modes: curseOn('curse_mark_1', 1) }));
    expect(low.ok).toBe(true);
    if (!low.ok) return;
    expect(low.damageDealt).toBe(0);
    expect(low.state.pools.hp).toBe(30);
    expect(low.state.pools.ap).toBe(5);
    expect(low.state.modes.instances.find((m) => m.id === 'curse_mark_1')?.charges).toBe(3);
    const vuln = low.state.marks.find((m) => m.id === 'vulnerable');
    expect(vuln?.target).toBe(CombatActor.PLAYER);
    expect(vuln?.family).toBe(MarkFamily.STAT);
    expect(vuln?.stacks).toBe(10);
    expect(vuln?.duration).toBe(2);

    const full = resolveSkill({ skill: surge }, baseState({ modes: curseOn('curse_mark_1', 3) }));
    expect(full.ok).toBe(true);
    if (!full.ok) return;
    expect(full.state.modes.instances.find((m) => m.id === 'curse_mark_1')?.charges).toBe(3);
    expect(full.state.marks.some((m) => m.id === 'vulnerable')).toBe(true);
    expect(full.state.pools.hp).toBe(30);

    const two = resolveSkill({ skill: surge }, baseState({ modes: curseOn('curse_mark_2', 1) }));
    expect(two.ok).toBe(true);
    if (!two.ok) return;
    expect(two.state.modes.instances.find((m) => m.id === 'curse_mark_2')?.charges).toBe(3);
  });
});

describe('T-110 require', () => {
  it('rejects without CURSE ON and consumes nothing', () => {
    const start = baseState();
    const result = resolveSkill({ skill: surge }, start);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('mode-required');
    expect(result.state.pools).toEqual(start.pools);
    expect(result.state.marks).toHaveLength(0);

    const sharingan = resolveSkill(
      { skill: surge },
      baseState({
        modes: {
          instances: [
            {
              id: 'sharingan_2',
              family: MODE_FAMILY.SHARINGAN,
              charges: 2,
              state: ModeRuntimeState.ON,
            },
          ],
        },
      }),
    );
    expect(sharingan.ok).toBe(false);
    if (sharingan.ok) return;
    expect(sharingan.reason).toBe('mode-required');
    expect(sharingan.state.pools.hp).toBe(40);
    expect(sharingan.state.marks.some((m) => m.id === 'vulnerable')).toBe(false);
  });
});
