/**
 * Simulator Utilities — Shared helpers for LocationSimulator and CampaignSimulator
 * ============================================================================
 * Extracted from T-015 architectural feedback: `prepareForCombat` and
 * `pickNextRoom` were copy-pasted between the two simulators. This module is the
 * single source of truth for both.
 */

import { Player, BranchingFloor, BranchingRoom } from '../game/types';
import { getRoomById } from '../game/systems/LocationSystem';

/**
 * Prepare the persistent player for a fresh combat encounter.
 *
 * Mirrors the real game's `startCombat` (useCombat.ts): combat buffs cleared,
 * skill cooldowns reset to 0, toggles deactivated. HP/chakra are preserved —
 * they are the attrition pools that carry over between rooms.
 */
export function prepareForCombat(player: Player): Player {
  return {
    ...player,
    activeBuffs: [],
    skills: player.skills.map(s => ({ ...s, currentCooldown: 0, isActive: false })),
  };
}

/**
 * Pick the next room to move into. Deterministic: if the floor's exit room has
 * been generated, navigate toward it (walk up the exit's parent chain to the
 * child of `current` that leads there); otherwise take the first child.
 */
export function pickNextRoom(
  floor: BranchingFloor,
  current: BranchingRoom,
  children: BranchingRoom[]
): BranchingRoom {
  if (floor.exitRoomId) {
    let node: BranchingRoom | undefined = getRoomById(floor, floor.exitRoomId);
    while (node && node.parentId && node.parentId !== current.id) {
      node = getRoomById(floor, node.parentId);
    }
    if (node && node.parentId === current.id) {
      const childTowardExit = children.find(c => c.id === node!.id);
      if (childTowardExit) return childTowardExit;
    }
  }
  return children[0];
}
