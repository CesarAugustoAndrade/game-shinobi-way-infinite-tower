/**
 * T-075 AC: Henge SUPPORT — Misdirect 2; SIDE +2 next draw; next SIDE Exposed 10%.
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
  Posture,
  PrimaryStat,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { effectiveWeight } from '../DeckSystem';
import { consumeSupportWeightBonuses } from '../SupportWeightSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const henge = SKILLS.HENGE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [henge],
    playerBuffs: [],
    enemyHp: 80,
    pendingSupportWeights: [],
    ...overrides,
  };
}

const sideCard = createMockSkill({
  id: 'wire_kunai_reel',
  cardRole: CardRole.SIDE_ATTACK,
  actionType: ActionType.ACTIVE,
  currentCooldown: 0,
});

const attackCard = createMockSkill({
  id: 'rasengan',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  currentCooldown: 0,
});

const rangedAttack = createMockSkill({
  id: 'fire_atk',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  attackMethod: AttackMethod.RANGED,
  allowedRanges: [CombatRange.MEDIUM, CombatRange.LONG],
  currentCooldown: 0,
});

const ctx = { posture: Posture.BALANCED };

describe('T-075 authoring', () => {
  it('declares SUPPORT AP1 CP1 CD4 SIDE +2 + misdirect and not DEX +0.25', () => {
    expect(henge.cardRole).toBe(CardRole.SUPPORT);
    expect(henge.apCost).toBe(1);
    expect(henge.chakraCost).toBe(1);
    expect(henge.cooldown).toBe(4);
    expect(henge.hpCost).toBe(0);
    expect(henge.baseDamage).toBe(0);
    expect(henge.nextDrawRoleBonus).toEqual({ role: CardRole.SIDE_ATTACK, delta: 2 });
    expect(henge.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'misdirect',
          duration: 2,
          consume: MarkConsumeTiming.ATTEMPT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      henge.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.DEXTERITY &&
          e.value === 0.25,
      ),
    ).toBeFalsy();
  });
});

describe('T-075 weight', () => {
  it('gives SIDE +2 once and does not change ATTACK weight', () => {
    const result = resolveSkill({ skill: henge }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    const first = consumeSupportWeightBonuses(result.state.pendingSupportWeights ?? []);
    expect(first.roleBonuses[CardRole.SIDE_ATTACK]).toBe(2);
    const baseSide = effectiveWeight(sideCard, { ...ctx, supportRoleBonuses: {} });
    const boosted = effectiveWeight(sideCard, { ...ctx, supportRoleBonuses: first.roleBonuses });
    expect(boosted).toBe(baseSide + 2);
    const empty = effectiveWeight(attackCard, { ...ctx, supportRoleBonuses: {} });
    const withBag = effectiveWeight(attackCard, { ...ctx, supportRoleBonuses: first.roleBonuses });
    expect(withBag).toBe(empty);
    const second = consumeSupportWeightBonuses(first.bag);
    expect(second.roleBonuses[CardRole.SIDE_ATTACK]).toBeUndefined();
  });
});

describe('T-075 exposed', () => {
  it('SIDE hit plants Exposed 10%; miss consumes misdirect without plant; RANGED 10→11', () => {
    const planted = resolveSkill({ skill: henge }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    expect(planted.state.marks.some((m) => m.id === 'misdirect')).toBe(true);

    const slash = SKILLS.KUNAI_SLASH;
    const missSide = resolveSkill(
      { skill: slash },
      { ...planted.state, range: CombatRange.CLOSE, skills: [slash] },
      { rollHit: () => ({ hit: false, damage: 0 }) },
    );
    expect(missSide.ok).toBe(true);
    if (!missSide.ok) return;
    expect(missSide.state.marks.some((m) => m.id === 'misdirect')).toBe(false);
    expect(missSide.state.marks.some((m) => m.id === 'exposed_10')).toBe(false);

    const armed = resolveSkill({ skill: henge }, baseState());
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    const hitSide = resolveSkill(
      { skill: slash },
      { ...armed.state, range: CombatRange.CLOSE, skills: [slash] },
      { rollHit: () => ({ hit: true, damage: slash.baseDamage }) },
    );
    expect(hitSide.ok).toBe(true);
    if (!hitSide.ok) return;
    expect(hitSide.state.marks.some((m) => m.id === 'misdirect')).toBe(false);
    const setup = hitSide.state.marks.find((m) => m.id === 'exposed_10');
    expect(setup?.target).toBe(CombatActor.PLAYER);
    expect(setup?.consume).toBe(MarkConsumeTiming.ATTEMPT);

    const boosted = resolveSkill(
      { skill: rangedAttack },
      { ...hitSide.state, range: CombatRange.MEDIUM, skills: [rangedAttack] },
      { rollHit: () => ({ hit: true, damage: 10 }) },
    );
    expect(boosted.ok).toBe(true);
    if (!boosted.ok) return;
    expect(boosted.damageDealt).toBe(11);
    expect(boosted.state.marks.find((m) => m.id === 'exposed_10')).toBeUndefined();
  });
});
