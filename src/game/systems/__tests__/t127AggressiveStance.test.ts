/**
 * T-127 AC: Aggressive Stance SUPPORT — Aggressive shift; next ATTACK +20% Setup; open plant.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  AttackMethod,
  CardRole,
  Clan,
  CombatActor,
  CombatRange,
  EffectType,
  MarkConsumeTiming,
  MarkFamily,
  Posture,
  PrimaryStat,
} from '../../types';
import { CLAN_START_LOADOUT } from '../../constants';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { stanceShiftFromSkill } from '../PostureSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const stance = SKILLS.AGGRESSIVE_STANCE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [stance],
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
  hitCount: 1,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const hit = { rollHit: () => ({ hit: true, damage: 10 }) };

describe('T-127 authoring', () => {
  it('declares SUPPORT ACTIVE AP1 CP3 CD5 Aggressive + Setup/open marks, not TOGGLE', () => {
    expect(stance.id).toBe('aggressive_stance');
    expect(stance.cardRole).toBe(CardRole.SUPPORT);
    expect(stance.actionType).toBe(ActionType.ACTIVE);
    expect(stance.apCost).toBe(1);
    expect(stance.chakraCost).toBe(3);
    expect(stance.cooldown).toBe(5);
    expect(stance.hpCost).toBe(0);
    expect(stance.baseDamage).toBe(0);
    expect(stance.stanceShift).toBe(Posture.AGGRESSIVE);
    expect(stanceShiftFromSkill(stance)).toBe(Posture.AGGRESSIVE);
    expect(stance.isToggle).toBeFalsy();
    expect(stance.upkeepCost).toBeUndefined();
    expect(stance.modeInteraction).toBeUndefined();
    expect(stance.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'aggressive_focus',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.ATTEMPT,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
        expect.objectContaining({
          id: 'aggressive_open',
          duration: 1,
          stacks: 20,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      stance.effects?.some(
        (e) =>
          (e.type === EffectType.BUFF && e.targetStat === PrimaryStat.STRENGTH) ||
          (e.type === EffectType.DEBUFF && e.targetStat === PrimaryStat.WILLPOWER),
      ),
    ).toBeFalsy();
    const lee = CLAN_START_LOADOUT[Clan.LEE];
    expect(lee.active.some((s) => s.id === 'aggressive_stance')).toBe(true);
    expect(lee.toggle.every((s) => s.id !== 'aggressive_stance')).toBe(true);
  });
});

describe('T-127 plant', () => {
  it('plants self Setup and open marks with no damage', () => {
    const result = resolveSkill({ skill: stance }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.pools.ap).toBe(5);
    expect(result.state.pools.chakra).toBe(17);
    const focus = result.state.marks.find((m) => m.id === 'aggressive_focus');
    expect(focus?.target).toBe(CombatActor.PLAYER);
    expect(focus?.duration).toBe(2);
    expect(focus?.stacks).toBe(1);
    expect(focus?.consume).toBe(MarkConsumeTiming.ATTEMPT);
    const open = result.state.marks.find((m) => m.id === 'aggressive_open');
    expect(open?.target).toBe(CombatActor.PLAYER);
    expect(open?.duration).toBe(1);
    expect(open?.stacks).toBe(20);
  });
});

describe('T-127 setup', () => {
  it('next ATTACK applies ×1.2 Setup and consumes focus; open remains; SIDE does not consume', () => {
    const planted = resolveSkill({ skill: stance }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;

    const armed = resolveSkill({ skill: nextAttack }, planted.state, hit);
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.attemptSpent.some((m) => m.id === 'aggressive_focus')).toBe(true);
    expect(armed.state.marks.some((m) => m.id === 'aggressive_focus')).toBe(false);
    expect(armed.state.marks.some((m) => m.id === 'aggressive_open')).toBe(true);
    expect(armed.damageDealt).toBe(Math.floor(10 * 1.2));

    const side = resolveSkill({ skill: nextSide }, planted.state, hit);
    expect(side.ok).toBe(true);
    if (!side.ok) return;
    expect(side.state.marks.some((m) => m.id === 'aggressive_focus')).toBe(true);
    expect(side.attemptSpent.some((m) => m.id === 'aggressive_focus')).toBe(false);
    expect(side.damageDealt).toBe(10);

    const clean = resolveSkill({ skill: nextAttack }, baseState({ skills: [nextAttack] }), hit);
    expect(clean.ok).toBe(true);
    if (!clean.ok) return;
    expect(clean.attemptSpent.some((m) => m.id === 'aggressive_focus')).toBe(false);
    expect(clean.damageDealt).toBe(10);
  });
});
