/* T-028 Lot F: Event art — painted-png plates where on disk; category/residual reuse painted plates */
export interface EventArtManifestEntry {
  key: string;
  id: string;
  emoji: string;
  label: string;
  src: string;
  quality: 'svg-tile' | 'painted-png' | 'imagine-jpg';
  kind: 'category' | 'event';
  category?: string;
}

export const EVENT_ART_MANIFEST: EventArtManifestEntry[] = [
  {
    "key": "event:cat_combat",
    "id": "cat_combat",
    "emoji": "⚔️",
    "label": "Combat Event",
    "src": "/assets/event_cat_combat.png",
    "quality": "painted-png",
    "kind": "category",
    "category": "combat"
  },
  {
    "key": "event:cat_reward",
    "id": "cat_reward",
    "emoji": "💎",
    "label": "Reward Event",
    "src": "/assets/event_cat_reward.png",
    "quality": "painted-png",
    "kind": "category",
    "category": "reward"
  },
  {
    "key": "event:cat_story",
    "id": "cat_story",
    "emoji": "📖",
    "label": "Story Event",
    "src": "/assets/event_cat_story.png",
    "quality": "painted-png",
    "kind": "category",
    "category": "story"
  },
  {
    "key": "event:cat_danger",
    "id": "cat_danger",
    "emoji": "☠️",
    "label": "Danger Event",
    "src": "/assets/event_cat_danger.png",
    "quality": "painted-png",
    "kind": "category",
    "category": "danger"
  },
  {
    "key": "event:cat_generic",
    "id": "cat_generic",
    "emoji": "🌀",
    "label": "Event",
    "src": "/assets/event_cat_generic.png",
    "quality": "painted-png",
    "kind": "category",
    "category": "generic"
  },
  {
    "key": "event:forbidden_scroll_library",
    "id": "forbidden_scroll_library",
    "emoji": "📜",
    "label": "forbidden scroll library",
    "src": "/assets/event_forbidden_scroll_library.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "reward"
  },
  {
    "key": "event:bullying_incident",
    "id": "bullying_incident",
    "emoji": "📖",
    "label": "bullying incident",
    "src": "/assets/event_bullying_incident.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:secret_training_ground",
    "id": "secret_training_ground",
    "emoji": "💎",
    "label": "secret training ground",
    "src": "/assets/event_secret_training_ground.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "reward"
  },
  {
    "key": "event:bridge_worker_plea",
    "id": "bridge_worker_plea",
    "emoji": "🌉",
    "label": "bridge worker plea",
    "src": "/assets/event_bridge_worker_plea.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "combat"
  },
  {
    "key": "event:mist_ambush_cache",
    "id": "mist_ambush_cache",
    "emoji": "🌫️",
    "label": "mist ambush cache",
    "src": "/assets/event_mist_ambush_cache.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "reward"
  },
  {
    "key": "event:tazuna_request",
    "id": "tazuna_request",
    "emoji": "👷",
    "label": "tazuna request",
    "src": "/assets/event_tazuna_request.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:forest_death_trap",
    "id": "forest_death_trap",
    "emoji": "🌲",
    "label": "forest death trap",
    "src": "/assets/event_forest_death_trap.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "danger"
  },
  {
    "key": "event:rival_team_encounter",
    "id": "rival_team_encounter",
    "emoji": "⚔️",
    "label": "rival team encounter",
    "src": "/assets/event_rival_team_encounter.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "combat"
  },
  {
    "key": "event:giant_serpent_nest",
    "id": "giant_serpent_nest",
    "emoji": "☠️",
    "label": "giant serpent nest",
    "src": "/assets/event_giant_serpent_nest.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "danger"
  },
  {
    "key": "event:scroll_merchant",
    "id": "scroll_merchant",
    "emoji": "💎",
    "label": "scroll merchant",
    "src": "/assets/event_scroll_merchant.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "reward"
  },
  {
    "key": "event:sound_four_ritual",
    "id": "sound_four_ritual",
    "emoji": " Crowley",
    "label": "sound four ritual",
    "src": "/assets/event_sound_four_ritual.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "danger"
  },
  {
    "key": "event:curse_mark_amplifier",
    "id": "curse_mark_amplifier",
    "emoji": "☠️",
    "label": "curse mark amplifier",
    "src": "/assets/event_curse_mark_amplifier.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "danger"
  },
  {
    "key": "event:valley_vision",
    "id": "valley_vision",
    "emoji": "📖",
    "label": "valley vision",
    "src": "/assets/event_valley_vision.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:orochimaru_experiment",
    "id": "orochimaru_experiment",
    "emoji": "🐍",
    "label": "orochimaru experiment",
    "src": "/assets/event_orochimaru_experiment.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "danger"
  },
  {
    "key": "event:orochimaru_experiment_result",
    "id": "orochimaru_experiment_result",
    "emoji": "📖",
    "label": "orochimaru experiment result",
    "src": "/assets/event_orochimaru_experiment_result.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:white_zetsu_paranoia",
    "id": "white_zetsu_paranoia",
    "emoji": "☠️",
    "label": "white zetsu paranoia",
    "src": "/assets/event_white_zetsu_paranoia.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "danger"
  },
  {
    "key": "event:bijuu_chakra_fragment",
    "id": "bijuu_chakra_fragment",
    "emoji": "🦊",
    "label": "bijuu chakra fragment",
    "src": "/assets/event_bijuu_chakra_fragment.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "reward"
  },
  {
    "key": "event:reanimated_envoy",
    "id": "reanimated_envoy",
    "emoji": "💀",
    "label": "reanimated envoy",
    "src": "/assets/event_reanimated_envoy.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:reanimated_envoy_fate",
    "id": "reanimated_envoy_fate",
    "emoji": "⚔️",
    "label": "reanimated envoy fate",
    "src": "/assets/event_reanimated_envoy_fate.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "combat"
  },
  {
    "key": "event:envoy_gratitude_repaid",
    "id": "envoy_gratitude_repaid",
    "emoji": "💎",
    "label": "envoy gratitude repaid",
    "src": "/assets/event_envoy_gratitude_repaid.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "reward"
  },
  {
    "key": "event:scavengers_field",
    "id": "scavengers_field",
    "emoji": "⚔️",
    "label": "scavengers field",
    "src": "/assets/event_scavengers_field.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "combat"
  },
  {
    "key": "event:abandoned_supply_cache",
    "id": "abandoned_supply_cache",
    "emoji": "💎",
    "label": "abandoned supply cache",
    "src": "/assets/event_abandoned_supply_cache.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "reward"
  },
  {
    "key": "event:ancient_treasure_map",
    "id": "ancient_treasure_map",
    "emoji": "💎",
    "label": "ancient treasure map",
    "src": "/assets/event_ancient_treasure_map.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "reward"
  },
  {
    "key": "event:traveling_merchant_caravan",
    "id": "traveling_merchant_caravan",
    "emoji": "💎",
    "label": "traveling merchant caravan",
    "src": "/assets/event_traveling_merchant_caravan.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "reward"
  },
  {
    "key": "event:hidden_shrine_blessing",
    "id": "hidden_shrine_blessing",
    "emoji": "⛩️",
    "label": "hidden shrine blessing",
    "src": "/assets/event_hidden_shrine_blessing.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "reward"
  },
  {
    "key": "event:intelligence_network",
    "id": "intelligence_network",
    "emoji": "📡",
    "label": "intelligence network",
    "src": "/assets/event_intelligence_network.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  // Land of Waves story plates
  {
    "key": "event:meet_tazuna",
    "id": "meet_tazuna",
    "emoji": "🌫️",
    "label": "meet tazuna",
    "src": "/assets/event_meet_tazuna.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:tazuna_road_mist",
    "id": "tazuna_road_mist",
    "emoji": "🌫️",
    "label": "tazuna road mist",
    "src": "/assets/event_tazuna_road_mist.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:protect_village",
    "id": "protect_village",
    "emoji": "🏘️",
    "label": "protect village",
    "src": "/assets/event_protect_village.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:meet_inari",
    "id": "meet_inari",
    "emoji": "🧒",
    "label": "meet inari",
    "src": "/assets/event_meet_inari.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:protect_bridge",
    "id": "protect_bridge",
    "emoji": "🌉",
    "label": "protect bridge",
    "src": "/assets/event_protect_bridge.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "combat"
  },
  {
    "key": "event:final_showdown_setup",
    "id": "final_showdown_setup",
    "emoji": "⚔️",
    "label": "final showdown setup",
    "src": "/assets/event_final_showdown_setup.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:final_confrontation",
    "id": "final_confrontation",
    "emoji": "🏯",
    "label": "final confrontation",
    "src": "/assets/event_final_confrontation.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:gato_defeat",
    "id": "gato_defeat",
    "emoji": "💰",
    "label": "gato defeat",
    "src": "/assets/event_gato_defeat.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  // A5 WAVE2 residual R1 sides — dedicated plates on disk
  {
    "key": "event:docks_collector_ledger",
    "id": "docks_collector_ledger",
    "emoji": "📒",
    "label": "collector ledger",
    "src": "/assets/event_docks_collector_ledger.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:mist_omen_tide",
    "id": "mist_omen_tide",
    "emoji": "🌫️",
    "label": "mist omen tide",
    "src": "/assets/event_mist_omen_tide.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "danger"
  },
  {
    "key": "event:shipwreck_whisper",
    "id": "shipwreck_whisper",
    "emoji": "🚢",
    "label": "shipwreck whisper",
    "src": "/assets/event_shipwreck_whisper.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "danger"
  },
  {
    "key": "event:manor_haunt_debt",
    "id": "manor_haunt_debt",
    "emoji": "🏚️",
    "label": "manor haunt debt",
    "src": "/assets/event_manor_haunt_debt.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  // A5 WAVE3 residual R1 sides — map to closest painted plates
  {
    "key": "event:corrupt_merchant_scales",
    "id": "corrupt_merchant_scales",
    "emoji": "⚖️",
    "label": "false scales",
    "src": "/assets/event_corrupt_merchant_scales.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:riverside_traveler_pact",
    "id": "riverside_traveler_pact",
    "emoji": "🔥",
    "label": "ashfire pact",
    "src": "/assets/event_riverside_traveler_pact.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:bandit_outpost_toll",
    "id": "bandit_outpost_toll",
    "emoji": "⚔️",
    "label": "toll of stakes",
    "src": "/assets/event_bandit_outpost_toll.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "danger"
  },
  // A5 WAVE4 residual R1 secrets — dedicated poster plates
  {
    "key": "event:hidden_cove_silent_drop",
    "id": "hidden_cove_silent_drop",
    "emoji": "🛥️",
    "label": "silent drop",
    "src": "/assets/event_hidden_cove_silent_drop.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "story"
  },
  {
    "key": "event:drowned_shrine_black_tide",
    "id": "drowned_shrine_black_tide",
    "emoji": "🏛️",
    "label": "black tide vow",
    "src": "/assets/event_drowned_shrine_black_tide.png",
    "quality": "painted-png",
    "kind": "event",
    "category": "danger"
  }
];

export const EVENT_CATEGORY_BY_ID: Record<string, string> = {
  "bridge_worker_plea": "combat",
  "mist_ambush_cache": "reward",
  "tazuna_request": "story",
  "meet_tazuna": "story",
  "tazuna_road_mist": "story",
  "protect_village": "story",
  "meet_inari": "story",
  "protect_bridge": "combat",
  "final_showdown_setup": "story",
  "final_confrontation": "story",
  "gato_defeat": "story",
  "docks_collector_ledger": "story",
  "mist_omen_tide": "danger",
  "shipwreck_whisper": "danger",
  "manor_haunt_debt": "story",
  "corrupt_merchant_scales": "story",
  "riverside_traveler_pact": "story",
  "bandit_outpost_toll": "danger",
  "hidden_cove_silent_drop": "story",
  "drowned_shrine_black_tide": "danger",

  "forest_death_trap": "danger",
  "rival_team_encounter": "combat",
  "giant_serpent_nest": "danger",
  "scroll_merchant": "reward",
  "sound_four_ritual": "danger",
  "curse_mark_amplifier": "danger",
  "valley_vision": "story",
  "orochimaru_experiment": "danger",
  "orochimaru_experiment_result": "story",
  "white_zetsu_paranoia": "danger",
  "bijuu_chakra_fragment": "reward",
  "reanimated_envoy": "story",
  "reanimated_envoy_fate": "combat",
  "envoy_gratitude_repaid": "reward",
  "scavengers_field": "combat",
  "abandoned_supply_cache": "reward",
  "ancient_treasure_map": "reward",
  "traveling_merchant_caravan": "reward",
  "hidden_shrine_blessing": "reward",
  "intelligence_network": "story",
  "forbidden_scroll_library": "reward",
  "bullying_incident": "story",
  "secret_training_ground": "reward"
};
