/* T-028 Lot E: Imagine raster migration — svg-tile entries converted to imagine-jpg */
export interface EnemyArtManifestEntry {
  key: string;
  id: string;
  emoji: string;
  label: string;
  src: string;
  quality: 'svg-tile' | 'painted-png' | 'imagine-jpg';
  kind: 'archetype' | 'job' | 'boss' | 'pool';
}

export const ENEMY_ART_MANIFEST: EnemyArtManifestEntry[] = [
  {
    "key": "enemy:archetype_TANK",
    "id": "archetype_TANK",
    "emoji": "🛡️",
    "label": "Tank",
    "src": "/assets/icons/enemies/archetype_tank.jpg",
    "quality": "imagine-jpg",
    "kind": "archetype"
  },
  {
    "key": "enemy:archetype_ASSASSIN",
    "id": "archetype_ASSASSIN",
    "emoji": "🗡️",
    "label": "Assassin",
    "src": "/assets/icons/enemies/archetype_assassin.jpg",
    "quality": "imagine-jpg",
    "kind": "archetype"
  },
  {
    "key": "enemy:archetype_BALANCED",
    "id": "archetype_BALANCED",
    "emoji": "⚖️",
    "label": "Balanced",
    "src": "/assets/icons/enemies/archetype_balanced.jpg",
    "quality": "imagine-jpg",
    "kind": "archetype"
  },
  {
    "key": "enemy:archetype_CASTER",
    "id": "archetype_CASTER",
    "emoji": "🔮",
    "label": "Caster",
    "src": "/assets/icons/enemies/archetype_caster.jpg",
    "quality": "imagine-jpg",
    "kind": "archetype"
  },
  {
    "key": "enemy:archetype_GENJUTSU",
    "id": "archetype_GENJUTSU",
    "emoji": "👁️",
    "label": "Genjutsu",
    "src": "/assets/icons/enemies/archetype_genjutsu.jpg",
    "quality": "imagine-jpg",
    "kind": "archetype"
  },
  {
    "key": "enemy:job_puppeteer",
    "id": "job_puppeteer",
    "emoji": "🥷",
    "label": "puppeteer",
    "src": "/assets/enemies/enemy_clumsy_puppeteer.png",
    "quality": "painted-png",
    "kind": "job"
  },
  {
    "key": "enemy:job_monk",
    "id": "job_monk",
    "emoji": "🥷",
    "label": "monk",
    "src": "/assets/enemies/enemy_monk.png",
    "quality": "painted-png",
    "kind": "job"
  },
  {
    "key": "enemy:job_ninja",
    "id": "job_ninja",
    "emoji": "🥷",
    "label": "ninja",
    "src": "/assets/enemies/enemy_exhausted_shinobi.png",
    "quality": "painted-png",
    "kind": "job"
  },
  {
    "key": "enemy:job_shinobi",
    "id": "job_shinobi",
    "emoji": "🥷",
    "label": "shinobi",
    "src": "/assets/enemies/enemy_exhausted_shinobi.png",
    "quality": "painted-png",
    "kind": "job"
  },
  {
    "key": "enemy:job_samurai",
    "id": "job_samurai",
    "emoji": "🥷",
    "label": "samurai",
    "src": "/assets/enemies/enemy_samurai.png",
    "quality": "painted-png",
    "kind": "job"
  },
  {
    "key": "enemy:boss_haku",
    "id": "boss_haku",
    "emoji": "👹",
    "label": "haku",
    "src": "/assets/enemies/enemy_boss_haku.png",
    "quality": "painted-png",
    "kind": "boss"
  },
  {
    "key": "enemy:boss_demon_brothers",
    "id": "boss_demon_brothers",
    "emoji": "👹",
    "label": "demon_brothers",
    "src": "/assets/enemies/enemy_boss_demon_brothers.png",
    "quality": "painted-png",
    "kind": "boss"
  },
  {
    "key": "enemy:pool_dock_worker",
    "id": "pool_dock_worker",
    "emoji": "🥷",
    "label": "dock worker",
    "src": "/assets/enemies/enemy_dock_worker.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_corrupt_guard",
    "id": "pool_corrupt_guard",
    "emoji": "🥷",
    "label": "corrupt guard",
    "src": "/assets/enemies/enemy_corrupt_guard.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_smuggler",
    "id": "pool_smuggler",
    "emoji": "🥷",
    "label": "smuggler",
    "src": "/assets/enemies/enemy_smuggler.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_beach_bandit",
    "id": "pool_beach_bandit",
    "emoji": "🥷",
    "label": "beach bandit",
    "src": "/assets/enemies/enemy_beach_bandit.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_sea_spirit",
    "id": "pool_sea_spirit",
    "emoji": "👁️",
    "label": "sea spirit",
    "src": "/assets/enemies/enemy_sea_spirit.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_stranded_ronin",
    "id": "pool_stranded_ronin",
    "emoji": "⚔️",
    "label": "stranded ronin",
    "src": "/assets/enemies/enemy_stranded_ronin.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_forest_bandit",
    "id": "pool_forest_bandit",
    "emoji": "🥷",
    "label": "forest bandit",
    "src": "/assets/enemies/enemy_forest_bandit.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_wild_boar",
    "id": "pool_wild_boar",
    "emoji": "🛡️",
    "label": "wild boar",
    "src": "/assets/enemies/enemy_wild_boar.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_missing_nin",
    "id": "pool_missing_nin",
    "emoji": "🥷",
    "label": "missing nin",
    "src": "/assets/enemies/enemy_missing_nin.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_cave_smuggler",
    "id": "pool_cave_smuggler",
    "emoji": "🥷",
    "label": "cave smuggler",
    "src": "/assets/enemies/enemy_cave_smuggler.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_trap_master",
    "id": "pool_trap_master",
    "emoji": "🥷",
    "label": "trap master",
    "src": "/assets/enemies/enemy_trap_master.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_guard_dog",
    "id": "pool_guard_dog",
    "emoji": "🐕",
    "label": "guard dog",
    "src": "/assets/enemies/enemy_war_dog.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_village_thug",
    "id": "pool_village_thug",
    "emoji": "🥷",
    "label": "village thug",
    "src": "/assets/enemies/enemy_village_thug.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_corrupt_merchant",
    "id": "pool_corrupt_merchant",
    "emoji": "🥷",
    "label": "corrupt merchant",
    "src": "/assets/enemies/enemy_corrupt_merchant.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_hired_muscle",
    "id": "pool_hired_muscle",
    "emoji": "🥷",
    "label": "hired muscle",
    "src": "/assets/enemies/enemy_hired_muscle.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_river_bandit",
    "id": "pool_river_bandit",
    "emoji": "🥷",
    "label": "river bandit",
    "src": "/assets/enemies/enemy_river_bandit.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_camp_raider",
    "id": "pool_camp_raider",
    "emoji": "🥷",
    "label": "camp raider",
    "src": "/assets/enemies/enemy_camp_raider.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_desperate_traveler",
    "id": "pool_desperate_traveler",
    "emoji": "🥷",
    "label": "desperate traveler",
    "src": "/assets/enemies/enemy_desperate_traveler.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_drowned_sailor",
    "id": "pool_drowned_sailor",
    "emoji": "🥷",
    "label": "drowned sailor",
    "src": "/assets/enemies/enemy_drowned_sailor.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_water_spirit",
    "id": "pool_water_spirit",
    "emoji": "👁️",
    "label": "water spirit",
    "src": "/assets/enemies/enemy_water_spirit.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_treasure_guardian",
    "id": "pool_treasure_guardian",
    "emoji": "🥷",
    "label": "treasure guardian",
    "src": "/assets/enemies/enemy_treasure_guardian.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_bridge_saboteur",
    "id": "pool_bridge_saboteur",
    "emoji": "🥷",
    "label": "bridge saboteur",
    "src": "/assets/enemies/enemy_bridge_saboteur.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_hired_assassin",
    "id": "pool_hired_assassin",
    "emoji": "🥷",
    "label": "hired assassin",
    "src": "/assets/enemies/enemy_hired_assassin.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_corrupt_foreman",
    "id": "pool_corrupt_foreman",
    "emoji": "🥷",
    "label": "corrupt foreman",
    "src": "/assets/enemies/enemy_corrupt_foreman.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_bandit_captain",
    "id": "pool_bandit_captain",
    "emoji": "🥷",
    "label": "bandit captain",
    "src": "/assets/enemies/enemy_bandit_captain.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_elite_mercenary",
    "id": "pool_elite_mercenary",
    "emoji": "🥷",
    "label": "elite mercenary",
    "src": "/assets/enemies/enemy_elite_mercenary.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_war_dog",
    "id": "pool_war_dog",
    "emoji": "🛡️",
    "label": "war dog",
    "src": "/assets/enemies/enemy_war_dog.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_vengeful_ghost",
    "id": "pool_vengeful_ghost",
    "emoji": "👁️",
    "label": "vengeful ghost",
    "src": "/assets/enemies/enemy_vengeful_ghost.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_manor_guardian",
    "id": "pool_manor_guardian",
    "emoji": "🥷",
    "label": "manor guardian",
    "src": "/assets/enemies/enemy_manor_guardian.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_cursed_servant",
    "id": "pool_cursed_servant",
    "emoji": "🥷",
    "label": "cursed servant",
    "src": "/assets/enemies/enemy_cursed_servant.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_cove_smuggler",
    "id": "pool_cove_smuggler",
    "emoji": "🥷",
    "label": "cove smuggler",
    "src": "/assets/enemies/enemy_cove_smuggler.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_sea_creature",
    "id": "pool_sea_creature",
    "emoji": "🥷",
    "label": "sea creature",
    "src": "/assets/enemies/enemy_sea_creature.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_mist_ninja",
    "id": "pool_mist_ninja",
    "emoji": "🥷",
    "label": "mist ninja",
    "src": "/assets/enemies/enemy_mist_ninja.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_hidden_guard",
    "id": "pool_hidden_guard",
    "emoji": "🥷",
    "label": "hidden guard",
    "src": "/assets/enemies/enemy_mist_ninja.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_shrine_demon",
    "id": "pool_shrine_demon",
    "emoji": "👁️",
    "label": "shrine demon",
    "src": "/assets/enemies/enemy_shrine_demon.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_corrupted_priest",
    "id": "pool_corrupted_priest",
    "emoji": "👁️",
    "label": "corrupted priest",
    "src": "/assets/enemies/enemy_corrupted_priest.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_eldritch_guardian",
    "id": "pool_eldritch_guardian",
    "emoji": "🥷",
    "label": "eldritch guardian",
    "src": "/assets/enemies/enemy_eldritch_guardian.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_elite_guard",
    "id": "pool_elite_guard",
    "emoji": "⚔️",
    "label": "elite guard",
    "src": "/assets/enemies/enemy_elite_guard.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_ronin",
    "id": "pool_ronin",
    "emoji": "⚔️",
    "label": "ronin",
    "src": "/assets/enemies/enemy_ronin.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_assassin",
    "id": "pool_assassin",
    "emoji": "🥷",
    "label": "assassin",
    "src": "/assets/enemies/enemy_hired_assassin.png",
    "quality": "painted-png",
    "kind": "pool"
  },
  {
    "key": "enemy:pool_gato",
    "id": "pool_gato",
    "emoji": "💰",
    "label": "gato",
    "src": "/assets/enemies/enemy_gato.png",
    "quality": "painted-png",
    "kind": "pool"
  }
];
