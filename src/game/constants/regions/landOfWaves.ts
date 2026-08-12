/**
 * =============================================================================
 * LAND OF WAVES REGION
 * =============================================================================
 *
 * First region in the post-Academy exploration system.
 * A coastal region under the brutal control of shipping magnate Gato.
 *
 * ## REGION STRUCTURE
 * - 13 Locations total (10 main + 3 secret)
 * - Entry: The Docks, Misty Beach
 * - Boss: Gato's Compound
 *
 * ## DANGER PROGRESSION
 * Entry (1-2) → Early (3-4) → Mid (3-5) → Late (4-6) → Boss (7)
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

const THE_DOCKS: LocationConfig = {
  id: 'the_docks',
  name: 'The Docks',
  description: 'Salt, tar, and Gato\'s coin. Fishermen keep their heads down while enforcers tax every crate that leaves the pier.',
  type: LocationType.SETTLEMENT,
  icon: locationIconFromRegistry('the_docks'),
  dangerLevel: 2,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [{ type: 'water_damage_bonus', value: 0.2 }],
  biome: 'Coastal Harbor',
  // 5–7 foes so combat variety stays high while bioma stays coastal/Gato
  enemyPool: ['dock_worker', 'corrupt_guard', 'smuggler', 'hired_muscle', 'village_thug', 'cove_smuggler'],
  lootTable: 'waves_settlement',
  atmosphereEvents: ['suspicious_cargo', 'overheard_conversation', 'dock_brawl'],
  // Spine: Tazuna; residual: collector ledger (R1 side pressure)
  tiedStoryEvents: ['meet_tazuna', 'docks_collector_ledger'],
  forwardPaths: [
    { id: 'docks_to_forest', targetId: 'coastal_forest', pathType: PathType.FORWARD, description: 'A well-worn path through the trees', dangerHint: 'Bandits lurk in the shadows' },
    { id: 'docks_to_beach', targetId: 'misty_beach', pathType: PathType.BRANCH, description: 'Follow the shoreline south', dangerHint: 'The mist is thick here' },
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

const MISTY_BEACH: LocationConfig = {
  id: 'misty_beach',
  name: 'Misty Beach',
  description: 'Fog eats the horizon. Hulls lie half-buried in wet sand — good cover for anyone who wants a body to vanish.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('misty_beach'),
  dangerLevel: 1,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.15 },
    { type: 'visibility_penalty', value: -0.2 },
  ],
  biome: 'Foggy Shoreline',
  enemyPool: ['beach_bandit', 'sea_spirit', 'stranded_ronin', 'drowned_sailor', 'water_spirit', 'missing_nin'],
  lootTable: 'waves_wilderness',
  atmosphereEvents: ['washed_up_treasure', 'stranded_sailor', 'ghost_ship_sighting'],
  // Prefer Mist cache + residual omen so shore flags / fog pressure surface (R1-006 / A5-W2)
  tiedStoryEvents: ['mist_ambush_cache', 'mist_omen_tide'],
  forwardPaths: [
    { id: 'beach_to_forest', targetId: 'coastal_forest', pathType: PathType.FORWARD, description: 'Head inland through the mist', dangerHint: 'The forest is dense' },
  ],
  secretPaths: [
    { id: 'beach_to_ship', targetId: 'sunken_ship', pathType: PathType.SECRET, description: 'Wade out to a half-submerged vessel', dangerHint: 'What treasures lie within?' },
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

const COASTAL_FOREST: LocationConfig = {
  id: 'coastal_forest',
  name: 'Coastal Forest',
  description: 'Salt-stunted pines choke the light. Bandits, boars, and missing-nin share the same wet trails.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('coastal_forest'),
  dangerLevel: 3,
  terrain: LocationTerrainType.FOREST,
  terrainEffects: [
    { type: 'evasion_bonus', value: 0.1 },
    { type: 'ambush_chance', value: 0.2 },
  ],
  biome: 'Dense Forest',
  enemyPool: ['forest_bandit', 'wild_boar', 'missing_nin', 'trap_master', 'camp_raider', 'ronin'],
  lootTable: 'waves_wilderness',
  atmosphereEvents: ['animal_attack', 'hidden_cache', 'bandit_camp'],
  // Residual mist omen — forest fog geometry (A5-W2)
  tiedStoryEvents: ['mist_omen_tide'],
  forwardPaths: [
    { id: 'forest_to_village', targetId: 'fishing_village', pathType: PathType.FORWARD, description: 'Smoke rises from a village ahead', dangerHint: 'The villagers seem friendly' },
    { id: 'forest_to_cave', targetId: 'smugglers_cave', pathType: PathType.BRANCH, description: 'A hidden trail leads underground', dangerHint: 'Danger and riches await' },
  ],
  loopPaths: [
    { id: 'forest_to_docks', targetId: 'the_docks', pathType: PathType.LOOP, description: 'A shortcut back to the harbor', dangerHint: 'Return to safety' },
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

const SMUGGLERS_CAVE: LocationConfig = {
  id: 'smugglers_cave',
  name: 'Smuggler\'s Cave',
  description:
    'Lantern-soot tunnels under the forest. Oilcloth ledgers price every crate Gato pretends not to own — tripwires, war hounds, and a tide-hole no coastguard charts.',
  type: LocationType.STRONGHOLD,
  icon: locationIconFromRegistry('smugglers_cave'),
  dangerLevel: 4,
  terrain: LocationTerrainType.UNDERGROUND,
  // Dark warehouse: fire sputters, traps ambush, fog of dust for stealth, poor sightlines
  terrainEffects: [
    { type: 'fire_damage_penalty', value: -0.25 },
    { type: 'stealth_bonus', value: 0.2 },
    { type: 'ambush_chance', value: 0.25 },
    { type: 'visibility_penalty', value: -0.15 },
  ],
  biome: 'Underground Cavern',
  // Black-market runners + trap wire + hounds — not surface bandits; mist men guard the cache
  // (guard_dog aliases war_dog art/name — keep a single hound id)
  enemyPool: [
    'cave_smuggler',
    'trap_master',
    'war_dog',
    'hidden_guard',
    'smuggler',
    'mist_ninja',
  ],
  lootTable: 'waves_stronghold',
  atmosphereEvents: ['oilcloth_ledger', 'wired_tunnel', 'tarp_handshake'],
  // Prefer Mist cache for hidden_cove / sunken_ship flag path (R1-006 / W4)
  tiedStoryEvents: ['mist_ambush_cache'],
  forwardPaths: [
    {
      id: 'cave_to_camp',
      targetId: 'riverside_camp',
      pathType: PathType.FORWARD,
      description: 'A wet crack opens toward river ashfire',
      dangerHint: 'Road-sellers buy what leaves these tunnels',
    },
    {
      id: 'cave_to_village',
      targetId: 'fishing_village',
      pathType: PathType.BRANCH,
      description: 'A smuggler bolt-hole under the stilt-houses',
      dangerHint: 'Emerge where Gato\'s taxes never look down',
    },
  ],
  secretPaths: [
    {
      id: 'cave_to_cove',
      targetId: 'hidden_cove',
      pathType: PathType.SECRET,
      description: 'Dive the charted tide-hole at low water',
      dangerHint: 'Lanterns above; silent drops below',
    },
  ],
  loopPaths: [
    {
      id: 'cave_to_beach',
      targetId: 'misty_beach',
      pathType: PathType.LOOP,
      description: 'Crawl the sea-vent back into fog',
      dangerHint: 'Salt air after oil and iron',
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

const FISHING_VILLAGE: LocationConfig = {
  id: 'fishing_village',
  name: 'Fishing Village',
  description: 'Weathered stilt-houses and empty nets. Gato\'s thugs collect "taxes" while Inari\'s people watch the bridge for wages that never arrive.',
  type: LocationType.SETTLEMENT,
  icon: locationIconFromRegistry('fishing_village'),
  dangerLevel: 1,
  terrain: LocationTerrainType.NEUTRAL,
  // Soft coastal identity: water edge + room to breathe (safe haven mid-run)
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.1 },
    { type: 'ambush_chance', value: -0.1 },
  ],
  biome: 'Rural Village',
  enemyPool: ['village_thug', 'corrupt_merchant', 'hired_muscle', 'corrupt_guard', 'desperate_traveler', 'ronin'],
  lootTable: 'waves_settlement',
  atmosphereEvents: ['villager_plea', 'hidden_resistance', 'tax_collection'],
  // Spine + residual false scales (A5-W3)
  tiedStoryEvents: ['protect_village', 'meet_inari', 'corrupt_merchant_scales'],
  forwardPaths: [
    { id: 'village_to_bridge', targetId: 'bridge_construction', pathType: PathType.FORWARD, description: 'The main road to the bridge', dangerHint: 'The bridge is heavily guarded' },
    { id: 'village_to_camp', targetId: 'riverside_camp', pathType: PathType.BRANCH, description: 'A detour along the river', dangerHint: 'Travelers camp here' },
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

const RIVERSIDE_CAMP: LocationConfig = {
  id: 'riverside_camp',
  name: 'Riverside Camp',
  description:
    'Ashfire rings the mud bank. Travelers sell bridge approaches the way collectors sell silence — fish-skin maps, salt-wood smoke, and knives under wet tarps.',
  type: LocationType.WILDERNESS,
  icon: locationIconFromRegistry('riverside_camp'),
  dangerLevel: 3,
  terrain: LocationTerrainType.WATER_ADJACENT,
  // River fog + camp ambushes: water edge, sold roads, hard-to-trust rest stops
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.15 },
    { type: 'ambush_chance', value: 0.2 },
    { type: 'stealth_bonus', value: 0.1 },
  ],
  biome: 'River Banks',
  // Road-sellers / river raiders / gray-market runners — not forest bandits or dock muscle
  enemyPool: [
    'river_bandit',
    'camp_raider',
    'desperate_traveler',
    'stranded_ronin',
    'missing_nin',
    'smuggler',
  ],
  lootTable: 'waves_wilderness',
  atmosphereEvents: ['ashfire_smoke', 'rope_ferry', 'sold_road'],
  // Residual: ashfire travelers sell mist approaches (A5-W3)
  tiedStoryEvents: ['riverside_traveler_pact'],
  forwardPaths: [
    {
      id: 'camp_to_bridge',
      targetId: 'bridge_construction',
      pathType: PathType.FORWARD,
      description: 'Follow the charcoal line toward Tazuna\'s span',
      dangerHint: 'The road-sellers priced this path three ways',
    },
    {
      id: 'camp_to_outpost',
      targetId: 'bandit_outpost',
      pathType: PathType.BRANCH,
      description: 'A stake-walled cut the maps call a shortcut',
      dangerHint: 'Toll blades wait where the river narrows',
    },
  ],
  loopPaths: [
    {
      id: 'camp_to_forest',
      targetId: 'coastal_forest',
      pathType: PathType.LOOP,
      description: 'Slip back under salt-stunted pines',
      dangerHint: 'Leave the ash rings behind',
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

const SUNKEN_SHIP: LocationConfig = {
  id: 'sunken_ship',
  name: 'Sunken Ship',
  description:
    'A hull scuttled on purpose. Below the waterline the drowned still count crates that never docked — Gato\'s seal on a chest that seems to breathe.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('sunken_ship'),
  dangerLevel: 5,
  terrain: LocationTerrainType.HAZARDOUS,
  // Flooded hold: water wins, fire dies, AP tax for swimming, whispers tax spirit
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.35 },
    { type: 'fire_damage_penalty', value: -0.55 },
    { type: 'movement_penalty', value: 0.25 },
    { type: 'mental_damage_bonus', value: 0.15 },
  ],
  biome: 'Shipwreck',
  // Hold haunt + false-floor guardians — not shore scavengers
  enemyPool: [
    'drowned_sailor',
    'water_spirit',
    'treasure_guardian',
    'sea_spirit',
    'sea_creature',
    'cove_smuggler',
  ],
  lootTable: 'waves_secret',
  atmosphereEvents: ['hold_breath', 'spectral_count', 'false_floor_lock'],
  // Residual: hold whispers map Gato's false-floor treasury (A5-W2)
  tiedStoryEvents: ['shipwreck_whisper'],
  forwardPaths: [
    {
      id: 'ship_to_forest',
      targetId: 'coastal_forest',
      pathType: PathType.FORWARD,
      description: 'Kick free to salt-stunted shore pines',
      dangerHint: 'Air burns; the counting resumes behind you',
    },
  ],
  secretPaths: [
    {
      id: 'ship_to_shrine',
      targetId: 'drowned_shrine',
      pathType: PathType.SECRET,
      description: 'Follow the unpaid tally into blacker water',
      dangerHint: 'Gods here preferred ledgers to prayers',
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
  unlockCondition: { type: 'intel', requirement: 'sunken_ship_discovered' },
};

const BRIDGE_CONSTRUCTION: LocationConfig = {
  id: 'bridge_construction',
  name: 'Bridge Construction',
  description: 'Tazuna\'s span grows under sawdust and crossbows. Every beam is a vote against Gato — or a target.',
  type: LocationType.LANDMARK,
  icon: locationIconFromRegistry('bridge_construction'),
  dangerLevel: 4,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.25 },
    { type: 'fall_hazard', value: 0.1 },
  ],
  biome: 'Great Bridge',
  enemyPool: ['bridge_saboteur', 'hired_assassin', 'corrupt_foreman', 'elite_mercenary', 'dock_worker', 'hired_muscle'],
  lootTable: 'waves_landmark',
  atmosphereEvents: ['bridge_sabotage', 'worker_strike', 'gato_threat'],
  // Spine + orphan worker plea + labor after Tazuna (preferred pool flag-gates rest)
  tiedStoryEvents: ['protect_bridge', 'final_showdown_setup', 'bridge_worker_plea', 'tazuna_request'],
  forwardPaths: [
    { id: 'bridge_to_compound', targetId: 'gatos_compound', pathType: PathType.FORWARD, description: 'The final confrontation awaits', dangerHint: 'Gato\'s fortress looms' },
    { id: 'bridge_to_manor', targetId: 'abandoned_manor', pathType: PathType.BRANCH, description: 'An old manor on the hill', dangerHint: 'Ghosts haunt this place' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: true,
    hasRest: false,
    hasTraining: true,
  },
};

const BANDIT_OUTPOST: LocationConfig = {
  id: 'bandit_outpost',
  name: 'Bandit Outpost',
  description: 'Stake walls and war hounds. Gato pays in ryo and fear — this camp is the receipt.',
  type: LocationType.STRONGHOLD,
  icon: locationIconFromRegistry('bandit_outpost'),
  dangerLevel: 5,
  terrain: LocationTerrainType.FORTIFIED,
  terrainEffects: [
    { type: 'enemy_defense_bonus', value: 0.15 },
    { type: 'ambush_chance', value: 0.3 },
  ],
  biome: 'Fortified Camp',
  enemyPool: ['bandit_captain', 'elite_mercenary', 'war_dog', 'camp_raider', 'hired_assassin', 'forest_bandit'],
  lootTable: 'waves_stronghold',
  atmosphereEvents: ['prisoner_rescue', 'supply_raid', 'commander_duel'],
  // Residual: unwritten toll / intimidation (A5-W3)
  tiedStoryEvents: ['bandit_outpost_toll'],
  forwardPaths: [
    { id: 'outpost_to_compound', targetId: 'gatos_compound', pathType: PathType.FORWARD, description: 'A direct assault route', dangerHint: 'The compound is heavily fortified' },
    { id: 'outpost_to_manor', targetId: 'abandoned_manor', pathType: PathType.BRANCH, description: 'Circle around through the manor', dangerHint: 'A less guarded approach' },
  ],
  loopPaths: [
    { id: 'outpost_to_camp', targetId: 'riverside_camp', pathType: PathType.LOOP, description: 'Retreat to the camp', dangerHint: 'Fall back and regroup' },
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

const ABANDONED_MANOR: LocationConfig = {
  id: 'abandoned_manor',
  name: 'Abandoned Manor',
  description: 'A noble house left to salt and mold. Portraits watch. Footsteps answer when no one should be home.',
  type: LocationType.LANDMARK,
  icon: locationIconFromRegistry('abandoned_manor'),
  // Late detour before Gato: quieter danger, mental pressure (not raw muscle)
  dangerLevel: 4,
  terrain: LocationTerrainType.NEUTRAL,
  terrainEffects: [
    { type: 'mental_damage_bonus', value: 0.25 },
    { type: 'visibility_penalty', value: -0.1 },
  ],
  biome: 'Ruined Estate',
  enemyPool: ['vengeful_ghost', 'manor_guardian', 'cursed_servant', 'corrupted_priest', 'shrine_demon', 'ronin'],
  lootTable: 'waves_landmark',
  atmosphereEvents: ['ghostly_wailing', 'hidden_passage', 'noble_treasure'],
  // Residual: manor debt / sold-house haunt (A5-W2)
  tiedStoryEvents: ['manor_haunt_debt'],
  forwardPaths: [
    { id: 'manor_to_compound', targetId: 'gatos_compound', pathType: PathType.FORWARD, description: 'The compound lies beyond', dangerHint: 'The final battle approaches' },
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

const HIDDEN_COVE: LocationConfig = {
  id: 'hidden_cove',
  name: 'Hidden Cove',
  description: 'A secret inlet where lanterns never stay lit. Smugglers drop cargo on schedules written in tide — rare goods, quieter debts.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('hidden_cove'),
  dangerLevel: 4,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.2 },
    { type: 'stealth_bonus', value: 0.2 },
  ],
  biome: 'Secret Harbor',
  enemyPool: ['cove_smuggler', 'sea_creature', 'hidden_guard', 'smuggler', 'mist_ninja', 'sea_spirit'],
  lootTable: 'waves_secret',
  atmosphereEvents: ['smuggler_meeting', 'rare_cargo', 'sea_monster'],
  // Residual: silent drop / unlogged gate codes (A5-W4)
  tiedStoryEvents: ['hidden_cove_silent_drop'],
  forwardPaths: [
    { id: 'cove_to_outpost', targetId: 'bandit_outpost', pathType: PathType.FORWARD, description: 'A path to the outpost', dangerHint: 'Bandits guard this route' },
  ],
  secretPaths: [
    { id: 'cove_to_shrine', targetId: 'drowned_shrine', pathType: PathType.SECRET, description: 'An underwater passage', dangerHint: 'Darkness waits below' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: true,
    hasMerchant: true,
    hasRest: false,
    hasTraining: false,
  },
  unlockCondition: { type: 'intel', requirement: 'hidden_cove_discovered' },
};

const DROWNED_SHRINE: LocationConfig = {
  id: 'drowned_shrine',
  name: 'Drowned Shrine',
  description: 'Pillars under black water still keep accounts. Old chakra hums like unpaid interest — gods here preferred ledgers to prayers.',
  type: LocationType.SECRET,
  icon: locationIconFromRegistry('drowned_shrine'),
  dangerLevel: 6,
  terrain: LocationTerrainType.CORRUPTED,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.4 },
    { type: 'fire_damage_penalty', value: -0.6 },
    { type: 'mental_damage_bonus', value: 0.3 },
  ],
  biome: 'Underwater Temple',
  enemyPool: ['shrine_demon', 'corrupted_priest', 'eldritch_guardian', 'vengeful_ghost', 'cursed_servant', 'water_spirit'],
  lootTable: 'waves_secret',
  atmosphereEvents: ['dark_ritual', 'forbidden_knowledge', 'ancient_curse'],
  // Residual: black tide vow / vault geometry (A5-W4)
  tiedStoryEvents: ['drowned_shrine_black_tide'],
  forwardPaths: [
    { id: 'shrine_to_compound', targetId: 'gatos_compound', pathType: PathType.FORWARD, description: 'A hidden approach to the compound', dangerHint: 'Emerge behind enemy lines' },
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
  unlockCondition: { type: 'intel', requirement: 'drowned_shrine_discovered' },
};

const GATOS_COMPOUND: LocationConfig = {
  id: 'gatos_compound',
  name: 'Gato\'s Compound',
  description: 'Iron gates, paid blades, and a smile that prices every life. Wave Country ends here — one way or another.',
  type: LocationType.BOSS,
  icon: locationIconFromRegistry('gatos_compound'),
  dangerLevel: 7,
  terrain: LocationTerrainType.FORTIFIED,
  terrainEffects: [
    { type: 'enemy_defense_bonus', value: 0.2 },
    { type: 'enemy_attack_bonus', value: 0.1 },
  ],
  biome: 'Fortified Mansion',
  // 'gato' is deliberately NOT in this pool: EnemySystem draws pool ids for NORMAL/ELITE encounters
  // and names them via POOL_DISPLAY_NAMES, so including it spawned Chunin mooks called "Gato"
  // (wearing his painted portrait), and the exit guardian could read "Guardian Gato".
  // The name is reserved for the danger-7 arc boss at the compound's climax.
  enemyPool: ['elite_guard', 'ronin', 'assassin', 'elite_mercenary', 'hired_assassin', 'hidden_guard', 'bandit_captain'],
  lootTable: 'waves_boss',
  atmosphereEvents: ['gato_speech', 'servant_whispers', 'display_of_power'],
  tiedStoryEvents: ['final_confrontation', 'gato_defeat'],
  forwardPaths: [], // Boss location - no forward paths
  flags: {
    isEntry: false,
    isBoss: true,
    isSecret: false,
    hasMerchant: false,
    hasRest: false,
    hasTraining: false,
  },
};

// ============================================================================
// REGION CONFIG
// ============================================================================

export const LAND_OF_WAVES_CONFIG: RegionConfig = {
  id: 'land_of_waves',
  name: 'Land of Waves',
  description: 'A poor coastal country under the thumb of the shipping magnate Gato. The great bridge may be its salvation... or its doom.',
  theme: 'Misty coast, poverty, tyranny, silence priced as survival',

  entryLocationIds: ['the_docks', 'misty_beach'],
  bossLocationId: 'gatos_compound',

  locations: [
    THE_DOCKS,
    MISTY_BEACH,
    COASTAL_FOREST,
    SMUGGLERS_CAVE,
    FISHING_VILLAGE,
    RIVERSIDE_CAMP,
    SUNKEN_SHIP,
    BRIDGE_CONSTRUCTION,
    BANDIT_OUTPOST,
    ABANDONED_MANOR,
    HIDDEN_COVE,
    DROWNED_SHRINE,
    GATOS_COMPOUND,
  ],

  arc: 'WAVES_ARC',
  biome: 'Mist Covered Bridge',

  lootTheme: {
    primaryElement: ElementType.WATER,
    equipmentFocus: [],
    goldMultiplier: 0.8, // Poor region
  },

  baseDifficulty: 40,
};

export default LAND_OF_WAVES_CONFIG;
