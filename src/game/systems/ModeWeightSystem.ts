/**
 * ModeWeightSystem — ON Modes → WeightContext.modeBonuses (T-015).
 * SkillId path only. No React. No Math.random.
 */

import { ActiveModeRuntime, ModeDefinition, ModeRuntimeState } from '../types';
import { getModeDefinition } from '../constants/modes';

export type ModeWeightLookup = (id: string) => ModeDefinition | undefined;

function isModeOn(mode: ActiveModeRuntime): boolean {
  return mode.state === ModeRuntimeState.ON || mode.state === undefined;
}

/**
 * Sum skillId weight deltas from ON Modes.
 * OFF / COOLDOWN instances contribute nothing.
 */
export function buildModeWeightBonuses(
  activeModes: readonly ActiveModeRuntime[],
  lookup: ModeWeightLookup = getModeDefinition,
): Readonly<Record<string, number>> {
  const bonuses: Record<string, number> = {};
  for (const mode of activeModes) {
    if (!isModeOn(mode)) continue;
    const def = lookup(mode.id);
    if (!def) continue;
    for (const modifier of def.weightModifiers) {
      if (!modifier.skillId) continue;
      bonuses[modifier.skillId] = (bonuses[modifier.skillId] ?? 0) + modifier.delta;
    }
  }
  return bonuses;
}
