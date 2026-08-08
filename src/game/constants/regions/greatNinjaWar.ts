/**
 * =============================================================================
 * GREAT NINJA WAR — DIVINE TREE ROOTS (T-026)
 * =============================================================================
 *
 * Fourth and final campaign region. Alliance vs reanimation army under the
 * God Tree roots. Boss clear ends the curated campaign (VICTORY).
 *
 * ## REGION STRUCTURE
 * - 13 Locations (10 main + 3 secret)
 * - Entry: Alliance Camp, Outer Trenches
 * - Boss: God Tree Heart (danger 7)
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

const ALLIANCE_CAMP: LocationConfig = {
  id: 'alliance_camp',
  name: 'Alliance Camp',
  description:
    'Tents of every nation fly under one banner. Medics, messengers, and last wills share the same mud.',
  type: LocationType.SETTLEMENT,
  icon: locationIconFromRegistry('alliance_camp'),
  dangerLevel: 1,
  terrain: LocationTerrainType.NEUTRAL,
  terrainEffects: [],
  biome: 'War Camp',
  enemyPool: ['camp_raider', 'missing_nin', 'hired_muscle', 'desperate_traveler', 'ronin', 'village_thug'],
  lootTable: 'war_settlement',
  atmosphereEvents: ['alliance_brief', 'missing_squad', 'ration_line'],
  tiedStoryEvents: ['scavengers_field'],
  forwardPaths: [
    {
      id: 'camp_to_trenches',
      targetId: 'outer_trenches',
      pathType: PathType.FORWARD,
      description: 'Toward the outer trenches',
      dangerHint: 'Artillery and reanimations',
    },
    {
      id: 'camp_to_field',
      targetId: 'scavenger_field',
      pathType: PathType.BRANCH,
      description: 'A field of broken armor',
      dangerHint: 'Looters and worse',
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

const OUTER_TRENCHES: LocationConfig = {
  id: 'outer_trenches',
  name: 'Outer Trenches',
  description: 'Mud, blood, and white zetsu pushing endlessly. The line must hold.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('outer_trenches'),
  dangerLevel: 2,
  terrain: LocationTerrainType.HAZARDOUS,
  terrainEffects: [
    { type: 'ambush_chance', value: 0.2 },
    { type: 'movement_penalty', value: 0.1 },
  ],
  biome: 'Trench Line',
  enemyPool: ['camp_raider', 'war_dog', 'missing_nin', 'elite_mercenary', 'hired_assassin', 'forest_bandit'],
  lootTable: 'war_wilderness',
  atmosphereEvents: ['whistle_signal', 'zetsu_wave', 'fallen_comrade'],
  forwardPaths: [
    {
      id: 'trenches_to_field',
      targetId: 'scavenger_field',
      pathType: PathType.FORWARD,
      description: 'Cross the scavenger field',
      dangerHint: 'No cover for miles',
    },
  ],
  secretPaths: [
    {
      id: 'trenches_to_bunker',
      targetId: 'sealed_bunker',
      pathType: PathType.SECRET,
      description: 'A half-buried bunker hatch',
      dangerHint: 'Something sealed itself in',
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

const SCAVENGER_FIELD: LocationConfig = {
  id: 'scavenger_field',
  name: 'Scavenger Field',
  description: 'A plain of abandoned gear. The dead do not stay dead for long.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('scavenger_field'),
  dangerLevel: 3,
  terrain: LocationTerrainType.NEUTRAL,
  terrainEffects: [{ type: 'ambush_chance', value: 0.25 }],
  biome: 'Battlefield Plain',
  enemyPool: ['camp_raider', 'desperate_traveler', 'missing_nin', 'ronin', 'cursed_servant', 'war_dog'],
  lootTable: 'war_wilderness',
  atmosphereEvents: ['false_ally', 'gear_pile', 'envoy_rumor'],
  tiedStoryEvents: ['scavengers_field'],
  forwardPaths: [
    {
      id: 'field_to_forest',
      targetId: 'ash_forest',
      pathType: PathType.FORWARD,
      description: 'Into the ash forest',
      dangerHint: 'Trees burn from within',
    },
    {
      id: 'field_to_ruins',
      targetId: 'village_ruins',
      pathType: PathType.BRANCH,
      description: 'Smoke over a ruined village',
      dangerHint: 'Reanimations guard the streets',
    },
  ],
  loopPaths: [
    {
      id: 'field_to_camp',
      targetId: 'alliance_camp',
      pathType: PathType.LOOP,
      description: 'Fall back to the alliance camp',
      dangerHint: 'Medics will ask hard questions',
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

const ASH_FOREST: LocationConfig = {
  id: 'ash_forest',
  name: 'Ash Forest',
  description: 'Trees charred black still stand. Embers crawl like living things.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('ash_forest'),
  dangerLevel: 3,
  terrain: LocationTerrainType.FOREST,
  terrainEffects: [
    { type: 'fire_damage_penalty', value: -0.1 },
    { type: 'ambush_chance', value: 0.2 },
  ],
  biome: 'Ash Forest',
  enemyPool: ['vengeful_ghost', 'shrine_demon', 'cursed_servant', 'elite_mercenary', 'missing_nin', 'eldritch_guardian'],
  lootTable: 'war_wilderness',
  atmosphereEvents: ['ember_rain', 'hidden_cache', 'bijuu_howl_distant'],
  forwardPaths: [
    {
      id: 'ash_to_ruins',
      targetId: 'village_ruins',
      pathType: PathType.FORWARD,
      description: 'Toward the village ruins',
      dangerHint: 'Streets full of the reanimated',
    },
    {
      id: 'ash_to_ridge',
      targetId: 'artillery_ridge',
      pathType: PathType.BRANCH,
      description: 'Climb the artillery ridge',
      dangerHint: 'Perfect sniper nests',
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

const VILLAGE_RUINS: LocationConfig = {
  id: 'village_ruins',
  name: 'Village Ruins',
  description: 'Homes without families. Reanimated villagers walk routes they knew in life.',
  type: LocationType.SETTLEMENT,
  icon: locationIconFromRegistry('village_ruins'),
  dangerLevel: 4,
  terrain: LocationTerrainType.NEUTRAL,
  terrainEffects: [{ type: 'mental_damage_bonus', value: 0.1 }],
  biome: 'Ruined Village',
  enemyPool: ['cursed_servant', 'mist_ninja', 'hidden_guard', 'missing_nin', 'hired_assassin', 'desperate_traveler'],
  lootTable: 'war_settlement',
  atmosphereEvents: ['empty_cradle', 'envoy_speech', 'rescue_attempt'],
  tiedStoryEvents: ['reanimated_envoy', 'reanimated_envoy_fate'],
  forwardPaths: [
    {
      id: 'ruins_to_ridge',
      targetId: 'artillery_ridge',
      pathType: PathType.FORWARD,
      description: 'Uphill to the ridge guns',
      dangerHint: 'Exposed climb',
    },
    {
      id: 'ruins_to_hq',
      targetId: 'alliance_hq',
      pathType: PathType.BRANCH,
      description: 'Signal fires of HQ',
      dangerHint: 'Politics and power',
    },
  ],
  secretPaths: [
    {
      id: 'ruins_to_chakra',
      targetId: 'bijuu_chakra_pool',
      pathType: PathType.SECRET,
      description: 'A pool that glows like a bijuu eye',
      dangerHint: 'Raw tailed-beast chakra',
    },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: true,
    hasRest: true,
    hasTraining: false,
  },
};

const ARTILLERY_RIDGE: LocationConfig = {
  id: 'artillery_ridge',
  name: 'Artillery Ridge',
  description: 'Earth-style cannons and thunder. The alliance tries to break the reanimation lines.',
  type: LocationType.STRONGHOLD,
  icon: locationIconFromRegistry('artillery_ridge'),
  dangerLevel: 4,
  terrain: LocationTerrainType.FORTIFIED,
  terrainEffects: [
    { type: 'enemy_defense_bonus', value: 0.1 },
    { type: 'enemy_attack_bonus', value: 0.1 },
  ],
  biome: 'Gun Ridge',
  enemyPool: ['elite_mercenary', 'bridge_saboteur', 'bandit_captain', 'war_dog', 'hired_assassin', 'elite_guard'],
  lootTable: 'war_stronghold',
  atmosphereEvents: ['barrage', 'counter_snipe', 'white_zetsu_tunnel'],
  tiedStoryEvents: ['white_zetsu_paranoia'],
  forwardPaths: [
    {
      id: 'ridge_to_hq',
      targetId: 'alliance_hq',
      pathType: PathType.FORWARD,
      description: 'Along the fortified road to HQ',
      dangerHint: 'VIP targets',
    },
    {
      id: 'ridge_to_roots',
      targetId: 'god_tree_roots',
      pathType: PathType.BRANCH,
      description: 'Down toward the root network',
      dangerHint: 'The tree drinks chakra',
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

const ALLIANCE_HQ: LocationConfig = {
  id: 'alliance_hq',
  name: 'Alliance HQ',
  description: 'Command tents of the five kage. Orders change the war every hour.',
  type: LocationType.LANDMARK,
  icon: locationIconFromRegistry('alliance_hq'),
  dangerLevel: 5,
  terrain: LocationTerrainType.FORTIFIED,
  terrainEffects: [{ type: 'enemy_defense_bonus', value: 0.15 }],
  biome: 'Command Post',
  enemyPool: ['assassin', 'elite_guard', 'elite_mercenary', 'hidden_guard', 'mist_ninja', 'hired_assassin'],
  lootTable: 'war_landmark',
  atmosphereEvents: ['kage_council', 'emergency_orders', 'envoy_return'],
  tiedStoryEvents: ['envoy_gratitude_repaid'],
  forwardPaths: [
    {
      id: 'hq_to_roots',
      targetId: 'god_tree_roots',
      pathType: PathType.FORWARD,
      description: 'The root front',
      dangerHint: 'Chakra drain zone',
    },
    {
      id: 'hq_to_nexus',
      targetId: 'reanimation_nexus',
      pathType: PathType.BRANCH,
      description: 'Strike the reanimation nexus',
      dangerHint: 'Endless reinforcements',
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

const GOD_TREE_ROOTS: LocationConfig = {
  id: 'god_tree_roots',
  name: 'God Tree Roots',
  description: 'Colossal roots drink the earth. White veins pulse with stolen chakra.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('god_tree_roots'),
  dangerLevel: 5,
  terrain: LocationTerrainType.CORRUPTED,
  terrainEffects: [
    { type: 'enemy_attack_bonus', value: 0.15 },
    { type: 'chakra_drain', value: 0.1 },
  ],
  biome: 'Divine Roots',
  enemyPool: ['eldritch_guardian', 'cursed_servant', 'shrine_demon', 'vengeful_ghost', 'missing_nin', 'corrupted_priest'],
  lootTable: 'war_wilderness',
  atmosphereEvents: ['root_pulse', 'vision_of_ten_tails', 'fallen_jinchuriki'],
  forwardPaths: [
    {
      id: 'roots_to_nexus',
      targetId: 'reanimation_nexus',
      pathType: PathType.FORWARD,
      description: 'Follow the black chakra veins',
      dangerHint: 'The nexus feeds the army',
    },
    {
      id: 'roots_to_heart',
      targetId: 'god_tree_heart',
      pathType: PathType.BRANCH,
      description: 'A direct path to the heart chamber',
      dangerHint: 'Final approach',
    },
  ],
  secretPaths: [
    {
      id: 'roots_to_fragment',
      targetId: 'ten_tails_fragment',
      pathType: PathType.SECRET,
      description: 'A sealed fragment of the Ten-Tails',
      dangerHint: 'Madness and power',
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

const REANIMATION_NEXUS: LocationConfig = {
  id: 'reanimation_nexus',
  name: 'Reanimation Nexus',
  description: 'Coffins rise without end. The technique\'s heart must be cut out.',
  type: LocationType.STRONGHOLD,
  icon: locationIconFromRegistry('reanimation_nexus'),
  dangerLevel: 6,
  terrain: LocationTerrainType.CORRUPTED,
  terrainEffects: [
    { type: 'enemy_defense_bonus', value: 0.15 },
    { type: 'enemy_attack_bonus', value: 0.15 },
  ],
  biome: 'Coffin Field',
  enemyPool: ['manor_guardian', 'elite_guard', 'cursed_servant', 'corrupted_priest', 'assassin', 'eldritch_guardian'],
  lootTable: 'war_stronghold',
  atmosphereEvents: ['coffin_wave', 'seal_break', 'true_body'],
  forwardPaths: [
    {
      id: 'nexus_to_heart',
      targetId: 'god_tree_heart',
      pathType: PathType.FORWARD,
      description: 'Into the God Tree heart',
      dangerHint: 'Campaign finale',
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

const GOD_TREE_HEART: LocationConfig = {
  id: 'god_tree_heart',
  name: 'God Tree Heart',
  description:
    'The hollow heart of the Divine Tree. Madara\'s shadow and the Ten-Tails\' dream converge. The war ends here.',
  type: LocationType.BOSS,
  icon: locationIconFromRegistry('god_tree_heart'),
  dangerLevel: 7,
  terrain: LocationTerrainType.CORRUPTED,
  terrainEffects: [
    { type: 'enemy_attack_bonus', value: 0.25 },
    { type: 'enemy_defense_bonus', value: 0.2 },
    { type: 'chakra_drain', value: 0.15 },
  ],
  biome: 'God Tree Core',
  enemyPool: ['eldritch_guardian', 'shrine_demon', 'elite_guard', 'assassin', 'cursed_servant', 'elite_mercenary', 'vengeful_ghost'],
  lootTable: 'war_boss',
  atmosphereEvents: ['infinite_tsukuyomi_flash', 'tree_scream', 'alliance_charge'],
  tiedStoryEvents: ['bijuu_chakra_fragment'],
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

const SEALED_BUNKER: LocationConfig = {
  id: 'sealed_bunker',
  name: 'Sealed Bunker',
  description: 'A wartime bunker sealed from the inside. Maps of the root network still glow.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('sealed_bunker'),
  dangerLevel: 4,
  terrain: LocationTerrainType.UNDERGROUND,
  terrainEffects: [{ type: 'stealth_bonus', value: 0.1 }],
  biome: 'War Bunker',
  enemyPool: ['hidden_guard', 'missing_nin', 'camp_raider', 'trap_master', 'war_dog', 'hired_assassin'],
  lootTable: 'war_secret',
  atmosphereEvents: ['intel_map', 'last_diary', 'gas_leak'],
  forwardPaths: [
    {
      id: 'bunker_to_trenches',
      targetId: 'outer_trenches',
      pathType: PathType.FORWARD,
      description: 'Surface to the trenches',
      dangerHint: 'Daylight and danger',
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
  unlockCondition: { type: 'intel', requirement: 'sealed_bunker_found' },
};

const BIJUU_CHAKRA_POOL: LocationConfig = {
  id: 'bijuu_chakra_pool',
  name: 'Bijuu Chakra Pool',
  description: 'A pool of tailed-beast chakra. Touch it and the war speaks in beasts\' voices.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('bijuu_chakra_pool'),
  dangerLevel: 5,
  terrain: LocationTerrainType.SACRED,
  terrainEffects: [
    { type: 'mental_damage_bonus', value: 0.2 },
    { type: 'chakra_drain', value: 0.05 },
  ],
  biome: 'Bijuu Spring',
  enemyPool: ['vengeful_ghost', 'eldritch_guardian', 'sea_spirit', 'cursed_servant', 'shrine_demon', 'water_spirit'],
  lootTable: 'war_secret',
  atmosphereEvents: ['beast_vision', 'power_surge', 'seal_crack'],
  tiedStoryEvents: ['bijuu_chakra_fragment'],
  forwardPaths: [
    {
      id: 'pool_to_ruins',
      targetId: 'village_ruins',
      pathType: PathType.FORWARD,
      description: 'Back through the ruins',
      dangerHint: 'You glow with foreign chakra',
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
  unlockCondition: { type: 'intel', requirement: 'bijuu_pool_found' },
};

const TEN_TAILS_FRAGMENT: LocationConfig = {
  id: 'ten_tails_fragment',
  name: 'Ten-Tails Fragment',
  description: 'A sealed shard of the Ten-Tails. Reality frays at the edges.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('ten_tails_fragment'),
  dangerLevel: 6,
  terrain: LocationTerrainType.CORRUPTED,
  terrainEffects: [
    { type: 'enemy_attack_bonus', value: 0.2 },
    { type: 'mental_damage_bonus', value: 0.25 },
  ],
  biome: 'Fragment Seal',
  enemyPool: ['eldritch_guardian', 'shrine_demon', 'vengeful_ghost', 'cursed_servant', 'assassin', 'treasure_guardian'],
  lootTable: 'war_secret',
  atmosphereEvents: ['truth_seeker', 'rinnegan_flash', 'world_crack'],
  forwardPaths: [
    {
      id: 'fragment_to_roots',
      targetId: 'god_tree_roots',
      pathType: PathType.FORWARD,
      description: 'Return to the roots',
      dangerHint: 'The tree noticed you',
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
  unlockCondition: { type: 'intel', requirement: 'ten_tails_fragment_found' },
};

// ============================================================================
// REGION CONFIG
// ============================================================================

export const GREAT_NINJA_WAR_CONFIG: RegionConfig = {
  id: 'great_ninja_war',
  name: 'Great Ninja War',
  description:
    'The Fourth Great Ninja War. Under the roots of the Divine Tree, the alliance faces reanimation and the dream of infinite moon.',
  theme: 'Alliance war, reanimation army, God Tree, campaign finale',

  entryLocationIds: ['alliance_camp', 'outer_trenches'],
  bossLocationId: 'god_tree_heart',

  locations: [
    ALLIANCE_CAMP,
    OUTER_TRENCHES,
    SCAVENGER_FIELD,
    ASH_FOREST,
    VILLAGE_RUINS,
    ARTILLERY_RIDGE,
    ALLIANCE_HQ,
    GOD_TREE_ROOTS,
    REANIMATION_NEXUS,
    GOD_TREE_HEART,
    SEALED_BUNKER,
    BIJUU_CHAKRA_POOL,
    TEN_TAILS_FRAGMENT,
  ],

  arc: 'WAR_ARC',
  biome: 'Divine Tree Roots',

  lootTheme: {
    primaryElement: ElementType.FIRE,
    equipmentFocus: [],
    goldMultiplier: 1.2,
  },

  baseDifficulty: 85,
};

export default GREAT_NINJA_WAR_CONFIG;
