import { EffectType, PrimaryStat, Clan, Rarity } from "../types";

export const HELP_TEXT = {
  STATS: {
    BODY: [
      {
        id: PrimaryStat.WILLPOWER,
        name: "Willpower",
        desc: "Grit & Survival.",
        effect: "Increases Max HP (9 per point). Governs Guts chance (survival at 1 HP) and HP Regen."
      },
      {
        id: PrimaryStat.CHAKRA,
        name: "Chakra",
        desc: "Energy Capacity.",
        effect: "Increases Max Chakra (8 per point). Necessary for using high-tier Jutsus."
      },
      {
        id: PrimaryStat.STRENGTH,
        name: "Strength",
        desc: "Physical Power.",
        effect: "Scales Taijutsu damage and Physical Defense."
      }
    ],
    MIND: [
      {
        id: PrimaryStat.SPIRIT,
        name: "Spirit",
        desc: "Elemental Affinity.",
        effect: "Scales Ninjutsu damage and Elemental Defense."
      },
      {
        id: PrimaryStat.INTELLIGENCE,
        name: "Intelligence",
        desc: "Tactical Knowledge.",
        effect: "Required to learn advanced Skills. Governs Chakra Regeneration."
      },
      {
        id: PrimaryStat.CALMNESS,
        name: "Calmness",
        desc: "Mental Fortitude.",
        effect: "Scales Genjutsu damage/defense and Resistance to status effects."
      }
    ],
    TECHNIQUE: [
      {
        id: PrimaryStat.SPEED,
        name: "Speed",
        desc: "Reflexes & Agility.",
        effect: "Governs Turn Initiative, Melee Hit Chance, and Evasion."
      },
      {
        id: PrimaryStat.ACCURACY,
        name: "Accuracy",
        desc: "Precision.",
        effect: "Governs Ranged Hit Chance and Ranged Critical Damage."
      },
      {
        id: PrimaryStat.DEXTERITY,
        name: "Dexterity",
        desc: "Hand Seals & Lethality.",
        effect: "Governs Critical Hit Chance for all attacks (0.5% per point)."
      }
    ]
  },

  DERIVED: [
    { name: "Evasion", desc: "Chance to completely dodge an attack. Capped by Soft Cap (250 Speed)." },
    { name: "Critical Chance", desc: "Chance to deal 1.75x damage. Base 8% + scaling with Dexterity." },
    { name: "Guts", desc: "Chance to survive a lethal blow with 1 HP. Scaling based on Willpower." },
    { name: "Status Resistance", desc: "Chance to ignore negative effects. Scaling based on Calmness." }
  ],

  EFFECTS: [
    { type: EffectType.STUN, label: "Stun", desc: "Target cannot act for the duration." },
    { type: EffectType.BURN, label: "Burn", desc: "Fire Damage over Time." },
    { type: EffectType.BLEED, label: "Bleed", desc: "Physical Damage over Time." },
    { type: EffectType.POISON, label: "Poison", desc: "Toxic Damage over Time (Ignores Defense)." },
    { type: EffectType.SHIELD, label: "Shield", desc: "Temporary HP that absorbs damage. Breaks when depleted." },
    { type: EffectType.REFLECTION, label: "Reflection", desc: "Returns a % of incoming damage back to the attacker." },
    { type: EffectType.INVULNERABILITY, label: "Invulnerability", desc: "Takes 0 damage from all sources." },
    { type: EffectType.CONFUSION, label: "Confusion", desc: "50% chance to hurt self instead of attacking." },
    { type: EffectType.SILENCE, label: "Silence", desc: "Cannot use Chakra-based skills." },
    { type: EffectType.REGEN, label: "Regeneration", desc: "Restores HP at the start of every turn." },
    { type: EffectType.CURSE, label: "Curse", desc: "Increases all damage taken by a percentage." }
  ],

  ELEMENTS: {
    CYCLE: "Fire > Wind > Lightning > Earth > Water > Fire",
    BONUS: "Super Effective hits deal 1.2x Damage and gain +10% Critical Chance.",
    RESIST: "Resisted hits deal 0.8x Damage. Physical and Mental attacks are always neutral."
  },

  // ============================================================================
  // CLANS - The 5 Playable Lineages
  // ============================================================================
  CLANS: [
    {
      id: Clan.UZUMAKI,
      name: "Uzumaki",
      role: "Sustain Tank",
      desc: "Massive reserves of willpower and chakra.",
      strengths: ["Highest HP", "Largest Chakra pool", "Good HP Regeneration"],
      weakness: "Lower Speed and offensive stats",
      strategy: "Endure. Heal. Outlast what the mist throws."
    },
    {
      id: Clan.UCHIHA,
      name: "Uchiha",
      role: "Elemental Glass Cannon",
      desc: "Masters of elemental ninjutsu and precision strikes.",
      strengths: ["High elemental damage (Spirit)", "High Critical Chance", "Fast reflexes (Speed)"],
      weakness: "Low HP and defenses",
      strategy: "End the fight before the frame cracks."
    },
    {
      id: Clan.HYUGA,
      name: "Hyuga",
      role: "Precision Taijutsu",
      desc: "Surgical strikers with pinpoint accuracy and technique.",
      strengths: ["Highest Accuracy", "High Dexterity (crits)", "Strong Strength & Speed balance"],
      weakness: "Lower chakra capacity",
      strategy: "Close range. Crits write the ledger."
    },
    {
      id: Clan.LEE,
      name: "Lee Disciple",
      role: "Pure Body Specialist",
      desc: "Extreme physical conditioning without any chakra.",
      strengths: ["Extreme Strength", "Extreme Speed", "High Willpower"],
      weakness: "No chakra for jutsus; Low mental stats",
      strategy: "Body only. Fist and foot — no seals."
    },
    {
      id: Clan.YAMANAKA,
      name: "Yamanaka",
      role: "Mind Controller",
      desc: "Tactical masterminds with unshakeable mental fortitude.",
      strengths: ["Highest Intelligence", "Highest Calmness", "Good Chakra pool"],
      weakness: "Physically frail (Low Strength)",
      strategy: "Marks and silence. The field bends first."
    }
  ],

  // ============================================================================
  // PROGRESSION - Game Scaling & Difficulty
  // ============================================================================
  PROGRESSION: {
    SCALING: {
      title: "Enemy Scaling Formula",
      formula: "totalScaling = dangerMult × progressionMult × diffMult × 0.85",
      breakdown: [
        "dangerMult = 0.30 + (dangerLevel × 0.24)  → D1=0.54, D4=1.26, D7=1.98",
        "progressionMult = 1 + (locationsCleared × 0.04)  → +4% per location cleared",
        "diffMult = 0.40 + (difficulty / 200)  → 40%-90%",
        "0.85 = Enemy ease factor (15% reduction)"
      ],
      examples: [
        { danger: 1, difficulty: 40, text: "Danger 1, 0 locations, Diff 40: 0.54 × 1.00 × 0.60 × 0.85 = 0.28×" },
        { danger: 4, difficulty: 50, text: "Danger 4, 5 locations, Diff 50: 1.26 × 1.20 × 0.65 × 0.85 = 0.84×" },
        { danger: 7, difficulty: 100, text: "Danger 7, 10 locations, Diff 100: 1.98 × 1.40 × 0.90 × 0.85 = 2.12×" }
      ]
    },
    // Bands MUST match MainMenu.getRank (25 / 45 / 65 / 85) — the handbook previously shipped the
    // pre-R1-007 four-band table and contradicted the rank shown on the menu slider.
    DIFFICULTY_RANKS: [
      { rank: "D", range: "0-24", color: "green-500", desc: "Thin pressure; low stat scaling" },
      { rank: "C", range: "25-44", color: "yellow-500", desc: "Usual pressure; moderate scaling" },
      { rank: "B", range: "45-64", color: "orange-500", desc: "Hard edge; significant scaling" },
      { rank: "A", range: "65-84", color: "red-500", desc: "Severe pressure; heavy scaling" },
      { rank: "S", range: "85-100", color: "red-600", desc: "Maximum pressure; full scaling" }
    ],
    RESOURCES: [
      { label: "HP Calculation", formula: "80 + (Willpower × 9) + equipment" },
      { label: "Chakra Calculation", formula: "30 + (Chakra stat × 8) + equipment" },
      { label: "Skill Chakra Cost", formula: "Typical 10-30; Ultimate skills 40-50" },
      { label: "HP Regen", formula: "2% of Max HP per turn, scaled by Willpower (÷20)" },
      { label: "Chakra Regen", formula: "Intelligence × 0.5 per turn" }
    ],
    PROGRESSION_DETAILS: [
      { label: "XP per Enemy", formula: "Base 25 + (Floor × 5) + tier bonuses" },
      { label: "Level Up Requirement", formula: "100 × Level XP needed" },
      { label: "Crit Damage Multiplier", formula: "1.75x (Base 8% + 0.5% per Dexterity)" },
      { label: "Hit Chance Formula", formula: "92% + (Attacker Stat - Defender Stat) × 1.5%" }
    ]
  },

  // ============================================================================
  // EQUIPMENT - Loot & Item System
  // ============================================================================
  EQUIPMENT: {
    RARITIES: [
      {
        rarity: Rarity.COMMON,
        color: "text-zinc-500",
        dropRate: "~35%",
        statBonus: "Minimal flat bonuses",
        desc: "Common gear found everywhere."
      },
      {
        rarity: Rarity.RARE,
        color: "text-blue-400",
        dropRate: "~30%",
        statBonus: "Moderate flat bonuses",
        desc: "Better stats than common items."
      },
      {
        rarity: Rarity.EPIC,
        color: "text-purple-400",
        dropRate: "~20%",
        statBonus: "High flat + percent bonuses",
        desc: "Significantly stronger; % multipliers included."
      },
      {
        rarity: Rarity.LEGENDARY,
        color: "text-orange-400",
        dropRate: "~14%",
        statBonus: "Massive bonuses + special effects",
        desc: "Rare power spikes; define builds."
      },
      {
        rarity: Rarity.CURSED,
        color: "text-red-600",
        dropRate: "~1%",
        statBonus: "Mixed beneficial/harmful effects",
        desc: "Risky rewards; extreme stat swings."
      }
    ],
    SLOTS: [
      { slot: "Weapon", primary: "Strength", desc: "Scales Taijutsu damage and physical attacks." },
      { slot: "Head", primary: "Calmness", desc: "Improves mental defense and status resistance." },
      { slot: "Body", primary: "Willpower", desc: "Increases HP and guts chance." },
      { slot: "Accessory", primary: "Speed/Spirit", desc: "Boosts reflexes or elemental power." }
    ],
    SCALING: "Item stats scale with Floor and Difficulty. Higher floors = stronger drops."
  },

  // ============================================================================
  // COMBAT MECHANICS - Deck/AP/Posture, Approaches & Terrain
  // ============================================================================
  COMBAT_MECHANICS: {
    DECK_ECONOMY: {
      title: "Deck, Hand & Action Points",
      overview: "Combat is a card-based system. Your known jutsu form a deck; each turn you draw a hand and spend Action Points (AP) to play cards. There is no MAIN/SIDE phase — only AP.",
      points: [
        { label: "Deck (8–20)", desc: "Playable jutsu (ACTIVE + TOGGLE) form your draw pile. Academy kits start ~8 cards; hard cap 20. PASSIVES stay always-on and never enter the deck." },
        { label: "Hand", desc: "You draw 4 cards at the start of each turn. Posture biases which kinds of cards appear (offensive / utility / defensive)." },
        { label: "Action Points (AP)", desc: "Base 3 AP/turn + 1 per 10 Speed. Each card costs AP (and often CP); when AP is gone, your turn ends. Harsh location terrain (movement penalty) can cut your AP budget — the combat HUD shows Terrain −N when that happens." },
        { label: "Card types", desc: "ACTIVE — attacks, utility, and setups (each card has its own AP cost). TOGGLE — modes: pay AP to activate, then upkeep each turn. PASSIVE — always on, not drawn. Some ACTIVE cards deal bonus damage when your combat posture matches their stance bonus." },
        { label: "Learning", desc: "Most techniques are open to any clan if you meet the stat requirements. Bloodline skills (e.g. Sharingan, Byakugan) stay clan-locked. Your clan's favorite techniques appear more often on scrolls and loot." }
      ]
    },
    POSTURES: [
      { type: "Aggressive", desc: "Favors attack cards. Deal +15% damage, take +15% damage.", color: "red" },
      { type: "Balanced", desc: "Even draw. Neutral damage and defense (default).", color: "gray" },
      { type: "Defensive", desc: "Favors guard/utility cards. Deal −15% damage, take −15% damage.", color: "blue" }
    ],
    APPROACHES: [
      { type: "Frontal Assault", desc: "Always available. Safe baseline — no bonuses, no risk. Default approach from the HUD.", color: "gray" },
      { type: "Silent Strike", desc: "Requires Dexterity 16+ and Speed 12+ (DEX specialists: Uchiha/Hyuga). Costs 8 chakra. Success: 1.5× first hit, +initiative. Fail: enemy seizes initiative, +20% damage taken, DEX/Speed debuffs. Terrain stealth helps odds.", color: "green" },
      { type: "Mind Trap", desc: "Requires Calmness 14+ and Intelligence 12+. Costs 18 chakra. Success: short confuse + slow. Fail: self-confusion and mind debuffs.", color: "blue" },
      { type: "Terrain Trap", desc: "Requires Intelligence 12+ and Accuracy 11+, plus trap-friendly room terrain. Costs 6 chakra. Success: ~12% enemy HP pre-fight. Fail: HP backfire + accuracy curse.", color: "red" },
      { type: "Iron Guard", desc: "Requires Willpower 14+. Costs 12 chakra. Success: shield + slight init loss (defensive open). Fail: +25% damage taken.", color: "blue" },
      { type: "Shadow Passage", desc: "Requires Speed 30+. Costs 30 chakra. Success: skip fight (no XP/loot). Blocked on elite/boss. Fail: heavy init loss and vulnerability.", color: "green" }
    ],
    /**
     * T-076: real location terrainEffects (LocationTerrainSystem), not fluff biomes.
     * Room TerrainType still applies stealth/init/element amp separately.
     */
    TERRAIN: [
      { type: "Water dmg / Fire dmg", desc: "Location tags can boost Water skills and cut Fire (and similar). Stacks with room elemental amp when both apply." },
      { type: "Mental dmg", desc: "Boosts mental-damage skills and mental-element techniques on that location." },
      { type: "Stealth", desc: "Adds to approach stealth success (room stealth + location stealth). Approach panel shows combined %." },
      { type: "Enemy atk / def", desc: "Enemy attack bonus hits harder; enemy defense reduces your outgoing damage. Watch the open-combat terrain strip." },
      { type: "Ambush", desc: "Raises elite/ambush spawn odds on that location’s rooms." },
      { type: "Poison / Fall / Chakra drain", desc: "End-of-enemy-turn hazards: % max HP damage or chakra drain (chance-gated). Logs when they trigger." },
      { type: "Evasion", desc: "Raises your dodge chance against enemy attacks (manual + auto combat)." },
      { type: "Movement / Visibility", desc: "Location movement_penalty cuts combat AP (HUD: Terrain −N). Visibility penalty reduces intel gains from combat, events, and info gathering." },
      { type: "Room Pace (movementCost)", desc: "Each room's footing multiplies combat AP (Pace ×0.8 easier … ×1.5 slower). Shown on the location map, approach strip, and open-combat terrain line. Floor AP never goes below 1." },
      { type: "Room Sight / Secrets", desc: "Sight (visibilityRange) fogs grandchild foresight on the map when ≤1. Secrets (hiddenRoomBonus) shifts exit-find chance when branching from that room." },
      /**
       * T-107: room combat conditions (CombatModifierType) — wired T-102–106.
       * Distinct from location Ambush spawn odds above.
       */
      { type: "Room Fight: Ambush", desc: "Enemy tends to act first and hits harder on the opening strike (×1.25). Shown as Fight chip on the map, approach strip, and open-combat banner." },
      { type: "Room Fight: Prepared", desc: "You seize initiative and deal bonus first-hit damage (×1.2). Path and approach UI label it Prepared." },
      { type: "Room Fight: Sanctuary", desc: "Sacred ground heals ~20% max HP before the fight starts." },
      { type: "Room Fight: Corrupted", desc: "Lingering poison ticks during the fight (combat log + buff)." },
      { type: "Room Fight: Forest / Swamp / Cliff", desc: "Forest: +evasion cover. Swamp: initiative drag. Cliff: missing an attack can cost % max HP from a slip." }
    ]
  },

  // ============================================================================
  // EXPLORATION - Region Hierarchy & Activities
  // ============================================================================
  EXPLORATION: {
    /**
     * First-run journey (Region 1 / Land of Waves). Matches live UI CTAs.
     */
    FIRST_RUN: [
      { step: 1, title: "Enter the Mist", desc: "Set Mission Rank (C is the usual pressure). Enter the Mist. Choose a lineage — Uzumaki endures longest when the path is unknown." },
      { step: 2, title: "Mark a path", desc: "On the region map, mark a destination card (1–3). Space/Enter or Enter Location to step through." },
      { step: 3, title: "Stand in the glow", desc: "The lit room is where you stand. Enter Room (Space/Enter) to face what waits, or branch above (1–2)." },
      { step: 4, title: "Seek the seal", desc: "Cut rooms until the Exit / Guardian appears. End it — return to the region scarred, richer, and still watched." },
      { step: 5, title: "Walk Away is still a choice", desc: "Risk and payoff are written on every option. Safe Walk Away skips blood and loot — the path still records that you passed." }
    ],
    HIERARCHY: [
      { term: "Region", desc: "Themed area with multiple locations. Shows Affinity (enemy element bias), Focus (loot stat bias), and Ryo multiplier on the region map.", icon: "map" },
      { term: "Location", desc: "Danger 1–7 node. Atmosphere line + Terrain strip list location effects that already apply in combat, intel, and approaches.", icon: "location" },
      { term: "Room", desc: "Branching spaces with activities. Room terrain sets Sight/Secrets/Pace; combat rooms also roll a Fight condition (Ambush, Prepared, Sanctuary, Corrupted, Forest, Cliff) that changes the encounter — shown on the map card, approach strip, and combat open banner.", icon: "room" }
    ],
    /**
     * T-076: region lootTheme identity (wired T-061/068/069/074).
     */
    REGION_IDENTITY: [
      { term: "Affinity", desc: "Region primary element. About half of normal/elite enemies lean this element (combat, events, guardians)." },
      { term: "Focus", desc: "Equipment focus stats (e.g. Speed · Dexterity). Component drops and shops bias toward those primary stats." },
      { term: "Ryo ×N", desc: "Gold multiplier after wealth/flags. Waves is poorer; later regions pay more." }
    ],
    DANGER_LEVELS: {
      desc: "Difficulty scaling within each location, ranging from 1 (easiest) to 7 (hardest)",
      formula: "effectiveFloor = 10 + (dangerLevel × 2) + floor(baseDifficulty / 20)",
      note: "Higher danger levels mean stronger enemies and better rewards. Foggy/low-visibility locations also cut intel gains."
    },
    ACTIVITIES: [
      { order: 1, activity: "Combat", desc: "Fight room enemy for XP and loot (open banner shows approach + active location terrain)" },
      { order: 2, activity: "Elite Challenge", desc: "Optional guardian fight - choose to fight or escape" },
      { order: 3, activity: "Merchant", desc: "Buy items; stock biased by location loot table + region Focus" },
      { order: 4, activity: "Event", desc: "Story/choice encounter; intel rewards respect visibility fog" },
      { order: 5, activity: "Scroll Discovery", desc: "Learn jutsu; pool biased by region Affinity (element) and Focus (scaling stat). Cards matching theme show a Region mark." },
      { order: 6, activity: "Rest", desc: "Restore HP and chakra" },
      { order: 7, activity: "Training", desc: "Spend resources to upgrade stats" },
      { order: 8, activity: "Treasure", desc: "Components/Ryo; drops use loot table + region Focus" },
      { order: 9, activity: "Info Gathering", desc: "Raise intel for clearer destination cards on the region map (foggy locations gain less)" }
    ],
    ROOM_STATES: [
      { state: "Accessible", desc: "Room can be entered from current position" },
      { state: "Cleared", desc: "All activities in room have been completed" },
      { state: "Exit", desc: "Final room leading to next area or floor" }
    ],
    LOCATION_BOSS: {
      title: "Location Boss",
      desc: "Guardian at the exit. Clearing the location shows progress, secrets, terrain summary, and region Affinity/Focus before returning to the region map."
    },
    ARCHETYPES: [
      {
        archetype: "TANK",
        stats: "High Willpower & Strength",
        playstyle: "Defensive; soaks damage",
        skills: "Shield, Regeneration buffs"
      },
      {
        archetype: "ASSASSIN",
        stats: "High Dexterity & Speed",
        playstyle: "Burst damage with high crits",
        skills: "High-damage single-target skills"
      },
      {
        archetype: "BALANCED",
        stats: "Even distribution",
        playstyle: "Versatile; no clear weakness",
        skills: "Mixed offensive & defensive"
      },
      {
        archetype: "CASTER",
        stats: "High Spirit & Intelligence",
        playstyle: "Elemental damage spam",
        skills: "Element-based AoE attacks"
      },
      {
        archetype: "GENJUTSU",
        stats: "High Calmness & Spirit",
        playstyle: "Control via status effects",
        skills: "Stun, Confusion, Silence, Debuffs"
      }
    ],
    STORY_ARCS: [
      { arc: 1, danger: "1-7", name: "Land of Waves", desc: "Coastal region (Water affinity, Focus Speed/Dex/Spirit, lower Ryo). Bandits and hired ninja." },
      { arc: 2, danger: "1-7", name: "Chunin Exams", desc: "Forest of Death (Wind affinity). Competitors and exam dangers." },
      { arc: 3, danger: "1-7", name: "Sasuke Retrieval", desc: "Valley of the End (Lightning affinity). Escalating conflict." },
      { arc: 4, danger: "1-7", name: "Great Ninja War", desc: "Divine Tree Roots (Fire affinity, higher Ryo). Legendary foes." }
    ]
  },

  // ============================================================================
  // CRAFTING - Synthesis System
  // ============================================================================
  CRAFTING: {
    OVERVIEW: {
      title: "TFT-Style Crafting",
      desc: "Combine components to create powerful artifacts with passive effects"
    },
    COMPONENTS: {
      desc: "Basic crafting materials dropped from enemies",
      examples: [
        { name: "Ninja Steel", use: "Weapon crafting" },
        { name: "Spirit Tag", use: "Seal-based artifacts" },
        { name: "Chakra Pill", use: "Energy restoration items" },
        { name: "Shadow Essence", use: "Stealth artifacts" }
      ]
    },
    ARTIFACTS: {
      desc: "Crafted items with passive effects that trigger during combat",
      triggers: [
        { trigger: "combat_start", desc: "Activates when battle begins" },
        { trigger: "on_hit", desc: "Activates when you deal damage" },
        { trigger: "on_crit", desc: "Activates on critical hits" },
        { trigger: "below_half_hp", desc: "Activates when HP drops below 50%" }
      ]
    },
    BAG: {
      capacity: 8,
      desc: "Your component bag holds up to 8 items (components or artifacts)"
    },
    SYNTHESIS: {
      combine: "Fence two components into one artifact",
      disassemble: "Unmake an artifact — half value returns as components",
      tip: "Unknown pairs still fuse. Read the forge; trust the scar."
    }
  }
};
