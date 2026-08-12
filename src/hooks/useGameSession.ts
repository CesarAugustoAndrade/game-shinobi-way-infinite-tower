/**
 * React bindings for the external GameSession store (Sprint A).
 *
 * Module-level singleton keeps wiring simple until multi-store /
 * provider injection is needed. Does not touch App.tsx yet.
 */

import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  createSessionStore,
  type SessionStore,
} from '../game/session/sessionStore';
import type { GameSession } from '../game/session/types';
import { GameState } from '../game/types';

/** App-wide singleton store for Sprint A. */
export const gameSessionStore: SessionStore = createSessionStore();

export function useGameSession(): {
  session: GameSession;
  dispatch: SessionStore['dispatch'];
  patch: SessionStore['patch'];
  replace: SessionStore['replace'];
  setGameState: (s: GameState) => void;
} {
  const session = useSyncExternalStore(
    gameSessionStore.subscribe,
    gameSessionStore.getState,
    gameSessionStore.getState,
  );

  const setGameState = useCallback((s: GameState) => {
    gameSessionStore.dispatch({ type: 'SET_GAME_STATE', gameState: s });
  }, []);

  return useMemo(
    () => ({
      session,
      dispatch: gameSessionStore.dispatch,
      patch: gameSessionStore.patch,
      replace: gameSessionStore.replace,
      setGameState,
    }),
    [session, setGameState],
  );
}

/**
 * Subscribe to a derived slice. Re-renders only when the selected
 * value changes by Object.is. Still listens to the full store
 * (naive Sprint A — fine until selector-driven equality needs work).
 */
export function useGameSessionSlice<T>(selector: (s: GameSession) => T): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const prevRef = useRef<T | undefined>(undefined);
  const hasPrevRef = useRef(false);

  const getSnapshot = useCallback((): T => {
    const next = selectorRef.current(gameSessionStore.getState());
    if (hasPrevRef.current && Object.is(prevRef.current, next)) {
      return prevRef.current as T;
    }
    hasPrevRef.current = true;
    prevRef.current = next;
    return next;
  }, []);

  return useSyncExternalStore(
    gameSessionStore.subscribe,
    getSnapshot,
    getSnapshot,
  );
}
