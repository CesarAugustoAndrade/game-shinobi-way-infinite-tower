/**
 * Sprint A — minimal scene registry.
 * Adding a GameState becomes "register a module" (descriptor), not App-routing glue.
 * Pure TS: no React / DOM.
 */

import {
  GameState,
  type Player,
  type Region,
  type BranchingFloor,
} from '../types';

export interface SceneEnterContext {
  session: {
    gameState: GameState;
    player: Player | null;
    region: Region | null;
    locationFloor: BranchingFloor | null;
    // allow extra fields
    [key: string]: unknown;
  };
}

export interface SceneDescriptor {
  id: GameState;
  /** Human label for debug */
  label: string;
  /** Soft-lock guard: can this state render safely? */
  canEnter: (ctx: SceneEnterContext) => boolean;
  /** Fallback if canEnter fails */
  fallback: GameState;
  /** Optional payload key name for documentation */
  payloadKey?: string;
}

const hasPlayer = (ctx: SceneEnterContext): boolean => ctx.session.player != null;
const hasRegion = (ctx: SceneEnterContext): boolean => ctx.session.region != null;
const hasLocationFloor = (ctx: SceneEnterContext): boolean =>
  ctx.session.locationFloor != null;

export const SCENE_REGISTRY: Partial<Record<GameState, SceneDescriptor>> = {
  [GameState.MENU]: {
    id: GameState.MENU,
    label: 'Menu',
    canEnter: () => true,
    fallback: GameState.MENU,
  },
  [GameState.REGION_MAP]: {
    id: GameState.REGION_MAP,
    label: 'Region Map',
    canEnter: (ctx) => hasPlayer(ctx),
    fallback: GameState.MENU,
  },
  [GameState.LOCATION_EXPLORE]: {
    id: GameState.LOCATION_EXPLORE,
    label: 'Location Explore',
    canEnter: (ctx) => hasPlayer(ctx) && hasRegion(ctx) && hasLocationFloor(ctx),
    fallback: GameState.REGION_MAP,
  },
  [GameState.COMBAT]: {
    id: GameState.COMBAT,
    label: 'Combat',
    canEnter: (ctx) => hasPlayer(ctx),
    fallback: GameState.REGION_MAP,
  },
  [GameState.SCENE_REGISTRY_PROBE]: {
    id: GameState.SCENE_REGISTRY_PROBE,
    label: 'Registry Probe',
    canEnter: () => true,
    fallback: GameState.MENU,
  },
};

export function getSceneDescriptor(state: GameState): SceneDescriptor | undefined {
  return SCENE_REGISTRY[state];
}

/**
 * Resolve a requested state through soft-lock guards.
 * If canEnter fails → try descriptor.fallback once; if that also fails →
 * REGION_MAP (when enterable) else MENU.
 * Unregistered states pass through unchanged (App still owns routing).
 */
export function resolveSceneState(state: GameState, ctx: SceneEnterContext): GameState {
  const desc = getSceneDescriptor(state);
  if (!desc) {
    return state;
  }

  if (desc.canEnter(ctx)) {
    return state;
  }

  // One re-check on fallback to avoid infinite fallback loops
  const fallback = desc.fallback;
  if (fallback !== state) {
    const fallbackDesc = getSceneDescriptor(fallback);
    if (!fallbackDesc || fallbackDesc.canEnter(ctx)) {
      return fallback;
    }
  }

  // Safe terminal defaults
  const regionMap = getSceneDescriptor(GameState.REGION_MAP);
  if (regionMap?.canEnter(ctx)) {
    return GameState.REGION_MAP;
  }
  return GameState.MENU;
}
