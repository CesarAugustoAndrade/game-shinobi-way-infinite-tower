/**
 * Infinite Ascent / Infinite Tower mode (T-027).
 * Procedural regions cycle the 4 curated campaign templates with rising difficulty.
 * Pure helpers — no React. Unlock flag uses localStorage (minimal meta, by design).
 */

import {
  LocationConfig,
  PathConfig,
  RegionConfig,
} from '../types';
import { REGION_ORDER } from '../constants/regions/campaign';

export const INFINITE_UNLOCK_STORAGE_KEY = 'shinobi-way-infinite-unlocked';

/** Difficulty added per infinite floor (after campaign base of template). */
export const INFINITE_DIFFICULTY_PER_FLOOR = 12;

/** In-memory fallback when localStorage is missing (tests / private mode). */
let memoryUnlocked = false;

/** Display height starts at 1 for the first infinite region. */
export function infiniteHeightFromFloor(floorIndex: number): number {
  return Math.max(1, floorIndex + 1);
}

export function isInfiniteModeUnlocked(): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(INFINITE_UNLOCK_STORAGE_KEY);
      if (v === '1') {
        memoryUnlocked = true;
        return true;
      }
      if (v === '0' || v === null) {
        // Prefer storage when available and explicitly empty
        if (v === '0') memoryUnlocked = false;
      }
    }
  } catch {
    // fall through to memory
  }
  return memoryUnlocked;
}

export function unlockInfiniteMode(): void {
  memoryUnlocked = true;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(INFINITE_UNLOCK_STORAGE_KEY, '1');
    }
  } catch {
    // ignore private mode / SSR — memory still set
  }
}

/** Test helper: clear unlock (memory + storage when present). */
export function clearInfiniteUnlockForTests(): void {
  memoryUnlocked = false;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(INFINITE_UNLOCK_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

function remapPath(path: PathConfig, floorIndex: number): PathConfig {
  return {
    ...path,
    id: `${path.id}_f${floorIndex}`,
    targetId: `${path.targetId}_f${floorIndex}`,
  };
}

function remapLocation(loc: LocationConfig, floorIndex: number): LocationConfig {
  return {
    ...loc,
    id: `${loc.id}_f${floorIndex}`,
    forwardPaths: loc.forwardPaths.map((p) => remapPath(p, floorIndex)),
    loopPaths: loc.loopPaths?.map((p) => remapPath(p, floorIndex)),
    secretPaths: loc.secretPaths?.map((p) => remapPath(p, floorIndex)),
    unlockCondition: loc.unlockCondition
      ? {
          ...loc.unlockCondition,
          requirement: `${loc.unlockCondition.requirement}_f${floorIndex}`,
        }
      : undefined,
  };
}

/**
 * Pick a curated template by cycling REGION_ORDER, stamp unique location ids,
 * and raise baseDifficulty with floor index.
 *
 * @param floorIndex 0-based infinite floor (0 = first ascent region)
 * @param missionDifficulty optional global difficulty slider 0–100 blended in
 */
export function generateInfiniteRegionConfig(
  floorIndex: number,
  missionDifficulty: number = 40,
): RegionConfig {
  const templates = REGION_ORDER.map((e) => e.config).filter(
    (c): c is RegionConfig => c != null,
  );
  if (templates.length === 0) {
    throw new Error('No campaign region templates available for infinite mode');
  }

  const template = templates[floorIndex % templates.length];
  const cycle = Math.floor(floorIndex / templates.length);
  const height = infiniteHeightFromFloor(floorIndex);

  // Scale: template base + floor ramp + slight mission difficulty bleed
  const baseDifficulty = Math.min(
    400,
    Math.round(
      template.baseDifficulty
        + floorIndex * INFINITE_DIFFICULTY_PER_FLOOR
        + missionDifficulty * 0.15
        + cycle * 8,
    ),
  );

  const locations = template.locations.map((l) => remapLocation(l, floorIndex));

  return {
    ...template,
    id: `infinite_${template.id}_f${floorIndex}`,
    name: `${template.name} · Ascent ${height}`,
    description: `${template.description} (Infinite Ascent floor ${height} — no summit.)`,
    theme: `${template.theme} | infinite floor ${height}`,
    entryLocationIds: template.entryLocationIds.map((id) => `${id}_f${floorIndex}`),
    bossLocationId: `${template.bossLocationId}_f${floorIndex}`,
    locations,
    baseDifficulty,
  };
}

/** Score for GameOver / leaderboard display. */
export function computeTowerScore(regionsClearedInInfinite: number): number {
  return Math.max(0, regionsClearedInInfinite);
}
