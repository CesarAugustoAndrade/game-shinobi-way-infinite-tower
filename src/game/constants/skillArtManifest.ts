/* T-028 Lot C: partial Imagine migration — do not regenerate SVG */
export interface SkillArtManifestEntry {
  id: string;
  name: string;
  el?: string;
  action?: string;
  dmg?: string;
  emoji: string;
  src: string;
  quality: 'svg-tile' | 'painted-png' | 'imagine-jpg';
}

export const SKILL_ART_MANIFEST: SkillArtManifestEntry[] = [
  {
    "id": "basic_atk",
    "name": "Taijutsu",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/basic_atk.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "shuriken",
    "name": "Shuriken",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/shuriken.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "mud_wall",
    "name": "Mud Wall",
    "el": "EARTH",
    "action": "SIDE",
    "dmg": "ELEMENTAL",
    "emoji": "🪨",
    "src": "/assets/icons/skills/mud_wall.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "phoenix_flower",
    "name": "Phoenix Flower",
    "el": "FIRE",
    "action": "SIDE",
    "dmg": "ELEMENTAL",
    "emoji": "🔥",
    "src": "/assets/icons/skills/phoenix_flower.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "kawarimi",
    "name": "Body Replacement",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/kawarimi.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "bunshin",
    "name": "Clone Technique",
    "el": "MENTAL",
    "action": "SIDE",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/bunshin.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "henge",
    "name": "Transformation",
    "el": "MENTAL",
    "action": "SIDE",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/henge.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "shunshin",
    "name": "Body Flicker",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/shunshin.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "kai",
    "name": "Release",
    "el": "MENTAL",
    "action": "SIDE",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/kai.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "leaf_whirlwind",
    "name": "Leaf Whirlwind",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/leaf_whirlwind.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "dynamic_entry",
    "name": "Dynamic Entry",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/dynamic_entry.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "rising_wind",
    "name": "Leaf Rising Wind",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/rising_wind.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "strong_fist",
    "name": "Strong Fist Combo",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/strong_fist.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "sweeping_kick",
    "name": "Sweeping Kick",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/sweeping_kick.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "elbow_strike",
    "name": "Elbow Strike",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/elbow_strike.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "feint_strike",
    "name": "Feint Strike",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/feint_strike.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "counter_stance",
    "name": "Counter Stance",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/counter_stance.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "dancing_leaf",
    "name": "Shadow of Dancing Leaf",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/dancing_leaf.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "focused_breathing",
    "name": "Focused Breathing",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/focused_breathing.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "kunai_slash",
    "name": "Kunai Slash",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/kunai_slash.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "kunai_throw",
    "name": "Kunai Throw",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/kunai_throw.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "shuriken_barrage",
    "name": "Shuriken Barrage",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/shuriken_barrage.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "windmill_shuriken",
    "name": "Windmill Shuriken",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/windmill_shuriken.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "senbon",
    "name": "Senbon Needle",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/senbon.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "senbon_rain",
    "name": "Senbon Rain",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/senbon_rain.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "explosive_tag",
    "name": "Explosive Tag",
    "el": "FIRE",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🔥",
    "src": "/assets/icons/skills/explosive_tag.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "explosive_barrage",
    "name": "Explosive Barrage",
    "el": "FIRE",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🔥",
    "src": "/assets/icons/skills/explosive_barrage.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "sword_slash",
    "name": "Sword Slash",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/sword_slash.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "iaido",
    "name": "Iaido",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/iaido.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "wire_setup",
    "name": "Wire Trap Setup",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/wire_setup.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "poison_coat",
    "name": "Poison Coat",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/poison_coat.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "smoke_bomb",
    "name": "Smoke Bomb",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/smoke_bomb.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "flash_bomb",
    "name": "Flash Bomb",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/flash_bomb.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "analyze",
    "name": "Analyze Enemy",
    "el": "MENTAL",
    "action": "SIDE",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/analyze.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "brace",
    "name": "Brace",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/brace.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "cloak_invis",
    "name": "Cloak of Invisibility",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/cloak_invis.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "basic_medical",
    "name": "Basic Medical Jutsu",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/basic_medical.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "focused_stance",
    "name": "Focused Stance",
    "el": "PHYSICAL",
    "action": "TOGGLE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/focused_stance.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "defensive_posture",
    "name": "Defensive Posture",
    "el": "PHYSICAL",
    "action": "TOGGLE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/defensive_posture.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "aggressive_stance",
    "name": "Aggressive Stance",
    "el": "PHYSICAL",
    "action": "TOGGLE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/aggressive_stance.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "weapon_proficiency",
    "name": "Weapon Proficiency",
    "el": "PHYSICAL",
    "action": "PASSIVE",
    "dmg": "PHYSICAL",
    "emoji": "✨",
    "src": "/assets/icons/skills/weapon_proficiency.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "taijutsu_training",
    "name": "Taijutsu Training",
    "el": "PHYSICAL",
    "action": "PASSIVE",
    "dmg": "PHYSICAL",
    "emoji": "✨",
    "src": "/assets/icons/skills/taijutsu_training.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "quick_reflexes",
    "name": "Quick Reflexes",
    "el": "PHYSICAL",
    "action": "PASSIVE",
    "dmg": "PHYSICAL",
    "emoji": "✨",
    "src": "/assets/icons/skills/quick_reflexes.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "iron_body",
    "name": "Iron Body",
    "el": "PHYSICAL",
    "action": "PASSIVE",
    "dmg": "PHYSICAL",
    "emoji": "✨",
    "src": "/assets/icons/skills/iron_body.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "chakra_reserves",
    "name": "Chakra Reserves",
    "el": "PHYSICAL",
    "action": "PASSIVE",
    "dmg": "PHYSICAL",
    "emoji": "✨",
    "src": "/assets/icons/skills/chakra_reserves.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "mental_fortitude",
    "name": "Mental Fortitude",
    "el": "MENTAL",
    "action": "PASSIVE",
    "dmg": "MENTAL",
    "emoji": "✨",
    "src": "/assets/icons/skills/mental_fortitude.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "precision",
    "name": "Precision",
    "el": "PHYSICAL",
    "action": "PASSIVE",
    "dmg": "PHYSICAL",
    "emoji": "✨",
    "src": "/assets/icons/skills/precision.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "fire_affinity",
    "name": "Fire Affinity",
    "el": "FIRE",
    "action": "PASSIVE",
    "dmg": "ELEMENTAL",
    "emoji": "✨",
    "src": "/assets/icons/skills/fire_affinity.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "air_palm",
    "name": "Air Palm",
    "el": "WIND",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "🌪️",
    "src": "/assets/icons/skills/air_palm.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "rasengan",
    "name": "Rasengan",
    "el": "WIND",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🌪️",
    "src": "/assets/icons/skills/rasengan.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "fireball",
    "name": "Fireball Jutsu",
    "el": "FIRE",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🔥",
    "src": "/assets/icons/skills/fireball.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "kaiten",
    "name": "8 Trigrams Rotation",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "ELEMENTAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/kaiten.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "byakugan",
    "name": "Byakugan",
    "el": "PHYSICAL",
    "action": "TOGGLE",
    "dmg": "MENTAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/byakugan.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "gentle_fist",
    "name": "Gentle Fist",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "TRUE",
    "emoji": "👊",
    "src": "/assets/icons/skills/gentle_fist.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "sharingan_2",
    "name": "Sharingan (2-Tomoe)",
    "el": "FIRE",
    "action": "TOGGLE",
    "dmg": "PHYSICAL",
    "emoji": "🔥",
    "src": "/assets/icons/skills/sharingan_2.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "water_prison",
    "name": "Water Prison",
    "el": "WATER",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "💧",
    "src": "/assets/icons/skills/water_prison.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "suijinheki",
    "name": "Water Wall",
    "el": "WATER",
    "action": "SIDE",
    "dmg": "ELEMENTAL",
    "emoji": "💧",
    "src": "/assets/icons/skills/suijinheki.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "hell_viewing",
    "name": "Hell Viewing Technique",
    "el": "MENTAL",
    "action": "MAIN",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/hell_viewing.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "mind_destruction",
    "name": "Mind Body Disturbance",
    "el": "MENTAL",
    "action": "MAIN",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/mind_destruction.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "dragon_flame",
    "name": "Dragon Flame Bomb",
    "el": "FIRE",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🔥",
    "src": "/assets/icons/skills/dragon_flame.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "hidden_mist",
    "name": "Hidden Mist Jutsu",
    "el": "WATER",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "💧",
    "src": "/assets/icons/skills/hidden_mist.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "water_clone",
    "name": "Water Clone Jutsu",
    "el": "WATER",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "💧",
    "src": "/assets/icons/skills/water_clone.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "lightning_ball",
    "name": "Lightning Ball",
    "el": "LIGHTNING",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "⚡",
    "src": "/assets/icons/skills/lightning_ball.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "earth_decapitation",
    "name": "Inner Decapitation",
    "el": "EARTH",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🪨",
    "src": "/assets/icons/skills/earth_decapitation.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "great_breakthrough",
    "name": "Great Breakthrough",
    "el": "WIND",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🌪️",
    "src": "/assets/icons/skills/great_breakthrough.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "air_bullet",
    "name": "Air Bullet",
    "el": "WIND",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🌪️",
    "src": "/assets/icons/skills/air_bullet.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "fang_over_fang",
    "name": "Fang Over Fang",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/fang_over_fang.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "mind_transfer",
    "name": "Mind Transfer Jutsu",
    "el": "MENTAL",
    "action": "MAIN",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/mind_transfer.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "shadow_possession",
    "name": "Shadow Possession",
    "el": "MENTAL",
    "action": "MAIN",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/shadow_possession.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "bug_swarm",
    "name": "Parasitic Insects",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/bug_swarm.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "expansion",
    "name": "Expansion Jutsu",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/expansion.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "64_palms",
    "name": "8 Trigrams 64 Palms",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "TRUE",
    "emoji": "👊",
    "src": "/assets/icons/skills/64_palms.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "sand_burial",
    "name": "Sand Burial",
    "el": "EARTH",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🪨",
    "src": "/assets/icons/skills/sand_burial.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "curse_mark_1",
    "name": "Curse Mark Stage 1",
    "el": "PHYSICAL",
    "action": "TOGGLE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/curse_mark_1.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "sand_shield",
    "name": "Sand Shield",
    "el": "EARTH",
    "action": "SIDE",
    "dmg": "ELEMENTAL",
    "emoji": "🪨",
    "src": "/assets/icons/skills/sand_shield.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "sharingan_predict",
    "name": "Sharingan: Predict",
    "el": "MENTAL",
    "action": "SIDE",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/sharingan_predict.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "byakugan_scan",
    "name": "Tenketsu Scan",
    "el": "MENTAL",
    "action": "SIDE",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/byakugan_scan.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "summon_gamabunta",
    "name": "Summoning: Gamabunta",
    "el": "WATER",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "💧",
    "src": "/assets/icons/skills/summon_gamabunta.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "summon_manda",
    "name": "Summoning: Manda",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/summon_manda.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "puppet_crow",
    "name": "Puppet: Crow",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/puppet_crow.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "shadow_clone",
    "name": "Shadow Clone Jutsu",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/shadow_clone.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "primary_lotus",
    "name": "Primary Lotus",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/primary_lotus.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "chidori",
    "name": "Chidori",
    "el": "LIGHTNING",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "⚡",
    "src": "/assets/icons/skills/chidori.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "chidori_stream",
    "name": "Chidori Stream",
    "el": "LIGHTNING",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "⚡",
    "src": "/assets/icons/skills/chidori_stream.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "sand_coffin",
    "name": "Sand Coffin",
    "el": "EARTH",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🪨",
    "src": "/assets/icons/skills/sand_coffin.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "water_dragon",
    "name": "Water Dragon Jutsu",
    "el": "WATER",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "💧",
    "src": "/assets/icons/skills/water_dragon.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "ice_mirrors",
    "name": "Demonic Ice Mirrors",
    "el": "WATER",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "💧",
    "src": "/assets/icons/skills/ice_mirrors.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "false_surroundings",
    "name": "False Surroundings",
    "el": "MENTAL",
    "action": "MAIN",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/false_surroundings.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "temple_nirvana",
    "name": "Temple of Nirvana",
    "el": "MENTAL",
    "action": "MAIN",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/temple_nirvana.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "hidden_lotus",
    "name": "Hidden Lotus",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "TRUE",
    "emoji": "👊",
    "src": "/assets/icons/skills/hidden_lotus.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "water_vortex",
    "name": "Giant Water Vortex",
    "el": "WATER",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "💧",
    "src": "/assets/icons/skills/water_vortex.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "clone_explosion",
    "name": "Clone Great Explosion",
    "el": "FIRE",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🔥",
    "src": "/assets/icons/skills/clone_explosion.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "1000_years",
    "name": "1000 Years of Death",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/1000_years.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "gate_of_life",
    "name": "Gate of Life (3rd Gate)",
    "el": "PHYSICAL",
    "action": "TOGGLE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/gate_of_life.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "curse_mark_2",
    "name": "Curse Mark Stage 2",
    "el": "PHYSICAL",
    "action": "TOGGLE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/curse_mark_2.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "curse_surge",
    "name": "Curse Mark Surge",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/curse_surge.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "gate_prep",
    "name": "Gate Release Prep",
    "el": "PHYSICAL",
    "action": "SIDE",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/gate_prep.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "killing_intent",
    "name": "Killing Intent",
    "el": "MENTAL",
    "action": "SIDE",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/killing_intent.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "demon_slash",
    "name": "Demon Slash",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/demon_slash.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "bone_drill",
    "name": "Dance of Clematis",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "TRUE",
    "emoji": "👊",
    "src": "/assets/icons/skills/bone_drill.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "poison_fog",
    "name": "Ibuse Poison Fog",
    "el": "FIRE",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🔥",
    "src": "/assets/icons/skills/poison_fog.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "tsukuyomi",
    "name": "Tsukuyomi",
    "el": "MENTAL",
    "action": "MAIN",
    "dmg": "TRUE",
    "emoji": "👁️",
    "src": "/assets/icons/skills/tsukuyomi.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "reaper_death_seal",
    "name": "Reaper Death Seal",
    "el": "MENTAL",
    "action": "MAIN",
    "dmg": "TRUE",
    "emoji": "👁️",
    "src": "/assets/icons/skills/reaper_death_seal.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "edo_tensei",
    "name": "Edo Tensei",
    "el": "MENTAL",
    "action": "MAIN",
    "dmg": "MENTAL",
    "emoji": "👁️",
    "src": "/assets/icons/skills/edo_tensei.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "gate_of_limit",
    "name": "Gate of Limit (5th Gate)",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/gate_of_limit.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "shukaku_arm",
    "name": "Shukaku Arm",
    "el": "EARTH",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🪨",
    "src": "/assets/icons/skills/shukaku_arm.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "copy_jutsu",
    "name": "Sharingan: Copy",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "PHYSICAL",
    "emoji": "👊",
    "src": "/assets/icons/skills/copy_jutsu.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "c4_karura",
    "name": "C4 Karura",
    "el": "EARTH",
    "action": "MAIN",
    "dmg": "TRUE",
    "emoji": "🪨",
    "src": "/assets/icons/skills/c4_karura.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "rasenshuriken",
    "name": "Rasenshuriken",
    "el": "WIND",
    "action": "MAIN",
    "dmg": "TRUE",
    "emoji": "🌪️",
    "src": "/assets/icons/skills/rasenshuriken.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "amaterasu",
    "name": "Amaterasu",
    "el": "FIRE",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "🔥",
    "src": "/assets/icons/skills/amaterasu.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "kirin",
    "name": "Kirin",
    "el": "LIGHTNING",
    "action": "MAIN",
    "dmg": "ELEMENTAL",
    "emoji": "⚡",
    "src": "/assets/icons/skills/kirin.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "shinra_tensei",
    "name": "Shinra Tensei",
    "el": "WIND",
    "action": "MAIN",
    "dmg": "TRUE",
    "emoji": "🌪️",
    "src": "/assets/icons/skills/shinra_tensei.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "kamui_impact",
    "name": "Kamui",
    "el": "PHYSICAL",
    "action": "MAIN",
    "dmg": "TRUE",
    "emoji": "👊",
    "src": "/assets/icons/skills/kamui_impact.jpg",
    "quality": "imagine-jpg"
  },
  {
    "id": "tengai_shinsei",
    "name": "Tengai Shinsei",
    "el": "EARTH",
    "action": "MAIN",
    "dmg": "TRUE",
    "emoji": "🪨",
    "src": "/assets/icons/skills/tengai_shinsei.jpg",
    "quality": "imagine-jpg"
  }
];
