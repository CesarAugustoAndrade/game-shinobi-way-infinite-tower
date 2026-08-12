/**
 * VisitContext — pure helpers unifying dual locationFloor / branchingFloor.
 *
 * Product path prefers locationFloor; branchingFloor is legacy dual-write.
 * Zero React; safe to import from hooks without circular ESM edges.
 */

import { completeActivity } from '../systems/LocationSystem';
import type { BranchingFloor, RoomActivities } from '../types';
import { GameState } from '../types';

export type VisitFloorKind = 'location' | 'branching';

export interface VisitContext {
  kind: VisitFloorKind;
  floor: BranchingFloor;
}

/**
 * Pick active visit: prefer locationFloor when present (current product path),
 * else branching. Matches useCombatVictory / treasure handlers precedence.
 */
export function resolveVisitContext(args: {
  locationFloor: BranchingFloor | null;
  branchingFloor: BranchingFloor | null;
}): VisitContext | null {
  if (args.locationFloor) {
    return { kind: 'location', floor: args.locationFloor };
  }
  if (args.branchingFloor) {
    return { kind: 'branching', floor: args.branchingFloor };
  }
  return null;
}

/**
 * completeActivity on the active visit floor.
 * Pure wrapper — always returns a new VisitContext with updated floor.
 * (LocationSystem.completeActivity is a no-op mutation-wise when room/activity missing.)
 */
export function completeActivityOnVisit(
  visit: VisitContext,
  roomId: string,
  activityType: keyof RoomActivities
): VisitContext {
  return {
    kind: visit.kind,
    floor: completeActivity(visit.floor, roomId, activityType),
  };
}

/**
 * Apply completed floor back to dual setters shape (for gradual migration).
 * Pure: returns patch object, does not call React setters.
 */
export function visitToFloorPatch(visit: VisitContext): {
  locationFloor?: BranchingFloor;
  branchingFloor?: BranchingFloor;
} {
  if (visit.kind === 'location') {
    return { locationFloor: visit.floor };
  }
  return { branchingFloor: visit.floor };
}

/**
 * Resolve active visit, complete one activity, and build dual-floor patch.
 * Pure: no React. Returns null when neither floor is present.
 */
export function applyVisitActivityComplete(args: {
  locationFloor: BranchingFloor | null;
  branchingFloor: BranchingFloor | null;
  roomId: string;
  activityType: keyof RoomActivities;
}): { visit: VisitContext; patch: ReturnType<typeof visitToFloorPatch> } | null {
  const resolved = resolveVisitContext({
    locationFloor: args.locationFloor,
    branchingFloor: args.branchingFloor,
  });
  if (!resolved) return null;
  const visit = completeActivityOnVisit(resolved, args.roomId, args.activityType);
  return { visit, patch: visitToFloorPatch(visit) };
}

/**
 * Which GameState to return after activity when still exploring.
 * Equivalent to resolveExploreReturnState(region, !!locationFloor):
 * LOCATION_EXPLORE only when region has a current location and the active
 * visit is a location floor; otherwise REGION_MAP. Never returns EXPLORE.
 */
export function resolvePostActivityGameState(
  region: { currentLocationId: string | null } | null,
  visit: VisitContext | null
): GameState {
  if (region?.currentLocationId && visit?.kind === 'location') {
    return GameState.LOCATION_EXPLORE;
  }
  return GameState.REGION_MAP;
}
