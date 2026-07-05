/**
 * Level System — Pure level-up logic
 * ============================================================================
 * Single source of truth for level-up mechanics, shared by the live game
 * (App.tsx checkLevelUp) and the Campaign Simulator.
 *
 * Extracted from T-015 architectural feedback: having two independent copies of
 * the level-up loop (App.tsx and CampaignSimulator) risked silent divergence.
 */

import { Player } from '../types';
import { CLAN_GROWTH } from '../constants';
import { getPlayerFullStats } from './StatSystem';

/**
 * Apply all pending level-ups to a player — pure function, no side effects.
 *
 * Behavior mirrors App.tsx `checkLevelUp` exactly:
 *  - Each level-up applies CLAN_GROWTH stat gains for the player's clan.
 *  - The first level gained triggers a full HP/Chakra heal.
 *  - `maxExp` for the next level = newLevel × 100.
 *  - Every iteration creates a fresh Player object with spread (immutable —
 *    never mutates the input or a shallow copy of it).
 *
 * UI concerns (log entries, leveledUp flags) are handled by callers; this
 * function performs only the data transformation.
 */
export function applyLevelUp(player: Player): Player {
  let p = player;
  const oldLevel = player.level;

  while (p.exp >= p.maxExp) {
    const growth = CLAN_GROWTH[p.clan];
    const newLevel = p.level + 1;
    p = {
      ...p,
      exp: p.exp - p.maxExp,
      level: newLevel,
      maxExp: newLevel * 100,
      primaryStats: {
        willpower:    p.primaryStats.willpower    + (growth.willpower    ?? 0),
        chakra:       p.primaryStats.chakra       + (growth.chakra       ?? 0),
        strength:     p.primaryStats.strength     + (growth.strength     ?? 0),
        spirit:       p.primaryStats.spirit       + (growth.spirit       ?? 0),
        intelligence: p.primaryStats.intelligence + (growth.intelligence ?? 0),
        calmness:     p.primaryStats.calmness     + (growth.calmness     ?? 0),
        speed:        p.primaryStats.speed        + (growth.speed        ?? 0),
        accuracy:     p.primaryStats.accuracy     + (growth.accuracy     ?? 0),
        dexterity:    p.primaryStats.dexterity    + (growth.dexterity    ?? 0),
      },
    };
  }

  if (p.level > oldLevel) {
    const newStats = getPlayerFullStats(p);
    p = {
      ...p,
      currentHp:     newStats.derived.maxHp,
      currentChakra: newStats.derived.maxChakra,
    };
  }

  return p;
}
