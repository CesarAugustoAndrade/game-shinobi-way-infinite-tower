/**
 * =============================================================================
 * CHUNIN EXAMS — FOREST OF DEATH (T-024)
 * =============================================================================
 *
 * Second campaign region. Survival exam inside the Forest of Death.
 *
 * ## REGION STRUCTURE
 * - 13 Locations (10 main + 3 secret)
 * - Entry: Exam Gates, Forest Edge
 * - Boss: Orochimaru's Arena (danger 7)
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

const EXAM_GATES: LocationConfig = {
  id: 'exam_gates',
  name: 'Exam Gates',
  description:
    'Iron gates and chunin proctors. Beyond this threshold, the Forest of Death swallows the weak.',
  type: LocationType.SETTLEMENT,
  icon: locationIconFromRegistry('exam_gates'),
  dangerLevel: 1,
  terrain: LocationTerrainType.NEUTRAL,
  terrainEffects: [],
  biome: 'Exam Gates',
  enemyPool: ['proctor_guard', 'nervous_genin', 'exam_thug'],
  lootTable: 'exams_settlement',
  atmosphereEvents: ['scroll_rules', 'team_introductions', 'last_meal'],
  tiedStoryEvents: ['forest_death_trap'],
  forwardPaths: [
    {
      id: 'gates_to_edge',
      targetId: 'forest_edge',
      pathType: PathType.FORWARD,
      description: 'The path under the canopy',
      dangerHint: 'Ambushers love the treeline',
    },
    {
      id: 'gates_to_thicket',
      targetId: 'thicket_paths',
      pathType: PathType.BRANCH,
      description: 'A shortcut into denser growth',
      dangerHint: 'Few return this way',
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

const FOREST_EDGE: LocationConfig = {
  id: 'forest_edge',
  name: 'Forest Edge',
  description: 'The wall of trees looms. Wire and paper tags glint between branches.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('forest_edge'),
  dangerLevel: 2,
  terrain: LocationTerrainType.FOREST,
  terrainEffects: [
    { type: 'evasion_bonus', value: 0.05 },
    { type: 'ambush_chance', value: 0.15 },
  ],
  biome: 'Forest of Death Edge',
  enemyPool: ['leaf_bandit', 'trap_genin', 'wild_boar'],
  lootTable: 'exams_wilderness',
  atmosphereEvents: ['wire_trap', 'screams_deeper', 'dropped_scroll'],
  forwardPaths: [
    {
      id: 'edge_to_thicket',
      targetId: 'thicket_paths',
      pathType: PathType.FORWARD,
      description: 'Push into the thicket',
      dangerHint: 'Visibility drops fast',
    },
  ],
  secretPaths: [
    {
      id: 'edge_to_heaven_scroll',
      targetId: 'hidden_heaven_scroll',
      pathType: PathType.SECRET,
      description: 'A false trail marked with Heaven seals',
      dangerHint: 'Bait for greedy teams',
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

const THICKET_PATHS: LocationConfig = {
  id: 'thicket_paths',
  name: 'Thicket Paths',
  description: 'Twisting animal trails. Every fork could be a trap or a rival team.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('thicket_paths'),
  dangerLevel: 3,
  terrain: LocationTerrainType.FOREST,
  terrainEffects: [
    { type: 'evasion_bonus', value: 0.1 },
    { type: 'ambush_chance', value: 0.25 },
  ],
  biome: 'Dense Canopy',
  enemyPool: ['grass_genin', 'sound_scout', 'trap_master'],
  lootTable: 'exams_wilderness',
  atmosphereEvents: ['false_scroll', 'team_shadows', 'insect_buzz'],
  tiedStoryEvents: ['rival_team_encounter'],
  forwardPaths: [
    {
      id: 'thicket_to_ford',
      targetId: 'muddy_ford',
      pathType: PathType.FORWARD,
      description: 'Follow the water smell',
      dangerHint: 'Crossing is exposed',
    },
    {
      id: 'thicket_to_scroll',
      targetId: 'scroll_cache',
      pathType: PathType.BRANCH,
      description: 'Follow torn paper tags',
      dangerHint: 'Scrolls attract predators',
    },
  ],
  loopPaths: [
    {
      id: 'thicket_to_gates',
      targetId: 'exam_gates',
      pathType: PathType.LOOP,
      description: 'Retreat toward the wall',
      dangerHint: 'Proctors will not help you',
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

const MUDDY_FORD: LocationConfig = {
  id: 'muddy_ford',
  name: 'Muddy Ford',
  description: 'A shallow river cuts the forest. Good cover — if you survive the crossing.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('muddy_ford'),
  dangerLevel: 3,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.1 },
    { type: 'movement_penalty', value: 0.1 },
  ],
  biome: 'Forest River',
  enemyPool: ['river_genin', 'sand_scout', 'water_clone_user'],
  lootTable: 'exams_wilderness',
  atmosphereEvents: ['body_downstream', 'hidden_crossing', 'fishing_wire'],
  forwardPaths: [
    {
      id: 'ford_to_scroll',
      targetId: 'scroll_cache',
      pathType: PathType.FORWARD,
      description: 'Upstream toward high ground',
      dangerHint: 'Scroll hunters ahead',
    },
    {
      id: 'ford_to_rival',
      targetId: 'rival_checkpoint',
      pathType: PathType.BRANCH,
      description: 'Smoke from a rival camp',
      dangerHint: 'Negotiation or blood',
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

const SCROLL_CACHE: LocationConfig = {
  id: 'scroll_cache',
  name: 'Scroll Cache',
  description: 'A clearing littered with decoy scrolls. One might be real. Most are bait.',
  type: LocationType.LANDMARK,
  icon: locationIconFromRegistry('scroll_cache'),
  dangerLevel: 4,
  terrain: LocationTerrainType.FOREST,
  terrainEffects: [{ type: 'ambush_chance', value: 0.3 }],
  biome: 'Scroll Clearing',
  enemyPool: ['scroll_thief', 'sound_genin', 'rain_genin'],
  lootTable: 'exams_landmark',
  atmosphereEvents: ['heaven_earth_swap', 'proctor_spy', 'false_victory'],
  tiedStoryEvents: ['scroll_merchant'],
  forwardPaths: [
    {
      id: 'scroll_to_rival',
      targetId: 'rival_checkpoint',
      pathType: PathType.FORWARD,
      description: 'Tracks lead to a fortified camp',
      dangerHint: 'They already have a scroll',
    },
    {
      id: 'scroll_to_sound',
      targetId: 'sound_hideout',
      pathType: PathType.BRANCH,
      description: 'A path of silence and broken trees',
      dangerHint: 'Sound Village techniques',
    },
  ],
  secretPaths: [
    {
      id: 'scroll_to_insects',
      targetId: 'insect_colony',
      pathType: PathType.SECRET,
      description: 'A buzzing tunnel under roots',
      dangerHint: 'Aburame territory?',
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

const RIVAL_CHECKPOINT: LocationConfig = {
  id: 'rival_checkpoint',
  name: 'Rival Checkpoint',
  description: 'Another genin team claims this choke point. Scrolls change hands here — or lives.',
  type: LocationType.STRONGHOLD,
  icon: locationIconFromRegistry('rival_checkpoint'),
  dangerLevel: 4,
  terrain: LocationTerrainType.FORTIFIED,
  terrainEffects: [
    { type: 'enemy_defense_bonus', value: 0.1 },
    { type: 'ambush_chance', value: 0.2 },
  ],
  biome: 'Fortified Camp',
  enemyPool: ['rival_leader', 'rival_tank', 'rival_scout'],
  lootTable: 'exams_stronghold',
  atmosphereEvents: ['hostage_deal', 'scroll_trade', 'triple_threat'],
  forwardPaths: [
    {
      id: 'rival_to_sound',
      targetId: 'sound_hideout',
      pathType: PathType.FORWARD,
      description: 'Deeper into Sound territory',
      dangerHint: 'They do not take prisoners',
    },
    {
      id: 'rival_to_tower',
      targetId: 'tower_approach',
      pathType: PathType.BRANCH,
      description: 'A faster path toward the tower',
      dangerHint: 'Less cover, more eyes',
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

const SOUND_HIDEOUT: LocationConfig = {
  id: 'sound_hideout',
  name: 'Sound Hideout',
  description: 'Oto genin carved a nest of wires and sound-jutsu markers into the living wood.',
  type: LocationType.STRONGHOLD,
  icon: locationIconFromRegistry('sound_hideout'),
  dangerLevel: 5,
  terrain: LocationTerrainType.HAZARDOUS,
  terrainEffects: [
    { type: 'enemy_attack_bonus', value: 0.1 },
    { type: 'mental_damage_bonus', value: 0.15 },
  ],
  biome: 'Sound Nest',
  enemyPool: ['dosu_adept', 'zaku_adept', 'kin_adept', 'sound_captain'],
  lootTable: 'exams_stronghold',
  atmosphereEvents: ['resonance_trap', 'sound_four_mark', 'orochimaru_whisper'],
  forwardPaths: [
    {
      id: 'sound_to_tower',
      targetId: 'tower_approach',
      pathType: PathType.FORWARD,
      description: 'Break for the tower spire',
      dangerHint: 'Final stretch',
    },
    {
      id: 'sound_to_serpent',
      targetId: 'serpent_thicket',
      pathType: PathType.BRANCH,
      description: 'A trail of shed scales',
      dangerHint: 'Something large hunts here',
    },
  ],
  secretPaths: [
    {
      id: 'sound_to_snake_den',
      targetId: 'snake_den',
      pathType: PathType.SECRET,
      description: 'A tunnel that smells of venom',
      dangerHint: 'Orochimaru\'s shadow',
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

const TOWER_APPROACH: LocationConfig = {
  id: 'tower_approach',
  name: 'Tower Approach',
  description: 'The central tower breaks the canopy. Teams with both scrolls race the last miles.',
  type: LocationType.LANDMARK,
  icon: locationIconFromRegistry('tower_approach'),
  dangerLevel: 5,
  terrain: LocationTerrainType.FOREST,
  terrainEffects: [{ type: 'ambush_chance', value: 0.2 }],
  biome: 'Tower Clearing',
  enemyPool: ['desperate_genin', 'elite_proctor', 'sand_elite'],
  lootTable: 'exams_landmark',
  atmosphereEvents: ['last_mile', 'scroll_theft', 'alliance_break'],
  forwardPaths: [
    {
      id: 'approach_to_serpent',
      targetId: 'serpent_thicket',
      pathType: PathType.FORWARD,
      description: 'The overgrown short cut',
      dangerHint: 'Serpents favor the dark',
    },
    {
      id: 'approach_to_arena',
      targetId: 'orochimaru_arena',
      pathType: PathType.BRANCH,
      description: 'Direct assault on the arena grounds',
      dangerHint: 'The snake waits',
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

const SERPENT_THICKET: LocationConfig = {
  id: 'serpent_thicket',
  name: 'Serpent Thicket',
  description: 'Scales, shed skins, and silence. Something wrong slithers between the roots.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('serpent_thicket'),
  dangerLevel: 6,
  terrain: LocationTerrainType.CORRUPTED,
  terrainEffects: [
    { type: 'enemy_attack_bonus', value: 0.15 },
    { type: 'poison_hazard', value: 0.1 },
  ],
  biome: 'Serpent Grove',
  enemyPool: ['giant_serpent', 'snake_summoner', 'cursed_genin'],
  lootTable: 'exams_wilderness',
  atmosphereEvents: ['skin_shed', 'hypnotic_gaze', 'curse_mark_flash'],
  tiedStoryEvents: ['giant_serpent_nest'],
  forwardPaths: [
    {
      id: 'serpent_to_arena',
      targetId: 'orochimaru_arena',
      pathType: PathType.FORWARD,
      description: 'The arena entrance carved in stone',
      dangerHint: 'Final trial',
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

const OROCHIMARU_ARENA: LocationConfig = {
  id: 'orochimaru_arena',
  name: "Orochimaru's Arena",
  description:
    'A hidden coliseum under the tower. The snake sannin watches. Only one team leaves whole.',
  type: LocationType.BOSS,
  icon: locationIconFromRegistry('orochimaru_arena'),
  dangerLevel: 7,
  terrain: LocationTerrainType.FORTIFIED,
  terrainEffects: [
    { type: 'enemy_defense_bonus', value: 0.2 },
    { type: 'enemy_attack_bonus', value: 0.15 },
  ],
  biome: 'Hidden Arena',
  enemyPool: ['orochimaru_guard', 'sound_elite', 'cursed_vessel', 'orochimaru'],
  lootTable: 'exams_boss',
  atmosphereEvents: ['sannin_smile', 'curse_mark_offer', 'exam_ends'],
  tiedStoryEvents: ['giant_serpent_nest'],
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

const HIDDEN_HEAVEN_SCROLL: LocationConfig = {
  id: 'hidden_heaven_scroll',
  name: 'Hidden Heaven Scroll',
  description: 'A buried Heaven scroll in a root hollow. Worth a fortune — or a death sentence.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('hidden_heaven_scroll'),
  dangerLevel: 4,
  terrain: LocationTerrainType.FOREST,
  terrainEffects: [{ type: 'stealth_bonus', value: 0.15 }],
  biome: 'Root Hollow',
  enemyPool: ['scroll_guardian', 'mimic_genin'],
  lootTable: 'exams_secret',
  atmosphereEvents: ['true_scroll', 'curse_tag', 'sudden_proctor'],
  forwardPaths: [
    {
      id: 'heaven_to_thicket',
      targetId: 'thicket_paths',
      pathType: PathType.FORWARD,
      description: 'Climb back to the trails',
      dangerHint: 'Others tracked you',
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
  unlockCondition: { type: 'intel', requirement: 'heaven_scroll_found' },
};

const INSECT_COLONY: LocationConfig = {
  id: 'insect_colony',
  name: 'Insect Colony',
  description: 'Hives under the bark. Information crawls if you speak the right language.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('insect_colony'),
  dangerLevel: 5,
  terrain: LocationTerrainType.UNDERGROUND,
  terrainEffects: [
    { type: 'stealth_bonus', value: 0.1 },
    { type: 'poison_hazard', value: 0.1 },
  ],
  biome: 'Hive Roots',
  enemyPool: ['insect_swarm', 'aburame_rival', 'parasite_host'],
  lootTable: 'exams_secret',
  atmosphereEvents: ['hive_mind', 'intel_trade', 'swarm_alarm'],
  forwardPaths: [
    {
      id: 'insect_to_scroll',
      targetId: 'scroll_cache',
      pathType: PathType.FORWARD,
      description: 'Surface near the cache',
      dangerHint: 'Bright light, bright targets',
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
  unlockCondition: { type: 'intel', requirement: 'insect_colony_found' },
};

const SNAKE_DEN: LocationConfig = {
  id: 'snake_den',
  name: 'Snake Den',
  description: 'Orochimaru\'s personal nest. Forbidden knowledge coils in the dark.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('snake_den'),
  dangerLevel: 6,
  terrain: LocationTerrainType.CORRUPTED,
  terrainEffects: [
    { type: 'enemy_attack_bonus', value: 0.2 },
    { type: 'mental_damage_bonus', value: 0.2 },
  ],
  biome: 'Venom Nest',
  enemyPool: ['summoned_snake', 'sound_four_adept', 'experiment_subject'],
  lootTable: 'exams_secret',
  atmosphereEvents: ['curse_mark_lab', 'shed_identity', 'sannin_echo'],
  forwardPaths: [
    {
      id: 'den_to_arena',
      targetId: 'orochimaru_arena',
      pathType: PathType.FORWARD,
      description: 'A private tunnel to the arena',
      dangerHint: 'He already knows you are here',
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
  unlockCondition: { type: 'intel', requirement: 'snake_den_found' },
};

// ============================================================================
// REGION CONFIG
// ============================================================================

export const CHUNIN_EXAMS_CONFIG: RegionConfig = {
  id: 'chunin_exams',
  name: 'Chunin Exams',
  description:
    'The second stage of the Chunin Exams: survive the Forest of Death with a Heaven or Earth scroll — or do not emerge at all.',
  theme: 'Survival exam, rival genin, Sound Village, Orochimaru\'s shadow',

  entryLocationIds: ['exam_gates', 'forest_edge'],
  bossLocationId: 'orochimaru_arena',

  locations: [
    EXAM_GATES,
    FOREST_EDGE,
    THICKET_PATHS,
    MUDDY_FORD,
    SCROLL_CACHE,
    RIVAL_CHECKPOINT,
    SOUND_HIDEOUT,
    TOWER_APPROACH,
    SERPENT_THICKET,
    OROCHIMARU_ARENA,
    HIDDEN_HEAVEN_SCROLL,
    INSECT_COLONY,
    SNAKE_DEN,
  ],

  arc: 'EXAMS_ARC',
  biome: 'Forest of Death',

  lootTheme: {
    primaryElement: ElementType.WIND,
    equipmentFocus: ['speed', 'intelligence', 'dexterity'],
    goldMultiplier: 1.0,
  },

  baseDifficulty: 55,
};

export default CHUNIN_EXAMS_CONFIG;
