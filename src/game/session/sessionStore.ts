/**
 * External GameSession store (no Zustand).
 *
 * Classic getState / dispatch / subscribe API for use with
 * React's useSyncExternalStore. Pure TS — no React import.
 */

import { createEmptyGameSession, reduceGameSession } from './createGameSession';
import type { GameSession, GameSessionAction } from './types';

export type SessionListener = () => void;

export interface SessionStore {
  getState: () => GameSession;
  dispatch: (action: GameSessionAction) => void;
  subscribe: (listener: SessionListener) => () => void;
  /** Replace entire session (hydrate from App useState migration). */
  replace: (session: GameSession) => void;
  /** Patch convenience — shallow merge via PATCH action. */
  patch: (partial: Partial<GameSession>) => void;
}

/**
 * Create an isolated session store.
 * Pass `initial` to seed (e.g. tests or hydrate); defaults to empty session.
 */
export function createSessionStore(initial?: GameSession): SessionStore {
  let state: GameSession = initial ?? createEmptyGameSession();
  const listeners = new Set<SessionListener>();

  const notify = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };

  const getState = (): GameSession => state;

  const dispatch = (action: GameSessionAction): void => {
    const next = reduceGameSession(state, action);
    if (next === state) return;
    state = next;
    notify();
  };

  const subscribe = (listener: SessionListener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const replace = (session: GameSession): void => {
    dispatch({ type: 'HYDRATE', session });
  };

  const patch = (partial: Partial<GameSession>): void => {
    dispatch({ type: 'PATCH', partial });
  };

  return { getState, dispatch, subscribe, replace, patch };
}
