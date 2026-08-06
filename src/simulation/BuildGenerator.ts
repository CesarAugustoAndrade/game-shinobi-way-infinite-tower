/**
 * Build Generator — Academy-first skill loadouts for combat simulation.
 *
 * Aligns with card combat vision:
 * - Start from CLAN_START_LOADOUT / getClanStartingSkills (~8 playable academy kit)
 * - Open learn via multi-stat canLearnSkill; hard clan gates only when requirements.clan set
 * - CLAN_FAVORITE_SKILLS bias for progression picks
 * - ActionType.ACTIVE | TOGGLE | PASSIVE (MAIN/SIDE removed)
 */

import {
  PrimaryAttributes,
  Skill,
  Clan,
  ElementType,
  SkillTier,
  ActionType,
} from '../game/types';
import {
  CLAN_STATS,
  SKILLS,
  CLAN_FAVORITE_SKILLS,
  getClanStartingSkills,
} from '../game/constants';
import { canLearnSkill } from '../game/systems/StatSystem';
import { LaunchProperties } from '../config/featureFlags';
import { PlayerBuildConfig } from './types';

// ============================================================================
// INTELLIGENCE TIERS (legacy labels for docs / INT banding)
// ============================================================================

export enum IntelligenceTier {
  BASIC = 'BASIC',       // 0-10
  RARE = 'RARE',         // 11-15
  EPIC = 'EPIC',         // 16-20
  LEGENDARY = 'LEGENDARY', // 21-25
  FORBIDDEN = 'FORBIDDEN'  // 26+
}

export function getIntelligenceTier(intelligence: number): IntelligenceTier {
  if (intelligence >= 26) return IntelligenceTier.FORBIDDEN;
  if (intelligence >= 21) return IntelligenceTier.LEGENDARY;
  if (intelligence >= 16) return IntelligenceTier.EPIC;
  if (intelligence >= 11) return IntelligenceTier.RARE;
  return IntelligenceTier.BASIC;
}

// ============================================================================
// SKILL LOOKUP
// ============================================================================

/**
 * Resolve a skill by catalog key or by Skill.id (e.g. 'basic_atk').
 */
export function resolveSkillById(id: string): Skill | undefined {
  if (!id) return undefined;
  const upper = id.toUpperCase();
  if (SKILLS[upper]) return SKILLS[upper];
  if (SKILLS[id]) return SKILLS[id];
  return Object.values(SKILLS).find(
    (s) => s.id === id || s.id.toLowerCase() === id.toLowerCase()
  );
}

/** Clone skill with cooldown reset for simulation. */
export function cloneSkillForSim(skill: Skill): Skill {
  return { ...skill, currentCooldown: 0 };
}

// ============================================================================
// SKILL FILTERING (open learn + clan hard-gates + multi-stat)
// ============================================================================

/**
 * Skills the player may learn given full primary stats, level, and clan.
 * Uses live canLearnSkill (open learn except requirements.clan; multi-stat floors).
 */
export function getAvailableSkills(
  stats: PrimaryAttributes | number,
  clan: Clan,
  level: number = 1,
  options?: { excludeIds?: ReadonlySet<string> | string[] }
): Skill[] {
  const exclude = options?.excludeIds
    ? new Set(
        Array.isArray(options.excludeIds)
          ? options.excludeIds
          : [...options.excludeIds]
      )
    : new Set<string>();

  const primary: PrimaryAttributes | number =
    typeof stats === 'number'
      ? stats
      : stats;

  const available: Skill[] = [];

  for (const skill of Object.values(SKILLS)) {
    if (exclude.has(skill.id)) continue;

    const check = canLearnSkill(skill, primary, level, clan);
    if (!check.canLearn) continue;

    available.push(skill);
  }

  return available;
}

/**
 * Score for progression pick priority: favorites first, then tier, then damage.
 */
function skillProgressionScore(skill: Skill, clan: Clan): number {
  const favorites = CLAN_FAVORITE_SKILLS[clan] ?? [];
  const favIndex = favorites.indexOf(skill.id);
  const favBoost = favIndex >= 0 ? 1000 - favIndex * 10 : 0;

  let tierScore = 0;
  switch (skill.tier) {
    case SkillTier.KINJUTSU: tierScore = 50; break;
    case SkillTier.FORBIDDEN: tierScore = 40; break;
    case SkillTier.HIDDEN: tierScore = 30; break;
    case SkillTier.ADVANCED: tierScore = 20; break;
    case SkillTier.BASIC: tierScore = 10; break;
    default: tierScore = 0;
  }

  const dmg =
    (((skill.baseDamage ?? 0) + (skill.scalingPerPoint ?? 0) * 3) || 0) *
    (skill.critBonus ? 1.2 : 1) *
    (skill.penetration ? 1.3 : 1);

  // Slight preference for playable ACTIVE cards over pure utility/passives when scoring
  const activeBoost = skill.actionType === ActionType.ACTIVE ? 5 : 0;

  return favBoost + tierScore + dmg + activeBoost;
}

/**
 * Skills sorted by combat damage potential (no favorite bias).
 */
export function getSkillsByDamagePotential(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) => {
    const scoreA = ((a.baseDamage ?? 0) + (a.scalingPerPoint ?? 0) * 3) * (a.critBonus ? 1.2 : 1) * (a.penetration ? 1.3 : 1);
    const scoreB = ((b.baseDamage ?? 0) + (b.scalingPerPoint ?? 0) * 3) * (b.critBonus ? 1.2 : 1) * (b.penetration ? 1.3 : 1);
    return scoreB - scoreA;
  });
}

/**
 * Skills sorted for progression: clan favorites → higher tier → damage.
 */
export function getSkillsByProgressionPriority(
  skills: Skill[],
  clan: Clan
): Skill[] {
  return [...skills].sort(
    (a, b) => skillProgressionScore(b, clan) - skillProgressionScore(a, clan)
  );
}

/**
 * Academy starting skill ids for a clan (ACTIVE + TOGGLE + PASSIVE).
 */
export function getClanStartingSkillIds(clan: Clan): string[] {
  return getClanStartingSkills(clan).map((s) => s.id);
}

/**
 * Generate loadout based on academy kit + learnable favorites / open skills.
 * Base = getClanStartingSkills; fill remaining slots with favorites then open learn.
 *
 * @param stats - Full primary stats (or legacy intelligence number)
 * @param clan - Player clan (clan-locked skills only if matching)
 * @param maxSkills - Cap including starters (default MAX_DECK_SIZE + room for passives)
 * @param level - Player level for canLearnSkill
 */
export function generateOptimalLoadout(
  stats: PrimaryAttributes | number,
  clan: Clan,
  maxSkills: number = LaunchProperties.MAX_DECK_SIZE + 4,
  level: number = 1
): Skill[] {
  const starters = getClanStartingSkills(clan).map(cloneSkillForSim);
  const loadout: Skill[] = [...starters];
  const knownIds = new Set(loadout.map((s) => s.id));

  if (loadout.length >= maxSkills) {
    return loadout.slice(0, maxSkills);
  }

  const available = getAvailableSkills(stats, clan, level, { excludeIds: knownIds });
  const prioritized = getSkillsByProgressionPriority(available, clan);

  for (const skill of prioritized) {
    if (loadout.length >= maxSkills) break;
    if (knownIds.has(skill.id)) continue;
    // Skip zero-impact pure placeholders (keep utility with effects / toggles / passives)
    if (
      skill.actionType === ActionType.ACTIVE &&
      ((skill.baseDamage ?? 0) + (skill.scalingPerPoint ?? 0) * 3) === 0 &&
      !(skill.effects && skill.effects.length > 0)
    ) {
      continue;
    }
    loadout.push(cloneSkillForSim(skill));
    knownIds.add(skill.id);
  }

  return loadout;
}

/**
 * Pick the next skill to learn during progression simulation.
 * Prefers clan favorites among canLearnSkill-eligible open/clan-gated skills.
 */
export function selectNextProgressionSkill(
  stats: PrimaryAttributes,
  clan: Clan,
  currentSkillIds: string[],
  level: number
): string | null {
  const known = new Set(currentSkillIds);
  const available = getAvailableSkills(stats, clan, level, { excludeIds: known });
  if (available.length === 0) return null;

  const prioritized = getSkillsByProgressionPriority(available, clan);
  // Prefer skills not already conceptually covered; top of list is favorite-biased
  return prioritized[0]?.id ?? null;
}

// ============================================================================
// PLAYER STAT CALCULATION
// ============================================================================

/**
 * Calculate player stats at a given level
 */
export function calculatePlayerStats(
  clan: Clan,
  level: number,
  customOverrides?: Partial<PrimaryAttributes>
): PrimaryAttributes {
  const baseStats = CLAN_STATS[clan];
  // F1: no CLAN_GROWTH — sim dumps (level-1) unspent points into willpower.
  const levels = Math.max(0, level - 1);
  const calculated: PrimaryAttributes = {
    willpower: baseStats.willpower + levels,
    chakra: baseStats.chakra,
    strength: baseStats.strength,
    spirit: baseStats.spirit,
    intelligence: baseStats.intelligence,
    calmness: baseStats.calmness,
    speed: baseStats.speed,
    accuracy: baseStats.accuracy,
    dexterity: baseStats.dexterity,
  };

  if (customOverrides) {
    Object.entries(customOverrides).forEach(([key, value]) => {
      if (value !== undefined) {
        calculated[key as keyof PrimaryAttributes] = value;
      }
    });
  }

  return calculated;
}

/**
 * Get the element affinity for a clan
 */
export function getClanElement(clan: Clan): ElementType {
  switch (clan) {
    case Clan.UZUMAKI: return ElementType.WIND;
    case Clan.UCHIHA: return ElementType.FIRE;
    case Clan.HYUGA: return ElementType.PHYSICAL;
    case Clan.LEE: return ElementType.PHYSICAL;
    case Clan.YAMANAKA: return ElementType.MENTAL;
    default: return ElementType.PHYSICAL;
  }
}

// ============================================================================
// PRESET HELPERS
// ============================================================================

/**
 * Merge academy start ids with mid-run signature picks, filtering wrong-clan locks
 * and resolving only existing skills. Order: academy first, then extras.
 */
function buildClanSkillIds(
  clan: Clan,
  midRunIds: string[],
  stats: PrimaryAttributes,
  level: number
): string[] {
  const startIds = getClanStartingSkillIds(clan);
  const known = new Set(startIds);
  const out = [...startIds];

  for (const id of midRunIds) {
    if (known.has(id)) continue;
    const skill = resolveSkillById(id);
    if (!skill) continue;
    const check = canLearnSkill(skill, stats, level, clan);
    if (!check.canLearn) continue;
    out.push(skill.id);
    known.add(skill.id);
  }

  return out;
}

// ============================================================================
// PRESET BUILDS
// ============================================================================

/**
 * Generate all clan preset builds at a given level.
 * Base = academy CLAN_START_LOADOUT; mid-run picks from favorites / open learn
 * (never wrong-clan hard locks).
 */
export function generateClanPresets(level: number = 10): PlayerBuildConfig[] {
  const builds: PlayerBuildConfig[] = [];

  // UZUMAKI — academy sustain + wind / medical progression
  const uzumakiStats = calculatePlayerStats(Clan.UZUMAKI, level);
  const uzStats = {
    ...uzumakiStats,
    spirit: Math.max(uzumakiStats.spirit, 28),
    intelligence: Math.max(uzumakiStats.intelligence, 20),
    speed: Math.max(uzumakiStats.speed, 22),
    accuracy: Math.max(uzumakiStats.accuracy, 20),
  };
  builds.push({
    name: 'Uzumaki Preset',
    clan: Clan.UZUMAKI,
    level,
    customStats: uzStats,
    skillIds: buildClanSkillIds(
      Clan.UZUMAKI,
      ['shadow_clone', 'rasengan', 'rasenshuriken', 'adamantine_chains'],
      uzStats,
      level
    ),
    element: ElementType.WIND,
  });

  // UCHIHA — academy fire + sharingan progression (no foreign bloodline kits)
  const uchihaStats = calculatePlayerStats(Clan.UCHIHA, level);
  const ucStats = {
    ...uchihaStats,
    intelligence: Math.max(uchihaStats.intelligence, 22),
    spirit: Math.max(uchihaStats.spirit, 24),
  };
  builds.push({
    name: 'Uchiha Preset',
    clan: Clan.UCHIHA,
    level,
    customStats: ucStats,
    skillIds: buildClanSkillIds(
      Clan.UCHIHA,
      ['fireball', 'chidori', 'sharingan_predict', 'amaterasu', 'kirin'],
      ucStats,
      level
    ),
    element: ElementType.FIRE,
  });

  // HYUGA — academy gentle fist + byakugan tree
  const hyugaStats = calculatePlayerStats(Clan.HYUGA, level);
  const hyStats = {
    ...hyugaStats,
    calmness: Math.max(hyugaStats.calmness, 22),
    accuracy: Math.max(hyugaStats.accuracy, 24),
    intelligence: Math.max(hyugaStats.intelligence, 16),
  };
  builds.push({
    name: 'Hyuga Preset',
    clan: Clan.HYUGA,
    level,
    customStats: hyStats,
    skillIds: buildClanSkillIds(
      Clan.HYUGA,
      ['air_palm', 'kaiten', '64_palms', 'byakugan_scan'],
      hyStats,
      level
    ),
    element: ElementType.PHYSICAL,
  });

  // LEE — pure tai academy; lotus / gates mid-run (no INT gates)
  const leeStats = calculatePlayerStats(Clan.LEE, level);
  const leeCustom = {
    ...leeStats,
    strength: Math.max(leeStats.strength, 24),
    speed: Math.max(leeStats.speed, 26),
  };
  builds.push({
    name: 'Lee Disciple Preset',
    clan: Clan.LEE,
    level,
    customStats: leeCustom,
    skillIds: buildClanSkillIds(
      Clan.LEE,
      ['primary_lotus', 'hidden_lotus', 'dancing_leaf', 'gate_of_life'],
      leeCustom,
      level
    ),
    element: ElementType.PHYSICAL,
  });

  // YAMANAKA — academy genjutsu tools; mind transfer mid (NOT Tsukuyomi / Uchiha)
  const yamanakaStats = calculatePlayerStats(Clan.YAMANAKA, level);
  const yaStats = {
    ...yamanakaStats,
    intelligence: Math.max(yamanakaStats.intelligence, 20),
    calmness: Math.max(yamanakaStats.calmness, 28),
  };
  builds.push({
    name: 'Yamanaka Preset',
    clan: Clan.YAMANAKA,
    level,
    customStats: yaStats,
    skillIds: buildClanSkillIds(
      Clan.YAMANAKA,
      ['mind_transfer', 'mind_destruction', 'temple_nirvana', 'shadow_possession'],
      yaStats,
      level
    ),
    element: ElementType.MENTAL,
  });

  return builds;
}

/**
 * Generate extreme/specialized builds for testing edge cases.
 *
 * BALANCE SCOPE NOTE (T-006 B.2 sign-off): not every build here is part of the
 * balance target curve. The curve covers the 5 clan presets (Uchiha/Hyuga/Lee/
 * Uzumaki/Yamanaka) + Balanced Build, plus Immortal Tank and Mind Controller as
 * in-scope endgame archetypes — all expected to sit ~80-90% clear at D1-2 and
 * ~20-40% at D6-7.
 *
 * Glass Cannon and Speed Demon are deliberately EXCLUDED from that curve: they
 * are EXTREME min-max stress-test fixtures that exist to probe the instrument
 * at the edges, not to be balanced.
 */
export function generateExtremeBuilds(level: number = 10): PlayerBuildConfig[] {
  const builds: PlayerBuildConfig[] = [];

  // Glass Cannon - Max Spirit/Dex, Min Willpower (Uchiha fire kit only)
  builds.push({
    name: 'Glass Cannon',
    clan: Clan.UCHIHA,
    level,
    customStats: {
      willpower: 8,
      chakra: 20,
      strength: 10,
      spirit: 40,
      intelligence: 22,
      calmness: 10,
      speed: 20,
      accuracy: 16,
      dexterity: 30
    },
    skillIds: buildClanSkillIds(
      Clan.UCHIHA,
      ['fireball', 'phoenix_flower', 'chidori', 'amaterasu'],
      {
        willpower: 8, chakra: 20, strength: 10, spirit: 40, intelligence: 22,
        calmness: 10, speed: 20, accuracy: 16, dexterity: 30
      },
      level
    ),
    element: ElementType.FIRE
  });

  // Immortal Tank - Max Willpower/Strength (Uzumaki base + open STR skills)
  builds.push({
    name: 'Immortal Tank',
    clan: Clan.UZUMAKI,
    level,
    customStats: {
      willpower: 50,
      chakra: 30,
      strength: 35,
      spirit: 12,
      intelligence: 12,
      calmness: 20,
      speed: 12,
      accuracy: 14,
      dexterity: 10
    },
    skillIds: buildClanSkillIds(
      Clan.UZUMAKI,
      ['bone_drill', 'demon_slash', 'primary_lotus', 'mud_wall', 'brace'],
      {
        willpower: 50, chakra: 30, strength: 35, spirit: 12, intelligence: 12,
        calmness: 20, speed: 12, accuracy: 14, dexterity: 10
      },
      level
    ),
    element: ElementType.PHYSICAL
  });

  // Speed Demon - Max Speed/Dex (Lee taijutsu)
  builds.push({
    name: 'Speed Demon',
    clan: Clan.LEE,
    level,
    customStats: {
      willpower: 20,
      chakra: 10,
      strength: 25,
      spirit: 8,
      intelligence: 8,
      calmness: 12,
      speed: 45,
      accuracy: 18,
      dexterity: 35
    },
    skillIds: buildClanSkillIds(
      Clan.LEE,
      ['primary_lotus', 'dynamic_entry', 'leaf_whirlwind', 'dancing_leaf'],
      {
        willpower: 20, chakra: 10, strength: 25, spirit: 8, intelligence: 8,
        calmness: 12, speed: 45, accuracy: 18, dexterity: 35
      },
      level
    ),
    element: ElementType.PHYSICAL
  });

  // Mind Controller - Max Intelligence/Calmness (Yamanaka only — no Tsukuyomi)
  builds.push({
    name: 'Mind Controller',
    clan: Clan.YAMANAKA,
    level,
    customStats: {
      willpower: 18,
      chakra: 25,
      strength: 8,
      spirit: 18,
      intelligence: 40,
      calmness: 45,
      speed: 12,
      accuracy: 12,
      dexterity: 15
    },
    skillIds: buildClanSkillIds(
      Clan.YAMANAKA,
      [
        'hell_viewing',
        'mind_destruction',
        'mind_transfer',
        'temple_nirvana',
        'shadow_possession',
      ],
      {
        willpower: 18, chakra: 25, strength: 8, spirit: 18, intelligence: 40,
        calmness: 45, speed: 12, accuracy: 12, dexterity: 15
      },
      level
    ),
    element: ElementType.MENTAL
  });

  // Balanced - competitive generalist on Hyuga open-learn hybrid
  builds.push({
    name: 'Balanced Build',
    clan: Clan.HYUGA,
    level,
    customStats: {
      willpower: 28,
      chakra: 24,
      strength: 26,
      spirit: 26,
      intelligence: 22,
      calmness: 22,
      speed: 24,
      accuracy: 24,
      dexterity: 22
    },
    skillIds: buildClanSkillIds(
      Clan.HYUGA,
      ['gentle_fist', 'water_dragon', 'chidori', 'shuriken', 'air_palm'],
      {
        willpower: 28, chakra: 24, strength: 26, spirit: 26, intelligence: 22,
        calmness: 22, speed: 24, accuracy: 24, dexterity: 22
      },
      level
    ),
    element: ElementType.WATER
  });

  return builds;
}

/**
 * Generate all test builds (clan presets + extreme builds)
 */
export function generateAllBuilds(level: number = 10): PlayerBuildConfig[] {
  return [
    ...generateClanPresets(level),
    ...generateExtremeBuilds(level)
  ];
}

/**
 * Create a player build from config
 */
export function createBuildFromConfig(config: PlayerBuildConfig): {
  stats: PrimaryAttributes;
  skills: Skill[];
  element: ElementType;
} {
  const stats = config.customStats
    ? { ...calculatePlayerStats(config.clan, config.level), ...config.customStats }
    : calculatePlayerStats(config.clan, config.level);

  const skills = config.skillIds
    .map((id) => resolveSkillById(id))
    .filter((s): s is Skill => Boolean(s))
    .map(cloneSkillForSim);

  // Ensure at least basic attack if catalog lookup failed entirely
  if (skills.length === 0) {
    skills.push(cloneSkillForSim(SKILLS.BASIC_ATTACK));
  }

  return {
    stats,
    skills,
    element: config.element
  };
}
