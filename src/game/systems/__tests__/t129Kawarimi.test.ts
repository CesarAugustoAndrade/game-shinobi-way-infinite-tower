/**
 * T-129 AC: Kawarimi SUPPORT — Substitution 2 ignore first hit + retreat 1; not Shield/SPEED.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  Posture,
  PrimaryStat,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { applySubstitutionIncoming } from '../MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const kawarimi = SKILLS.KAWARIMI;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [kawarimi],
    playerBuffs: [],
    enemyHp: 80,
    pendingSupportWeights: [],
    ...overrides,
  };
}

describe('T-129 authoring', () => {
  it('declares SUPPORT AP1 CP3 CD4 substitution 2 and not Shield 30 / SPEED 0.3', () => {
    expect(kawarimi.id).toBe('kawarimi');
    expect(kawarimi.cardRole).toBe(CardRole.SUPPORT);
    expect(kawarimi.apCost).toBe(1);
    expect(kawarimi.chakraCost).toBe(3);
    expect(kawarimi.cooldown).toBe(4);
    expect(kawarimi.hpCost).toBe(0);
    expect(kawarimi.baseDamage).toBe(0);
    expect(kawarimi.stanceShift).toBeUndefined();
    expect(kawarimi.stanceBonus).toBeUndefined();
    expect(kawarimi.modeInteraction).toBeUndefined();
    expect(kawarimi.bandMove).toBeUndefined();
    expect(kawarimi.tags).toEqual(
      expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.MARK]),
    );
    expect(kawarimi.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'substitution',
          duration: 2,
          stacks: 1,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      kawarimi.effects?.some((e) => e.type === EffectType.SHIELD && e.value === 30),
    ).toBeFalsy();
    expect(
      kawarimi.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.SPEED &&
          e.value === 0.3,
      ),
    ).toBeFalsy();
    expect(kawarimi.stanceShift).not.toBe(Posture.DEFENSIVE);
  });
});

describe('T-129 plant', () => {
  it('plants substitution on self duration 2, deals 0, and leaves Mode empty', () => {
    const result = resolveSkill({ skill: kawarimi }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.ap).toBe(5);
    expect(result.state.pools.chakra).toBe(17);
    const mark = result.state.marks.find((m) => m.id === 'substitution');
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(1);
    expect(mark?.family).toBe(MarkFamily.STAT);
    expect(result.state.modes.instances).toHaveLength(0);
    expect(result.state.range).toBe(CombatRange.MEDIUM);
    const used = result.state.skills.find((s) => s.id === kawarimi.id);
    expect(used?.readyOnTurn).toBe(7);
  });
});

describe('T-129 substitution helper', () => {
  it('zeros first hit, strips the mark, and retreats one band toward LONG', () => {
    const planted = resolveSkill({ skill: kawarimi }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const fired = applySubstitutionIncoming(40, planted.state.marks, CombatRange.MEDIUM);
    expect(fired.damage).toBe(0);
    expect(fired.consumed).toBe(true);
    expect(fired.retreatSteps).toBe(1);
    expect(fired.range).toBe(CombatRange.LONG);
    expect(fired.marks.some((m) => m.id === 'substitution')).toBe(false);
  });

  it('passthrough when unarmed; does not consume on damage 0; PUSH@LONG stays LONG', () => {
    const bare = applySubstitutionIncoming(40, [], CombatRange.CLOSE);
    expect(bare.damage).toBe(40);
    expect(bare.consumed).toBe(false);
    expect(bare.retreatSteps).toBe(0);
    expect(bare.range).toBe(CombatRange.CLOSE);

    const planted = resolveSkill({ skill: kawarimi }, baseState({ range: CombatRange.LONG }));
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const zero = applySubstitutionIncoming(0, planted.state.marks, CombatRange.LONG);
    expect(zero.damage).toBe(0);
    expect(zero.consumed).toBe(false);
    expect(zero.retreatSteps).toBe(0);
    expect(zero.marks.some((m) => m.id === 'substitution')).toBe(true);

    const wall = applySubstitutionIncoming(25, planted.state.marks, CombatRange.LONG);
    expect(wall.damage).toBe(0);
    expect(wall.consumed).toBe(true);
    expect(wall.retreatSteps).toBe(1);
    expect(wall.range).toBe(CombatRange.LONG);
  });
});
