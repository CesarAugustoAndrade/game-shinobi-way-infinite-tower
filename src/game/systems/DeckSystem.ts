/**
 * =============================================================================
 * DECK SYSTEM - Weighted card draw for the AP combat economy (T-004)
 * =============================================================================
 *
 * Pure functions that turn a player's skills into a draw pile and deal a
 * per-turn hand biased by the active posture. The only impurity is
 * `Math.random` inside the weighted draw (documented below); inputs are never
 * mutated — every function returns fresh arrays.
 *
 * ## Model
 *
 * - **deck**: the remaining draw pile (skills not currently in hand/discard).
 * - **hand**: the cards the player can play this turn.
 * - **discard**: cards spent or set aside, reshuffled back when the deck can no
 *   longer fill a full hand.
 *
 * PASSIVE skills are always active and never become cards (see `buildDeck`).
 * The per-category draw weight comes from `combatCards.weightFor`, which folds
 * in the posture multipliers from `LaunchProperties.POSTURE_DRAW_WEIGHTS`.
 *
 * =============================================================================
 */

import { ActionType, Posture, Skill } from '../types';
import { weightFor } from '../constants/combatCards';

/**
 * Build the draw pile from a player's skills: every non-PASSIVE skill becomes a
 * card. PASSIVE skills stay always-on and are excluded from the deck.
 *
 * @param skills - The player's full skill list.
 * @returns A new array of the deck-eligible cards (order preserved).
 */
export function buildDeck(skills: Skill[]): Skill[] {
  return skills.filter((skill) => skill.actionType !== ActionType.PASSIVE);
}

/**
 * Weighted, without-replacement draw of up to `handSize` distinct cards from
 * `deck`, biased by the active posture. Cards with a higher posture weight are
 * proportionally more likely to be drawn, but every card keeps a positive
 * weight so none is ever excluded outright.
 *
 * Impurity: uses `Math.random` for the weighted selection. Does NOT mutate the
 * input `deck`.
 *
 * @param deck - The draw pile to deal from.
 * @param posture - The active combat posture (drives the weighting).
 * @param handSize - Maximum number of cards to draw.
 * @returns The drawn `hand` and the `deck` remaining after removal.
 */
export function drawHand(
  deck: Skill[],
  posture: Posture,
  handSize: number
): { hand: Skill[]; deck: Skill[] } {
  const pool = [...deck];
  const hand: Skill[] = [];
  const drawCount = Math.min(Math.max(0, handSize), pool.length);

  for (let i = 0; i < drawCount; i++) {
    const totalWeight = pool.reduce((sum, card) => sum + weightFor(card, posture), 0);

    // Guard against a degenerate (non-positive) total — should not happen since
    // weights are always positive, but keep the draw robust.
    let pickIndex = pool.length - 1;
    if (totalWeight > 0) {
      let roll = Math.random() * totalWeight;
      for (let j = 0; j < pool.length; j++) {
        roll -= weightFor(pool[j], posture);
        if (roll <= 0) {
          pickIndex = j;
          break;
        }
      }
    }

    hand.push(pool[pickIndex]);
    pool.splice(pickIndex, 1);
  }

  return { hand, deck: pool };
}

/**
 * Merge the leftover deck with the discard pile into a single fresh draw pile.
 *
 * @param deck - The remaining draw pile.
 * @param discard - The discard pile to fold back in.
 * @returns A new combined draw pile.
 */
export function reshuffle(deck: Skill[], discard: Skill[]): Skill[] {
  return [...deck, ...discard];
}

/**
 * Deal a fresh hand for a new turn:
 *   1. The previous hand (played and unplayed) joins the discard pile.
 *   2. If the remaining deck cannot fill a full hand, reshuffle the discard in.
 *   3. Weighted-draw `handSize` cards under the active posture.
 *
 * Cards spent during the previous turn should already live in `discard`; only
 * the still-in-hand remainder is passed via `previousHand` so nothing is
 * double-counted.
 *
 * @param deck - The current draw pile.
 * @param discard - The current discard pile (already-spent cards).
 * @param previousHand - Cards still in hand from last turn (returned to discard).
 * @param posture - The active combat posture.
 * @param handSize - Number of cards to draw for the new turn.
 * @returns The new `hand`, the remaining `deck`, and the updated `discard`.
 */
export function drawNewTurnHand(
  deck: Skill[],
  discard: Skill[],
  previousHand: Skill[],
  posture: Posture,
  handSize: number
): { hand: Skill[]; deck: Skill[]; discard: Skill[] } {
  let pile = [...deck];
  let newDiscard = [...discard, ...previousHand];

  if (pile.length < handSize) {
    pile = reshuffle(pile, newDiscard);
    newDiscard = [];
  }

  const { hand, deck: remaining } = drawHand(pile, posture, handSize);
  return { hand, deck: remaining, discard: newDiscard };
}
