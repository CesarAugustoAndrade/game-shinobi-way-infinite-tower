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

// Story flag → combat/loot run modifiers (T-034 table)
export * from './eventFlagRunModifiers';

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
/**
 * F1 start: all primaries 1 except two clan affinities at 3.
 * Uzumaki WILL+CHA | Uchiha SPI+DEX | Hyūga ACC+DEX | Lee STR+SPD | Yamanaka INT+CAL
 */
const BASE_ONE: PrimaryAttributes = {
  willpower: 1,
  chakra: 1,
  strength: 1,
  spirit: 1,
  intelligence: 1,
  calmness: 1,
  speed: 1,
  accuracy: 1,
  dexterity: 1,
};

export const CLAN_STATS: Record<Clan, PrimaryAttributes> = {
  [Clan.UZUMAKI]: { ...BASE_ONE, willpower: 3, chakra: 3 },
  [Clan.UCHIHA]: { ...BASE_ONE, spirit: 3, dexterity: 3 },
  [Clan.HYUGA]: { ...BASE_ONE, accuracy: 3, dexterity: 3 },
  [Clan.LEE]: { ...BASE_ONE, strength: 3, speed: 3 },
  [Clan.YAMANAKA]: { ...BASE_ONE, intelligence: 3, calmness: 3 },
};

export const CLAN_PRIMARY_STATS: Record<Clan, (keyof PrimaryAttributes)[]> = {
  [Clan.UZUMAKI]: ['willpower', 'chakra'],
  [Clan.UCHIHA]: ['spirit', 'dexterity'],
  [Clan.HYUGA]: ['accuracy', 'dexterity'],
  [Clan.LEE]: ['strength', 'speed'],
  [Clan.YAMANAKA]: ['intelligence', 'calmness'],
};

// CLAN_GROWTH removed (F1): each level grants 1 unspentStatPoint; player assigns.

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
    'adamantine_chains', 'brace', 'focused_breathing', 'uzumaki_barrage',
  ],
  [Clan.UCHIHA]: [
    'phoenix_flower', 'fireball', 'chidori', 'sharingan_predict',
    'sharingan_2', 'sharingan_3', 'fire_affinity', 'amaterasu',
  ],
  [Clan.HYUGA]: [
    'gentle_fist', 'air_palm', 'kaiten', '64_palms', 'byakugan',
    'byakugan_scan', 'analyze', 'twin_lion_fists',
  ],
  [Clan.LEE]: [
    'leaf_whirlwind', 'dynamic_entry', 'heavy_kick', 'primary_lotus',
    'hidden_lotus', 'gate_of_life', 'gate_prep', 'gate_of_limit', 'dancing_leaf',
    'morning_peacock',
  ],
  [Clan.YAMANAKA]: [
    'analyze', 'kai', 'hell_viewing', 'mind_transfer', 'mind_destruction',
    'mind_reading',
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

/** Cap for Player.clanLevel (Clan Rite scroll mode). */
export const MAX_CLAN_LEVEL = 5;

/**
 * Clan bloodline track: skill ids offered when ascending to that level.
 * Generator picks 2–3 not already owned; falls back to favorites if thin.
 */
export const CLAN_LEVEL_SKILL_POOL: Record<Clan, Record<number, readonly string[]>> = {
  [Clan.UZUMAKI]: {
    1: ['basic_medical', 'bunshin', 'brace'],
    2: ['shadow_clone', 'focused_breathing', 'adamantine_chains'],
    3: ['rasengan', 'chakra_reserves', 'basic_medical'],
    4: ['rasenshuriken', 'adamantine_chains', 'uzumaki_barrage'],
    5: ['rasenshuriken', 'uzumaki_barrage', 'adamantine_chains'],
  },
  [Clan.UCHIHA]: {
    1: ['phoenix_flower', 'fireball', 'fire_affinity'],
    2: ['chidori', 'sharingan_predict', 'phoenix_flower'],
    3: ['sharingan_2', 'chidori', 'fireball'],
    4: ['amaterasu', 'sharingan_3', 'sharingan_predict'],
    5: ['amaterasu', 'sharingan_3', 'chidori'],
  },
  [Clan.HYUGA]: {
    1: ['gentle_fist', 'air_palm', 'analyze'],
    2: ['byakugan', 'gentle_fist', 'byakugan_scan'],
    3: ['kaiten', '64_palms', 'air_palm'],
    4: ['64_palms', 'kaiten', 'twin_lion_fists'],
    5: ['twin_lion_fists', 'kaiten', '64_palms'],
  },
  [Clan.LEE]: {
    1: ['leaf_whirlwind', 'dynamic_entry', 'heavy_kick'],
    2: ['dancing_leaf', 'primary_lotus', 'leaf_whirlwind'],
    3: ['gate_prep', 'primary_lotus', 'dynamic_entry'],
    4: ['hidden_lotus', 'gate_of_life', 'morning_peacock'],
    5: ['morning_peacock', 'gate_of_limit', 'hidden_lotus'],
  },
  [Clan.YAMANAKA]: {
    1: ['analyze', 'kai', 'hell_viewing'],
    2: ['mind_transfer', 'kai', 'analyze'],
    3: ['mind_destruction', 'mind_transfer', 'hell_viewing'],
    4: ['mind_destruction', 'mind_reading', 'kai'],
    5: ['mind_reading', 'hell_viewing', 'mind_transfer'],
  },
};

export function resolveSkillById(skillId: string): Skill | undefined {
  return Object.values(SKILLS).find((s) => s.id === skillId);
}

/**
 * Build 2–3 clan skill choices for ascending to `targetLevel`.
 * Prefers unused pool skills; pads with favorites / academy kit.
 */
export function getClanLevelSkillChoices(
  clan: Clan,
  targetLevel: number,
  ownedSkillIds: Set<string>,
  count: number = 3,
): Skill[] {
  const level = Math.max(1, Math.min(MAX_CLAN_LEVEL, targetLevel));
  const poolIds = [
    ...(CLAN_LEVEL_SKILL_POOL[clan]?.[level] ?? []),
    ...(CLAN_FAVORITE_SKILLS[clan] ?? []),
    ...getClanStartingSkills(clan).map((s) => s.id),
  ];
  const seen = new Set<string>();
  const out: Skill[] = [];
  for (const id of poolIds) {
    if (seen.has(id) || ownedSkillIds.has(id)) continue;
    const skill = resolveSkillById(id);
    if (!skill) continue;
    seen.add(id);
    out.push({ ...skill, level: 1 });
    if (out.length >= count) break;
  }
  // If all owned, allow upgrades of favorites as last resort
  if (out.length === 0) {
    for (const id of CLAN_FAVORITE_SKILLS[clan] ?? []) {
      const skill = resolveSkillById(id);
      if (!skill || seen.has(id)) continue;
      seen.add(id);
      out.push({ ...skill, level: 1 });
      if (out.length >= count) break;
    }
  }
  return out;
}

/** Vendor scroll ryo price by tier × floor */
export function getScrollVendorPrice(skill: Skill, floor: number): number {
  const tierBase: Record<string, number> = {
    BASIC: 40,
    ADVANCED: 80,
    HIDDEN: 140,
    FORBIDDEN: 220,
    KINJUTSU: 320,
  };
  const base = tierBase[skill.tier] ?? 60;
  return Math.floor(base + floor * 12 + (skill.apCost ?? 1) * 5);
}

/** Flat forget cost at scroll vendor */
export function getScrollForgetCostRyo(skillLevel: number = 1): number {
  return 40 + Math.max(0, skillLevel - 1) * 15;
}

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