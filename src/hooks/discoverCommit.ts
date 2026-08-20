/**
 * T-146 — live Discover commit adapter. Maps CombatState onto commitDiscoverChoice.
 * No React. No second commit engine.
 */

import { CombatRange, type Skill } from '../game/types';
import type { CombatState } from '../game/systems/combat-types';
import { commitDiscoverChoice, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export function combatStateToDiscoverResolve(
  combatState: CombatState,
  skills: readonly Skill[] = [],
): ResolveSkillState {
  return {
    pools: {
      ap: combatState.currentAp,
      chakra: 0,
      hp: 1,
      maxHp: 1,
    },
    range: combatState.currentRange ?? CombatRange.MEDIUM,
    turnIndex: combatState.turnIndex ?? 1,
    marks: (combatState.marks ?? []).map((mark) => ({ ...mark })),
    modes: { instances: (combatState.activeModes ?? []).map((mode) => ({ ...mode })) },
    skills: (skills.length > 0 ? skills : combatState.playablePool).map((skill) => ({ ...skill })),
    playerBuffs: [],
    enemyHp: 1,
    hand: combatState.hand.map((skill) => ({ ...skill })),
    playablePool: combatState.playablePool.map((skill) => ({ ...skill })),
    pendingDiscover: combatState.pendingDiscover
      ? {
          sourceId: combatState.pendingDiscover.sourceId,
          candidates: combatState.pendingDiscover.candidates.map((entry) => ({
            ...entry,
            skill: { ...entry.skill },
            reasons: [...entry.reasons],
          })),
        }
      : undefined,
  };
}

export function commitDiscoverOnCombatState(
  combatState: CombatState,
  chosenSkillId: string,
  skills: readonly Skill[] = [],
): { combatState: CombatState; refused: boolean } {
  const result = commitDiscoverChoice(combatStateToDiscoverResolve(combatState, skills), chosenSkillId);
  if (result.refused) {
    return { combatState, refused: true };
  }
  return {
    refused: false,
    combatState: {
      ...combatState,
      hand: result.state.hand ?? combatState.hand,
      marks: result.state.marks,
      pendingDiscover: undefined,
    },
  };
}
