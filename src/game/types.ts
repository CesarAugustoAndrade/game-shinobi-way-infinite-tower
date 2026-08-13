// ============================================================================
// SHINOBI WAY - THE INFINITE TOWER
// New Stat System: The Shinobi Triad (Body, Mind, Technique)
// ============================================================================

export enum GameState {
  MENU,
  CHAR_SELECT,
  EXPLORE,          // Branching room exploration view
  ELITE_CHALLENGE,  // Elite challenge choice screen (fight vs escape)
  COMBAT,
  LOOT,
  MERCHANT,
  EVENT,
  TRAINING,         // Training scene for stat upgrades
  SCROLL_DISCOVERY, // Finding jutsu scrolls in exploration
  GAME_OVER,
  GUIDE,
  // Region exploration system states
  REGION_MAP,       // Region overview showing all locations
  LOCATION_EXPLORE, // Inside a location (binary room branching exploration)
  // Treasure system states
  TREASURE,              // Treasure choice screen (locked chests OR treasure hunter)
  TREASURE_HUNT_REWARD,  // Map completion reward screen
  // Campaign macro (T-023)
  INTERLUDE,             // Post-boss: narrative + heal + boon 1-of-3 → next region
  VICTORY,               // Campaign clear (provisional after region 1 until T-024..026)
  /** Sprint A: registry smoke state; no production UI yet. */
  SCENE_REGISTRY_PROBE = 'SCENE_REGISTRY_PROBE',
}

export enum ElementType {
  FIRE = 'Fire',
  WIND = 'Wind',
  LIGHTNING = 'Lightning',
  EARTH = 'Earth',
  WATER = 'Water',
  PHYSICAL = 'Physical',
  MENTAL = 'Mental' // For Genjutsu
}

// ============================================================================
// PRIMARY STATS - The 9 Core Attributes
// ============================================================================
export enum PrimaryStat {
  // THE BODY (Hardware) - Survival & Resources
  WILLPOWER = 'Willpower',   // Max HP, Guts chance, HP Regen
  CHAKRA = 'Chakra',         // Max Chakra capacity
  STRENGTH = 'Strength',     // Taijutsu Dmg, Physical Defense

  // THE MIND (Software) - Nature & Logic
  SPIRIT = 'Spirit',         // Elemental Dmg, Elemental Defense
  INTELLIGENCE = 'Intelligence', // Jutsu Requirements, Chakra Regen
  CALMNESS = 'Calmness',     // Genjutsu Defense, Status Resistance

  // THE TECHNIQUE (Application) - Precision & Speed
  SPEED = 'Speed',           // Initiative, Melee Hit, Evasion
  ACCURACY = 'Accuracy',     // Ranged Hit, Ranged Crit Multiplier
  DEXTERITY = 'Dexterity'    // Critical Hit Chance (all types)
}

// Legacy alias for backward compatibility
export const Stat = PrimaryStat;
export type Stat = PrimaryStat;

// ============================================================================
// DAMAGE SYSTEM
// ============================================================================
export enum DamageType {
  PHYSICAL = 'Physical',     // Taijutsu - mitigated by Strength
  ELEMENTAL = 'Elemental',   // Ninjutsu - mitigated by Spirit
  MENTAL = 'Mental',         // Genjutsu - mitigated by Calmness
  TRUE = 'True'              // Bypasses ALL defenses (rare/forbidden)
}

export enum DamageProperty {
  NORMAL = 'Normal',         // Subject to BOTH flat and % defenses
  PIERCING = 'Piercing',     // Ignores FLAT defense, only % applies
  ARMOR_BREAK = 'ArmorBreak', // Ignores % defense, only flat applies
  TRUE = 'True'              // Bypasses ALL defense (rare/forbidden skills)
}

export enum AttackMethod {
  MELEE = 'Melee',           // Hit chance uses SPEED vs SPEED
  RANGED = 'Ranged',         // Hit chance uses ACCURACY vs SPEED
  AUTO = 'Auto'              // Always hits (some DoTs, Genjutsu effects)
}

// ============================================================================
// COMBAT DISTANCE (F2)
// ============================================================================

/** Engagement band between combatants. Distance only gates skills (no global dmg mods). */
export enum CombatRange {
  CLOSE = 'CLOSE',
  MEDIUM = 'MEDIUM',
  LONG = 'LONG',
}

// ============================================================================
// HEAT (F3) — visit alert / greed meter
// ============================================================================

/** Visible HEAT tiers (plan §3). */
export enum HeatTier {
  QUIET = 'QUIET',             // 0–24
  SUSPICIOUS = 'SUSPICIOUS',   // 25–49
  ALERT = 'ALERT',             // 50–74
  HUNTED = 'HUNTED',           // 75–100
}

/**
 * Authored heat delta presets (only content may change heat).
 * Mandatory paths normally use 0; optional rewards raise heat.
 */
export enum HeatPreset {
  NONE = 0,
  SMALL = 5,
  VALUABLE = 10,
  GRAND = 20,
  JACKPOT = 30,
  COOL_SMALL = -5,
  COOL_VALUABLE = -10,
  COOL_GRAND = -20,
}

/** Voluntary / forced move direction relative to engagement. */
export enum RangeMoveDirection {
  APPROACH = 'APPROACH', // toward CLOSE
  RETREAT = 'RETREAT',   // toward LONG
}

export enum RangeMoveSubject {
  SELF = 'SELF',
  FOE = 'FOE',
  BOTH = 'BOTH',
}

export enum RangeMoveTrigger {
  VOLUNTARY = 'VOLUNTARY',
  PUSH = 'PUSH',
  PULL = 'PULL',
  OTHER = 'OTHER',
}

/**
 * Future range-reaction definition (infra only this delivery — empty registry).
 * Skills/items are not yet adapted.
 */
export interface RangeReactionDef {
  id: string;
  trigger: RangeMoveTrigger;
  subject: RangeMoveSubject;
  /** Extra AP cost when reaction fires (optional). */
  apSurcharge?: number;
  /** Optional damage payload using F1 damage contract. */
  baseDamage?: number;
  scalingPerPoint?: number;
  scalingStat?: PrimaryStat;
  damageType?: DamageType;
  safeMovement?: boolean;
}

// ============================================================================
// PRIMARY ATTRIBUTES INTERFACE
// ============================================================================
export interface PrimaryAttributes {
  // THE BODY
  willpower: number;    // Grit, survival instinct
  chakra: number;       // Raw energy capacity
  strength: number;     // Physical conditioning

  // THE MIND
  spirit: number;       // Nature affinity
  intelligence: number; // Tactical acumen
  calmness: number;     // Mental fortitude

  // THE TECHNIQUE
  speed: number;        // Reflexes and flow
  accuracy: number;     // Precision and marksmanship
  dexterity: number;    // Lethal precision
}

// ============================================================================
// DERIVED STATS - Calculated from Primary Attributes
// ============================================================================
export interface DerivedStats {
  // Resource Pools
  maxHp: number;
  currentHp: number;
  maxChakra: number;
  currentChakra: number;

  // Regeneration (per turn)
  hpRegen: number;
  chakraRegen: number;

  // DEFENSE - Flat (subtracts from damage before %)
  physicalDefenseFlat: number;
  elementalDefenseFlat: number;
  mentalDefenseFlat: number;

  // DEFENSE - Percentage (damage reduction after flat)
  physicalDefensePercent: number;   // 0-1 scale
  elementalDefensePercent: number;  // 0-1 scale
  mentalDefensePercent: number;     // 0-1 scale

  // Status & Survival
  statusResistance: number;   // % chance to resist debuffs
  gutsChance: number;         // % chance to survive lethal blow at 1 HP
  
  // Offensive - attacker-side impact contribution (display / legacy).
  // Live hit uses single impact vs defender SPEED in StatSystem.calculateDamage.
  meleeHitRate: number;       // ~90 + 6×SPEED (no defender)
  rangedHitRate: number;      // ~90 + 6×ACCURACY (no defender)

  /** @deprecated Dual evasion removed — always 0. Kept for UI compatibility. */
  evasion: number;

  // Critical Strikes
  critChance: number;         // % chance to crit
  critDamageMelee: number;    // Multiplier for melee crits
  critDamageRanged: number;   // Multiplier for ranged crits (Accuracy bonus)

  // Initiative (turn order in combat)
  initiative: number;

  // Action economy: min(9, 3 + floor((SPEED − 1) / 2))
  actionPointsPerTurn: number;
}

// ============================================================================
// COMBINED CHARACTER STATS
// ============================================================================
export interface CharacterStats {
  primary: PrimaryAttributes;
  derived: DerivedStats;
  effectivePrimary: PrimaryAttributes;
  equipmentBonuses?: ItemStatBonus;
  /** Present when stats come from getPlayerFullStats (player passives) */
  passiveBonuses?: PassiveBonuses;
}

// Legacy Attributes interface for backward compatibility during migration
export interface Attributes {
  hp: number;
  maxHp: number;
  chakra: number;
  maxChakra: number;
  // Map old stats to new
  str: number;      // -> strength
  int: number;      // -> intelligence
  spd: number;      // -> speed
  def: number;      // Deprecated - split into strength/spirit/calmness
  gen: number;      // -> calmness (genjutsu defense)
  acc: number;      // -> accuracy
  // New stats (added for transition)
  willpower?: number;
  spirit?: number;
  dexterity?: number;
  calmness?: number;
}

// ============================================================================
// CLANS & ELEMENTS
// ============================================================================
export enum Clan {
  UZUMAKI = 'Uzumaki',
  UCHIHA = 'Uchiha',
  HYUGA = 'Hyuga',
  LEE = 'Lee Disciple',
  YAMANAKA = 'Yamanaka'
}

export enum Rarity {
  BROKEN = 'Broken',      // Lowest tier - drops from treasure/enemies
  COMMON = 'Common',      // Upgraded from 2x Broken (same type)
  RARE = 'Rare',          // Synthesized from 2x Common (any types)
  EPIC = 'Epic',          // Upgraded from 2x Rare Artifact (same)
  LEGENDARY = 'Legendary',
  CURSED = 'Cursed'
}

// Treasure quality determines what tier of items drop from treasure rooms
export enum TreasureQuality {
  BROKEN = 'Broken',   // Default starting tier
  COMMON = 'Common',   // Upgraded quality
  RARE = 'Rare'        // Highest upgradeable quality
}

export enum SkillTier {
  // Jutsu Card Tier System (Part 1 Naruto)
  // Based on ninja rank and INT requirements
  BASIC = 'Basic',           // E-D rank, INT 0-6, Academy fundamentals
  ADVANCED = 'Advanced',     // C-B rank, INT 8-12, Chunin-level techniques
  HIDDEN = 'Hidden',         // B-A rank, INT 14-18, Jonin/Clan secrets
  FORBIDDEN = 'Forbidden',   // A-S rank, INT 16-20, Dangerous techniques
  KINJUTSU = 'Kinjutsu'      // S+ rank, INT 20-24, Ultimate forbidden
}

// ============================================================================
// ACTION TYPE SYSTEM - Card category for the AP economy (T-004 / card-combat plan)
// ============================================================================
// Combat spends Action Points (AP) per card; the turn ends when AP is exhausted
// (or the player ends turn). MAIN/SIDE collapsed into ACTIVE — AP is authored
// per skill via Skill.apCost (fallback defaults in combatCards.ts).
export enum ActionType {
  ACTIVE = 'Active',   // Playable combat cards (attacks, utility, setup)
  TOGGLE = 'Toggle',   // Stance skills: pay AP to activate, upkeep each turn
  PASSIVE = 'Passive'  // Always active, never played as a card (0 AP)
}

// ============================================================================
// CARD ROLE / MODE / MARK CONTRACTS (T-001 — SOUL §5 + §13)
// ============================================================================
// First-class taxonomy for hand-playable techniques. `cardRole` is the
// normative role source once authored. Missing `cardRole` is incomplete
// authoring — never infer SUPPORT/MODE/SIDE/ATTACK from expected damage.

/** Hand-playable technique role. UI label for SIDE_ATTACK is “SIDE”. */
export enum CardRole {
  SUPPORT = 'SUPPORT',
  MODE = 'MODE',
  SIDE_ATTACK = 'SIDE_ATTACK',
  ATTACK = 'ATTACK',
}

/** Target scope for Mode enhancements / Main-attack contracts (SOUL §13). */
export enum TargetScope {
  MAIN_ATTACK = 'MAIN_ATTACK',
  ATTACK = 'ATTACK',
  SIDE_ATTACK = 'SIDE_ATTACK',
  OFFENSIVE_SKILL = 'OFFENSIVE_SKILL',
}

/**
 * Combinable skill tags — not a fifth role. TOOL is a tag, never a CardRole.
 * Elemental / clan members mirror existing ElementType / Clan; no new mechanics.
 */
export enum SkillTag {
  TOOL = 'TOOL',
  WEAPON = 'WEAPON',
  TAIJUTSU = 'TAIJUTSU',
  NINJUTSU = 'NINJUTSU',
  GENJUTSU = 'GENJUTSU',
  MODE = 'MODE',
  MARK = 'MARK',
  DISCOVER = 'DISCOVER',
  MULTI_HIT = 'MULTI_HIT',
  PASSIVE = 'PASSIVE',
  SIGNATURE = 'SIGNATURE',
  FIRE = 'FIRE',
  WIND = 'WIND',
  LIGHTNING = 'LIGHTNING',
  EARTH = 'EARTH',
  WATER = 'WATER',
  PHYSICAL = 'PHYSICAL',
  MENTAL = 'MENTAL',
  UZUMAKI = 'UZUMAKI',
  UCHIHA = 'UCHIHA',
  HYUGA = 'HYUGA',
  LEE = 'LEE',
  YAMANAKA = 'YAMANAKA',
}

export enum CombatActor {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
}

export enum MarkConsumeTiming {
  ATTEMPT = 'ATTEMPT',
  IMPACT = 'IMPACT',
  NONE = 'NONE',
}

/** SOUL §9 v1 families. Marks sit beside Buffs; they never rewrite Room Terrain. */
export enum MarkFamily {
  DOT = 'DOT',
  SHIELD = 'SHIELD',
  STAT = 'STAT',
  HARD_CONTROL = 'HARD_CONTROL',
}

/** Stub trigger names for Mark / Mode contracts. Runtime wiring is later T-XXX. */
export enum CombatTrigger {
  ON_PLAY = 'ON_PLAY',
  ON_HIT = 'ON_HIT',
  ON_MOVE = 'ON_MOVE',
}

export enum ModeEndKind {
  PAYOFF = 'PAYOFF',
  MANUAL_OFF = 'MANUAL_OFF',
  ZERO_CHARGES = 'ZERO_CHARGES',
  UPKEEP_FAIL = 'UPKEEP_FAIL',
  FAMILY_REPLACE = 'FAMILY_REPLACE',
  FINISHER = 'FINISHER',
}

export interface TypedCost {
  ap?: number;
  chakra?: number;
  hp?: number;
}

export interface WeightModifier {
  skillId?: string;
  tag?: SkillTag;
  role?: CardRole;
  delta: number;
}

export interface EnhancementRule {
  targetScope: TargetScope;
  note: string;
}

export interface ModeEndClause {
  kind: ModeEndKind;
}

export interface DiscoverSpec {
  count: number;
  tag?: SkillTag;
  element?: ElementType;
}

/** Forced engagement shift authored on a skill (T-023 SIDE tools). */
export type BandMoveKind = 'PULL' | 'PUSH' | 'SELF_RETREAT' | 'SELF_APPROACH';

export interface BandMoveSpec {
  kind: BandMoveKind;
  steps?: number;
}

export interface MarkSpec {
  id: string;
  duration: number;
  stacks?: number;
  consume?: MarkConsumeTiming;
  trigger?: CombatTrigger;
  /** Apply stacks once per landed hit (Air Palm Chakra Point). */
  perHit?: boolean;
  family?: MarkFamily;
  /** Default enemy (T-023/T-026). Rotation shield/reflect uses self. */
  targetActor?: 'self' | 'enemy';
}

export interface ModeInteraction {
  modeId?: string;
  family?: string;
  consumeCharges?: number;
  requireOn?: boolean;
  /** Additive damage mult when that Mode is ON (Rasengan clones = 0.5). */
  damageMultBonus?: number;
  /** Extra independent hits when that Mode is ON and consume succeeds (Barrage = 2). */
  bonusHits?: number;
  /** Spend every remaining charge of modeId at attempt (Peacock). */
  consumeAllCharges?: boolean;
  /** Additive damage mult per remaining charge before spend (Peacock = 0.15). */
  damagePerChargeBonus?: number;
  /** Mode ON bonus also requires this enemy mark id (Twin Lion = chakra_point). */
  requireMarkId?: string;
  /** Extra legal bands while Mode is ON and consumeCharges can be paid (Chidori MEDIUM). */
  grantRanges?: CombatRange[];
}

export interface ModeDefinition {
  id: string;
  family: string;
  stage?: number;
  maxCharges: number;
  activationCost: TypedCost;
  upkeep: TypedCost;
  cooldown: number;
  weightModifiers: WeightModifier[];
  enhancements: EnhancementRule[];
  endClauses: ModeEndClause[];
}

/** Mode machine states (T-005). OFF/READY are implicit when the instance is absent. */
export enum ModeRuntimeState {
  ACTIVATION = 'ACTIVATION',
  ON = 'ON',
  FIN = 'FIN',
  COOLDOWN = 'COOLDOWN',
}

/** Live Mode instance on the encounter board (T-002 / T-005). */
export interface ActiveModeRuntime {
  id: string;
  family: string;
  charges: number;
  /** Authored Mode CD; used when upkeep fails and the Mode ends. */
  cooldown?: number;
  readyOnTurn?: number;
  state?: ModeRuntimeState;
  stage?: number;
}

export interface Mark {
  id: string;
  sourceSkillId: string;
  owner: CombatActor;
  target: CombatActor;
  duration: number;
  stacks: number;
  family?: MarkFamily;
  trigger?: CombatTrigger;
  consume?: MarkConsumeTiming;
}

/**
 * Out-of-combat Skill Config (not CombatSetup).
 * `mainAttackId` is a designated ATTACK skill id, or null until resolved.
 */
export interface SkillConfig {
  mainAttackId: string | null;
  modeUpkeepPriority: string[];
}

// ============================================================================
// POSTURE SYSTEM (T-004 — deckbuilder / Action Point combat refactor)
// ============================================================================
// The combatant's active stance. Posture biases the weighted card draw and
// applies a light damage/defense modifier. Switching posture costs AP; some
// skills shift posture for free on hit (see Skill.stanceShift).
export enum Posture {
  AGGRESSIVE = 'Aggressive', // Favors offensive cards in the draw
  BALANCED = 'Balanced',     // Neutral draw weighting (default)
  DEFENSIVE = 'Defensive'    // Favors utility/defensive cards in the draw
}

// Legacy ItemSlot - kept for migration compatibility
export enum ItemSlot {
  WEAPON = 'Weapon',
  HEAD = 'Head',
  BODY = 'Body',
  ACCESSORY = 'Accessory'
}

// ============================================================================
// SYNTHESIS SYSTEM - TFT-Style Component Crafting
// ============================================================================

// 4 Generic equipment slots (replaces typed slots)
export enum EquipmentSlot {
  SLOT_1 = 'Slot1',
  SLOT_2 = 'Slot2',
  SLOT_3 = 'Slot3',
  SLOT_4 = 'Slot4',
}

// Map legacy ItemSlot to EquipmentSlot for backwards compatibility
export const SLOT_MAPPING: Record<ItemSlot, EquipmentSlot> = {
  [ItemSlot.WEAPON]: EquipmentSlot.SLOT_1,
  [ItemSlot.HEAD]: EquipmentSlot.SLOT_2,
  [ItemSlot.BODY]: EquipmentSlot.SLOT_3,
  [ItemSlot.ACCESSORY]: EquipmentSlot.SLOT_4,
};

// Drag-and-drop types for inventory management
export type DragSource =
  | { type: 'bag'; index: number }
  | { type: 'equipment'; slot: EquipmentSlot };

export interface DragData {
  item: Item;
  source: DragSource;
}

// Component identifiers - Naruto-themed crafting materials
export enum ComponentId {
  NINJA_STEEL = 'ninja_steel',           // +Strength (forged metal)
  SPIRIT_TAG = 'spirit_tag',             // +Spirit (ofuda/paper tags)
  CHAKRA_PILL = 'chakra_pill',           // +Chakra (soldier pills)
  IRON_SAND = 'iron_sand',               // +Willpower (Kazekage's sand)
  ANBU_MASK = 'anbu_mask',               // +Calmness (emotional control)
  TRAINING_WEIGHTS = 'training_weights', // +Dexterity (Rock Lee style)
  SWIFT_SANDALS = 'swift_sandals',       // +Speed (shinobi footwear)
  TACTICAL_SCROLL = 'tactical_scroll',   // +Intelligence (strategy guides)
  HASHIRAMA_CELL = 'hashirama_cell',     // Special - Kekkei Genkai synthesis
}

// Passive effect types for synthesized artifacts
export enum PassiveEffectType {
  // Damage over Time
  BLEED = 'bleed',
  BURN = 'burn',
  POISON = 'poison',

  // Resource manipulation
  CHAKRA_DRAIN = 'chakra_drain',
  CHAKRA_RESTORE = 'chakra_restore',
  LIFESTEAL = 'lifesteal',

  // Defensive
  REFLECT = 'reflect',
  SHIELD_ON_START = 'shield_on_start',
  INVULNERABLE_FIRST_TURN = 'invulnerable_first_turn',
  DAMAGE_REDUCTION = 'damage_reduction',
  REGEN = 'regen',
  GUTS = 'guts',

  // Offensive
  PIERCE_DEFENSE = 'pierce_defense',
  CONVERT_TO_ELEMENTAL = 'convert_to_elemental',
  EXECUTE_THRESHOLD = 'execute_threshold',
  COUNTER_ATTACK = 'counter_attack',

  // Utility
  FREE_FIRST_SKILL = 'free_first_skill',
  COOLDOWN_RESET_ON_KILL = 'cooldown_reset_on_kill',
  SEAL_CHANCE = 'seal_chance',

  // Kekkei Genkai (Hashirama Cell combinations)
  ALL_ELEMENTS = 'all_elements',
  CLAN_TRAIT_UCHIHA = 'clan_trait_uchiha',
  CLAN_TRAIT_UZUMAKI = 'clan_trait_uzumaki',
  CLAN_TRAIT_HYUGA = 'clan_trait_hyuga',
  CLAN_TRAIT_NARA = 'clan_trait_nara',
}

// Passive effect definition for artifacts
export interface PassiveEffect {
  type: PassiveEffectType;
  value?: number;          // e.g., 25 for 25% chance, 5 for 5% HP
  duration?: number;       // For DoTs/buffs in turns
  triggerCondition?: 'on_hit' | 'on_kill' | 'on_crit' | 'combat_start' | 'turn_start' | 'below_half_hp';
}

// Re-export runtime knobs from config (Sprint C — types stay schema-only eventually)
export {
  MAX_BAG_SLOTS,
  DISASSEMBLE_RETURN_RATE,
  DEFAULT_MERCHANT_SLOTS,
  MAX_MERCHANT_SLOTS,
  DEFAULT_TREASURE_QUALITY,
  STAT_FORMULAS,
} from './config';

// ============================================================================
// EFFECTS & BUFFS
// ============================================================================
export enum EffectType {
  STUN = 'Stun',
  DOT = 'DoT',
  BUFF = 'Buff',
  DEBUFF = 'Debuff',
  HEAL = 'Heal',
  DRAIN = 'Drain',
  CONFUSION = 'Confusion',
  SILENCE = 'Silence',
  BLEED = 'Bleed',        // Physical DoT
  BURN = 'Burn',          // Fire DoT
  POISON = 'Poison',      // Ignores some defense
  CHAKRA_DRAIN = 'ChakraDrain',
  
  // --- NEW EFFECTS ---
  SHIELD = 'Shield',           // Absorbs incoming damage (Temporary HP)
  INVULNERABILITY = 'Invuln',  // Takes 0 damage for duration
  CURSE = 'Curse',             // Increases damage taken by X%
  REFLECTION = 'Reflect',      // Returns % of damage taken
  REGEN = 'Regen',             // Restores HP at start of turn
  CHAKRA_REGEN = 'ChakraRegen' // Restores Chakra at start of turn
}

export interface EffectDefinition {
  type: EffectType;
  value?: number;           // Damage amount or stat multiplier
  duration: number;         // Turns (-1 for permanent/toggle)
  targetStat?: PrimaryStat; // For Buff/Debuff
  chance: number;           // 0-1 probability
  damageType?: DamageType;  // For DoT effects
  damageProperty?: DamageProperty; // For DoT effects
}

export interface Buff {
  id: string;
  name: string;
  duration: number;
  effect: EffectDefinition;
  source: string;
}

// ============================================================================
// SKILLS / JUTSU
// ============================================================================
export interface SkillRequirements {
  /** Preferred: any primary-stat floors (INT still the most common for ninjutsu). */
  stats?: Partial<Record<PrimaryStat, number>>;
  /** @deprecated Prefer stats[PrimaryStat.INTELLIGENCE]. Still checked for catalog migration. */
  intelligence?: number;
  level?: number;         // Minimum player level
  /** Hard gate only (bloodline/hiden). Omit for open-learn shared techniques. */
  clan?: Clan;
}

/**
 * Optional bonus when the player's combat posture matches `posture`.
 * MVP wires damageMultBonus; other fields are reserved infra.
 */
export interface StanceBonus {
  posture: Posture;
  /** Multiplicative: effective damageMult *= (1 + damageMultBonus). */
  damageMultBonus?: number;
  /** Reserved: reduce AP cost when matched (min 1). */
  apDiscount?: number;
  /** Reserved: add to effect apply chance. */
  effectChanceBonus?: number;
  /** Reserved: extra effects on match. */
  extraEffects?: EffectDefinition[];
}

// Passive skill effect for PASSIVE action type skills
export interface PassiveSkillEffect {
  statBonus?: Partial<PrimaryAttributes>;
  damageBonus?: number;          // % bonus to damage dealt (0.1 = +10%)
  /**
   * When set, damageBonus only applies to skills of this element.
   * When omitted, nature-element passives (FIRE/WIND/etc. skill.element)
   * auto-scope to that element; PHYSICAL/MENTAL passives stay global.
   */
  damageBonusElement?: ElementType;
  defenseBonus?: number;         // % bonus added to all percent defenses
  regenBonus?: { hp?: number; chakra?: number };  // Per-turn regeneration
  specialEffect?: string;        // Unique effect identifier
}

/**
 * Aggregated bonuses from all equipped passive skills.
 * Produced by StatSystem.aggregatePassiveSkillBonuses.
 */
export interface PassiveBonuses {
  /** Flat bonuses to primary stats (e.g., +5 Strength) */
  statBonus: Partial<PrimaryAttributes>;
  /** Percentage bonus to all outgoing damage (0.1 = +10%) */
  damageBonus: number;
  /**
   * Element-scoped damage bonuses (e.g. FIRE_AFFINITY → Fire only).
   * Applied when the attacking skill's element matches the key.
   */
  elementalDamageBonus: Partial<Record<ElementType, number>>;
  /** Percentage bonus added to all percent defenses (0.1 = +10%) */
  defenseBonus: number;
  /** Flat HP regeneration per turn (added to derived hpRegen) */
  hpRegen: number;
  /** Flat chakra regeneration per turn (added to derived chakraRegen) */
  chakraRegen: number;
}

/**
 * Typed HP cost (optional advanced form). Flat `number` on Skill is the common case.
 * - flat: pay value HP
 * - percentMax: pay floor(maxHp × fraction) where value is 0–1 or 0–100
 * - all: pay remaining HP (pair with mutualKo for Reaper)
 */
export type HpCostSpec =
  | { kind: 'flat'; value: number }
  | { kind: 'percentMax'; value: number }
  | { kind: 'all' };

export interface Skill {
  id: string;
  name: string;
  tier: SkillTier;
  description: string;

  // ACTION TYPE - ACTIVE (playable) / TOGGLE / PASSIVE
  actionType: ActionType;

  /**
   * SOUL authoring (T-001). Optional this slice so the catalog still compiles.
   * Missing `cardRole` is incomplete authoring — never guess from DPS / baseDamage.
   */
  cardRole?: CardRole;
  tags?: SkillTag[];
  /** v1 default is 2 via `defaultBaseWeight()` when omitted. Not CARD_BASE_WEIGHT (1.0). */
  baseWeight?: number;
  hitCount?: number;
  discover?: DiscoverSpec;
  markEffects?: MarkSpec[];
  /** Forced band shift after resolve (Wire PULL / Blastback PUSH / Backstep retreat). */
  bandMove?: BandMoveSpec;
  modeInteraction?: ModeInteraction;
  perHitEffects?: EffectDefinition[];

  // DECKBUILDER / AP ECONOMY (T-004)
  // Prefer explicit apCost on every playable skill; fallback in combatCards.ts.
  apCost?: number;               // Action Point cost to play this card
  stanceShift?: Posture;         // If set, playing this card shifts posture (free)
  stanceBonus?: StanceBonus;     // Optional reward when posture matches

  // Costs
  chakraCost: number;
  /** Flat HP toll. Use mutualKo for sacrifice-all techniques (Reaper). */
  hpCost: number;

  // Cooldown
  cooldown: number;
  currentCooldown: number;
  /**
   * Absolute player-turn index when this skill becomes playable (T-002).
   * Used on turn T with authored N → readyOnTurn = T + N + 1.
   * Omit or 0 = ready. Normative readiness is `isSkillReadyOnTurn`; do not infer from DPS.
   */
  readyOnTurn?: number;

  // Damage Calculation (F1): raw = baseDamage + scalingPerPoint × effectivePrimary[scalingStat]
  baseDamage: number;
  scalingPerPoint: number;
  scalingStat: PrimaryStat;     // Which stat scales the damage
  damageType: DamageType;       // Physical/Elemental/Mental/True
  damageProperty: DamageProperty; // Normal/Piercing/ArmorBreak
  attackMethod: AttackMethod;   // Melee/Ranged/Auto

  /** Explicit mutual KO (Reaper Death Seal). Both actors defeated without damage pipeline. */
  mutualKo?: boolean;

  /**
   * Optional override of range bands where this skill can be used.
   * When omitted, defaults from AttackMethod (MELEE CLOSE; RANGED MEDIUM+LONG; AUTO all).
   */
  allowedRanges?: CombatRange[];

  // Element (for elemental interactions)
  element: ElementType;

  // Toggle Skills (like Sharingan)
  isToggle?: boolean;
  isActive?: boolean;
  upkeepCost?: number;

  // Effects applied on hit
  effects?: EffectDefinition[];

  // Bonuses
  critBonus?: number;           // Extra % crit chance
  penetration?: number;         // % defense ignored (0-1)

  // Requirements
  requirements?: SkillRequirements;

  // Passive skill effect (for PASSIVE action type)
  passiveEffect?: PassiveSkillEffect;

  // Upgrade tracking
  level?: number;

  // Visual
  image?: string;
  icon?: string;                // Emoji/icon for quick reference
}

// ============================================================================
// ITEMS & EQUIPMENT
// ============================================================================
export interface ItemStatBonus {
  // Primary stat bonuses
  willpower?: number;
  chakra?: number;
  strength?: number;
  spirit?: number;
  intelligence?: number;
  calmness?: number;
  speed?: number;
  accuracy?: number;
  dexterity?: number;
  
  // Direct derived stat bonuses (rare items)
  flatHp?: number;
  flatChakra?: number;
  flatPhysicalDef?: number;
  flatElementalDef?: number;
  flatMentalDef?: number;
  percentPhysicalDef?: number;
  percentElementalDef?: number;
  percentMentalDef?: number;
  critChance?: number;
  critDamage?: number;
}

export interface Item {
  id: string;
  name: string;
  type?: ItemSlot;           // Legacy: typed slot (optional for components/artifacts)
  rarity: Rarity;
  stats: ItemStatBonus;
  value: number;
  description?: string;
  requirements?: SkillRequirements;

  // Synthesis system fields
  isComponent: boolean;                    // true = basic component, false = artifact/legacy item
  componentId?: ComponentId;               // Only for components
  recipe?: [ComponentId, ComponentId];     // Only for artifacts - the components used to craft
  passive?: PassiveEffect;                 // Only for artifacts - special effect
  icon?: string;                           // Emoji or icon identifier for display
}

// ============================================================================
// PLAYER & ENEMY
// ============================================================================
export interface Player {
  clan: Clan;
  level: number;
  exp: number;
  maxExp: number;

  // Stats
  primaryStats: PrimaryAttributes;
  /**
   * Unspent level-up points. Each level grants exactly 1.
   * Must reach 0 via mandatory assign modal before continuing play;
   * full HP/Chakra refill only after all points are spent.
   */
  unspentStatPoints: number;

  // Resources (tracked separately from derived for current values)
  currentHp: number;
  currentChakra: number;

  // Flavor
  element: ElementType;
  ryo: number;

  // Loadout - 4 generic equipment slots (synthesis system)
  equipment: Record<EquipmentSlot, Item | null>;
  skills: Skill[];
  /**
   * Out-of-combat Skill Config (T-013). Missing on old saves → treat as
   * `{ mainAttackId: null, modeUpkeepPriority: [] }` then `ensureMainAttack`.
   */
  skillConfig?: SkillConfig;
  activeBuffs: Buff[];

  // Bag - 12 fixed slots for components and artifacts
  bag: (Item | null)[];  // Fixed 12-slot array (null = empty slot)

  // Progression systems
  treasureQuality: TreasureQuality;  // What tier items drop from treasure (upgradeable)
  merchantSlots: number;              // How many items shown at merchant (1-4)
  locationsCleared: number;           // Global count of locations cleared (enemy scaling)
  /**
   * Clan bloodline track (0–5). Raised by Clan Rite scroll rooms (once per location).
   * Each level offers clan skill choices.
   */
  clanLevel: number;

  // Event Engine 2.0 (T-008): persistent narrative flags for the current run.
  // Set by event outcomes (effects.setFlags), read by event/choice gating
  // (requiresFlags/excludesFlags). Values are counters (0 = unset/absent).
  eventFlags: Record<string, number>;

  /**
   * Preferred pre-combat approach (HUD). Applied automatically to every
   * encounter until changed. Falls back to FRONTAL_ASSAULT when unavailable
   * for a given room (terrain, elite/boss, missing stats).
   */
  preferredApproach: ApproachType;
}

export interface Enemy {
  name: string;
  tier: string;

  // Stats
  primaryStats: PrimaryAttributes;
  currentHp: number;
  currentChakra: number;

  // Combat
  element: ElementType;
  skills: Skill[];
  activeBuffs: Buff[];

  // Flags
  isBoss?: boolean;
  /** F3: EXIT Hunter (armed heat 100 upgrade of Guardian). */
  isHunter?: boolean;
  image?: string;
  dropRateBonus?: number;
  /** F3: XP/Ryo multiplier for special foes (Hunter = 2). */
  rewardMultiplier?: number;

  // Presentation (T-014)
  /** Archetype key: 'TANK' | 'ASSASSIN' | 'BALANCED' | 'CASTER' | 'GENJUTSU' */
  archetype?: string;
  /** Danger level (1-7) at which this enemy was generated — used for Lv. N badge. */
  dangerLevel?: number;
  /**
   * Preferred engagement band (F2). When omitted, derived from archetype.
   * Bosses/specials may override.
   */
  preferredRange?: CombatRange;

  // Telegraph (A-003) — next skill intent for UI / combat log
  /** Skill id the enemy intends to use on its next action. */
  intendedSkillId?: string;
  /** Display name of the telegraphed skill. */
  intendedSkillName?: string;
  /** AI reason for the telegraphed skill (debug / log). */
  intentReason?: string;
}

// ============================================================================
// COMBAT RESULT
// ============================================================================
export interface DamageResult {
  rawDamage: number;          // Before any mitigation
  flatReduction: number;      // Damage blocked by flat defense
  percentReduction: number;   // Damage blocked by % defense
  finalDamage: number;        // After all mitigation
  isCrit: boolean;
  isMiss: boolean;
  isEvaded: boolean;
  elementMultiplier: number;
  gutsTriggered?: boolean;    // Did target survive via Guts?
}

// ============================================================================
// GAME EVENTS & ROOMS
// ============================================================================
export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'danger' | 'gain' | 'event';
  details?: string;
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================
export enum RiskLevel {
  SAFE = 'SAFE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EXTREME = 'EXTREME'
}

export interface RequirementCheck {
  minStat?: { stat: PrimaryStat; value: number };
  requiredClan?: Clan;
}

export interface EventCost {
  ryo?: number;
}

export interface EventOutcome {
  weight: number; // Probability weight (sum should = 100 across outcomes)

  effects: {
    // Stats & progression
    statChanges?: Partial<PrimaryAttributes>;
    exp?: number;
    ryo?: number;

    // HP/Chakra changes
    hpChange?: number | { percent: number };
    chakraChange?: number | { percent: number };

    // Persistent buffs
    buffs?: Buff[];

    // Player progression upgrades
    upgradeTreasureQuality?: boolean; // Permanently upgrade treasure quality (BROKEN → COMMON → RARE)
    addMerchantSlot?: boolean; // Add a merchant slot
    intelGain?: number; // Intel gained from this outcome (0-40 range)

    // Combat triggers
    // archetype = combat build (TANK/ASSASSIN/BALANCED/CASTER/GENJUTSU)
    // enemyType = tier for scaling (NORMAL/ELITE/BOSS/AMBUSH); defaults to NORMAL
    triggerCombat?: {
      floor: number;
      difficulty: number;
      archetype: string;
      name?: string;
      enemyType?: 'NORMAL' | 'ELITE' | 'BOSS' | 'AMBUSH';
    };

    // --- Event Engine 2.0 (T-008) — all optional, additive ---
    // Chain into another event: after this outcome resolves, open the event
    // whose GameEvent.id === chainTo instead of returning to exploration.
    chainTo?: string;
    // Persistent run flags written into player.eventFlags (immutable merge).
    setFlags?: Record<string, number>;
    // Grant a skill to the loadout, looked up by Skill.id from the SKILLS table.
    grantSkillById?: string;
    // Brand the player with a curse (damage-amplification Buff added to
    // activeBuffs). value = extra damage taken fraction (default 0.5),
    // duration = turns it persists into combat (default 3).
    curse?: { value?: number; duration?: number };
    // Remove one random item from the player's bag (uses the game PRNG).
    removeRandomItem?: boolean;

    /**
     * F3: authored visit heat delta for this outcome (presets 0/±5/±10/±20/+30).
     * Omitted = 0 (mandatory/neutral path).
     */
    heatDelta?: number;

    // Logging
    logMessage: string;
    logType: 'gain' | 'danger' | 'info' | 'loot';
  };
}

export interface EventChoice {
  label: string;
  description: string;

  // Risk indicator (shown to player)
  riskLevel: RiskLevel;
  hintText?: string; // Vague clue about outcome

  // Requirements (choice disabled if not met)
  requirements?: RequirementCheck;

  // Event Engine 2.0 (T-008): flag gating. The choice is only offered when
  // every requiresFlags entry is met (flag >= value) and no excludesFlags
  // entry is met (flag < value). Optional → existing choices are unaffected.
  requiresFlags?: Record<string, number>;
  excludesFlags?: Record<string, number>;

  // Costs (paid upfront)
  costs?: EventCost;

  // Multiple outcomes with weighted probability
  outcomes: EventOutcome[];
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  /**
   * Optional one-line mystery tag under the title (Event UI).
   * Keep short — pressure, not exposition.
   */
  mysteryFlavor?: string;
  allowedArcs?: string[]; // Story arcs where this event can occur
  // Weights how often this event surfaces vs its peers in the same arc pool
  // (T-016). Rarer tiers appear less; see EVENT_RARITY_WEIGHTS + selectWeightedEvent.
  // Omitted → treated as COMMON.
  rarity?: Rarity;
  // Event Engine 2.0 (T-008): flag gating for event eligibility. An event is
  // only offered when every requiresFlags entry is met (flag >= value) and no
  // excludesFlags entry is met (flag < value). Optional → additive.
  requiresFlags?: Record<string, number>;
  excludesFlags?: Record<string, number>;
  choices: EventChoice[];
}

// STAT_FORMULAS lives in ./statFormulas (re-exported via ./config above)

// ============================================================================
// TERRAIN & EXPLORATION
// ============================================================================

export enum TerrainType {
  // Academy Biome
  OPEN_GROUND = 'OPEN_GROUND',
  ROOFTOPS = 'ROOFTOPS',
  TRAINING_FIELD = 'TRAINING_FIELD',
  ALLEYWAY = 'ALLEYWAY',

  // Waves Biome
  FOG_BANK = 'FOG_BANK',
  BRIDGE = 'BRIDGE',
  WATER_SURFACE = 'WATER_SURFACE',
  SHORELINE = 'SHORELINE',

  // Forest of Death Biome
  DENSE_FOLIAGE = 'DENSE_FOLIAGE',
  TREE_CANOPY = 'TREE_CANOPY',
  SWAMP = 'SWAMP',
  GIANT_ROOTS = 'GIANT_ROOTS',

  // Valley of the End Biome
  WATERFALL = 'WATERFALL',
  CLIFF_EDGE = 'CLIFF_EDGE',
  STONE_PILLARS = 'STONE_PILLARS',
  RAPIDS = 'RAPIDS',

  // War Arc Biome
  ROOT_NETWORK = 'ROOT_NETWORK',
  CORRUPTED_ZONE = 'CORRUPTED_ZONE',
  CHAKRA_NEXUS = 'CHAKRA_NEXUS',
  VOID_SPACE = 'VOID_SPACE'
}

export enum ApproachType {
  FRONTAL_ASSAULT = 'FRONTAL_ASSAULT',   // Direct combat, no modifiers
  STEALTH_AMBUSH = 'STEALTH_AMBUSH',     // Sneak attack, first hit 1.5x + initiative (DEX path)
  GENJUTSU_SETUP = 'GENJUTSU_SETUP',     // Mental trap, enemy confused
  ENVIRONMENTAL_TRAP = 'ENVIRONMENTAL',   // Use terrain, enemy loses HP
  IRON_GUARD = 'IRON_GUARD',             // Willpower fortify — shield + defensive open
  SHADOW_BYPASS = 'SHADOW_BYPASS'        // Skip combat entirely (rare)
}

// ============================================================================
// TERRAIN DEFINITIONS
// ============================================================================

export interface TerrainEffects {
  // Exploration effects
  stealthModifier: number;        // +/- to stealth approach chance
  visibilityRange: number;        // How many nodes ahead player can see (1-3)
  hiddenRoomBonus: number;        // % bonus to finding hidden rooms
  movementCost: number;           // Multiplier (1.0 = normal, 1.5 = slow)

  // Combat effects
  initiativeModifier: number;     // +/- to initiative
  evasionModifier: number;        // +/- to evasion (as decimal, e.g., 0.10 = +10%)
  elementAmplify?: ElementType;   // Element boosted by 25%
  elementAmplifyPercent?: number; // Custom amplify amount

  // Hazards (applied each turn in combat)
  hazard?: {
    type: 'DAMAGE' | 'CHAKRA_DRAIN' | 'POISON' | 'FALL';
    value: number;
    chance: number;              // 0-1 probability per turn
    affectsPlayer: boolean;
    affectsEnemy: boolean;
  };
}

export interface TerrainDefinition {
  id: TerrainType;
  name: string;
  description: string;
  biome: string;
  effects: TerrainEffects;
}

// ============================================================================
// APPROACH DEFINITIONS
// ============================================================================

export interface ApproachRequirements {
  /** Primary gate (legacy single-stat). Prefer minStats for multi-gates. */
  minStat?: { stat: PrimaryStat; value: number };
  /** All listed stats must meet thresholds (e.g. Silent Strike: DEX + Speed). */
  minStats?: Array<{ stat: PrimaryStat; value: number }>;
  requiredSkill?: string;         // Skill ID required
  allowedTerrains?: TerrainType[]; // Only available on these terrains
}

export interface ApproachSuccessCalc {
  baseChance: number;             // Starting success rate
  scalingStat: PrimaryStat;       // Which stat increases success
  scalingFactor: number;          // % added per stat point
  terrainBonus: boolean;          // Whether terrain stealth modifier applies
  maxChance: number;              // Cap (usually 95)
}

export interface ApproachEffects {
  // Turn order
  initiativeBonus: number;
  guaranteedFirst: boolean;

  // First hit bonus
  firstHitMultiplier: number;     // 2.0 for stealth ambush

  // Buffs/Debuffs
  playerBuffs: EffectDefinition[];
  enemyDebuffs: EffectDefinition[];

  // Special
  skipCombat: boolean;            // For bypass
  enemyHpReduction: number;       // % HP removed pre-fight (0-1)

  // Costs
  chakraCost: number;
  hpCost: number;

  // XP modifier
  xpMultiplier: number;           // 1.0 = 100%, 1.15 = 115%

  /**
   * F3: heat applied when this effect block is used.
   * Success paths use 0; fail paths use approach fail deltas.
   */
  heatDelta?: number;
}

export interface ApproachOption {
  type: ApproachType;
  name: string;
  description: string;

  requirements: ApproachRequirements;
  successCalc: ApproachSuccessCalc;

  // Effects on success
  successEffects: ApproachEffects;

  // Effects on failure (reverts to frontal-like)
  failureEffects?: Partial<ApproachEffects>;
}

// ============================================================================
// ROOM TYPE CONTENT
// ============================================================================

export interface ShrineBlessing {
  id: string;
  name: string;
  description: string;

  requirement?: { stat: PrimaryStat; value: number };

  effect: {
    permanentStatBonus?: Partial<PrimaryAttributes>;
    tempBuff?: Buff;
    healPercent?: number;
    chakraRestorePercent?: number;
  };

  cost?: {
    hp?: number;
    chakra?: number;
    ryo?: number;
  };
}

export interface TrainingOption {
  id: string;
  name: string;
  targetStat: PrimaryStat;

  // Training intensity
  intensity: 'LIGHT' | 'MODERATE' | 'INTENSE' | 'EXTREME';

  // Requirements
  willpowerRequired: number;

  // Costs
  hpCost: number;
  chakraCost: number;

  // Reward
  statGain: number;               // Permanent stat increase
}

export interface TrialDefinition {
  id: string;
  name: string;
  description: string;

  // Challenge type
  challengeType: 'ENDURANCE' | 'PRECISION' | 'WILLPOWER' | 'SPEED' | 'WISDOM';
  primaryStat: PrimaryStat;
  secondaryStat?: PrimaryStat;

  // Thresholds
  threshold: number;              // Pass/fail line

  // Rewards
  passReward: {
    exp?: number;
    statBonus?: Partial<PrimaryAttributes>;
    skill?: Skill;
    item?: Item;
  };

  failPenalty: {
    hpLoss?: number;
    debuff?: Buff;
  };
}

// ============================================================================
// COMBAT SETUP (Terrain + Approach modifiers)
// ============================================================================

export interface CombatSetup {
  terrain: TerrainType;
  terrainEffects: TerrainEffects;

  approach: ApproachType;
  approachSuccess: boolean;

  // Calculated modifiers for combat
  playerModifiers: {
    initiativeBonus: number;
    firstHitMultiplier: number;
    evasionBonus: number;
    precompatBuffs: Buff[];
  };

  enemyModifiers: {
    hpReductionPercent: number;
    initialDebuffs: Buff[];
  };

  // Environment
  activeHazards: TerrainEffects['hazard'][];
  elementAmplification?: { element: ElementType; percent: number };

  // XP/Loot modifiers
  xpMultiplier: number;
  lootMultiplier: number;
  wasHiddenRoom: boolean;
}

// ============================================================================
// BRANCHING ROOM EXPLORATION SYSTEM
// ============================================================================

export enum BranchingRoomType {
  START = 'START',           // Entry room (always cleared)
  VILLAGE = 'VILLAGE',       // Settlement with merchant/NPCs
  OUTPOST = 'OUTPOST',       // Military post with combat + weapon merchant
  SHRINE = 'SHRINE',         // Sacred place with blessings
  CAMP = 'CAMP',             // Resting spot with training
  RUINS = 'RUINS',           // Ancient location with treasure/traps
  BRIDGE = 'BRIDGE',         // Chokepoint with toll/guardian
  BOSS_GATE = 'BOSS_GATE',   // Exit room with semi-boss
  FOREST = 'FOREST',         // Wild area with ambush chance
  CAVE = 'CAVE',             // Underground with hidden treasure
  BATTLEFIELD = 'BATTLEFIELD' // Combat-focused area
}

export enum CombatModifierType {
  NONE = 'NONE',
  AMBUSH = 'AMBUSH',             // Enemy goes first
  PREPARED = 'PREPARED',         // Player gets +20% damage first turn
  SANCTUARY = 'SANCTUARY',       // Player healed 20% before fight
  CORRUPTED = 'CORRUPTED',       // Both take poison damage per turn
  TERRAIN_SWAMP = 'TERRAIN_SWAMP',     // -10 Speed for all
  TERRAIN_FOREST = 'TERRAIN_FOREST',   // +15% evasion
  TERRAIN_CLIFF = 'TERRAIN_CLIFF'      // Miss = 10% fall damage
}

export type RoomTier = 0 | 1 | 2;
// Position types for rooms in the branching structure
// Base: CENTER, LEFT, RIGHT for tier 0-1
// Children: CHILD_0/CHILD_1 for the 2-child branching pattern
export type RoomPosition =
  | 'LEFT' | 'RIGHT' | 'CENTER'
  | 'LEFT_OUTER' | 'LEFT_INNER' | 'RIGHT_INNER' | 'RIGHT_OUTER'
  | 'CHILD_0' | 'CHILD_1';

// Activity interfaces for multi-activity rooms
export interface CombatActivity {
  enemy: Enemy;
  modifiers: CombatModifierType[];
  completed: boolean;
}

export interface MerchantActivity {
  items: Item[];
  discountPercent?: number;
  completed: boolean;
}

export interface EventActivity {
  definition: GameEvent;
  completed: boolean;
}

export interface RestActivity {
  healPercent: number;
  chakraRestorePercent: number;
  completed: boolean;
}

/** Resource paid for one training offer (each session has one offer per type). */
export type TrainingCostType = 'hp' | 'chakra' | 'ryo';

/** One of three regimens offered at a training ground. */
export interface TrainingOffer {
  stat: PrimaryStat;
  costType: TrainingCostType;
  cost: number;
  gain: number;
  /** F3: heat for claiming this optional training (jackpot typically +5..+10). */
  heatDelta?: number;
}

export interface TrainingActivity {
  options: TrainingOffer[]; // length 3 — pick one
  completed: boolean;
  selectedStat?: PrimaryStat;
  selectedCostType?: TrainingCostType;
}

// ============================================================================
// TREASURE SYSTEM TYPES
// ============================================================================

export enum TreasureType {
  LOCKED_CHEST = 'LockedChest',      // Vault path (open with chakra → pick 1 of 3)
  TREASURE_HUNTER = 'TreasureHunter' // Same vault + optional free map-piece path
}

export interface TreasureChoice {
  item: Item;
  isArtifact: boolean;
}

/** One face in the vault offer (mixed reward pool). */
export type VaultRewardKind = 'item' | 'hp' | 'ryo' | 'scroll';

export interface VaultRewardOption {
  kind: VaultRewardKind;
  /** Sealed until player pays reveal cost (or open bulk). */
  revealed: boolean;
  item?: Item;
  isArtifact?: boolean;
  /** Flat HP restore */
  hpAmount?: number;
  /** Flat ryo grant */
  ryoAmount?: number;
  /** Scroll / skill grant */
  skill?: Skill;
}

/** UI phase for Event-style treasure room */
export type TreasurePhase = 'entry' | 'vault';

export interface TreasureActivity {
  type: TreasureType;
  /** Legacy item list (kept for bag-full / compat); vaultOptions is primary. */
  choices: TreasureChoice[];
  /** Exactly 3 mixed rewards after open vault */
  vaultOptions: VaultRewardOption[];
  ryoBonus: number;                // Extra ryo when claiming an item (legacy side loot)
  /** Chakra to open the vault (enter pick phase) */
  openCost: number;
  /** Chakra to reveal one sealed face */
  revealCost: number;
  /** True after vault opened (phase vault) */
  isRevealed: boolean;
  phase: TreasurePhase;
  selectedIndex: number | null;
  collected: boolean;
  /** Free map-piece alternative (no combat) */
  mapPieceAvailable: boolean;
  /** F3: heat when claiming optional treasure (default valuable +10). */
  heatDelta?: number;
}

export interface TreasureHunt {
  isActive: boolean;
  requiredPieces: number;          // 2-4 based on danger level
  collectedPieces: number;
}

export interface InfoGatheringActivity {
  intelGain: number;        // Intel percentage gained (default 25)
  flavorText: string;       // Description of how intel is gathered
  completed: boolean;
}

/** Scroll room mode: traveling vendor vs clan bloodline rite */
export type ScrollDiscoveryMode = 'vendor' | 'clan';

export interface ScrollDiscoveryActivity {
  mode: ScrollDiscoveryMode;
  /** Vendor stock (also used empty for clan mode) */
  availableScrolls: Skill[];
  /** skillId → ryo price (vendor) */
  prices: Record<string, number>;
  /** Flat ryo to forget a skill at the vendor */
  forgetCostRyo: number;
  /** Legacy / optional chakra toll (unused for pure ryo buy) */
  cost?: { ryo?: number; chakra?: number };
  /** Clan rite: level after ascending */
  clanLevelAfter?: number;
  /** Clan rite: 2–3 skills to pick */
  clanSkillChoices?: Skill[];
  completed: boolean;
}

export interface EliteChallengeActivity {
  enemy: Enemy;      // Elite-tier enemy guardian
  artifact: Item;    // The artifact reward
  /**
   * T-108: room combat conditions (same pool as CombatActivity.modifiers).
   * Elite rooms exclude combat, so mods live here.
   */
  modifiers: CombatModifierType[];
  completed: boolean;
}

export interface RoomActivities {
  combat?: CombatActivity;
  eliteChallenge?: EliteChallengeActivity;
  merchant?: MerchantActivity;
  event?: EventActivity;
  scrollDiscovery?: ScrollDiscoveryActivity;
  rest?: RestActivity;
  training?: TrainingActivity;
  treasure?: TreasureActivity;
  infoGathering?: InfoGatheringActivity;
}

// Order in which activities are processed
export const ACTIVITY_ORDER: (keyof RoomActivities)[] = [
  'combat',          // Always first if present
  'eliteChallenge',  // Elite challenge after regular combat
  'merchant',        // Shop opens after combat
  'event',           // Story/dialogue
  'scrollDiscovery', // Jutsu scroll discovery
  'rest',            // Healing
  'training',        // Stat boost
  'treasure',        // Loot last
  'infoGathering'    // Intel gathering (+25%)
];

// ============================================================================
// WEIGHTED ACTIVITY SYSTEM
// ============================================================================

/**
 * Weight (0-100) for each activity type.
 * 0 = never appears, 100 = very likely (but not guaranteed)
 * Higher weights increase probability but don't guarantee appearance.
 */
export interface ActivityWeights {
  combat: number;
  eliteChallenge: number;
  merchant: number;
  event: number;
  scrollDiscovery: number;
  rest: number;
  training: number;
  treasure: number;
  infoGathering: number;
}

/**
 * Weights for how many activities a room type tends to have.
 * Values are relative weights, not percentages.
 * Example: { one: 20, two: 60, three: 20 } = 20% for 1, 60% for 2, 20% for 3
 */
export interface ActivityCountWeights {
  one: number;
  two: number;
  three: number;
}

/**
 * Complete activity configuration for a room type.
 * Replaces the old boolean-based activity flags.
 */
export interface RoomTypeActivityConfig {
  activityCountWeights: ActivityCountWeights;
  activityWeights: ActivityWeights;
}

/**
 * Activities that cannot appear together in the same room.
 * If activity A is selected, activities in its exclusion list are removed from the pool.
 */
export const ACTIVITY_EXCLUSIONS: Partial<Record<keyof RoomActivities, (keyof RoomActivities)[]>> = {
  combat: ['eliteChallenge'],
  eliteChallenge: ['combat'],
};

export interface RoomRevealRequirement {
  skill?: string;          // Skill ID required to reveal
  item?: string;           // Item ID required
  stat?: { name: PrimaryStat; value: number }; // Stat threshold
}

export interface BranchingRoom {
  id: string;
  tier: RoomTier;
  position: RoomPosition;
  parentId: string | null;
  childIds: string[];

  // Display
  type: BranchingRoomType;
  name: string;
  description: string;
  terrain: TerrainType;
  backgroundImage?: string;
  icon?: string;

  // Activities (sequential)
  activities: RoomActivities;
  currentActivityIndex: number;

  // State
  isVisible: boolean;
  isAccessible: boolean;
  isCleared: boolean;
  isExit: boolean;
  isCurrent: boolean;

  // Dynamic generation tracking
  depth: number;                    // Absolute depth from floor start (0, 1, 2, 3...)
  hasGeneratedChildren: boolean;    // Track if children have been created

  // Hidden room requirements (for future)
  revealRequirement?: RoomRevealRequirement;
}

export interface BranchingFloor {
  id: string;
  floor: number;
  arc: string;
  biome: string;

  rooms: BranchingRoom[];
  currentRoomId: string;
  exitRoomId: string | null;  // null until exit room is generated

  // Metadata
  totalRooms: number;
  clearedRooms: number;

  // For dynamic exit generation
  roomsVisited: number;       // Track total rooms visited for exit probability
  difficulty: number;         // Store difficulty for generating new rooms

  // Intel system (0-100%)
  currentIntel: number;
  intelGainedThisLocation: number;

  // Wealth system (1-7 scale)
  wealthLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // Dynamic generation control
  roomGenerationMode: 'static' | 'dynamic';
  targetRoomCount: number;
  minRoomsBeforeExit: number;
  dangerLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // Treasure hunt system
  treasureHunt: TreasureHunt | null;
  /** Clan Rite already used this location (scroll mode clan at most once) */
  clanRiteUsed?: boolean;

  /**
   * T-033: story event ids preferred when generating room events
   * (from Location.tiedStoryEvents).
   */
  preferredEventIds?: string[];

  /**
   * T-046: ambient flavor line for this location (from atmosphereEvents).
   */
  atmosphereFlavor?: string;

  /**
   * A4: true when re-entering a previously completed location (reduced rewards).
   * UI scar chip + log; systems already apply revisit weight via deck.
   */
  isRevisit?: boolean;

  /**
   * A4 wave2: veiled / secret destination (flags.isSecret or LocationType.SECRET).
   * UI chip only — no new unlock systems.
   */
  isSecret?: boolean;

  /**
   * T-056: location enemyPool ids for room combat theming.
   */
  enemyPool?: string[];

  /**
   * T-059: location lootTable id for combat/treasure component bias.
   */
  lootTable?: string;

  /**
   * T-064: location terrainEffects for room-gen ambush bias (raw authoring data).
   */
  terrainEffects?: LocationTerrainEffect[];

  /**
   * T-068: region lootTheme.primaryElement for enemy affinity bias.
   */
  preferredElement?: ElementType;

  /**
   * T-070: full region lootTheme for merchant stock bias.
   */
  lootTheme?: RegionLootTheme;

  /**
   * F3 visit HEAT (0–100). Runtime only — never on persistent Location.
   * Resets when leaving / revisiting (new BranchingFloor).
   */
  heat: number;

  /**
   * F3: latched when heat first hits 100 this visit.
   * Stays true even if heat later drops; drives Hunter EXIT + elite-chain off at 100.
   */
  hunterArmed: boolean;
}

// Room type configuration for generation
// Note: Activity generation is now handled by ROOM_TYPE_ACTIVITY_CONFIGS (weighted system)
export interface RoomTypeConfig {
  type: BranchingRoomType;
  name: string;
  icon: string;
  description: string;

  // Appearance weights by tier
  tier0Weight: number;
  tier1Weight: number;
  tier2Weight: number;

  // Combat configuration
  combatModifiers?: CombatModifierType[];
  isExitEligible?: boolean;
}

// ============================================================================
// REGION EXPLORATION SYSTEM
// ============================================================================
// Region > Location > Room hierarchy with intel-gated path navigation
// For post-Academy arcs (Floors 11+)

export enum LocationType {
  SETTLEMENT = 'settlement',     // Villages, camps - merchants, rest, social
  WILDERNESS = 'wilderness',     // Forests, beaches - exploration, medium danger
  STRONGHOLD = 'stronghold',     // Outposts, hideouts - combat heavy
  LANDMARK = 'landmark',         // Bridges, monuments - story events, balanced
  SECRET = 'secret',             // Hidden areas - special rewards, high danger
  BOSS = 'boss'                  // Final boss location - cannot skip
}

export enum PathType {
  FORWARD = 'forward',           // Standard progression path (always visible)
  BRANCH = 'branch',             // Alternative route at same danger level
  LOOP = 'loop',                 // Returns to earlier location (one-time use)
  SECRET = 'secret'              // Hidden path (requires intel to reveal)
}

// Terrain type for locations (affects combat modifiers)
export enum LocationTerrainType {
  NEUTRAL = 'neutral',
  WATER_ADJACENT = 'water_adjacent',
  FOREST = 'forest',
  MIST = 'mist',
  UNDERGROUND = 'underground',
  HAZARDOUS = 'hazardous',
  FORTIFIED = 'fortified',
  CORRUPTED = 'corrupted',
  SACRED = 'sacred'
}

// ============================================================================
// PATH & NAVIGATION
// ============================================================================

export interface LocationPath {
  id: string;
  targetLocationId: string;
  pathType: PathType;
  isRevealed: boolean;           // Hidden until intel gathered
  isUsed: boolean;               // For loop paths (one-time use)
  description: string;
  dangerHint?: string;           // Vague hint about destination danger
}

export interface UnlockCondition {
  type: 'intel' | 'item' | 'karma' | 'story_flag' | 'always';
  requirement: string | number;
}

// ============================================================================
// LOCATION
// ============================================================================
// Each location uses binary branching (always 2 children); map foresight reads 2→4
// Player visits 5 rooms per location before reaching Room 10 (elite/boss fight)

export interface LocationFlags {
  isEntry: boolean;              // Starting location for region
  isBoss: boolean;               // Final boss location
  isSecret: boolean;             // Hidden location (requires unlock)
  hasMerchant: boolean;          // Merchant available in this location
  hasRest: boolean;              // Rest point available
  hasTraining: boolean;          // Training available
  hasInfoGathering?: boolean;    // Info gathering available (intel bonus)
}

export interface LocationTerrainEffect {
  type: string;                  // e.g., 'water_damage_bonus', 'fire_damage_penalty'
  value: number;                 // Modifier value (0.2 = +20%)
}

/**
 * Location icon with optional image asset and emoji fallback.
 * Supports both plain emoji strings (legacy) and asset objects.
 */
export interface LocationIconAsset {
  asset?: string;    // Path to image asset (e.g., '/assets/icons/locations/misty_beach.png')
  fallback: string;  // Emoji fallback (e.g., '🌫️')
}

export type LocationIcon = string | LocationIconAsset;

export interface Location {
  id: string;
  name: string;
  description: string;
  type: LocationType;
  icon: LocationIcon;

  // Difficulty (1-7 scale)
  dangerLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // Location size (minimum rooms before exit can appear)
  minRooms: number;  // 5-20 based on LocationType

  // Environment
  terrain: LocationTerrainType;
  terrainEffects: LocationTerrainEffect[];
  biome: string;
  backgroundImage?: string;

  // Room structure (binary 2-child branching + dynamic exit)
  rooms: BranchingRoom[];
  currentRoomId: string | null;
  roomsCleared: number;

  // Content pools
  enemyPool: string[];           // Enemy IDs that can spawn here
  lootTable: string;             // Loot table ID for this location

  // Events
  atmosphereEvents: string[];    // Random ambient events
  tiedStoryEvents?: string[];    // Story events tied to this location

  // Navigation
  forwardPaths: string[];        // Path IDs for forward progression
  loopPaths?: string[];          // Path IDs for backtracking
  secretPaths?: string[];        // Path IDs for hidden routes

  // State
  flags: LocationFlags;
  isDiscovered: boolean;         // Has player found this location?
  isAccessible: boolean;         // Can player travel here now?
  isCompleted: boolean;          // Has player cleared this location?
  isCurrent: boolean;            // Is player currently here?

  // Unlock requirements (for secret locations)
  unlockCondition?: UnlockCondition;

  // Wealth system (auto-generated from LocationType)
  wealthLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // Room generation config (optional, for LocationSystem integration)
  roomGenerationMode?: 'static' | 'dynamic';
  targetRoomCount?: number;
}

// ============================================================================
// REGION
// ============================================================================
// A region contains 10-15 locations connected by paths
// Player progresses forward-only until reaching the boss

export interface RegionLootTheme {
  primaryElement: ElementType;   // Main element theme (affects loot/enemies)
  equipmentFocus: string[];      // Stat focus for equipment drops
  goldMultiplier: number;        // Ryo drop modifier (poor regions = 0.8)
}

export interface Region {
  id: string;
  name: string;
  description: string;
  theme: string;                 // Narrative theme description

  // Navigation
  entryLocationIds: string[];    // Starting location options (1-2)
  bossLocationId: string;        // Final boss location
  currentLocationId: string | null;

  // All locations in this region
  locations: Location[];

  // All paths connecting locations
  paths: LocationPath[];

  // Progression tracking
  locationsCompleted: number;
  totalLocations: number;
  visitedLocationIds: string[];
  discoveredSecretIds: string[]; // Secret locations discovered

  // State
  isCompleted: boolean;

  // Theming
  arc: string;                   // Story arc (e.g., 'WAVES_ARC')
  biome: string;                 // Visual biome
  lootTheme: RegionLootTheme;

  // Scaling
  baseDifficulty: number;        // Starting difficulty for region
}

// ============================================================================
// REGION CONFIGURATION (for data files)
// ============================================================================

export interface LocationConfig {
  id: string;
  name: string;
  description: string;
  type: LocationType;
  icon: LocationIcon;
  dangerLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  minRooms?: number;  // Optional - if not provided, auto-calculated from type
  terrain: LocationTerrainType;
  terrainEffects: LocationTerrainEffect[];
  biome: string;
  enemyPool: string[];
  lootTable: string;
  atmosphereEvents: string[];
  tiedStoryEvents?: string[];
  forwardPaths: PathConfig[];
  loopPaths?: PathConfig[];
  secretPaths?: PathConfig[];
  flags: LocationFlags;
  unlockCondition?: UnlockCondition;
}

export interface PathConfig {
  id: string;
  targetId: string;
  pathType: PathType;
  description: string;
  dangerHint?: string;
}

export interface RegionConfig {
  id: string;
  name: string;
  description: string;
  theme: string;
  entryLocationIds: string[];
  bossLocationId: string;
  locations: LocationConfig[];
  arc: string;
  biome: string;
  lootTheme: RegionLootTheme;
  baseDifficulty: number;
}

// ============================================================================
// CARD-BASED LOCATION SELECTION SYSTEM
// ============================================================================
// Replaces node-map with 3-card selection from a weighted deck

/**
 * Global intel pool - accumulates from exploration activities
 * Higher intel reveals more info on location cards
 */
export interface IntelPool {
  totalIntel: number;      // Accumulated from exploration
  maxIntel: number;        // Cap (default: 10)
}

/**
 * Intel reveal levels for location cards
 */
export enum IntelRevealLevel {
  NONE = 0,     // "???" placeholder, danger hidden
  PARTIAL = 1,  // Danger level + location type shown
  FULL = 2,     // One bonus feature (special loot/event)
}

/**
 * Location entry in the deck with drawing metadata
 */
export interface DeckLocation {
  locationId: string;
  dangerLevel: number;
  isCompleted: boolean;
  baseWeight: number;        // Higher for lower danger (10 - dangerLevel)
  completionPenalty: number; // 0.3 if completed, 1.0 otherwise
}

/**
 * Deck state for weighted location drawing
 */
export interface LocationDeck {
  regionId: string;
  locations: DeckLocation[];
}

/**
 * A single drawn card representing a location choice
 */
export interface LocationCard {
  locationId: string;
  location: Location;
  intelLevel: IntelRevealLevel;
  isRevisit: boolean;        // Has player completed this before?
}

/**
 * Activity state for location cards
 * false = not present, 'normal' = present, 'special' = enhanced version
 */
export type ActivityStatus = false | 'normal' | 'special';

export interface LocationActivities {
  combat: ActivityStatus;
  merchant: ActivityStatus;
  rest: ActivityStatus;
  training: ActivityStatus;
  event: ActivityStatus;
  scrollDiscovery: ActivityStatus;
  treasure: ActivityStatus;
  eliteChallenge: ActivityStatus;
  infoGathering: ActivityStatus;
}

/**
 * Display info for a card based on intel level
 */
export interface CardDisplayInfo {
  name: string;              // "???" if no intel
  subtitle: string;          // Location type or "Unknown Territory"
  dangerLevel: number | null;
  locationType: LocationType | null;
  specialFeature: string | null; // Only at FULL intel
  showMystery: boolean;
  revisitBadge: boolean;

  // NEW - Wealth and activities
  wealthLevel: number | null;
  activities: LocationActivities | null;
  isBoss: boolean;
  isSecret: boolean;

  // Location size info
  minRooms: number | null;  // Revealed at PARTIAL intel or higher

  /** T-047: authored description — null when mystery (NONE intel) */
  description: string | null;
  /** T-047: optional atmosphere flavor at FULL intel */
  atmosphereLine: string | null;
  /** T-063: location terrain effect labels at FULL intel */
  terrainEffectLines: string[] | null;
}

/**
 * Progress-based tier weights for drawing cards
 * Progress 0-25%:   Low (danger 1-2) = 80%, Mid (3-4) = 18%, High (5-7) = 2%
 * Progress 25-50%:  Low = 40%, Mid = 50%, High = 10%
 * Progress 50-75%:  Low = 15%, Mid = 45%, High = 40%
 * Progress 75-100%: Low = 5%, Mid = 25%, High = 70%
 */
export type DangerTier = 'low' | 'mid' | 'high';

export interface TierWeights {
  low: number;   // Danger 1-2
  mid: number;   // Danger 3-4
  high: number;  // Danger 5-7
}