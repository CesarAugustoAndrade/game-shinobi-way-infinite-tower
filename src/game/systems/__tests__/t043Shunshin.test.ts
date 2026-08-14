/**
 * T-043 AC: Shunshin — SUPPORT one-band step (no manual move) + next Offensive +1 DEX.
 *
 * Intent field: `intent.movement` — PULL = approach, PUSH = retreat.
 * Default authored `bandMove` is SELF_APPROACH (PULL).
 * DEX payoff: spent `shunshin_dex` adds `scalingPerPoint` when scalingStat is DEXTERITY.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkConsumeTiming,
  MarkFamily,
  PrimaryStat,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const shunshin = SKILLS.SHUNSHIN;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [shunshin],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    ...overrides,
  };
}

const dexSide = createMockSkill({
  id: 'dex_slash',
  cardRole: CardRole.SIDE_ATTACK,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  scalingPerPoint: 4,
  scalingStat: PrimaryStat.DEXTERITY,
  currentCooldown: 0,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const hit = { rollHit: () => ({ hit: true, damage: dexSide.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-043 authoring', () => {
  it('declares SUPPORT band-step + shunshin_dex ATTEMPT self mark', () => {
    expect(shunshin.cardRole).toBe(CardRole.SUPPORT);
    expect(shunshin.apCost).toBe(1);
    expect(shunshin.chakraCost).toBe(4);
    expect(shunshin.cooldown).toBe(3);
    expect(shunshin.hpCost).toBe(0);
    expect(shunshin.baseDamage).toBe(0);
    expect(shunshin.bandMove).toEqual({ kind: 'SELF_APPROACH', steps: 1 });
    expect(shunshin.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'shunshin_dex',
          duration: 1,
          consume: MarkConsumeTiming.ATTEMPT,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      shunshin.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.SPEED && e.value === 0.4,
      ),
    ).toBeFalsy();
  });
});

describe('T-043 move mark', () => {
  it('approaches one band without spending the manual move and plants shunshin_dex', () => {
    const result = resolveSkill({ skill: shunshin, movement: { kind: 'PULL' } }, baseState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(0);
    expect(result.state.range).toBe(CombatRange.CLOSE);
    expect(result.state.playerMoveUsedThisTurn).toBe(false);
    const mark = result.state.marks.find((m) => m.id === 'shunshin_dex');
    expect(mark?.duration).toBe(1);
    expect(mark?.target).toBe(CombatActor.PLAYER);
    expect(mark?.consume).toBe(MarkConsumeTiming.ATTEMPT);
    expect(result.state.modes.instances).toHaveLength(0);

    const edge = resolveSkill(
      { skill: shunshin, movement: { kind: 'PUSH' } },
      baseState({ range: CombatRange.LONG }),
    );
    expect(edge.ok).toBe(true);
    if (!edge.ok) return;
    expect(edge.state.range).toBe(CombatRange.LONG);
    expect(edge.state.marks.some((m) => m.id === 'shunshin_dex')).toBe(true);
  });
});

describe('T-043 dex payoff', () => {
  it('adds scalingPerPoint on a DEX Offensive and consumes at attempt', () => {
    const armed = resolveSkill({ skill: shunshin }, baseState());
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;

    const boosted = resolveSkill({ skill: dexSide }, { ...armed.state, skills: [dexSide] }, hit);
    expect(boosted.ok).toBe(true);
    if (!boosted.ok) return;
    expect(boosted.damageDealt).toBe(dexSide.baseDamage + dexSide.scalingPerPoint);
    expect(boosted.state.marks.find((m) => m.id === 'shunshin_dex')).toBeUndefined();

    const clean = resolveSkill({ skill: dexSide }, baseState({ skills: [dexSide] }), hit);
    expect(clean.ok).toBe(true);
    if (!clean.ok) return;
    expect(clean.damageDealt).toBe(dexSide.baseDamage);

    const planted = resolveSkill({ skill: shunshin }, baseState());
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const supportAgain = resolveSkill({ skill: shunshin }, planted.state);
    expect(supportAgain.ok).toBe(true);
    if (!supportAgain.ok) return;
    expect(supportAgain.state.marks.some((m) => m.id === 'shunshin_dex')).toBe(true);

    const missed = resolveSkill({ skill: dexSide }, { ...planted.state, skills: [dexSide] }, miss);
    expect(missed.ok).toBe(true);
    if (!missed.ok) return;
    expect(missed.damageDealt).toBe(0);
    expect(missed.state.marks.find((m) => m.id === 'shunshin_dex')).toBeUndefined();
  });
});
