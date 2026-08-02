import {
  PrimaryAttributes, PrimaryStat, Clan, ElementType,
  ItemSlot, Rarity, GameEvent, Skill
} from '../types';
import { ACADEMY_ARC_EVENTS } from './events/academyArcEvents';
import { WAVES_ARC_EVENTS } from './events/wavesArcEvents';
import { EXAMS_ARC_EVENTS } from './events/examsArcEvents';
import { ROGUE_ARC_EVENTS } from './events/rogueArcEvents';
import { WAR_ARC_EVENTS } from './events/warArcEvents';
import { GENERIC_EVENTS } from './events/genericEvents';
import { SKILLS } from './skills';

// Exploration System Exports
export * from './terrain';
export * from './approaches';
export * from './skills';

// Art registry (T-019) — central key→asset with emoji cascade
export * from './artRegistry';

// MAX_LOGS removed - use LIMITS.MAX_LOG_ENTRIES from config.ts instead

// ============================================================================
// ELEMENTAL ADVANTAGE CYCLE
// Fire > Wind > Lightning > Earth > Water > Fire
// ============================================================================
export const ELEMENTAL_CYCLE: Record<ElementType, ElementType> = {
  [ElementType.FIRE]: ElementType.WIND,
  [ElementType.WIND]: ElementType.LIGHTNING,
  [ElementType.LIGHTNING]: ElementType.EARTH,
  [ElementType.EARTH]: ElementType.WATER,
  [ElementType.WATER]: ElementType.FIRE,
  [ElementType.PHYSICAL]: ElementType.PHYSICAL,
  [ElementType.MENTAL]: ElementType.MENTAL,
};

// Helper to check effectiveness (1.2 = Strong, 0.8 = Weak, 1.0 = Neutral)
export const getElementEffectiveness = (attacker: ElementType, defender: ElementType): number => {
  if (attacker === ElementType.PHYSICAL || attacker === ElementType.MENTAL) return 1.0;

  // Standard Cycle (Attacker beats Defender)
  if (ELEMENTAL_CYCLE[attacker] === defender) return 1.2;

  // Reverse Cycle (Defender beats Attacker -> Resistance)
  if (ELEMENTAL_CYCLE[defender] === attacker) return 0.8;

  return 1.0;
};

// ============================================================================
// CLAN STARTING ELEMENT (affinity for terrain amp / gear scoring / HUD)
// Must stay aligned with createPlayer and progression sims.
// ============================================================================
export const CLAN_ELEMENTS: Record<Clan, ElementType> = {
  [Clan.UCHIHA]: ElementType.FIRE,
  [Clan.UZUMAKI]: ElementType.WIND,
  [Clan.HYUGA]: ElementType.PHYSICAL,
  [Clan.LEE]: ElementType.PHYSICAL,
  [Clan.YAMANAKA]: ElementType.MENTAL,
};

// ============================================================================
// CLAN STARTING STATS (Primary Attributes)
// Philosophy:
// - Uzumaki: Massive Willpower/Chakra (Tank/Sustain)
// - Uchiha: High Spirit/Dexterity/Speed (Elemental Glass Cannon)
// - Hyuga: High Accuracy/Dexterity/Strength (Precision Taijutsu)
// - Lee: Extreme Strength/Speed, Zero Spirit/Intelligence (Pure Body)
// - Yamanaka: High Intelligence/Calmness/Spirit (Mind Controller)
// ============================================================================
export const CLAN_STATS: Record<Clan, PrimaryAttributes> = {
  [Clan.UZUMAKI]: {
    willpower: 25,   // Massive life force
    chakra: 22,      // Huge reserves
    strength: 12,
    spirit: 10,
    intelligence: 10,
    calmness: 14,    // Stubborn determination
    speed: 10,
    accuracy: 8,
    dexterity: 8
  },
  [Clan.UCHIHA]: {
    willpower: 12,
    chakra: 14,
    strength: 10,
    spirit: 22,      // Fire affinity mastery
    intelligence: 16,
    calmness: 12,
    speed: 18,       // Sharingan perception
    accuracy: 14,
    dexterity: 18    // Precise strikes
  },
  [Clan.HYUGA]: {
    willpower: 14,
    chakra: 12,
    strength: 16,    // Gentle Fist conditioning
    spirit: 8,       // Less elemental focus
    intelligence: 14,
    calmness: 16,    // Byakugan mental clarity
    speed: 16,
    accuracy: 19,    // Tenketsu precision (T-006 B.2: 22→19, trims Hyuga's dominant hit/crit + Gentle Fist scaling)
    dexterity: 18    // Surgical strikes
  },
  [Clan.LEE]: {
    willpower: 20,   // Never gives up
    chakra: 4,       // Almost no ninjutsu capacity
    strength: 28,    // Peak physical conditioning
    spirit: 2,       // Cannot mold elemental chakra
    intelligence: 6, // Limited jutsu learning
    calmness: 10,
    speed: 26,       // Extreme speed training
    accuracy: 12,
    dexterity: 12
  },
  [Clan.YAMANAKA]: {
    willpower: 12,
    chakra: 18,
    strength: 6,     // Frail body
    spirit: 14,
    intelligence: 22, // Master tacticians
    calmness: 24,    // Unshakeable mind
    speed: 10,
    accuracy: 10,
    dexterity: 12
  },
};

// ============================================================================
// CLAN GROWTH RATES (Stats per Level)
// ============================================================================
export const CLAN_GROWTH: Record<Clan, Partial<PrimaryAttributes>> = {
  // T-006 B.2: willpower growth 4→3 — at +4/level Uzumaki reached ~61 willpower
  // (780+ HP), an unkillable tank-mage that cleared 100% deep into the endgame.
  [Clan.UZUMAKI]: {
    willpower: 3, chakra: 3, strength: 1, spirit: 3,
    intelligence: 1, calmness: 1, speed: 1, accuracy: 1, dexterity: 1
  },
  [Clan.UCHIHA]: { 
    willpower: 1, chakra: 2, strength: 1, spirit: 3, 
    intelligence: 2, calmness: 1, speed: 2, accuracy: 2, dexterity: 3 
  },
  // T-006 B.2: Hyuga was clearing 100% at every danger — its precision offense
  // (high accuracy/dexterity/strength feeding Gentle Fist + Primary Lotus) deleted
  // enemies before they could act, and high willpower kept it tanky. Trimmed
  // accuracy/dexterity/strength AND willpower growth to break the one-shot loop
  // and make it mortal in the endgame.
  [Clan.HYUGA]: {
    willpower: 1, chakra: 1, strength: 1, spirit: 1,
    intelligence: 2, calmness: 2, speed: 2, accuracy: 2, dexterity: 1
  },
  // T-006 B.2: Lee also cleared 100% everywhere — extreme strength + speed +
  // willpower made it a one-shotting, evasive, tanky triple-threat. Trimmed
  // strength/speed/willpower growth so the endgame can punish it.
  [Clan.LEE]: {
    willpower: 2, chakra: 0, strength: 2, spirit: 0,
    intelligence: 0, calmness: 1, speed: 2, accuracy: 1, dexterity: 2
  },
  // T-006 B.2: Yamanaka is the frail genjutsu clan (base willpower 12) and its
  // preset doesn't override willpower, so it entered the endgame on ~222 HP and
  // got deleted by the danger HP/offense walls — the earlier mental-damage buffs
  // couldn't save it because the preset clamps int/calmness BELOW their natural
  // growth, nullifying them. Raised willpower growth 1→3 (survivability lever,
  // not damage) to bring it back into band (D1≈80, D7 in the 20-40 tail). Mind
  // Controller is unaffected: it hard-overrides willpower to 15.
  [Clan.YAMANAKA]: {
    willpower: 3, chakra: 2, strength: 0, spirit: 2,
    intelligence: 3, calmness: 4, speed: 1, accuracy: 1, dexterity: 2
  },
};

// ============================================================================
// ENEMY PREFIXES FOR GENERATION
// ============================================================================
export const ENEMY_PREFIXES = {
  WEAK: ['Exhausted', 'Clumsy', 'Novice'],
  NORMAL: ['Mist', 'Rock', 'Cloud', 'Sound', 'Rogue'],
  STRONG: ['Veteran', 'Vicious', 'Elite', 'Merciless'],
  DEADLY: ['Demonic', 'Cursed', 'Blood-Thirsty']
};

// ============================================================================
// CLAN STARTING SKILLS (Legacy - single skill)
// ============================================================================
export const CLAN_START_SKILL: Record<Clan, Skill> = {
  [Clan.UZUMAKI]: SKILLS.SHADOW_CLONE,
  [Clan.UCHIHA]: SKILLS.FIREBALL,
  [Clan.HYUGA]: SKILLS.GENTLE_FIST,
  [Clan.LEE]: SKILLS.PRIMARY_LOTUS,
  [Clan.YAMANAKA]: SKILLS.MIND_DESTRUCTION,
};

// ============================================================================
// CLAN STARTING LOADOUTS — academy-first card combat kits (~8 playable)
// ACTIVE = playable cards; TOGGLE = stance/dojutsu; PASSIVE = always-on
// ============================================================================
export interface ClanLoadout {
  active: Skill[];    // Playable deck cards (was main + side)
  toggle: Skill[];    // Stance / dojutsu toggles
  passive: Skill[];   // Permanent bonus skills (not in deck)
}

/** Shared academy core (~6) + clan delta keep start near START_DECK_TARGET (8). */
const ACADEMY_CORE: Skill[] = [
  SKILLS.BASIC_ATTACK,
  SKILLS.HEAVY_KICK,
  SKILLS.SHURIKEN,
  SKILLS.WIRE_SETUP,
  SKILLS.KAWARIMI,
  SKILLS.BUNSHIN,
];

export const CLAN_START_LOADOUT: Record<Clan, ClanLoadout> = {
  // Uzumaki: sustain academy + medical; mid signatures learned in run
  [Clan.UZUMAKI]: {
    active: [...ACADEMY_CORE, SKILLS.BASIC_MEDICAL],
    toggle: [SKILLS.DEFENSIVE_POSTURE],
    passive: [SKILLS.CHAKRA_RESERVES],
  },

  // Uchiha: tools + simple fire; Great Fireball / Chidori mid-run
  [Clan.UCHIHA]: {
    active: [
      SKILLS.BASIC_ATTACK,
      SKILLS.HEAVY_KICK,
      SKILLS.SHURIKEN,
      SKILLS.WIRE_SETUP,
      SKILLS.SMOKE_BOMB,
      SKILLS.KAWARIMI,
      SKILLS.PHOENIX_FLOWER,
    ],
    toggle: [SKILLS.SHARINGAN_2TOMOE],
    passive: [SKILLS.FIRE_AFFINITY],
  },

  // Hyuga: Gentle Fist + Byakugan; 64/Kaiten/Air mid-run
  [Clan.HYUGA]: {
    active: [
      SKILLS.BASIC_ATTACK,
      SKILLS.HEAVY_KICK,
      SKILLS.SHURIKEN,
      SKILLS.KAWARIMI,
      SKILLS.ANALYZE,
      SKILLS.GENTLE_FIST,
      SKILLS.BRACE,
    ],
    toggle: [SKILLS.BYAKUGAN],
    passive: [SKILLS.PRECISION],
  },

  // Lee: pure tai academy; Lotus/Gates mid-run (no INT gates)
  [Clan.LEE]: {
    active: [
      SKILLS.BASIC_ATTACK,
      SKILLS.HEAVY_KICK,
      SKILLS.LEAF_WHIRLWIND,
      SKILLS.DYNAMIC_ENTRY,
      SKILLS.FOCUSED_BREATHING,
      SKILLS.BRACE,
      SKILLS.SHURIKEN,
    ],
    toggle: [SKILLS.AGGRESSIVE_STANCE],
    passive: [SKILLS.TAIJUTSU_TRAINING],
  },

  // Yamanaka: analyze/kai tools; Mind Transfer mid (still clan-locked)
  [Clan.YAMANAKA]: {
    active: [
      SKILLS.BASIC_ATTACK,
      SKILLS.HEAVY_KICK,
      SKILLS.SHURIKEN,
      SKILLS.BUNSHIN,
      SKILLS.ANALYZE,
      SKILLS.KAI,
      SKILLS.HELL_VIEWING,
    ],
    toggle: [SKILLS.FOCUSED_STANCE],
    passive: [SKILLS.MENTAL_FORTITUDE],
  },
};

/**
 * Skills this clan is more likely to see in scrolls/loot (bias only).
 * Not a hard gate — open learn still applies except requirements.clan.
 */
export const CLAN_FAVORITE_SKILLS: Record<Clan, readonly string[]> = {
  [Clan.UZUMAKI]: [
    'basic_medical', 'bunshin', 'shadow_clone', 'rasengan', 'rasenshuriken',
    'adamantine_chains', 'brace', 'focused_breathing',
  ],
  [Clan.UCHIHA]: [
    'phoenix_flower', 'fireball', 'chidori', 'sharingan_predict',
    'sharingan_2', 'fire_affinity', 'amaterasu',
  ],
  [Clan.HYUGA]: [
    'gentle_fist', 'air_palm', 'kaiten', '64_palms', 'byakugan',
    'byakugan_scan', 'analyze',
  ],
  [Clan.LEE]: [
    'leaf_whirlwind', 'dynamic_entry', 'heavy_kick', 'primary_lotus',
    'hidden_lotus', 'gate_of_life', 'gate_prep', 'gate_of_limit', 'dancing_leaf',
  ],
  [Clan.YAMANAKA]: [
    'analyze', 'kai', 'hell_viewing', 'mind_transfer', 'mind_destruction',
  ],
};

/**
 * Get all skills from a clan loadout as a flat array
 * Useful for initializing a player's skill list
 */
export const getClanStartingSkills = (clan: Clan): Skill[] => {
  const loadout = CLAN_START_LOADOUT[clan];
  return [
    ...loadout.active,
    ...loadout.toggle,
    ...loadout.passive,
  ];
};

// ============================================================================
// BOSS DEFINITIONS (danger 1–7; legacy floor keys 8/17/25… removed)
// ============================================================================

export interface BossDefinition {
  name: string;
  element: ElementType;
  skill: Skill;
}

/**
 * Default bosses keyed by location danger level (1–7).
 * Used when no arc-specific override exists.
 */
export const BOSS_BY_DANGER: Record<number, BossDefinition> = {
  1: { name: 'Demon Brothers', element: ElementType.PHYSICAL, skill: SKILLS.DEMON_SLASH },
  2: { name: 'Haku', element: ElementType.WATER, skill: SKILLS.ICE_MIRRORS },
  3: { name: 'Zabuza Momochi', element: ElementType.WATER, skill: SKILLS.WATER_DRAGON },
  4: { name: 'Gaara', element: ElementType.EARTH, skill: SKILLS.SAND_COFFIN },
  5: { name: 'Kimimaro', element: ElementType.PHYSICAL, skill: SKILLS.BONE_DRILL },
  6: { name: 'Sasuke Uchiha', element: ElementType.LIGHTNING, skill: SKILLS.CHIDORI },
  7: { name: 'Pain', element: ElementType.WIND, skill: SKILLS.SHINRA_TENSEI },
};

/**
 * Arc-themed boss overrides by danger (1–7).
 * generateEnemy looks up arc first, then falls back to BOSS_BY_DANGER.
 */
export const BOSS_BY_ARC: Record<string, Partial<Record<number, BossDefinition>>> = {
  WAVES_ARC: {
    1: { name: 'Demon Brothers', element: ElementType.PHYSICAL, skill: SKILLS.DEMON_SLASH },
    2: { name: 'Haku of the Mist', element: ElementType.WATER, skill: SKILLS.ICE_MIRRORS },
    3: { name: 'Zabuza Momochi', element: ElementType.WATER, skill: SKILLS.WATER_DRAGON },
    4: { name: 'Zabuza, Demon of the Mist', element: ElementType.WATER, skill: SKILLS.WATER_DRAGON },
    5: { name: 'Haku, Ice Mirror Master', element: ElementType.WATER, skill: SKILLS.ICE_MIRRORS },
    6: { name: "Gato's Elite Guard", element: ElementType.PHYSICAL, skill: SKILLS.DEMON_SLASH },
    // R1: compound climax is Gato (location boss), not Zabuza duo
    7: { name: 'Gato', element: ElementType.PHYSICAL, skill: SKILLS.DEMON_SLASH },
  },
  EXAMS_ARC: {
    1: { name: 'Sound Genin', element: ElementType.WIND, skill: SKILLS.GREAT_BREAKTHROUGH },
    2: { name: 'Dosu Kinuta', element: ElementType.MENTAL, skill: SKILLS.HELL_VIEWING },
    3: { name: 'Temari', element: ElementType.WIND, skill: SKILLS.GREAT_BREAKTHROUGH },
    4: { name: 'Gaara of the Sand', element: ElementType.EARTH, skill: SKILLS.SAND_COFFIN },
    5: { name: 'Orochimaru', element: ElementType.WIND, skill: SKILLS.POISON_FOG },
    6: { name: 'Gaara (Shukaku)', element: ElementType.EARTH, skill: SKILLS.SHUKAKU_ARM },
    7: { name: 'Orochimaru, the Snake', element: ElementType.WIND, skill: SKILLS.SUMMON_MANDA },
  },
  ROGUE_ARC: {
    1: { name: 'Sound Four Initiate', element: ElementType.PHYSICAL, skill: SKILLS.STRONG_FIST },
    2: { name: 'Jirobo', element: ElementType.EARTH, skill: SKILLS.EARTH_DECAPITATION },
    3: { name: 'Kidomaru', element: ElementType.PHYSICAL, skill: SKILLS.WIRE_SETUP },
    4: { name: 'Sakon & Ukon', element: ElementType.PHYSICAL, skill: SKILLS.DEMON_SLASH },
    5: { name: 'Kimimaro', element: ElementType.PHYSICAL, skill: SKILLS.BONE_DRILL },
    6: { name: 'Sasuke Uchiha', element: ElementType.LIGHTNING, skill: SKILLS.CHIDORI },
    7: { name: 'Sasuke of the Curse Mark', element: ElementType.LIGHTNING, skill: SKILLS.CURSE_SURGE },
  },
  WAR_ARC: {
    1: { name: 'White Zetsu', element: ElementType.EARTH, skill: SKILLS.MUD_WALL },
    2: { name: 'Reanimated Shinobi', element: ElementType.PHYSICAL, skill: SKILLS.RASENGAN },
    3: { name: 'Kakuzu', element: ElementType.FIRE, skill: SKILLS.FIREBALL },
    4: { name: 'Pain (Deva Path)', element: ElementType.WIND, skill: SKILLS.SHINRA_TENSEI },
    5: { name: 'Obito Uchiha', element: ElementType.FIRE, skill: SKILLS.KAMUI_IMPACT },
    6: { name: 'Madara Uchiha', element: ElementType.FIRE, skill: SKILLS.TENGAI_SHINSEI },
    7: { name: 'Ten-Tails Madara', element: ElementType.FIRE, skill: SKILLS.TENGAI_SHINSEI },
  },
  ACADEMY_ARC: {
    1: { name: 'Academy Bully', element: ElementType.PHYSICAL, skill: SKILLS.STRONG_FIST },
    2: { name: 'Rogue Genin', element: ElementType.FIRE, skill: SKILLS.FIREBALL },
    3: { name: 'Missing-nin Scout', element: ElementType.WIND, skill: SKILLS.GREAT_BREAKTHROUGH },
    4: { name: 'Bandit Captain', element: ElementType.PHYSICAL, skill: SKILLS.DEMON_SLASH },
    5: { name: 'Chunin Deserter', element: ElementType.LIGHTNING, skill: SKILLS.LIGHTNING_BALL },
    6: { name: 'Rogue Jonin', element: ElementType.WATER, skill: SKILLS.WATER_DRAGON },
    7: { name: 'Mizuki', element: ElementType.PHYSICAL, skill: SKILLS.DEMON_SLASH },
  },
};

/**
 * Resolve boss identity for a danger level and optional story arc.
 * Danger is clamped to 1–7 (region system); never uses legacy floor keys.
 */
export function getBossData(dangerLevel: number, arcName?: string): BossDefinition {
  const d = Math.max(1, Math.min(7, Math.round(Number(dangerLevel)) || 1));
  const fromArc = arcName ? BOSS_BY_ARC[arcName]?.[d] : undefined;
  return fromArc ?? BOSS_BY_DANGER[d] ?? BOSS_BY_DANGER[7];
}

/** Danger-keyed boss table (1–7). Prefer getBossData(danger, arc) for themed names. */
export const BOSS_NAMES = BOSS_BY_DANGER;

export const AMBUSH_ENEMIES = [
  { name: 'Zabuza Momochi', element: ElementType.WATER, skill: SKILLS.DEMON_SLASH },
  { name: 'Kimimaro', element: ElementType.PHYSICAL, skill: SKILLS.BONE_DRILL },
  { name: 'Hanzo the Salamander', element: ElementType.FIRE, skill: SKILLS.POISON_FOG }
];

// ============================================================================
// EVENT DEFINITIONS
// ============================================================================
export const EVENTS: GameEvent[] = [
  ...GENERIC_EVENTS, // Generic events that can appear in any arc (treasure upgrades, etc.)
  ...ACADEMY_ARC_EVENTS,
  ...WAVES_ARC_EVENTS,
  ...EXAMS_ARC_EVENTS,
  ...ROGUE_ARC_EVENTS,
  ...WAR_ARC_EVENTS,
];

// Relative appearance weights per event rarity (T-016). The event picker in
// LocationSystem draws from the eligible arc pool proportionally to these
// weights, so a RARE event surfaces ~half as often as a COMMON one and an EPIC
// roughly a fifth as often. Balance data lives here (not in the systems) so the
// balance pass (T-012) can tune frequency without touching engine code.
export const EVENT_RARITY_WEIGHTS: Record<Rarity, number> = {
  [Rarity.BROKEN]: 100,
  [Rarity.COMMON]: 100,
  [Rarity.RARE]: 45,
  [Rarity.EPIC]: 18,
  [Rarity.LEGENDARY]: 7,
  [Rarity.CURSED]: 7,
};