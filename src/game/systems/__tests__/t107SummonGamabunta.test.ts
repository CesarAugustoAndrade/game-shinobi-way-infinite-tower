/**
 * T-107 AC: Summon Gamabunta ATTACK — 25 M/L; self Shield 35 on hit; no Mode consume.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  ModeRuntimeState,
  SkillTag,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const toad = SKILLS.SUMMON_GAMABUNTA;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [toad],
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

const hit = { rollHit: () => ({ hit: true, damage: toad.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-107 authoring', () => {
  it('declares ATTACK AP4 CP11 CD8 25 MEDIUM·LONG + self Shield 35 no Mode', () => {
    expect(toad.id).toBe('summon_gamabunta');
    expect(toad.cardRole).toBe(CardRole.ATTACK);
    expect(toad.apCost).toBe(4);
    expect(toad.chakraCost).toBe(11);
    expect(toad.hpCost).toBe(0);
    expect(toad.cooldown).toBe(8);
    expect(toad.baseDamage).toBe(25);
    expect(toad.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.MEDIUM, CombatRange.LONG]),
    );
    expect(toad.modeInteraction).toBeUndefined();
    expect(toad.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'gamabunta_shield',
          stacks: 35,
          duration: 99,
          family: MarkFamily.SHIELD,
          targetActor: 'self',
          requireHit: true,
        }),
      ]),
    );
    expect(toad.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.WATER]));
    expect(
      toad.effects?.some((e) => e.type === EffectType.SHIELD && e.value === 80 && e.duration === 3),
    ).toBeFalsy();
  });
});

describe('T-107 hit shield', () => {
  it('deals 25, plants Shield 35, and leaves clone charges unchanged', () => {
    const result = resolveSkill({ skill: toad }, baseState({ modes: clonesOn(3) }), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(25);
    const shield = result.state.marks.find((m) => m.id === 'gamabunta_shield');
    expect(shield?.target).toBe(CombatActor.PLAYER);
    expect(shield?.family).toBe(MarkFamily.SHIELD);
    expect(shield?.stacks).toBe(35);
    expect(result.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges).toBe(3);
  });
});

describe('T-107 miss', () => {
  it('plants no shield and spends no Mode charges on 0 hits', () => {
    const result = resolveSkill({ skill: toad }, baseState({ modes: clonesOn(3) }), miss);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.marks.some((m) => m.id === 'gamabunta_shield')).toBe(false);
    expect(result.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges).toBe(3);
  });
});
