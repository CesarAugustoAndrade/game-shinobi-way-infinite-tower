/**
 * Campaign macro registry (T-023).
 * REGION_ORDER drives post-boss interlude / victory.
 * Regions 2–4 land as stubs until T-024..T-026 ship full configs.
 */

import { RegionConfig } from '../../types';
import { LAND_OF_WAVES_CONFIG } from './landOfWaves';
import { CHUNIN_EXAMS_CONFIG } from './chuninExams';
import { SASUKE_RETRIEVAL_CONFIG } from './sasukeRetrieval';
import { GREAT_NINJA_WAR_CONFIG } from './greatNinjaWar';

export interface CampaignRegionEntry {
  /** Stable campaign id (config.id when present). */
  id: string;
  /** Display name for logs / UI when config missing. */
  name: string;
  /** Full region config; null = not shipped yet (skip → victory if next missing). */
  config: RegionConfig | null;
  /** Campaign difficulty step (used when generating region). */
  baseDifficulty: number;
  /** Post-boss interlude copy (shown when advancing TO the next region). */
  interlude: {
    title: string;
    body: string;
  };
}

/**
 * Full 4-region campaign path (T-026 completes the set).
 * After God Tree Heart boss → VICTORY (no provisional gap).
 */
export const REGION_ORDER: CampaignRegionEntry[] = [
  {
    id: 'land_of_waves',
    name: 'Land of Waves',
    config: LAND_OF_WAVES_CONFIG,
    baseDifficulty: 40,
    interlude: {
      title: 'Mist Lifts, Road Remains',
      body:
        'Gato is gone. The pier is quiet for the first time in years. Workers nail boards over bloodstains and call it quiet enough. A sealed scroll in your pack points inland — toward a forest that eats genin whole.',
    },
  },
  {
    id: 'chunin_exams',
    name: 'Chunin Exams',
    config: CHUNIN_EXAMS_CONFIG,
    baseDifficulty: 55,
    interlude: {
      title: 'Leaf Proving Grounds',
      body:
        'The written exams are over. Beyond the gates of the Forest of Death, only the strong — or the clever — will emerge with the scroll.',
    },
  },
  {
    id: 'sasuke_retrieval',
    name: 'Sasuke Retrieval',
    config: SASUKE_RETRIEVAL_CONFIG,
    baseDifficulty: 70,
    interlude: {
      title: 'Valley of the End',
      body:
        'Friendship and fate collide where two rivers meet. The next path is paved with broken bonds.',
    },
  },
  {
    id: 'great_ninja_war',
    name: 'Great Ninja War',
    config: GREAT_NINJA_WAR_CONFIG,
    baseDifficulty: 85,
    interlude: {
      title: 'Roots of the Divine Tree',
      body:
        'The alliance holds the line. Above the roots of the God Tree, the last war of this age begins.',
    },
  },
];

export function getCampaignEntry(index: number): CampaignRegionEntry | null {
  if (index < 0 || index >= REGION_ORDER.length) return null;
  return REGION_ORDER[index];
}

/** Next entry that has a playable config, or null → campaign victory. */
export function getNextPlayableRegionIndex(fromIndex: number): number | null {
  for (let i = fromIndex + 1; i < REGION_ORDER.length; i++) {
    if (REGION_ORDER[i].config) return i;
  }
  return null;
}

export function getPlayableRegionCount(): number {
  return REGION_ORDER.filter((e) => e.config != null).length;
}
