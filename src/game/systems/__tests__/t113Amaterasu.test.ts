/**
 * T-113 AC: Amaterasu ATTACK — require Sharingan ON; 20 + TRUE Burn 8×4; consume 2 charges.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  DamageProperty,
  DamageType,
  EffectType,
  MarkFamily,
  ModeRuntimeState,
  SkillTag,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const flame = SKILLS.AMATERASU;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [flame],
    playerBuffs: [],
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

const hit = { rollHit: () => ({ hit: true, damage: flame.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-113 authoring', () => {
  it('declares ATTACK AP5 CP13 HP20 CD5 20 + Sharingan consume 2 + Burn 8×4 TRUE', () => {
    expect(flame.id).toBe('amaterasu');
    expect(flame.cardRole).toBe(CardRole.ATTACK);
    expect(flame.apCost).toBe(5);
    expect(flame.chakraCost).toBe(13);
    expect(flame.hpCost).toBe(20);
    expect(flame.cooldown).toBe(5);
    expect(flame.baseDamage).toBe(20);
    expect(flame.damageProperty).toBe(DamageProperty.NORMAL);
    expect(flame.modeInteraction).toEqual(
      expect.objectContaining({
        family: MODE_FAMILY.SHARINGAN,
        requireFamily: MODE_FAMILY.SHARINGAN,
        requireOn: true,
        consumeCharges: 2,
      }),
    );
    expect(flame.modeInteraction?.consumeAllCharges).toBeUndefined();
    expect(flame.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'burn',
          stacks: 8,
          duration: 4,
          family: MarkFamily.DOT,
          targetActor: 'enemy',
          requireHit: true,
        }),
      ]),
    );
    expect(flame.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: EffectType.BURN,
          value: 8,
          duration: 4,
          damageType: DamageType.TRUE,
        }),
      ]),
    );
    expect(flame.tags).toEqual(
      expect.arrayContaining([SkillTag.UCHIHA, SkillTag.NINJUTSU, SkillTag.FIRE]),
    );
    expect(flame.baseDamage).not.toBe(13);
    expect(
      flame.effects?.some((e) => e.type === EffectType.BURN && e.value === 50 && e.duration === 5),
    ).toBeFalsy();
  });
});

describe('T-113 hit', () => {
  it('deals 20, spends 2 charges, plants Burn 8×4, and pays HP 20', () => {
    const result = resolveSkill(
      { skill: flame },
      baseState({ modes: sharinganOn('sharingan_2', 3) }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(20);
    expect(result.state.pools.hp).toBe(20);
    expect(result.state.pools.ap).toBe(1);
    expect(result.state.pools.chakra).toBe(7);
    const burn = result.state.marks.find((m) => m.id === 'burn');
    expect(burn?.target).toBe(CombatActor.ENEMY);
    expect(burn?.family).toBe(MarkFamily.DOT);
    expect(burn?.stacks).toBe(8);
    expect(burn?.duration).toBe(4);
    const mode = result.state.modes.instances.find((m) => m.id === 'sharingan_2');
    expect(mode?.charges).toBe(1);
    expect(mode?.state).toBe(ModeRuntimeState.ON);

    const three = resolveSkill(
      { skill: flame },
      baseState({ modes: sharinganOn('sharingan_3', 2) }),
      hit,
    );
    expect(three.ok).toBe(true);
    if (!three.ok) return;
    expect(three.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges).toBe(0);
    expect(three.state.modes.instances.find((m) => m.id === 'sharingan_3')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );

    const whiff = resolveSkill(
      { skill: flame },
      baseState({ modes: sharinganOn('sharingan_2', 3) }),
      miss,
    );
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'burn')).toBe(false);
    expect(whiff.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges).toBe(1);
    expect(whiff.state.pools.hp).toBe(20);
  });
});

describe('T-113 require', () => {
  it('rejects without Sharingan or with 1 charge and consumes nothing', () => {
    const start = baseState();
    const result = resolveSkill({ skill: flame }, start, hit);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('mode-required');
    expect(result.state.pools).toEqual(start.pools);
    expect(result.state.marks.some((m) => m.id === 'burn')).toBe(false);

    const short = baseState({ modes: sharinganOn('sharingan_2', 1) });
    const broke = resolveSkill({ skill: flame }, short, hit);
    expect(broke.ok).toBe(false);
    if (broke.ok) return;
    expect(broke.reason).toBe('mode-required');
    expect(broke.state.pools).toEqual(short.pools);
    expect(broke.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges).toBe(1);
    expect(broke.state.marks.some((m) => m.id === 'burn')).toBe(false);
  });
});
