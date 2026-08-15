/**
 * T-062 AC: Cloak of Invisibility SUPPORT — plant self cloaked; next ATTACK 1.5× +1 DEX consume.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkConsumeTiming,
  MarkFamily,
  PrimaryStat,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const cloak = SKILLS.CLOAK_INVIS;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [cloak],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const nextAttack = createMockSkill({
  id: 'next_attack',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  scalingPerPoint: 4,
  scalingStat: PrimaryStat.DEXTERITY,
  hitCount: 1,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const nextSide = createMockSkill({
  id: 'next_side',
  cardRole: CardRole.SIDE_ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  scalingPerPoint: 4,
  scalingStat: PrimaryStat.DEXTERITY,
  hitCount: 1,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const hit = { rollHit: () => ({ hit: true, damage: 10 }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-062 authoring', () => {
  it('declares SUPPORT AP1 CP3 CD4 + self cloaked 2 ATTEMPT', () => {
    expect(cloak.cardRole).toBe(CardRole.SUPPORT);
    expect(cloak.apCost).toBe(1);
    expect(cloak.chakraCost).toBe(3);
    expect(cloak.cooldown).toBe(4);
    expect(cloak.hpCost).toBe(0);
    expect(cloak.baseDamage).toBe(0);
    expect(cloak.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.MARK]));
    expect(cloak.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'cloaked',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.ATTEMPT,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      cloak.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.SPEED && e.value === 0.6,
      ),
    ).toBeFalsy();
    expect(
      cloak.effects?.some(
        (e) =>
          e.type === EffectType.BUFF && e.targetStat === PrimaryStat.DEXTERITY && e.value === 0.5,
      ),
    ).toBeFalsy();
  });
});

describe('T-062 plant', () => {
  it('plants self Cloaked 2 with no damage and no Mode change', () => {
    const result = resolveSkill({ skill: cloak }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const mark = result.state.marks.find((m) => m.id === 'cloaked');
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.duration).toBe(2);
    expect(mark?.stacks).toBe(1);
    expect(mark?.consume).toBe(MarkConsumeTiming.ATTEMPT);
    expect(result.state.modes.instances).toHaveLength(0);
  });
});

describe('T-062 payoff', () => {
  it('force-crits 10→15 +4 DEX and consumes Cloaked on an ATTACK hit', () => {
    const planted = resolveSkill({ skill: cloak }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const armed = resolveSkill({ skill: nextAttack }, planted.state, hit);
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.damageDealt).toBe(19);
    expect(armed.state.marks.some((m) => m.id === 'cloaked')).toBe(false);

    const clean = resolveSkill({ skill: nextAttack }, baseState({ skills: [nextAttack] }), hit);
    expect(clean.ok).toBe(true);
    if (!clean.ok) return;
    expect(clean.damageDealt).toBe(10);
  });

  it('consumes Cloaked on a full ATTACK miss with no damage', () => {
    const planted = resolveSkill({ skill: cloak }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const whiff = resolveSkill({ skill: nextAttack }, planted.state, miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'cloaked')).toBe(false);
  });

  it('does not consume Cloaked on a SIDE hit', () => {
    const planted = resolveSkill({ skill: cloak }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const side = resolveSkill({ skill: nextSide }, planted.state, hit);
    expect(side.ok).toBe(true);
    if (!side.ok) return;
    expect(side.damageDealt).toBe(10);
    expect(side.state.marks.some((m) => m.id === 'cloaked')).toBe(true);
  });
});
