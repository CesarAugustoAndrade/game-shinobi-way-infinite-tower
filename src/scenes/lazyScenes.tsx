/**
 * React.lazy wrappers for heavy non-boot scenes.
 * Keeps the initial menu chunk lean; each scene loads on first enter.
 *
 * All target modules use `export default` — no named-export remapping needed.
 */
import React, { Suspense } from 'react';

/** Pixel-friendly full-area placeholder while a scene chunk loads. */
export const SceneFallback: React.FC = () => (
  <div
    className="w-full h-full min-h-0 flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-sm tracking-widest uppercase"
    role="status"
    aria-live="polite"
  >
    Loading…
  </div>
);

/** Wrap any lazy scene tree so first visit shows SceneFallback. */
export const LazyScene: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<SceneFallback />}>{children}</Suspense>
);

// --- Heavy scenes (default exports) ---

export const CharacterSelect = React.lazy(() => import('./menu/CharacterSelect'));
export const GameGuide = React.lazy(() => import('./menu/GameGuide'));

export const Combat = React.lazy(() => import('./combat/Combat'));
export const EliteChallenge = React.lazy(() => import('./combat/EliteChallenge'));

export const Loot = React.lazy(() => import('./rewards/Loot'));
export const TreasureChoice = React.lazy(() => import('./rewards/TreasureChoice'));
export const TreasureHuntReward = React.lazy(() => import('./rewards/TreasureHuntReward'));
export const ScrollDiscovery = React.lazy(() => import('./rewards/ScrollDiscovery'));

export const Merchant = React.lazy(() => import('./activities/Merchant'));
export const Training = React.lazy(() => import('./activities/Training'));
export const Event = React.lazy(() => import('./activities/Event'));
