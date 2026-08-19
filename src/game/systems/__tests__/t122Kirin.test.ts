/**
 * T-122 AC: Kirin ATTACK — hard require Sharingan 3T ON + Burn; 45 LONG; consume-all closes Mode.
 *
 * Burn is stripped only on ≥1 hit. Twin Lion soft requireMark is unchanged.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  DamageProperty,
  DamageType,
  MarkFamily,
  ModeRuntimeState,
  SkillTag,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const kirin = SKILLS.KIRIN;
const lions = SKILLS.TWIN_LION_FISTS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 8, chakra: 30, hp: 40, maxHp: 40 },
    range: CombatRange.LONG,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [kirin],
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

const burnMark = {
  id: 'burn',
  sourceSkillId: 'fireball',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 2,
  stacks: 5,
  family: MarkFamily.DOT,
};

const hit = { rollHit: () => ({ hit: true, damage: kirin.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-122 authoring', () => {
  it('declares ATTACK AP6 CP27 CD8 45 LONG + 3T hard Burn, not ARMOR_BREAK 15', () => {
    expect(kirin.id).toBe('kirin');
    expect(kirin.cardRole).toBe(CardRole.ATTACK);
    expect(kirin.apCost).toBe(6);
    expect(kirin.chakraCost).toBe(27);
    expect(kirin.hpCost).toBe(0);
    expect(kirin.cooldown).toBe(8);
    expect(kirin.baseDamage).toBe(45);
    expect(kirin.baseDamage).not.toBe(15);
    expect(kirin.damageType).toBe(DamageType.ELEMENTAL);
    expect(kirin.damageProperty).not.toBe(DamageProperty.ARMOR_BREAK);
    expect(kirin.allowedRanges).toEqual([CombatRange.LONG]);
    expect(kirin.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'sharingan_3',
        family: MODE_FAMILY.SHARINGAN,
        requireOn: true,
        consumeAllCharges: true,
        requireMarkId: 'burn',
        requireMarkHard: true,
        consumeAllMatchingMarks: true,
      }),
    );
    expect(kirin.tags).toEqual(
      expect.arrayContaining([SkillTag.UCHIHA, SkillTag.NINJUTSU, SkillTag.LIGHTNING]),
    );
    expect(lions.modeInteraction?.requireMarkHard).toBeUndefined();
  });
});

describe('T-122 hit', () => {
  it('deals 45, closes Sharingan 3, and consumes Burn on hit', () => {
    const result = resolveSkill(
      { skill: kirin },
      baseState({ modes: sharinganOn('sharingan_3', 3), marks: [burnMark] }),
      hit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(1);
    expect(result.damageDealt).toBe(45);
    expect(result.state.pools.ap).toBe(2);
    expect(result.state.pools.chakra).toBe(3);
    expect(result.state.marks.some((m) => m.id === 'burn')).toBe(false);
    const mode = result.state.modes.instances.find((m) => m.id === 'sharingan_3');
    expect(mode?.charges).toBe(0);
    expect(mode?.state).toBe(ModeRuntimeState.COOLDOWN);

    const close = resolveSkill(
      { skill: kirin },
      baseState({
        range: CombatRange.CLOSE,
        modes: sharinganOn('sharingan_3', 2),
        marks: [burnMark],
      }),
      hit,
    );
    expect(close.ok).toBe(false);
  });
});

describe('T-122 gates', () => {
  it('rejects without 3T or Burn; miss spends charges and keeps Burn', () => {
    const start = baseState({ marks: [burnMark] });
    const noMode = resolveSkill({ skill: kirin }, start, hit);
    expect(noMode.ok).toBe(false);
    if (noMode.ok) return;
    expect(noMode.reason).toBe('mode-required');
    expect(noMode.state.pools).toEqual(start.pools);

    const twoT = resolveSkill(
      { skill: kirin },
      baseState({ modes: sharinganOn('sharingan_2', 3), marks: [burnMark] }),
      hit,
    );
    expect(twoT.ok).toBe(false);
    if (twoT.ok) return;
    expect(twoT.reason).toBe('mode-required');
    expect(twoT.state.pools.ap).toBe(8);

    const noBurn = resolveSkill(
      { skill: kirin },
      baseState({ modes: sharinganOn('sharingan_3', 3) }),
      hit,
    );
    expect(noBurn.ok).toBe(false);
    if (noBurn.ok) return;
    expect(noBurn.reason).toBe('mark-required');
    expect(noBurn.state.pools.ap).toBe(8);
    expect(noBurn.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges).toBe(3);

    const whiff = resolveSkill(
      { skill: kirin },
      baseState({ modes: sharinganOn('sharingan_3', 2), marks: [burnMark] }),
      miss,
    );
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'burn')).toBe(true);
    expect(whiff.state.modes.instances.find((m) => m.id === 'sharingan_3')?.state).toBe(
      ModeRuntimeState.COOLDOWN,
    );
    expect(whiff.state.pools.ap).toBe(2);
  });
});
