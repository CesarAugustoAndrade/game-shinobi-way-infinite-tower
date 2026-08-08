/**
 * GameSession — Sprint A foundation for external session state.
 *
 * Holds the durable run/session fields that will migrate out of App.tsx
 * useState. Shape is intentionally minimal; expand via PATCH / HYDRATE
 * and future typed actions as systems move onto the store.
 */

import type {
  BranchingFloor,
  GameState,
  Player,
  Region,
} from '../types';

/** Schema version for hydrate / save migration. */
export const GAME_SESSION_VERSION = 1 as const;

/**
 * Core session document. Nullable exploration fields match App.tsx
 * (player/region/floors are null until char-select / enter-location).
 */
export interface GameSession {
  /** Discriminant for save migration. */
  version: typeof GAME_SESSION_VERSION;
  /** High-level scene / flow state. */
  gameState: GameState;
  player: Player | null;
  region: Region | null;
  /** Active location diamond floor (modern path). */
  locationFloor: BranchingFloor | null;
  /** Legacy branching floor; kept during migration. */
  branchingFloor: BranchingFloor | null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type GameSessionAction =
  | { type: 'SET_GAME_STATE'; gameState: GameState }
  | { type: 'SET_PLAYER'; player: Player | null }
  | { type: 'SET_REGION'; region: Region | null }
  | { type: 'SET_LOCATION_FLOOR'; locationFloor: BranchingFloor | null }
  | { type: 'SET_BRANCHING_FLOOR'; branchingFloor: BranchingFloor | null }
  /** Shallow-merge partial fields onto the current session. */
  | { type: 'PATCH'; partial: Partial<GameSession> }
  /** Replace entire session (load / App migration hydrate). */
  | { type: 'HYDRATE'; session: GameSession };
