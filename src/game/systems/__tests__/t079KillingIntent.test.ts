/**
 * T-079 AC: Killing Intent SUPPORT — 80% Stun 1; Fear 1 always on play.
 *
 * Policy: Fear plants on every successful resolve. Stun is the only roll.
 * Threshold: rng() < 0.8 → enemy Stun 1 (0 succeeds, 0.8 / 0.99 fail). Fail: no self-Stun.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { applyFearOutgoing } from '../MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const intent = SKILLS.KILLING_INTENT;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [intent],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 50,
    ...overrides,
  };
}

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration: number,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

describe('T-079 authoring', () => {
  it('declares SUPPORT AP2 CD6 + 80% Stun 1 + Fear 20 and not AP1 / STUN 0.3', () => {
    expect(intent.cardRole).toBe(CardRole.SUPPORT);
    expect(intent.apCost).toBe(2);
    expect(intent.chakraCost).toBe(0);
    expect(intent.cooldown).toBe(6);
    expect(intent.hpCost).toBe(0);
    expect(intent.baseDamage).toBe(0);
    expect(intent.tags).toEqual(expect.arrayContaining([SkillTag.GENJUTSU, SkillTag.MENTAL]));
    expect(intent.controlStun).toEqual({ chance: 0.8, enemyDuration: 1 });
    expect(intent.controlStun?.failSelfDuration).toBeUndefined();
    expect(intent.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'fear',
          duration: 1,
          stacks: 20,
          family: MarkFamily.STAT,
          targetActor: 'enemy',
        }),
      ]),
    );
    expect(
      intent.effects?.some((e) => e.type === EffectType.STUN && e.chance === 0.3),
    ).toBeFalsy();
  });
});

describe('T-079 stun', () => {
  it('applies enemy Stun 1 on success and no stun on fail; never damages', () => {
    const win = resolveSkill({ skill: intent }, baseState(), { rng: () => 0 });
    expect(win.ok).toBe(true);
    if (!win.ok) return;
    expect(win.damageDealt).toBe(0);
    expect(hasStun(win.state.enemyBuffs, 1)).toBe(true);
    expect(hasStun(win.state.playerBuffs, 1)).toBe(false);

    const lose = resolveSkill({ skill: intent }, baseState(), { rng: () => 0.99 });
    expect(lose.ok).toBe(true);
    if (!lose.ok) return;
    expect(lose.damageDealt).toBe(0);
    expect(hasStun(lose.state.enemyBuffs, 1)).toBe(false);
    expect(hasStun(lose.state.playerBuffs, 1)).toBe(false);
    expect(lose.state.pools.ap).toBe(4);
  });
});

describe('T-079 fear', () => {
  it('plants enemy Fear 1 stacks 20 on play even when Stun fails', () => {
    const win = resolveSkill({ skill: intent }, baseState(), { rng: () => 0 });
    expect(win.ok).toBe(true);
    if (!win.ok) return;
    const fear = win.state.marks.find((m) => m.id === 'fear');
    expect(fear?.target).toBe(CombatActor.ENEMY);
    expect(fear?.duration).toBe(1);
    expect(fear?.stacks).toBe(20);
    const feared = applyFearOutgoing(100, win.state.marks);
    expect(feared.damage).toBe(80);

    const lose = resolveSkill({ skill: intent }, baseState(), { rng: () => 0.99 });
    expect(lose.ok).toBe(true);
    if (!lose.ok) return;
    const still = lose.state.marks.find((m) => m.id === 'fear');
    expect(still?.stacks).toBe(20);
    expect(still?.duration).toBe(1);
  });
});
