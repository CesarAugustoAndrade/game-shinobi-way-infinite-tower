/**
 * =============================================================================
 * ROOM GRAPH SYSTEM - Navigation, Activity Completion & Room Queries
 * =============================================================================
 *
 * Pure room-graph operations extracted from LocationSystem:
 * - Accessibility / movement between rooms
 * - Activity ordering and completion
 * - Floor-completion checks
 * - Room state queries
 * - Combat setup readout for a room
 *
 * Zero React/DOM. Generation (ensureGrandchildrenExist) stays in LocationSystem;
 * moveToRoom calls it so foresight levels remain populated after travel.
 */

import {
  BranchingFloor,
  BranchingRoom,
  CombatModifierType,
  RoomActivities,
  RoomTier,
  TerrainType,
  Player,
  Enemy,
  ACTIVITY_ORDER,
} from '../types';
import { ensureGrandchildrenExist } from './LocationSystem';

// ============================================================================
// ROOM NAVIGATION
// ============================================================================

/**
 * Check if a room is accessible from the current room
 */
export function isRoomAccessible(
  branchingFloor: BranchingFloor,
  targetRoomId: string
): boolean {
  const currentRoom = branchingFloor.rooms.find(r => r.id === branchingFloor.currentRoomId);
  if (!currentRoom) return false;

  // Can always access current room
  if (targetRoomId === branchingFloor.currentRoomId) return true;

  // Can only move to child rooms if current room is cleared
  if (!currentRoom.isCleared) return false;

  return currentRoom.childIds.includes(targetRoomId);
}

/**
 * Move to a new room
 * Also triggers dynamic generation of grandchildren for the new room
 */
export function moveToRoom(
  branchingFloor: BranchingFloor,
  targetRoomId: string,
  player?: Player
): BranchingFloor {
  const targetRoom = branchingFloor.rooms.find(r => r.id === targetRoomId);

  // Check if target room exists and is accessible
  if (!targetRoom || !targetRoom.isAccessible) {
    return branchingFloor;
  }

  // Only increment roomsVisited if actually moving to a different room
  // (re-entering current room for remaining activities shouldn't count)
  const isNewRoom = branchingFloor.currentRoomId !== targetRoomId;

  // Update current room flags - preserve existing accessibility
  const updatedRooms = branchingFloor.rooms.map(room => ({
    ...room,
    isCurrent: room.id === targetRoomId,
  }));

  let updatedFloor: BranchingFloor = {
    ...branchingFloor,
    currentRoomId: targetRoomId,
    rooms: updatedRooms,
    roomsVisited: isNewRoom ? branchingFloor.roomsVisited + 1 : branchingFloor.roomsVisited,
  };

  // Generate grandchildren for this room's children (ensure 2 levels visible)
  updatedFloor = ensureGrandchildrenExist(updatedFloor, targetRoomId, player);

  return updatedFloor;
}

// ============================================================================
// ACTIVITY MANAGEMENT
// ============================================================================

/**
 * Get the current activity for a room
 */
export function getCurrentActivity(room: BranchingRoom): keyof RoomActivities | null {
  for (const activityKey of ACTIVITY_ORDER) {
    const activity = room.activities[activityKey];
    if (activity && !isActivityCompleted(activity)) {
      return activityKey;
    }
  }
  return null;
}

/**
 * Check if an activity is completed
 */
function isActivityCompleted(activity: RoomActivities[keyof RoomActivities]): boolean {
  if (!activity) return true;

  if ('completed' in activity) return activity.completed;
  if ('collected' in activity) return activity.collected;

  return false;
}

/**
 * Mark an activity as completed
 */
export function completeActivity(
  branchingFloor: BranchingFloor,
  roomId: string,
  activityKey: keyof RoomActivities
): BranchingFloor {
  const updatedRooms = branchingFloor.rooms.map(room => {
    if (room.id !== roomId) return room;

    const activity = room.activities[activityKey];
    if (!activity) return room;

    const updatedActivity = { ...activity };
    if ('completed' in updatedActivity) {
      updatedActivity.completed = true;
    }
    if ('collected' in updatedActivity) {
      updatedActivity.collected = true;
    }

    const updatedActivities = {
      ...room.activities,
      [activityKey]: updatedActivity,
    };

    // Check if all activities are now complete
    const allCompleted = ACTIVITY_ORDER.every(key => {
      const act = updatedActivities[key];
      return !act || isActivityCompleted(act);
    });

    // Update child rooms accessibility if room is now cleared
    let updatedChildIds = room.childIds;

    return {
      ...room,
      activities: updatedActivities,
      isCleared: allCompleted,
    };
  });

  // If the room was cleared, unlock children without mutating prior room objects
  // (map kept non-target rooms by reference — in-place isAccessible=true corrupted history).
  const clearedRoom = updatedRooms.find(r => r.id === roomId);
  const roomsAfterUnlock =
    clearedRoom?.isCleared
      ? updatedRooms.map((room) =>
          clearedRoom.childIds.includes(room.id) && !room.isAccessible
            ? { ...room, isAccessible: true }
            : room
        )
      : updatedRooms;

  // Count cleared rooms
  const clearedCount = roomsAfterUnlock.filter(r => r.isCleared).length;

  return {
    ...branchingFloor,
    rooms: roomsAfterUnlock,
    clearedRooms: clearedCount,
  };
}

/**
 * Soft-lock recovery: room has no remaining activities but is still !isCleared
 * (empty gen after event/elite flag dropouts, or spent residue). Without this,
 * children never unlock and the branch is permanently sealed.
 * No-op when room already cleared or still has a pending activity.
 */
export function clearRoomIfSpent(
  branchingFloor: BranchingFloor,
  roomId: string
): BranchingFloor {
  const room = branchingFloor.rooms.find((r) => r.id === roomId);
  if (!room || room.isCleared) return branchingFloor;
  if (getCurrentActivity(room)) return branchingFloor;

  const updatedRooms = branchingFloor.rooms.map((r) =>
    r.id === roomId ? { ...r, isCleared: true } : r
  );
  const clearedRoom = updatedRooms.find((r) => r.id === roomId);
  const roomsAfterUnlock = clearedRoom
    ? updatedRooms.map((r) =>
        clearedRoom.childIds.includes(r.id) && !r.isAccessible
          ? { ...r, isAccessible: true }
          : r
      )
    : updatedRooms;

  return {
    ...branchingFloor,
    rooms: roomsAfterUnlock,
    clearedRooms: roomsAfterUnlock.filter((r) => r.isCleared).length,
  };
}

/**
 * Check if the floor is complete (exit room cleared)
 */
export function isFloorComplete(branchingFloor: BranchingFloor): boolean {
  const exitRoom = branchingFloor.rooms.find(r => r.id === branchingFloor.exitRoomId);
  return exitRoom?.isCleared ?? false;
}

// ============================================================================
// ROOM STATE QUERIES
// ============================================================================

/**
 * Get a room by ID
 */
export function getRoomById(
  branchingFloor: BranchingFloor,
  roomId: string
): BranchingRoom | undefined {
  return branchingFloor.rooms.find(r => r.id === roomId);
}

/**
 * Get the current room
 */
export function getCurrentRoom(branchingFloor: BranchingFloor): BranchingRoom | undefined {
  return branchingFloor.rooms.find(r => r.id === branchingFloor.currentRoomId);
}

/**
 * Get child rooms of a room
 */
export function getChildRooms(
  branchingFloor: BranchingFloor,
  roomId: string
): BranchingRoom[] {
  const room = branchingFloor.rooms.find(r => r.id === roomId);
  if (!room) return [];

  return room.childIds
    .map(childId => branchingFloor.rooms.find(r => r.id === childId))
    .filter((r): r is BranchingRoom => r !== undefined);
}

/**
 * Get rooms by tier
 */
export function getRoomsByTier(
  branchingFloor: BranchingFloor,
  tier: RoomTier
): BranchingRoom[] {
  return branchingFloor.rooms.filter(r => r.tier === tier);
}

// ============================================================================
// COMBAT MODIFIER HELPERS
// ============================================================================

/**
 * Get combat setup for a room
 */
export function getCombatSetup(room: BranchingRoom): {
  enemy: Enemy | null;
  modifiers: CombatModifierType[];
  terrain: TerrainType;
} {
  const combat = room.activities.combat;

  return {
    enemy: combat?.enemy ?? null,
    modifiers: combat?.modifiers ?? [CombatModifierType.NONE],
    terrain: room.terrain,
  };
}
