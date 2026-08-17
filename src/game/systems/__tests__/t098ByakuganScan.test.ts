/**
 * T-098 AC: Byakugan Scan SUPPORT — require Byakugan ON; Tenketsu Exposed 2; HYUGA ATTACK +2.
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
import { consumeSupportWeightBonuses } from '../SupportWeightSystem';
import { effectiveWeight } from '../DeckSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { Posture } from '../../types';

const scan = SKILLS.BYAKUGAN_SCAN;
const fist = SKILLS.GENTLE_FIST;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [scan],
    playerBuffs: [],
    enemyHp: 50,
    ...overrides,
  };
}

function byakuganOn(charges: number) {
  return {
    instances: [
      {
        id: 'byakugan',
        family: MODE_FAMILY.HYUGA,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

describe('T-098 authoring', () => {
  it('declares SUPPORT AP1 CP3 CD3 require Byakugan + Tenketsu 2 + HYUGA ATTACK +2', () => {
    expect(scan.id).toBe('byakugan_scan');
    expect(scan.cardRole).toBe(CardRole.SUPPORT);
    expect(scan.apCost).toBe(1);
    expect(scan.chakraCost).toBe(3);
    expect(scan.cooldown).toBe(3);
    expect(scan.hpCost).toBe(0);
    expect(scan.baseDamage).toBe(0);
    expect(scan.modeInteraction).toEqual(
      expect.objectContaining({
        modeId: 'byakugan',
        family: MODE_FAMILY.HYUGA,
        requireOn: true,
      }),
    );
    expect(scan.modeInteraction?.consumeCharges).toBeUndefined();
    expect(scan.tags).toEqual(expect.arrayContaining([SkillTag.HYUGA, SkillTag.MARK]));
    expect(scan.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'tenketsu_exposed',
          duration: 2,
          stacks: 30,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(scan.nextDrawSkillBonuses).toEqual(
      expect.arrayContaining([
        { skillId: 'gentle_fist', delta: 2 },
        { skillId: '64_palms', delta: 2 },
        { skillId: 'twin_lion_fists', delta: 2 },
      ]),
    );
    expect(
      scan.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.ACCURACY &&
          e.value === 0.3,
      ),
    ).toBeFalsy();
  });
});

describe('T-098 mode gate', () => {
  it('rejects Byakugan OFF; ON pays costs and does not spend charges', () => {
    const start = baseState();
    const off = resolveSkill({ skill: scan }, start);
    expect(off.ok).toBe(false);
    if (off.ok) return;
    expect(off.reason).toBe('mode-required');
    expect(off.state.pools).toEqual(start.pools);
    expect(off.state.marks).toHaveLength(0);

    const on = resolveSkill({ skill: scan }, baseState({ modes: byakuganOn(2) }));
    expect(on.ok).toBe(true);
    if (!on.ok) return;
    expect(on.damageDealt).toBe(0);
    expect(on.state.pools.ap).toBe(5);
    expect(on.state.pools.chakra).toBe(17);
    expect(on.state.modes.instances.find((m) => m.id === 'byakugan')?.charges).toBe(2);
  });
});

describe('T-098 setup', () => {
  it('plants Tenketsu Exposed 2 and enqueues Hyuga ATTACK +2', () => {
    const result = resolveSkill({ skill: scan }, baseState({ modes: byakuganOn(2) }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const mark = result.state.marks.find((m) => m.id === 'tenketsu_exposed');
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.family).toBe(MarkFamily.STAT);
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(30);

    const first = consumeSupportWeightBonuses(result.state.pendingSupportWeights ?? []);
    expect(first.bonuses.gentle_fist).toBe(2);
    expect(first.bonuses['64_palms']).toBe(2);
    expect(first.bonuses.twin_lion_fists).toBe(2);
    const ctx = { posture: Posture.BALANCED };
    expect(effectiveWeight(fist, { ...ctx, supportBonuses: first.bonuses })).toBe(
      effectiveWeight(fist, { ...ctx, supportBonuses: {} }) + 2,
    );
    const second = consumeSupportWeightBonuses(first.bag);
    expect(second.bonuses.gentle_fist).toBeUndefined();
  });
});
