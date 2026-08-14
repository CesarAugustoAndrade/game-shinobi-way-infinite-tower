/**
 * T-044 AC: Dancing Leaf — SUPPORT snap CLOSE + Lotus Opening + LOTUS weight +2.
 *
 * CLOSE lock: bandMove SELF_APPROACH steps 2 (LONG/MEDIUM/CLOSE → CLOSE).
 * Finisher: floor(total * 1.25) after Mode bucket. Non-GATES does not consume.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkConsumeTiming,
  ModeRuntimeState,
  PrimaryStat,
} from '../../types';
import { MODE_FAMILY } from '../../constants/modes';
import { SKILLS } from '../../constants/skills';
import { consumeSupportWeightBonuses } from '../SupportWeightSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const leaf = SKILLS.DANCING_LEAF;
const lotus = SKILLS.PRIMARY_LOTUS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 10, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [leaf],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    pendingSupportWeights: [],
    ...overrides,
  };
}

function gatesOn(charges = 1) {
  return {
    instances: [
      {
        id: 'gate_of_life',
        family: MODE_FAMILY.GATES,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  };
}

const lotusHit = { rollHit: () => ({ hit: true, damage: lotus.baseDamage }) };
const lotusMiss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-044 authoring', () => {
  it('declares SUPPORT CLOSE snap + lotus_opening + LOTUS +2', () => {
    expect(leaf.cardRole).toBe(CardRole.SUPPORT);
    expect(leaf.apCost).toBe(1);
    expect(leaf.chakraCost).toBe(1);
    expect(leaf.cooldown).toBe(3);
    expect(leaf.hpCost).toBe(0);
    expect(leaf.baseDamage).toBe(0);
    expect(leaf.bandMove).toEqual({ kind: 'SELF_APPROACH', steps: 2 });
    expect(leaf.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'lotus_opening',
          duration: 2,
          consume: MarkConsumeTiming.ATTEMPT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(leaf.nextDrawSkillBonuses).toEqual(
      expect.arrayContaining([
        { skillId: 'primary_lotus', delta: 2 },
        { skillId: 'hidden_lotus', delta: 2 },
      ]),
    );
    expect(leaf.nextDrawSkillBonuses?.some((e) => e.skillId === 'morning_peacock')).toBeFalsy();
    expect(
      leaf.effects?.some((e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.STRENGTH && e.value === 0.5),
    ).toBeFalsy();
    expect(
      leaf.effects?.some((e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.DEXTERITY && e.value === 0.3),
    ).toBeFalsy();
  });
});

describe('T-044 setup', () => {
  it('snaps to CLOSE, plants Opening, and enqueues LOTUS +2 without spending the manual move', () => {
    const fromMedium = resolveSkill({ skill: leaf }, baseState());
    expect(fromMedium.ok).toBe(true);
    if (!fromMedium.ok) return;
    expect(fromMedium.damageDealt).toBe(0);
    expect(fromMedium.state.range).toBe(CombatRange.CLOSE);
    expect(fromMedium.state.playerMoveUsedThisTurn).toBe(false);
    expect(fromMedium.state.marks.find((m) => m.id === 'lotus_opening')?.duration).toBe(2);
    expect(fromMedium.state.marks.find((m) => m.id === 'lotus_opening')?.target).toBe(CombatActor.PLAYER);
    const bag = consumeSupportWeightBonuses(fromMedium.state.pendingSupportWeights ?? []);
    expect(bag.bonuses.primary_lotus).toBe(2);
    expect(bag.bonuses.hidden_lotus).toBe(2);
    expect(bag.bonuses.morning_peacock).toBeUndefined();

    const fromLong = resolveSkill({ skill: leaf }, baseState({ range: CombatRange.LONG }));
    expect(fromLong.ok).toBe(true);
    if (!fromLong.ok) return;
    expect(fromLong.state.range).toBe(CombatRange.CLOSE);

    const stay = resolveSkill({ skill: leaf }, baseState({ range: CombatRange.CLOSE }));
    expect(stay.ok).toBe(true);
    if (!stay.ok) return;
    expect(stay.state.range).toBe(CombatRange.CLOSE);
    expect(stay.state.playerMoveUsedThisTurn).toBe(false);
  });
});

describe('T-044 finisher', () => {
  it('applies ×1.25 on Primary Lotus and does not let non-GATES consume Opening', () => {
    const planted = resolveSkill({ skill: leaf }, baseState({ modes: gatesOn(1) }));
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const boosted = resolveSkill(
      { skill: lotus },
      { ...planted.state, skills: [lotus], range: CombatRange.CLOSE },
      lotusHit,
    );
    const clean = resolveSkill(
      { skill: lotus },
      baseState({ modes: gatesOn(1), skills: [lotus], range: CombatRange.CLOSE }),
      lotusHit,
    );
    expect(boosted.ok).toBe(true);
    expect(clean.ok).toBe(true);
    if (!boosted.ok || !clean.ok) return;
    expect(boosted.damageDealt).toBe(Math.floor(clean.damageDealt * 1.25));
    expect(boosted.state.marks.find((m) => m.id === 'lotus_opening')).toBeUndefined();

    const missed = resolveSkill(
      { skill: lotus },
      { ...planted.state, skills: [lotus], range: CombatRange.CLOSE },
      lotusMiss,
    );
    expect(missed.ok).toBe(true);
    if (!missed.ok) return;
    expect(missed.damageDealt).toBe(0);
    expect(missed.state.marks.find((m) => m.id === 'lotus_opening')).toBeUndefined();

    const other = createMockSkill({
      id: 'basic_atk',
      cardRole: CardRole.ATTACK,
      actionType: ActionType.ACTIVE,
      apCost: 1,
      chakraCost: 0,
      baseDamage: 10,
      currentCooldown: 0,
      allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
    });
    const leftover = resolveSkill(
      { skill: other },
      { ...planted.state, skills: [other] },
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(leftover.ok).toBe(true);
    if (!leftover.ok) return;
    expect(leftover.state.marks.some((m) => m.id === 'lotus_opening')).toBe(true);
  });
});
