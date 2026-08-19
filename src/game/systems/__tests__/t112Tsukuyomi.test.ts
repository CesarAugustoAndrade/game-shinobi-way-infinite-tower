/**
 * T-112 AC: Tsukuyomi ATTACK — require Sharingan ON; 30 mental + Stun 2; consume-all closes Mode.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatRange,
  DamageType,
  EffectType,
  ModeRuntimeState,
  SkillTag,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const illusion = SKILLS.TSUKUYOMI;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [illusion],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

function sharinganOn(id: 'sharingan_2' | 'sharingan_3', charges: number) {
  return {
    instances: [
      {
        id,
        family: MODE_FAMILY.SHARINGAN,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

const hit = { rollHit: () => ({ hit: true, damage: illusion.baseDamage }), rng: () => 0 };
const miss = { rollHit: () => ({ hit: false, damage: 0 }), rng: () => 0 };

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration: number,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

describe('T-112 authoring', () => {
  it('declares ATTACK AP5 CP13 HP15 CD6 30 MENTAL + Sharingan consume-all + Stun 2', () => {
    expect(illusion.id).toBe('tsukuyomi');
    expect(illusion.cardRole).toBe(CardRole.ATTACK);
    expect(illusion.apCost).toBe(5);
    expect(illusion.chakraCost).toBe(13);
    expect(illusion.hpCost).toBe(15);
    expect(illusion.cooldown).toBe(6);
    expect(illusion.baseDamage).toBe(30);
    expect(illusion.damageType).toBe(DamageType.MENTAL);
    expect(illusion.modeInteraction).toEqual(
      expect.objectContaining({
        family: MODE_FAMILY.SHARINGAN,
        requireFamily: MODE_FAMILY.SHARINGAN,
        requireOn: true,
        consumeAllCharges: true,
      }),
    );
    expect(illusion.impactStun).toEqual({ chance: 1.0, duration: 2 });
    expect(illusion.tags).toEqual(
      expect.arrayContaining([SkillTag.UCHIHA, SkillTag.GENJUTSU, SkillTag.MENTAL]),
    );
    expect(illusion.damageType).not.toBe(DamageType.TRUE);
    expect(
      illusion.effects?.some((e) => e.type === EffectType.STUN && e.duration === 1),
    ).toBeFalsy();
  });
});

describe('T-112 hit close', () => {
  it('deals 30, plants Stun 2, pays HP 15, and closes Sharingan', () => {
    const result = resolveSkill(
      { skill: illusion },
      baseState({ modes: sharinganOn('sharingan_2', 3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(30);
    expect(result.state.pools.hp).toBe(25);
    expect(result.state.pools.ap).toBe(1);
    expect(result.state.pools.chakra).toBe(7);
    expect(hasStun(result.state.enemyBuffs, 2)).toBe(true);
    const mode = result.state.modes.instances.find((m) => m.id === 'sharingan_2');
    expect(mode?.charges).toBe(0);
    expect(mode?.state).toBe(ModeRuntimeState.COOLDOWN);

    const three = resolveSkill(
      { skill: illusion },
      baseState({ modes: sharinganOn('sharingan_3', 2) }),
      hit,
    );
    expect(three.ok).toBe(true);
    if (!three.ok) return;
    expect(three.state.modes.instances.find((m) => m.id === 'sharingan_3')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );

    const whiff = resolveSkill(
      { skill: illusion },
      baseState({ modes: sharinganOn('sharingan_2', 2) }),
      miss,
    );
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(hasStun(whiff.state.enemyBuffs, 2)).toBe(false);
    expect(whiff.state.modes.instances.find((m) => m.id === 'sharingan_2')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );
    expect(whiff.state.pools.hp).toBe(25);
  });
});

describe('T-112 require', () => {
  it('rejects without Sharingan and consumes nothing', () => {
    const start = baseState();
    const result = resolveSkill({ skill: illusion }, start, hit);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('mode-required');
    expect(result.state.pools).toEqual(start.pools);
    expect(hasStun(result.state.enemyBuffs, 2)).toBe(false);

    const curse = resolveSkill(
      { skill: illusion },
      baseState({
        modes: {
          instances: [
            {
              id: 'curse_mark_1',
              family: MODE_FAMILY.CURSE,
              charges: 3,
              state: ModeRuntimeState.ON,
            },
          ],
        },
      }),
      hit,
    );
    expect(curse.ok).toBe(false);
    if (curse.ok) return;
    expect(curse.reason).toBe('mode-required');
    expect(curse.state.pools.hp).toBe(40);
    expect(curse.state.modes.instances.find((m) => m.id === 'curse_mark_1')?.charges).toBe(3);
  });
});
