/**
 * Game session module public surface (pure — no React).
 * React bindings live in `src/hooks/useGameSession.ts`.
 *
 * Visit helpers: prefer `resolveVisitContext` + `completeActivityOnVisit` over
 * dual locationFloor/branchingFloor branches in hooks.
 * Scene soft-lock: `resolveSceneState` + `SCENE_REGISTRY`.
 */

export {
  GAME_SESSION_VERSION,
  type GameSession,
  type GameSessionAction,
} from './types';

export {
  createEmptyGameSession,
  createGameSession,
  reduceGameSession,
} from './createGameSession';

export {
  createSessionStore,
  type SessionListener,
  type SessionStore,
} from './sessionStore';

export {
  type VisitFloorKind,
  type VisitContext,
  resolveVisitContext,
  completeActivityOnVisit,
  visitToFloorPatch,
  resolvePostActivityGameState,
} from './visitContext';

export {
  type SceneEnterContext,
  type SceneDescriptor,
  SCENE_REGISTRY,
  getSceneDescriptor,
  resolveSceneState,
} from './sceneRegistry';
