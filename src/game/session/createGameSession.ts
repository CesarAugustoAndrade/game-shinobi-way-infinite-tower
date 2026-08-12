/**
 * Factory + pure reducer for GameSession (Sprint A).
 * No React / DOM — safe for systems and tests later.
 */

import { GameState } from '../types';
import {
  GAME_SESSION_VERSION,
  type GameSession,
  type GameSessionAction,
} from './types';

/** Empty session used at boot and after full reset. */
export function createEmptyGameSession(): GameSession {
  return {
    version: GAME_SESSION_VERSION,
    gameState: GameState.MENU,
    player: null,
    region: null,
    locationFloor: null,
    branchingFloor: null,
  };
}

/** Alias kept for call-sites that prefer create* naming. */
export const createGameSession = createEmptyGameSession;

/**
 * Pure reducer. Always returns a new object when state changes
 * (immutability for external-store subscribers).
 */
export function reduceGameSession(
  state: GameSession,
  action: GameSessionAction,
): GameSession {
  switch (action.type) {
    case 'SET_GAME_STATE':
      if (state.gameState === action.gameState) return state;
      return { ...state, gameState: action.gameState };

    case 'SET_PLAYER':
      if (state.player === action.player) return state;
      return { ...state, player: action.player };

    case 'SET_REGION':
      if (state.region === action.region) return state;
      return { ...state, region: action.region };

    case 'SET_LOCATION_FLOOR':
      if (state.locationFloor === action.locationFloor) return state;
      return { ...state, locationFloor: action.locationFloor };

    case 'SET_BRANCHING_FLOOR':
      if (state.branchingFloor === action.branchingFloor) return state;
      return { ...state, branchingFloor: action.branchingFloor };

    case 'PATCH': {
      // version is fixed by schema; ignore caller overrides to avoid desync
      const { version: _v, ...rest } = action.partial;
      return { ...state, ...rest, version: state.version };
    }

    case 'HYDRATE':
      return {
        ...action.session,
        version: GAME_SESSION_VERSION,
      };

    default: {
      // Exhaustiveness guard — unknown actions leave state untouched
      const _exhaustive: never = action;
      void _exhaustive;
      return state;
    }
  }
}
