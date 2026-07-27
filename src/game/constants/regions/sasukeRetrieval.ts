/**
 * =============================================================================
 * SASUKE RETRIEVAL — VALLEY OF THE END (T-025)
 * =============================================================================
 *
 * Third campaign region. Pursuit of a missing-nin through Sound territory
 * toward the final clash at the Valley of the End.
 *
 * ## REGION STRUCTURE
 * - 13 Locations (10 main + 3 secret)
 * - Entry: Leaf Gate, River Road
 * - Boss: Valley of the End (danger 7)
 *
 * ## DANGER PROGRESSION
 * Entry (1-2) → Early (3) → Mid (4-5) → Late (5-6) → Boss (7)
 *
 * =============================================================================
 */

import {
  RegionConfig,
  LocationConfig,
  LocationType,
  LocationTerrainType,
  PathType,
  ElementType,
} from '../../types';
import { locationIconFromRegistry } from '../artRegistry';

// ============================================================================
// LOCATION DEFINITIONS
// ============================================================================

const LEAF_GATE: LocationConfig = {
  id: 'leaf_gate',
  name: 'Leaf Gate',
  description:
    'Konoha\'s outer gate at dawn. The pursuit begins with spare kunai and a name on every tongue: Sasuke.',
  type: LocationType.SETTLEMENT,
  icon: locationIconFromRegistry('leaf_gate'),
  dangerLevel: 1,
  terrain: LocationTerrainType.NEUTRAL,
  terrainEffects: [],
  biome: 'Village Gate',
  enemyPool: ['deserter_scout', 'bandit_lookout', 'anxious_genin'],
  lootTable: 'rogue_settlement',
  atmosphereEvents: ['mission_brief', 'farewell_team', 'wanted_poster'],
  tiedStoryEvents: ['valley_vision'],
  forwardPaths: [
    {
      id: 'gate_to_river',
      targetId: 'river_road',
      pathType: PathType.FORWARD,
      description: 'The river road south',
      dangerHint: 'Sound scouts watch the banks',
    },
    {
      id: 'gate_to_border',
      targetId: 'sound_border',
      pathType: PathType.BRANCH,
      description: 'A forest cut toward Sound Country',
      dangerHint: 'No leaf patrols beyond this line',
    },
  ],
  flags: {
    isEntry: true,
    isBoss: false,
    isSecret: false,
    hasMerchant: true,
    hasRest: true,
    hasTraining: false,
  },
};

const RIVER_ROAD: LocationConfig = {
  id: 'river_road',
  name: 'River Road',
  description: 'A long road along cold water. Footprints of missing-nin vanish into the current.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('river_road'),
  dangerLevel: 2,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.1 },
    { type: 'ambush_chance', value: 0.15 },
  ],
  biome: 'River Banks',
  enemyPool: ['river_bandit', 'sound_scout', 'ronin_wanderer'],
  lootTable: 'rogue_wilderness',
  atmosphereEvents: ['washed_kunai', 'night_camp', 'false_trail'],
  forwardPaths: [
    {
      id: 'river_to_border',
      targetId: 'sound_border',
      pathType: PathType.FORWARD,
      description: 'Follow the border markers',
      dangerHint: 'Oto seals on the trees',
    },
  ],
  secretPaths: [
    {
      id: 'river_to_supply',
      targetId: 'hidden_supply_cache',
      pathType: PathType.SECRET,
      description: 'A supply drop half-sunk in reeds',
      dangerHint: 'Trap or gift?',
    },
  ],
  flags: {
    isEntry: true,
    isBoss: false,
    isSecret: false,
    hasMerchant: false,
    hasRest: true,
    hasTraining: false,
  },
};

const SOUND_BORDER: LocationConfig = {
  id: 'sound_border',
  name: 'Sound Border',
  description: 'Wire and silence. Crossing means war with Sound Village.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('sound_border'),
  dangerLevel: 3,
  terrain: LocationTerrainType.FOREST,
  terrainEffects: [
    { type: 'ambush_chance', value: 0.25 },
    { type: 'evasion_bonus', value: 0.05 },
  ],
  biome: 'Border Forest',
  enemyPool: ['sound_scout', 'wire_trapper', 'oto_genin'],
  lootTable: 'rogue_wilderness',
  atmosphereEvents: ['border_alarm', 'dead_messenger', 'curse_mark_glint'],
  forwardPaths: [
    {
      id: 'border_to_waterfall',
      targetId: 'waterfall_pass',
      pathType: PathType.FORWARD,
      description: 'The roaring pass',
      dangerHint: 'Sound carries for miles',
    },
    {
      id: 'border_to_camp',
      targetId: 'sound_four_camp',
      pathType: PathType.BRANCH,
      description: 'Tracks of four elite chakra signatures',
      dangerHint: 'Sound Four territory',
    },
  ],
  loopPaths: [
    {
      id: 'border_to_gate',
      targetId: 'leaf_gate',
      pathType: PathType.LOOP,
      description: 'Fall back toward the Leaf',
      dangerHint: 'Pride or survival?',
    },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: false,
    hasRest: false,
    hasTraining: true,
  },
};

const WATERFALL_PASS: LocationConfig = {
  id: 'waterfall_pass',
  name: 'Waterfall Pass',
  description: 'A thunderous waterfall hides caves and killers. The air tastes of ozone and blood.',
  type: LocationType.LANDMARK,
  icon: locationIconFromRegistry('waterfall_pass'),
  dangerLevel: 3,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.15 },
    { type: 'visibility_penalty', value: -0.1 },
  ],
  biome: 'Waterfall Pass',
  enemyPool: ['waterfall_assassin', 'sound_sensor', 'missing_nin'],
  lootTable: 'rogue_landmark',
  atmosphereEvents: ['echo_fight', 'cave_entrance', 'lightning_flash'],
  forwardPaths: [
    {
      id: 'waterfall_to_camp',
      targetId: 'sound_four_camp',
      pathType: PathType.FORWARD,
      description: 'Climb toward smoke',
      dangerHint: 'Elite campfires',
    },
    {
      id: 'waterfall_to_shrine',
      targetId: 'curse_mark_shrine',
      pathType: PathType.BRANCH,
      description: 'A path of black seals',
      dangerHint: 'Curse mark energy',
    },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: false,
    hasRest: true,
    hasTraining: false,
  },
};

const SOUND_FOUR_CAMP: LocationConfig = {
  id: 'sound_four_camp',
  name: 'Sound Four Camp',
  description: 'Oto\'s elite rest here between hunts. Level Two seals hum under their skin.',
  type: LocationType.STRONGHOLD,
  icon: locationIconFromRegistry('sound_four_camp'),
  dangerLevel: 4,
  terrain: LocationTerrainType.FORTIFIED,
  terrainEffects: [
    { type: 'enemy_defense_bonus', value: 0.15 },
    { type: 'enemy_attack_bonus', value: 0.1 },
  ],
  biome: 'Oto Camp',
  enemyPool: ['jirobo_adept', 'kidomaru_adept', 'sakon_adept', 'sound_four_guard'],
  lootTable: 'rogue_stronghold',
  atmosphereEvents: ['level_two_threat', 'prisoner_cage', 'tayuya_flute'],
  tiedStoryEvents: ['sound_four_ritual'],
  forwardPaths: [
    {
      id: 'camp_to_shrine',
      targetId: 'curse_mark_shrine',
      pathType: PathType.FORWARD,
      description: 'Follow the ritual smoke',
      dangerHint: 'Seals grow denser',
    },
    {
      id: 'camp_to_chains',
      targetId: 'forest_of_chains',
      pathType: PathType.BRANCH,
      description: 'A forest bound in iron wire',
      dangerHint: 'Kidomaru\'s playground',
    },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: true,
    hasRest: false,
    hasTraining: false,
  },
};

const CURSE_MARK_SHRINE: LocationConfig = {
  id: 'curse_mark_shrine',
  name: 'Curse Mark Shrine',
  description: 'A ruined shrine where Orochimaru branded his chosen. Power and pain share one altar.',
  type: LocationType.LANDMARK,
  icon: locationIconFromRegistry('curse_mark_shrine'),
  dangerLevel: 4,
  terrain: LocationTerrainType.CORRUPTED,
  terrainEffects: [
    { type: 'mental_damage_bonus', value: 0.15 },
    { type: 'enemy_attack_bonus', value: 0.1 },
  ],
  biome: 'Cursed Shrine',
  enemyPool: ['cursed_vessel', 'sound_priest', 'experiment_guard'],
  lootTable: 'rogue_landmark',
  atmosphereEvents: ['brand_vision', 'sannin_whisper', 'seal_flare'],
  tiedStoryEvents: ['curse_mark_amplifier'],
  forwardPaths: [
    {
      id: 'shrine_to_chains',
      targetId: 'forest_of_chains',
      pathType: PathType.FORWARD,
      description: 'Wire trails into the dark wood',
      dangerHint: 'Ambush nets',
    },
    {
      id: 'shrine_to_hideout',
      targetId: 'northern_hideout',
      pathType: PathType.BRANCH,
      description: 'North toward the hideout lights',
      dangerHint: 'Orochimaru\'s last fortress',
    },
  ],
  secretPaths: [
    {
      id: 'shrine_to_lab',
      targetId: 'orochimaru_lab',
      pathType: PathType.SECRET,
      description: 'A stair under the altar',
      dangerHint: 'Forbidden experiments',
    },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: false,
    hasRest: true,
    hasTraining: true,
  },
};

const FOREST_OF_CHAINS: LocationConfig = {
  id: 'forest_of_chains',
  name: 'Forest of Chains',
  description: 'Trees webbed in chakra wire. One wrong step and you hang like prey.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('forest_of_chains'),
  dangerLevel: 5,
  terrain: LocationTerrainType.HAZARDOUS,
  terrainEffects: [
    { type: 'ambush_chance', value: 0.3 },
    { type: 'movement_penalty', value: 0.15 },
  ],
  biome: 'Wire Forest',
  enemyPool: ['kidomaru_spider', 'wire_hunter', 'oto_elite'],
  lootTable: 'rogue_wilderness',
  atmosphereEvents: ['cocoon_trap', 'arrow_rain', 'broken_strand'],
  forwardPaths: [
    {
      id: 'chains_to_hideout',
      targetId: 'northern_hideout',
      pathType: PathType.FORWARD,
      description: 'Break through to the fort',
      dangerHint: 'Last Sound stronghold',
    },
    {
      id: 'chains_to_bridge',
      targetId: 'bridge_to_valley',
      pathType: PathType.BRANCH,
      description: 'A high ridge toward the valley',
      dangerHint: 'The final road',
    },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: false,
    hasRest: false,
    hasTraining: false,
  },
};

const NORTHERN_HIDEOUT: LocationConfig = {
  id: 'northern_hideout',
  name: 'Northern Hideout',
  description: 'Orochimaru\'s northern base. Doors of flesh and stone. Sasuke passed through here.',
  type: LocationType.STRONGHOLD,
  icon: locationIconFromRegistry('northern_hideout'),
  dangerLevel: 5,
  terrain: LocationTerrainType.FORTIFIED,
  terrainEffects: [
    { type: 'enemy_defense_bonus', value: 0.2 },
    { type: 'enemy_attack_bonus', value: 0.1 },
  ],
  biome: 'Sound Fortress',
  enemyPool: ['hideout_guard', 'sound_elite', 'kabuto_adept', 'summoned_snake'],
  lootTable: 'rogue_stronghold',
  atmosphereEvents: ['empty_throne', 'snake_hatchery', 'sasuke_echo'],
  tiedStoryEvents: ['orochimaru_experiment'],
  forwardPaths: [
    {
      id: 'hideout_to_bridge',
      targetId: 'bridge_to_valley',
      pathType: PathType.FORWARD,
      description: 'The road to the Valley',
      dangerHint: 'The valley waits',
    },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: true,
    hasRest: true,
    hasTraining: true,
  },
};

const BRIDGE_TO_VALLEY: LocationConfig = {
  id: 'bridge_to_valley',
  name: 'Bridge to the Valley',
  description: 'A broken stone bridge over a canyon wind. Beyond it: the statues of two legends.',
  type: LocationType.LANDMARK,
  icon: locationIconFromRegistry('bridge_to_valley'),
  dangerLevel: 6,
  terrain: LocationTerrainType.HAZARDOUS,
  terrainEffects: [
    { type: 'fall_hazard', value: 0.15 },
    { type: 'enemy_attack_bonus', value: 0.1 },
  ],
  biome: 'Canyon Bridge',
  enemyPool: ['valley_sentinel', 'cursed_ronin', 'lightning_genin'],
  lootTable: 'rogue_landmark',
  atmosphereEvents: ['statue_shadow', 'chidori_echo', 'friendship_memory'],
  forwardPaths: [
    {
      id: 'bridge_to_valley',
      targetId: 'valley_of_the_end',
      pathType: PathType.FORWARD,
      description: 'Descend into the Valley of the End',
      dangerHint: 'No turning back',
    },
  ],
  secretPaths: [
    {
      id: 'bridge_to_lightning',
      targetId: 'lightning_cliff',
      pathType: PathType.SECRET,
      description: 'A cliff scarred by lightning',
      dangerHint: 'Chidori training ground',
    },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: false,
    hasRest: true,
    hasTraining: false,
  },
};

const VALLEY_OF_THE_END: LocationConfig = {
  id: 'valley_of_the_end',
  name: 'Valley of the End',
  description:
    'Where Hashirama and Madara once dueled. Water crashes between giant statues. Here friendship ends — or is remade.',
  type: LocationType.BOSS,
  icon: locationIconFromRegistry('valley_of_the_end'),
  dangerLevel: 7,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.2 },
    { type: 'enemy_attack_bonus', value: 0.2 },
    { type: 'enemy_defense_bonus', value: 0.15 },
  ],
  biome: 'Valley of the End',
  enemyPool: ['curse_mark_sasuke', 'sharingan_adept', 'valley_guardian', 'sasuke'],
  lootTable: 'rogue_boss',
  atmosphereEvents: ['final_rasengan', 'final_chidori', 'statue_crack'],
  tiedStoryEvents: ['valley_vision', 'orochimaru_experiment_result'],
  forwardPaths: [],
  flags: {
    isEntry: false,
    isBoss: true,
    isSecret: false,
    hasMerchant: false,
    hasRest: false,
    hasTraining: false,
  },
};

// --- Secrets ---

const HIDDEN_SUPPLY_CACHE: LocationConfig = {
  id: 'hidden_supply_cache',
  name: 'Hidden Supply Cache',
  description: 'Leaf ANBU left a cache for the retrieval team. If you can find it first.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('hidden_supply_cache'),
  dangerLevel: 4,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [{ type: 'stealth_bonus', value: 0.15 }],
  biome: 'Reed Cache',
  enemyPool: ['cache_thief', 'sound_scavenger'],
  lootTable: 'rogue_secret',
  atmosphereEvents: ['anbu_tag', 'extra_soldier_pills', 'map_fragment'],
  forwardPaths: [
    {
      id: 'cache_to_river',
      targetId: 'river_road',
      pathType: PathType.FORWARD,
      description: 'Back to the river road',
      dangerHint: 'You may have been watched',
    },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: true,
    hasMerchant: false,
    hasRest: false,
    hasTraining: false,
  },
  unlockCondition: { type: 'intel', requirement: 'supply_cache_found' },
};

const OROCHIMARU_LAB: LocationConfig = {
  id: 'orochimaru_lab',
  name: "Orochimaru's Lab",
  description: 'Glass tanks and curse marks. Knowledge that should stay buried.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('orochimaru_lab'),
  dangerLevel: 5,
  terrain: LocationTerrainType.CORRUPTED,
  terrainEffects: [
    { type: 'mental_damage_bonus', value: 0.2 },
    { type: 'poison_hazard', value: 0.1 },
  ],
  biome: 'Forbidden Lab',
  enemyPool: ['lab_abomination', 'sound_researcher', 'failed_vessel'],
  lootTable: 'rogue_secret',
  atmosphereEvents: ['tank_break', 'curse_offer', 'sannin_notes'],
  tiedStoryEvents: ['orochimaru_experiment'],
  forwardPaths: [
    {
      id: 'lab_to_shrine',
      targetId: 'curse_mark_shrine',
      pathType: PathType.FORWARD,
      description: 'Climb back to the shrine',
      dangerHint: 'Something followed you',
    },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: true,
    hasMerchant: false,
    hasRest: false,
    hasTraining: true,
    hasInfoGathering: true,
  },
  unlockCondition: { type: 'intel', requirement: 'orochimaru_lab_found' },
};

const LIGHTNING_CLIFF: LocationConfig = {
  id: 'lightning_cliff',
  name: 'Lightning Cliff',
  description: 'A cliff where Chidori was refined. The stone still smells of scorched ozone.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('lightning_cliff'),
  dangerLevel: 6,
  terrain: LocationTerrainType.HAZARDOUS,
  terrainEffects: [
    { type: 'enemy_attack_bonus', value: 0.15 },
    { type: 'fall_hazard', value: 0.1 },
  ],
  biome: 'Lightning Scar',
  enemyPool: ['lightning_specter', 'uchiha_echo', 'storm_genin'],
  lootTable: 'rogue_secret',
  atmosphereEvents: ['chidori_memory', 'sharingan_flash', 'storm_break'],
  forwardPaths: [
    {
      id: 'cliff_to_bridge',
      targetId: 'bridge_to_valley',
      pathType: PathType.FORWARD,
      description: 'Join the bridge path',
      dangerHint: 'The valley calls',
    },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: true,
    hasMerchant: false,
    hasRest: false,
    hasTraining: false,
  },
  unlockCondition: { type: 'intel', requirement: 'lightning_cliff_found' },
};

// ============================================================================
// REGION CONFIG
// ============================================================================

export const SASUKE_RETRIEVAL_CONFIG: RegionConfig = {
  id: 'sasuke_retrieval',
  name: 'Sasuke Retrieval',
  description:
    'A desperate pursuit across Sound Country. Bring him home — or meet him as an enemy at the Valley of the End.',
  theme: 'Friendship vs path, Sound Four, curse marks, Valley of the End',

  entryLocationIds: ['leaf_gate', 'river_road'],
  bossLocationId: 'valley_of_the_end',

  locations: [
    LEAF_GATE,
    RIVER_ROAD,
    SOUND_BORDER,
    WATERFALL_PASS,
    SOUND_FOUR_CAMP,
    CURSE_MARK_SHRINE,
    FOREST_OF_CHAINS,
    NORTHERN_HIDEOUT,
    BRIDGE_TO_VALLEY,
    VALLEY_OF_THE_END,
    HIDDEN_SUPPLY_CACHE,
    OROCHIMARU_LAB,
    LIGHTNING_CLIFF,
  ],

  arc: 'ROGUE_ARC',
  biome: 'Valley of the End',

  lootTheme: {
    primaryElement: ElementType.LIGHTNING,
    equipmentFocus: ['strength', 'speed', 'dexterity'],
    goldMultiplier: 1.1,
  },

  baseDifficulty: 70,
};

export default SASUKE_RETRIEVAL_CONFIG;
