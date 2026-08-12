/**
 * T-003 AC tests: full-pool weighted draw, SOUL weight formula, Discover 3 + dead hand.
 */

import { describe, it, expect } from 'vitest';
import { ActionType, CardRole, Posture, SkillTag } from '../../types';
import {
  discoverThree,
  drawHand,
  drawNewTurnHand,
  effectiveWeight,
  isDeadHand,
  playablePool,
} from '../DeckSystem';
import { createMockSkill } from './testFixtures';

const fixedRng = (values: number[]): (() => number) => {
  let i = 0;
  return () => values[i++] ?? 0;
};

describe('T-003 full pool', () => {
  it('samples the full playable set on consecutive draws after virtual discard', () => {
    const pool = [
      createMockSkill({ id: 'a', cardRole: CardRole.ATTACK }),
      createMockSkill({ id: 'b', cardRole: CardRole.ATTACK }),
      createMockSkill({ id: 'c', cardRole: CardRole.SUPPORT }),
      createMockSkill({ id: 'd', cardRole: CardRole.SIDE_ATTACK }),
      createMockSkill({ id: 'e', cardRole: CardRole.MODE }),
      createMockSkill({ id: 'f', cardRole: CardRole.SUPPORT }),
    ];
    const ctx = { posture: Posture.BALANCED };
    const turn1 = drawHand(pool, ctx, 4, fixedRng([0, 0, 0, 0]));
    expect(turn1.hand).toHaveLength(4);
    const turn1Ids = new Set(turn1.hand.map((s) => s.id));

    const turn2 = drawNewTurnHand(pool, ctx, 4, fixedRng([0.99, 0.99, 0.99, 0.99]));
    expect(turn2.hand).toHaveLength(4);
    const stillEligible = pool.filter((s) => turn1Ids.has(s.id));
    expect(stillEligible.length).toBe(4);
    const turn2FromFullPool = turn2.hand.every((s) => pool.some((p) => p.id === s.id));
    expect(turn2FromFullPool).toBe(true);

    const forced = drawHand(pool, ctx, 6, () => 0);
    expect(new Set(forced.hand.map((s) => s.id)).size).toBe(6);
  });

  it('excludes PASSIVE from the playable pool', () => {
    const skills = [
      createMockSkill({ id: 'atk', cardRole: CardRole.ATTACK }),
      createMockSkill({ id: 'pas', actionType: ActionType.PASSIVE }),
    ];
    expect(playablePool(skills).map((s) => s.id)).toEqual(['atk']);
  });
});

describe('T-003 weight formula', () => {
  const baseCtx = { posture: Posture.BALANCED };

  it('Aggressive increases ATTACK weight by +1 vs Balanced baseline', () => {
    const attack = createMockSkill({ id: 'rasengan', cardRole: CardRole.ATTACK, baseWeight: 2 });
    expect(effectiveWeight(attack, { posture: Posture.BALANCED })).toBe(2);
    expect(effectiveWeight(attack, { posture: Posture.AGGRESSIVE })).toBe(3);
  });

  it('applies cooldown −1 and Mode self-ON −1; floor is 1', () => {
    const mode = createMockSkill({
      id: 'sage',
      cardRole: CardRole.MODE,
      baseWeight: 2,
      currentCooldown: 2,
    });
    expect(effectiveWeight(mode, { ...baseCtx, activeModeIds: ['sage'] })).toBe(1);
    const alreadyMin = createMockSkill({
      id: 'tiny',
      cardRole: CardRole.ATTACK,
      baseWeight: 1,
      currentCooldown: 1,
    });
    expect(effectiveWeight(alreadyMin, baseCtx)).toBe(1);
  });

  it('does not change weight when only baseDamage differs', () => {
    const low = createMockSkill({ id: 'a', cardRole: CardRole.SUPPORT, baseDamage: 1, baseWeight: 2 });
    const high = createMockSkill({ id: 'b', cardRole: CardRole.SUPPORT, baseDamage: 99, baseWeight: 2 });
    expect(effectiveWeight(low, { posture: Posture.DEFENSIVE })).toBe(
      effectiveWeight(high, { posture: Posture.DEFENSIVE }),
    );
    expect(effectiveWeight(low, { posture: Posture.DEFENSIVE })).toBe(3);
  });
});

describe('T-003 discover and dead hand', () => {
  it('Discover offers ≤3 candidates including a CD skill and choosing it is disabled', () => {
    const source = createMockSkill({ id: 'discover-scroll', cardRole: CardRole.SUPPORT, tags: [SkillTag.DISCOVER] });
    const cd = createMockSkill({
      id: 'chidori',
      cardRole: CardRole.ATTACK,
      currentCooldown: 2,
      tags: [SkillTag.NINJUTSU],
    });
    const readyA = createMockSkill({ id: 'a', cardRole: CardRole.ATTACK, tags: [SkillTag.NINJUTSU] });
    const readyB = createMockSkill({ id: 'b', cardRole: CardRole.ATTACK, tags: [SkillTag.NINJUTSU] });
    const inHand = createMockSkill({ id: 'hand-card', cardRole: CardRole.SUPPORT });
    const result = discoverThree({
      pool: [source, cd, readyA, readyB, inHand],
      hand: [inHand],
      sourceId: source.id,
      filter: { tag: SkillTag.NINJUTSU },
      ctx: { posture: Posture.BALANCED },
      rng: () => 0,
    });
    expect(result.candidates.length).toBeLessThanOrEqual(3);
    expect(result.candidates.some((c) => c.skill.id === 'chidori')).toBe(true);
    expect(result.candidates.some((c) => c.skill.id === 'hand-card' || c.skill.id === source.id)).toBe(false);
    const chosenCd = result.candidates.find((c) => c.skill.id === 'chidori');
    expect(chosenCd?.disabled).toBe(true);
    expect(result.chosen).not.toBeNull();
  });

  it('does not auto-redraw a four-card dead hand', () => {
    const dead = [1, 2, 3, 4].map((n) =>
      createMockSkill({ id: `cd-${n}`, cardRole: CardRole.ATTACK, currentCooldown: 3 }),
    );
    const extra = createMockSkill({ id: 'ready', cardRole: CardRole.ATTACK, currentCooldown: 0 });
    const drawn = drawHand([...dead, extra], { posture: Posture.BALANCED }, 4, () => 0);
    expect(drawn.snapshots).toHaveLength(4);
    expect(isDeadHand(drawn.snapshots)).toBe(true);
    expect(drawn.hand.every((s) => s.currentCooldown > 0)).toBe(true);
    expect(drawn.hand.some((s) => s.id === 'ready')).toBe(false);
  });
});
