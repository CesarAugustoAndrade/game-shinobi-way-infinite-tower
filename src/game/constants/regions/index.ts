/**
 * Region Configuration Exports
 *
 * Each region defines:
 * - 10-15 Locations with connections
 * - Intel missions and path networks
 * - Loot themes and enemy pools
 */

export { LAND_OF_WAVES_CONFIG } from './landOfWaves';
export { CHUNIN_EXAMS_CONFIG } from './chuninExams';
export { SASUKE_RETRIEVAL_CONFIG } from './sasukeRetrieval';
export { GREAT_NINJA_WAR_CONFIG } from './greatNinjaWar';
export {
  REGION_ORDER,
  getCampaignEntry,
  getNextPlayableRegionIndex,
  getPlayableRegionCount,
} from './campaign';
export type { CampaignRegionEntry } from './campaign';
