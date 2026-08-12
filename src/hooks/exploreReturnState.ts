import { GameState } from '../game/types';

/**
 * Resolve a safe post-activity map state. Never returns EXPLORE (no UI).
 * Prefer LOCATION_EXPLORE when still inside a location; otherwise REGION_MAP.
 *
 * Kept in a pure module (not useExploration) so combat-victory and other hooks
 * can import without circular ESM edges that break named exports under Vite.
 */
export function resolveExploreReturnState(
  region: { currentLocationId: string | null } | null,
  hasLocationFloor: boolean
): GameState {
  if (region?.currentLocationId && hasLocationFloor) {
    return GameState.LOCATION_EXPLORE;
  }
  return GameState.REGION_MAP;
}
