/**
 * Tests for DeckSystem (T-004 F2).
 *
 * Lock the weighted-draw economy so the deckbuilder cannot silently drift:
 *  - `buildDeck`        — PASSIVE skills never become cards.
 *  - `drawHand`         — posture biases the draw toward higher-weight cards,
 *                         but no positive-weight card is ever excluded, and a
 *                         deck smaller than the hand never crashes.
 *  - `drawNewTurnHand`  — reshuffle conserves every card (no loss / no dup) and
 *                         the previous hand is folded into the discard.
 *
 * The only impurity is `Math.random` inside the weighted pick; it is mocked so
 * the weighting is asserted deterministically.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildDeck, drawHand, drawNewTurnHand } from '../DeckSystem';
import { ActionType, EffectType, Posture, Skill } from '../../types';
import { createMockSkill } from './testFixtures';
import { LaunchProperties } from '../../../config/featureFlags';

// ── Card factories ──────────────────────────────────────────────────────────
// damageMult > 0.5 ⇒ offensive; damageMult 0 + SHIELD ⇒ defensive.

const offensiveCard = (id: string): Skill =>
  createMockSkill({ id, name: id, damageMult: 2.0 });

const defensiveCard = (id: string): Skill =>
  createMockSkill({
    id,
    name: id,
    damageMult: 0,
    actionType: ActionType.ACTIVE,
    effects: [{ type: EffectType.SHIELD, value: 40, duration: 2, chance: 1.0 }],
  });

/** Count how many times each card id appears across a list of skills. */
const idCounts = (skills: Skill[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const s of skills) counts.set(s.id, (counts.get(s.id) ?? 0) + 1);
  return counts;
};

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// buildDeck
// ============================================================================

describe('buildDeck', () => {
  it('excludes PASSIVE skills (always-on, never cards)', () => {
    const skills = [
      offensiveCard('atk'),
      createMockSkill({ id: 'passive', actionType: ActionType.PASSIVE }),
      defensiveCard('guard'),
    ];
    const deck = buildDeck(skills);

    expect(deck.map((c) => c.id)).toEqual(['atk', 'guard']);
    expect(deck.some((c) => c.actionType === ActionType.PASSIVE)).toBe(false);
  });

  it('does not mutate the input array', () => {
    const skills = [offensiveCard('atk'), createMockSkill({ id: 'p', actionType: ActionType.PASSIVE })];
    buildDeck(skills);
    expect(skills).toHaveLength(2);
  });
});

// ============================================================================
// drawHand — weighted bias
// ============================================================================

describe('drawHand — posture bias', () => {
  // Pool order [offensive, defensive]. Weights (CARD_BASE_WEIGHT 1.0):
  //   AGGRESSIVE → offensive 2.0 / defensive 0.5  (total 2.5)
  //   DEFENSIVE  → offensive 0.5 / defensive 2.0  (total 2.5)
  // For a fixed roll r, the cumulative-weight scan picks the offensive card when
  //   AGGRESSIVE: r*2.5 ≤ 2.0  ⇒ r ≤ 0.80
  //   DEFENSIVE:  r*2.5 ≤ 0.5  ⇒ r ≤ 0.20
  // So the SAME roll resolves to the favored card under each posture.
  it('draws the higher-weight card for the active posture (same roll, different posture)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const pool = [offensiveCard('atk'), defensiveCard('guard')];

    const aggressive = drawHand(pool, Posture.AGGRESSIVE, 1);
    expect(aggressive.hand.map((c) => c.id)).toEqual(['atk']); // offensive favored

    const defensive = drawHand(pool, Posture.DEFENSIVE, 1);
    expect(defensive.hand.map((c) => c.id)).toEqual(['guard']); // defensive favored
  });

  it('favors high-weight cards more often across a sweep of rolls', () => {
    const rolls = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95];
    let idx = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => rolls[idx++ % rolls.length]);

    const pool = [offensiveCard('atk'), defensiveCard('guard')];

    const countOffensive = (posture: Posture): number => {
      idx = 0;
      let hits = 0;
      for (let i = 0; i < rolls.length; i++) {
        if (drawHand(pool, posture, 1).hand[0].id === 'atk') hits++;
      }
      return hits;
    };

    // Offensive is drawn more under AGGRESSIVE than under DEFENSIVE.
    expect(countOffensive(Posture.AGGRESSIVE)).toBeGreaterThan(countOffensive(Posture.DEFENSIVE));
  });
});

// ============================================================================
// drawHand — never excludes a positive-weight card
// ============================================================================

describe('drawHand — inclusion guarantees', () => {
  it('never excludes a card: a full-size draw returns every card', () => {
    const pool = [offensiveCard('a'), defensiveCard('b'), offensiveCard('c')];
    const { hand, deck } = drawHand(pool, Posture.AGGRESSIVE, pool.length);

    expect(hand).toHaveLength(3);
    expect(new Set(hand.map((c) => c.id))).toEqual(new Set(['a', 'b', 'c']));
    expect(deck).toHaveLength(0);
  });

  it('can still draw a low-weight card (no hard exclusion)', () => {
    // Under AGGRESSIVE the defensive card has the LOW weight (0.5). A high roll
    // skips past the heavy offensive card and lands on it.
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const pool = [offensiveCard('atk'), defensiveCard('guard')];

    const { hand } = drawHand(pool, Posture.AGGRESSIVE, 1);
    expect(hand.map((c) => c.id)).toEqual(['guard']); // the low-weight card IS drawable
  });

  it('does not mutate the input deck', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const pool = [offensiveCard('a'), defensiveCard('b')];
    drawHand(pool, Posture.BALANCED, 1);
    expect(pool).toHaveLength(2);
  });
});

// ============================================================================
// drawHand — deck smaller than the hand
// ============================================================================

describe('drawHand — deck smaller than hand size', () => {
  it('a 3-card deck with HAND_SIZE 4 yields a 3-card hand and an empty deck (no crash)', () => {
    expect(LaunchProperties.HAND_SIZE).toBeGreaterThan(3);
    const pool = [offensiveCard('a'), defensiveCard('b'), offensiveCard('c')];

    const { hand, deck } = drawHand(pool, Posture.BALANCED, LaunchProperties.HAND_SIZE);

    expect(hand).toHaveLength(3);
    expect(deck).toHaveLength(0);
    expect(new Set(hand.map((c) => c.id))).toEqual(new Set(['a', 'b', 'c']));
  });

  it('handles an empty deck gracefully (empty hand, no throw)', () => {
    const { hand, deck } = drawHand([], Posture.BALANCED, LaunchProperties.HAND_SIZE);
    expect(hand).toHaveLength(0);
    expect(deck).toHaveLength(0);
  });
});

// ============================================================================
// drawNewTurnHand — reshuffle conservation
// ============================================================================

describe('drawNewTurnHand', () => {
  it('reshuffles when the deck cannot fill a hand, conserving every card (no loss / no dup)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const deck = [offensiveCard('d1'), defensiveCard('d2')]; // 2 < handSize 4 → reshuffle
    const discard = [offensiveCard('x1'), defensiveCard('x2'), offensiveCard('x3')];
    const previousHand = [defensiveCard('h1'), offensiveCard('h2')];
    const handSize = 4;

    const before = [...deck, ...discard, ...previousHand];
    const result = drawNewTurnHand(deck, discard, previousHand, Posture.BALANCED, handSize);

    // Hand is filled to the requested size.
    expect(result.hand).toHaveLength(handSize);
    // Reshuffle emptied the discard (previous hand + discard folded into the pile).
    expect(result.discard).toHaveLength(0);

    // Total card count is invariant and no id is duplicated or lost.
    const after = [...result.hand, ...result.deck, ...result.discard];
    expect(after).toHaveLength(before.length); // 7
    expect(idCounts(after)).toEqual(idCounts(before));
  });

  it('without reshuffle, folds the previous hand into the discard', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const deck = [
      offensiveCard('d1'),
      defensiveCard('d2'),
      offensiveCard('d3'),
      defensiveCard('d4'),
      offensiveCard('d5'),
    ]; // 5 ≥ handSize 3 → no reshuffle
    const discard = [offensiveCard('x1')];
    const previousHand = [defensiveCard('h1'), offensiveCard('h2')];
    const handSize = 3;

    const before = [...deck, ...discard, ...previousHand];
    const result = drawNewTurnHand(deck, discard, previousHand, Posture.BALANCED, handSize);

    expect(result.hand).toHaveLength(3);
    expect(result.deck).toHaveLength(2);
    // Discard = old discard + previous hand (no reshuffle consumed it).
    expect(new Set(result.discard.map((c) => c.id))).toEqual(new Set(['x1', 'h1', 'h2']));

    // Still conserves every card.
    const after = [...result.hand, ...result.deck, ...result.discard];
    expect(idCounts(after)).toEqual(idCounts(before));
  });

  it('does not mutate the input deck or discard arrays', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const deck = [offensiveCard('d1'), defensiveCard('d2')];
    const discard = [offensiveCard('x1')];
    const previousHand = [defensiveCard('h1')];

    drawNewTurnHand(deck, discard, previousHand, Posture.BALANCED, 4);

    expect(deck).toHaveLength(2);
    expect(discard).toHaveLength(1);
  });
});
