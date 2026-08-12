/**
 * DeckSystem (T-003): full-pool draw. Inverted from T-004 reshuffle/pile tests.
 */

import { describe, it, expect } from 'vitest';
import { buildDeck, drawHand, drawNewTurnHand, playablePool } from '../DeckSystem';
import { ActionType, CardRole, Posture, Skill } from '../../types';
import { createMockSkill } from './testFixtures';
import { LaunchProperties } from '../../../config/featureFlags';

const card = (id: string, role = CardRole.ATTACK): Skill =>
  createMockSkill({ id, name: id, cardRole: role, baseDamage: 12, scalingPerPoint: 4 });

describe('buildDeck / playablePool', () => {
  it('excludes PASSIVE skills (always-on, never cards)', () => {
    const skills = [
      card('atk'),
      createMockSkill({ id: 'passive', actionType: ActionType.PASSIVE }),
      card('guard', CardRole.SUPPORT),
    ];
    expect(buildDeck(skills).map((c) => c.id)).toEqual(['atk', 'guard']);
    expect(playablePool(skills).some((c) => c.actionType === ActionType.PASSIVE)).toBe(false);
  });

  it('does not mutate the input array', () => {
    const skills = [card('atk'), createMockSkill({ id: 'p', actionType: ActionType.PASSIVE })];
    buildDeck(skills);
    expect(skills).toHaveLength(2);
  });
});

describe('drawHand — full pool, no residual deck', () => {
  it('a full-size draw returns every card and does not expose a leftover pile', () => {
    const pool = [card('a'), card('b', CardRole.SUPPORT), card('c')];
    const { hand, snapshots } = drawHand(pool, { posture: Posture.AGGRESSIVE }, pool.length, () => 0);
    expect(hand).toHaveLength(3);
    expect(new Set(hand.map((c) => c.id))).toEqual(new Set(['a', 'b', 'c']));
    expect(snapshots).toHaveLength(3);
  });

  it('does not mutate the input pool', () => {
    const pool = [card('a'), card('b', CardRole.SUPPORT)];
    drawHand(pool, { posture: Posture.BALANCED }, 1, () => 0.5);
    expect(pool).toHaveLength(2);
  });

  it('a 3-card pool with HAND_SIZE 4 yields a 3-card hand (no crash)', () => {
    expect(LaunchProperties.HAND_SIZE).toBeGreaterThan(3);
    const pool = [card('a'), card('b', CardRole.SUPPORT), card('c')];
    const { hand } = drawHand(pool, { posture: Posture.BALANCED }, LaunchProperties.HAND_SIZE, () => 0);
    expect(hand).toHaveLength(3);
  });

  it('handles an empty pool gracefully', () => {
    const { hand } = drawHand([], { posture: Posture.BALANCED }, LaunchProperties.HAND_SIZE, () => 0);
    expect(hand).toHaveLength(0);
  });
});

describe('drawNewTurnHand — virtual discard (inverted reshuffle)', () => {
  it('second draw samples from the full pool, including cards drawn last turn', () => {
    const pool = [card('d1'), card('d2', CardRole.SUPPORT), card('x1'), card('x2'), card('h1', CardRole.SUPPORT)];
    const turn1 = drawNewTurnHand(pool, { posture: Posture.BALANCED }, 4, () => 0);
    expect(turn1.hand).toHaveLength(4);
    const turn2 = drawNewTurnHand(pool, { posture: Posture.BALANCED }, 4, () => 0);
    expect(turn2.hand).toHaveLength(4);
    expect(turn2.hand.every((s) => pool.some((p) => p.id === s.id))).toBe(true);
  });

  it('does not shrink the pool across turns (no discard pile)', () => {
    const pool = [card('a'), card('b'), card('c'), card('d'), card('e')];
    drawNewTurnHand(pool, { posture: Posture.BALANCED }, 3, () => 0);
    const again = drawNewTurnHand(pool, { posture: Posture.BALANCED }, 5, () => 0);
    expect(again.hand).toHaveLength(5);
    expect(new Set(again.hand.map((s) => s.id)).size).toBe(5);
  });
});
