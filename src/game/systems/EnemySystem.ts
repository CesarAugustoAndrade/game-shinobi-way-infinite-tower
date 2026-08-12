/**
 * =============================================================================
 * ENEMY SYSTEM - Enemy Generation & Story Arc Management
 * =============================================================================
 *
 * This system generates enemies with varied archetypes, scaling, and story
 * arc theming. Enemies are the primary combat challenge in the game.
 *
 * ## STORY ARCS (Region-Based)
 *
 * Arcs are determined by the Region's `arc` property.
 *
 * | Arc Name    | Biome                    |
 * |-------------|--------------------------|
 * | ACADEMY_ARC | Village Hidden in Leaves |
 * | WAVES_ARC   | Mist Covered Bridge      |
 * | EXAMS_ARC   | Forest of Death          |
 * | ROGUE_ARC   | Valley of the End        |
 * | WAR_ARC     | Divine Tree Roots        |
 *
 * ## ENEMY ARCHETYPES (5 Types)
 *
 * Each archetype has different base stat distributions:
 *
 * | Archetype | Primary Stats              | Combat Style       |
 * |-----------|----------------------------|-------------------|
 * | TANK      | Willpower 22, Strength 18  | High HP, defense  |
 * | ASSASSIN  | Speed 22, Dexterity 18     | Fast, high crit   |
 * | BALANCED  | All stats 12-14            | No weaknesses     |
 * | CASTER    | Spirit 22, Chakra 18       | Elemental damage  |
 * | GENJUTSU  | Calmness 22, Intelligence 18| Mental attacks  |
 *
 * ## SCALING FORMULA (Danger-Based)
 *
 * totalScaling = dangerMult × progressionMult × diffMult × ENEMY_EASE_FACTOR
 *
 * - dangerMult = DANGER_BASE + (dangerLevel × DANGER_PER_LEVEL)
 *   → D1=0.70, D4=1.15, D7=1.60
 * - progressionMult = 1 + (locationsCleared × PROGRESSION_PER_LOCATION)
 *   → +4% per location cleared globally
 * - diffMult = 0.40 + (difficulty / 200)
 * - ENEMY_EASE_FACTOR = 0.85
 *
 * Example: Danger 4, 5 locations cleared, difficulty 40
 * - dangerMult = 0.55 + (4 × 0.15) = 1.15
 * - progressionMult = 1 + (5 × 0.04) = 1.20
 * - diffMult = 0.40 + 0.20 = 0.60
 * - totalScaling = 1.15 × 1.20 × 0.60 × 0.85 = 0.70× base stats
 *
 * ## ENEMY TYPES
 *
 * - **NORMAL**: Random archetype, standard stats
 * - **ELITE**: TANK or CASTER, +40% willpower, +30% strength/spirit
 * - **AMBUSH**: Always ASSASSIN, uses special enemy templates
 * - **BOSS**: Fixed stats, custom tier "Kage Level", unique skills
 *
 * ## SKILL ASSIGNMENT (A-003)
 *
 * Every archetype gets a kit of ≥3 skills (cloned so cooldowns are per-instance):
 * - TANK      → Taijutsu, Mud Wall, Brace, Strong Fist
 * - ASSASSIN  → Taijutsu, Shuriken, Smoke Bomb, Senbon
 * - BALANCED  → Taijutsu, Shuriken, Leaf Whirlwind, Water Clone
 * - CASTER    → Taijutsu + 2 elemental skills (element-aware)
 * - GENJUTSU  → Taijutsu, Hell Viewing, Mind Disturbance, False Surroundings
 * - High difficulty (>50, 30% chance) → +Rasengan (signature add-on)
 *
 * Boss names resolve via getBossData(danger 1–7, arc), not legacy floor keys.
 *
 * =============================================================================
 */

import {
  Enemy,
  ElementType,
  PrimaryAttributes,
  Skill
} from '../types';
import { getBossData, SKILLS, AMBUSH_ENEMIES, ENEMY_PREFIXES } from '../constants';
import { resolveEnemyImageSrc } from '../constants/artRegistry';
import { calculateDerivedStats } from './StatSystem';
import { DIFFICULTY, ENEMY_BALANCE } from '../config';
import { pick, chance } from '../utils/rng';
import { LaunchProperties } from '../../config/featureFlags';

/**
 * Enemy archetype determines base stat distribution and combat style.
 * Distinct from enemy *tier* (NORMAL / ELITE / BOSS / AMBUSH).
 */
export type EnemyArchetype = 'TANK' | 'ASSASSIN' | 'BALANCED' | 'CASTER' | 'GENJUTSU';

const COMBAT_ARCHETYPES: readonly EnemyArchetype[] = [
  'TANK', 'ASSASSIN', 'BALANCED', 'CASTER', 'GENJUTSU',
] as const;

export const isEnemyArchetype = (value: string): value is EnemyArchetype =>
  (COMBAT_ARCHETYPES as readonly string[]).includes(value);

/** Clone a skill template so cooldowns/effects don't share state across enemies. */
function cloneSkill(skill: Skill): Skill {
  return {
    ...skill,
    currentCooldown: 0,
    effects: skill.effects?.map(e => ({ ...e })),
  };
}

/**
 * Element-aware caster ninjutsu pair (BASIC is added by getArchetypeKit).
 */
function getCasterElementSkills(element: ElementType): Skill[] {
  switch (element) {
    case ElementType.WATER:
      return [SKILLS.WATER_DRAGON, SKILLS.WATER_CLONE];
    case ElementType.LIGHTNING:
      return [SKILLS.LIGHTNING_BALL, SKILLS.CHIDORI];
    case ElementType.EARTH:
      return [SKILLS.EARTH_DECAPITATION, SKILLS.MUD_WALL];
    case ElementType.WIND:
      return [SKILLS.GREAT_BREAKTHROUGH, SKILLS.AIR_BULLET];
    case ElementType.FIRE:
    default:
      return [SKILLS.FIREBALL, SKILLS.PHOENIX_FLOWER];
  }
}

/**
 * Build a full combat kit (≥3 skills) for an archetype.
 * CASTER kits adapt to the enemy's element.
 */
export function getArchetypeKit(
  archetype: EnemyArchetype,
  element: ElementType = ElementType.FIRE
): Skill[] {
  switch (archetype) {
    case 'TANK':
      return [
        cloneSkill(SKILLS.BASIC_ATTACK),
        cloneSkill(SKILLS.MUD_WALL),
        cloneSkill(SKILLS.BRACE),
        cloneSkill(SKILLS.STRONG_FIST),
      ];
    case 'ASSASSIN':
      return [
        cloneSkill(SKILLS.BASIC_ATTACK),
        cloneSkill(SKILLS.SHURIKEN),
        cloneSkill(SKILLS.SMOKE_BOMB),
        cloneSkill(SKILLS.SENBON),
      ];
    case 'BALANCED':
      return [
        cloneSkill(SKILLS.BASIC_ATTACK),
        cloneSkill(SKILLS.SHURIKEN),
        cloneSkill(SKILLS.LEAF_WHIRLWIND),
        cloneSkill(SKILLS.WATER_CLONE),
      ];
    case 'CASTER': {
      const [primary, secondary] = getCasterElementSkills(element);
      return [
        cloneSkill(SKILLS.BASIC_ATTACK),
        cloneSkill(primary),
        cloneSkill(secondary),
      ];
    }
    case 'GENJUTSU':
      return [
        cloneSkill(SKILLS.BASIC_ATTACK),
        cloneSkill(SKILLS.HELL_VIEWING),
        cloneSkill(SKILLS.MIND_DESTRUCTION),
        cloneSkill(SKILLS.FALSE_SURROUNDINGS),
      ];
    default:
      return [
        cloneSkill(SKILLS.BASIC_ATTACK),
        cloneSkill(SKILLS.SHURIKEN),
        cloneSkill(SKILLS.LEAF_WHIRLWIND),
      ];
  }
}

/**
 * Pick a default opening telegraph.
 * Prefer a non-basic skill with damageMult > 0 (signature attack), then any
 * non-basic utility, else the first skill.
 */
function defaultIntent(
  skills: Skill[]
): Pick<Enemy, 'intendedSkillId' | 'intendedSkillName' | 'intentReason'> {
  const signature =
    skills.find(s => s.id !== SKILLS.BASIC_ATTACK.id && ((s.baseDamage ?? 0) + (s.scalingPerPoint ?? 0) * 3) > 0) ??
    skills.find(s => s.id !== SKILLS.BASIC_ATTACK.id) ??
    skills[0];
  if (!signature) return {};
  return {
    intendedSkillId: signature.id,
    intendedSkillName: signature.name,
    intentReason: 'opening move',
  };
}

/**
 * Story arc data returned by getStoryArc.
 */
interface StoryArc {
  /** Internal arc identifier (e.g., 'ACADEMY_ARC') */
  name: string;
  /** Display name for the arc */
  label: string;
  /** Biome/location description for this arc */
  biome: string;
}

/**
 * Arc name to StoryArc data mapping.
 */
const STORY_ARCS: Record<string, StoryArc> = {
  'ACADEMY_ARC': { name: 'ACADEMY_ARC', label: 'Academy Graduation', biome: 'Village Hidden in the Leaves' },
  'WAVES_ARC': { name: 'WAVES_ARC', label: 'Land of Waves', biome: 'Mist Covered Bridge' },
  'EXAMS_ARC': { name: 'EXAMS_ARC', label: 'Chunin Exams', biome: 'Forest of Death' },
  'ROGUE_ARC': { name: 'ROGUE_ARC', label: 'Sasuke Retrieval', biome: 'Valley of the End' },
  'WAR_ARC': { name: 'WAR_ARC', label: 'Great Ninja War', biome: 'Divine Tree Roots' },
};

/**
 * Get story arc data by arc name (for region-based system).
 * Use this when the arc is known from the Region config.
 *
 * @param arcName - Arc identifier (e.g., 'WAVES_ARC')
 * @returns StoryArc with name, label, and biome
 */
export const getStoryArcByName = (arcName: string): StoryArc => {
  return STORY_ARCS[arcName] || STORY_ARCS['WAVES_ARC'];
};

/**
 * Generate an enemy with appropriate stats, skills, and theming.
 *
 * ## Enemy Generation Flow:
 * 1. Determine story arc for theming from arcName
 * 2. Calculate total scaling from danger level, progression, and difficulty
 * 3. For BOSS: Use fixed boss data from constants (danger 1–7 + arc)
 * 4. For others: Select archetype and generate base stats
 * 5. Scale stats by totalScaling multiplier
 * 6. Apply type-specific bonuses (ELITE gets +40% willpower, +30% str/spirit)
 * 7. Assign full archetype skill kits (≥3 skills)
 * 8. Select name from arc-appropriate pool
 * 9. Set opening skill telegraph (intent)
 *
 * @param dangerLevel - Location danger level (1-7)
 * @param locationsCleared - Global count of locations cleared (progression)
 * @param type - Enemy tier: NORMAL, ELITE, BOSS, or AMBUSH (scaling/elite bonuses)
 * @param diff - Difficulty value (0-100, affects diffMult)
 * @param arcName - Arc identifier for theming (e.g., 'WAVES_ARC')
 * @param forcedArchetype - Optional combat build archetype (TANK/ASSASSIN/…). When set,
 *   overrides the random/tier-based archetype pick (used by event triggerCombat).
 * @param enemyPool - Optional location enemyPool ids (T-056). Used for NORMAL/ELITE names + art.
 * @param preferredElement - Optional region lootTheme.primaryElement (T-068). Biases NORMAL/ELITE element.
 * @returns Fully generated Enemy ready for combat
 */
/** Humanize location enemyPool ids (snake_case) into display names. Exported for tests. */
/** R1 Waves: readable foe names (pool ids are mechanical). */
const POOL_DISPLAY_NAMES: Record<string, string> = {
  dock_worker: 'Dock Worker',
  corrupt_guard: "Gato's Enforcer",
  smuggler: 'Harbor Smuggler',
  beach_bandit: 'Shore Bandit',
  sea_spirit: 'Mist Spirit',
  stranded_ronin: 'Stranded Ronin',
  forest_bandit: 'Woods Bandit',
  wild_boar: 'Wild Boar',
  missing_nin: 'Missing-nin',
  cave_smuggler: 'Cave Runner',
  trap_master: 'Trap Setter',
  guard_dog: 'War Hound',
  village_thug: 'Village Extortionist',
  corrupt_merchant: 'Crooked Merchant',
  hired_muscle: 'Hired Muscle',
  river_bandit: 'River Raider',
  camp_raider: 'Camp Raider',
  desperate_traveler: 'Desperate Traveler',
  drowned_sailor: 'Drowned Sailor',
  water_spirit: 'Tide Wraith',
  treasure_guardian: 'Treasure Guardian',
  bridge_saboteur: 'Bridge Saboteur',
  hired_assassin: 'Hired Assassin',
  corrupt_foreman: 'Corrupt Foreman',
  bandit_captain: 'Bandit Captain',
  elite_mercenary: 'Elite Mercenary',
  war_dog: 'War Hound',
  vengeful_ghost: 'Vengeful Ghost',
  manor_guardian: 'Manor Warden',
  cursed_servant: 'Cursed Servant',
  cove_smuggler: 'Cove Smuggler',
  sea_creature: 'Deep Thing',
  hidden_guard: 'Hidden Guard',
  shrine_demon: 'Shrine Demon',
  corrupted_priest: 'Corrupted Priest',
  eldritch_guardian: 'Eldritch Warden',
  elite_guard: 'Compound Guard',
  ronin: 'Ronin',
  assassin: 'Mist Assassin',
  gato: 'Gato',
};

export function humanizeEnemyPoolId(id: string): string {
  const key = id.trim().toLowerCase();
  if (POOL_DISPLAY_NAMES[key]) return POOL_DISPLAY_NAMES[key];
  const cleaned = key.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!cleaned) return 'Rogue';
  return cleaned
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ')
    .trim() || 'Rogue';
}

/** Rank budget bonuses (F1 additive enemy scale). */
const RANK_BONUS: Record<'NORMAL' | 'ELITE' | 'BOSS' | 'AMBUSH' | 'GUARDIAN', number> = {
  NORMAL: 0,
  AMBUSH: 1,
  ELITE: 3,
  GUARDIAN: 4,
  BOSS: 7,
};

const ARCHETYPE_BASES: Record<EnemyArchetype, PrimaryAttributes> = {
  // Offense +1 on damage stats; WILL unchanged (HP = shared 100+20×WILL).
  TANK: { willpower: 3, chakra: 1, strength: 4, spirit: 2, intelligence: 1, calmness: 2, speed: 1, accuracy: 1, dexterity: 1 },
  ASSASSIN: { willpower: 1, chakra: 1, strength: 3, spirit: 1, intelligence: 1, calmness: 1, speed: 3, accuracy: 2, dexterity: 3 },
  CASTER: { willpower: 1, chakra: 3, strength: 1, spirit: 4, intelligence: 3, calmness: 1, speed: 1, accuracy: 1, dexterity: 1 },
  GENJUTSU: { willpower: 1, chakra: 2, strength: 1, spirit: 3, intelligence: 4, calmness: 3, speed: 1, accuracy: 1, dexterity: 1 },
  BALANCED: { willpower: 2, chakra: 2, strength: 3, spirit: 3, intelligence: 2, calmness: 2, speed: 2, accuracy: 2, dexterity: 2 },
};

/** Priority order for spending positive budget (archetype-focused first). */
const ARCHETYPE_PRIORITY: Record<EnemyArchetype, (keyof PrimaryAttributes)[]> = {
  TANK: ['willpower', 'strength', 'calmness', 'chakra', 'spirit', 'intelligence', 'speed', 'accuracy', 'dexterity'],
  ASSASSIN: ['speed', 'dexterity', 'strength', 'accuracy', 'willpower', 'chakra', 'spirit', 'intelligence', 'calmness'],
  CASTER: ['chakra', 'spirit', 'intelligence', 'willpower', 'speed', 'calmness', 'strength', 'accuracy', 'dexterity'],
  GENJUTSU: ['intelligence', 'calmness', 'chakra', 'spirit', 'willpower', 'speed', 'accuracy', 'dexterity', 'strength'],
  BALANCED: ['willpower', 'strength', 'spirit', 'speed', 'intelligence', 'calmness', 'chakra', 'accuracy', 'dexterity'],
};

/**
 * Additive budget: (Danger−1) + floor(locationsCleared/2) + round((difficulty−40)/20) + rankBonus.
 * Positive budget cycles priorities; negative removes in reverse without going below 1.
 */
export function computeEnemyStatBudget(
  dangerLevel: number,
  locationsCleared: number,
  difficulty: number,
  rank: keyof typeof RANK_BONUS
): number {
  return (
    (dangerLevel - 1) +
    Math.floor(locationsCleared / 2) +
    Math.round((difficulty - 40) / 20) +
    RANK_BONUS[rank]
  );
}

export function applyAdditiveStatBudget(
  base: PrimaryAttributes,
  budget: number,
  archetype: EnemyArchetype
): PrimaryAttributes {
  const stats = { ...base };
  const order = ARCHETYPE_PRIORITY[archetype];
  if (budget > 0) {
    for (let i = 0; i < budget; i++) {
      const key = order[i % order.length];
      stats[key] += 1;
    }
  } else if (budget < 0) {
    const rev = [...order].reverse();
    for (let i = 0; i < -budget; i++) {
      const key = rev[i % rev.length];
      stats[key] = Math.max(1, stats[key] - 1);
    }
  }
  // Floor all at 1
  (Object.keys(stats) as (keyof PrimaryAttributes)[]).forEach((k) => {
    stats[k] = Math.max(1, stats[k]);
  });
  return stats;
}

export const generateEnemy = (
  dangerLevel: number,
  locationsCleared: number,
  type: 'NORMAL' | 'ELITE' | 'BOSS' | 'AMBUSH',
  diff: number,
  arcName: string,
  forcedArchetype?: EnemyArchetype,
  enemyPool?: string[],
  preferredElement?: ElementType,
): Enemy => {
  const arc = getStoryArcByName(arcName);

  if (type === 'BOSS') {
    // A-003: danger 1–7 (+ arc theme), not legacy floors 8/17/25…
    const bossData = getBossData(dangerLevel, arcName);

    // Portrait from art registry (T-021) — offline cascade, no GenAI required
    const bossImage = resolveEnemyImageSrc({
      name: bossData.name,
      archetype: 'TANK',
      isBoss: true,
    });

    const budget = computeEnemyStatBudget(dangerLevel, locationsCleared, diff, 'BOSS');
    const bossStats = applyAdditiveStatBudget(ARCHETYPE_BASES.TANK, budget, 'TANK');
    const derived = calculateDerivedStats(bossStats, {});
    // Boss kit: basic + element support + signature technique (≥3 skills)
    const supportSkill =
      bossData.element === ElementType.WATER ? SKILLS.WATER_CLONE :
      bossData.element === ElementType.EARTH ? SKILLS.MUD_WALL :
      bossData.element === ElementType.LIGHTNING ? SKILLS.LIGHTNING_BALL :
      bossData.element === ElementType.WIND ? SKILLS.GREAT_BREAKTHROUGH :
      bossData.element === ElementType.MENTAL ? SKILLS.HELL_VIEWING :
      SKILLS.FIREBALL;
    const bossSkills = [
      cloneSkill(SKILLS.BASIC_ATTACK),
      cloneSkill(supportSkill),
      cloneSkill(bossData.skill),
    ];
    if (bossData.name.includes('Zabuza')) {
      bossSkills.push(cloneSkill(SKILLS.DEMON_SLASH));
    }
    if (bossData.name.includes('Gato')) {
      // Tycoon climax: raw hired-muscle pressure + signature slash
      bossSkills.push(cloneSkill(SKILLS.STRONG_FIST));
    }
    // Avoid duplicate skill ids if signature equals support
    const uniqueBossSkills = bossSkills.filter(
      (s, i, arr) => arr.findIndex(x => x.id === s.id) === i
    );
    if (uniqueBossSkills.length < 3) {
      uniqueBossSkills.push(cloneSkill(SKILLS.BRACE));
    }
    return {
      name: bossData.name,
      tier: 'Kage Level',
      element: bossData.element,
      isBoss: true,
      skills: uniqueBossSkills,
      primaryStats: bossStats,
      currentHp: derived.maxHp,
      currentChakra: derived.maxChakra,
      dropRateBonus: 50 + diff,
      activeBuffs: [],
      image: bossImage,
      archetype: 'TANK',
      dangerLevel,
      ...defaultIntent(uniqueBossSkills),
    };
  }

  let archetype: EnemyArchetype = 'BALANCED';
  if (forcedArchetype && isEnemyArchetype(forcedArchetype)) {
    archetype = forcedArchetype;
  } else if (type === 'AMBUSH') {
    archetype = 'ASSASSIN';
  } else if (type === 'ELITE') {
    archetype = chance(0.5) ? 'TANK' : 'CASTER';
  } else {
    archetype = pick(COMBAT_ARCHETYPES) ?? 'BALANCED';
  }

  const rankKey: keyof typeof RANK_BONUS =
    type === 'AMBUSH' ? 'AMBUSH' : type === 'ELITE' ? 'ELITE' : 'NORMAL';
  const budget = computeEnemyStatBudget(dangerLevel, locationsCleared, diff, rankKey);
  const scaledStats = applyAdditiveStatBudget(
    ARCHETYPE_BASES[archetype],
    budget,
    archetype
  );

  let name = "";
  const elements = Object.values(ElementType).filter(e => e !== ElementType.MENTAL && e !== ElementType.PHYSICAL);
  // T-068: ~50% chance to lock enemy element to region lootTheme.primaryElement
  let enemyElement: ElementType =
    preferredElement &&
    preferredElement !== ElementType.MENTAL &&
    preferredElement !== ElementType.PHYSICAL &&
    chance(0.5)
      ? preferredElement
      : (pick(elements) ?? ElementType.FIRE);
  let skills: Skill[];
  let poolIdForArt: string | undefined;

  if (type === 'AMBUSH') {
    const template = pick(AMBUSH_ENEMIES) ?? AMBUSH_ENEMIES[0];
    name = template.name;
    enemyElement = template.element;
    // Assassin kit + unique ambush signature (≥3 + special)
    skills = getArchetypeKit('ASSASSIN', enemyElement);
    if (!skills.some(s => s.id === template.skill.id)) {
      skills.push(cloneSkill(template.skill));
    }
  } else {
    // T-056: prefer location enemyPool for NORMAL/ELITE theming when authored
    const pool = (enemyPool ?? []).filter((id) => id && id.trim().length > 0);
    if (pool.length > 0 && (type === 'NORMAL' || type === 'ELITE')) {
      poolIdForArt = pick(pool) ?? pool[0];
      name = humanizeEnemyPoolId(poolIdForArt);
    } else {
      let namePool = ENEMY_PREFIXES.NORMAL;
      // Broad Waves fallback when location has no enemyPool (should be rare)
      if (arc.name === 'WAVES_ARC') {
        namePool = [
          'Mist', 'Harbor', 'Shore', 'Bridge', 'Ronin', 'Bandit',
          'Smuggler', 'Tide', 'Gato Hireling', 'Missing-nin',
        ];
      }
      else if (arc.name === 'EXAMS_ARC') namePool = ['Sand', 'Sound', 'Rain', 'Grass'];
      else if (arc.name === 'ROGUE_ARC') namePool = ['Sound Four', 'Curse Mark', 'Rogue'];
      else if (arc.name === 'WAR_ARC') namePool = ['Reanimated', 'White Zetsu', 'Masked'];
      else if (diff > 75) namePool = ENEMY_PREFIXES.DEADLY;
      else if (diff > 40) namePool = ENEMY_PREFIXES.STRONG;
      else if (diff < 10) namePool = ENEMY_PREFIXES.WEAK;

      const prefix = pick(namePool) ?? 'Rogue';
      const job = pick(['Ninja', 'Samurai', 'Puppeteer', 'Monk']) ?? 'Ninja';
      name = `${prefix} ${job}`;
    }

    // A-003: full archetype kits (≥3 skills). TANK/BALANCED no longer BASIC-only.
    skills = getArchetypeKit(archetype, enemyElement);
    if (diff > 50 && chance(0.3) && !skills.some(s => s.id === SKILLS.RASENGAN.id)) {
      skills.push(cloneSkill(SKILLS.RASENGAN));
    }
  }

  const isElite = type === 'ELITE' || type === 'AMBUSH';
  // Rank budget already encodes elite/ambush; no multiplicative post-scale.
  const derived = calculateDerivedStats(scaledStats, {});

  // Portrait from art registry (T-021): poolId → job keyword → archetype fallback
  const enemyImage = resolveEnemyImageSrc({
    name,
    archetype,
    poolId: poolIdForArt,
    isBoss: false,
  });

  return {
    name,
    tier: isElite ? (type === 'AMBUSH' ? 'S-Rank Rogue' : 'Jonin') : 'Chunin',
    element: enemyElement,
    skills,
    primaryStats: scaledStats,
    currentHp: derived.maxHp,
    currentChakra: derived.maxChakra,
    activeBuffs: [],
    image: enemyImage,
    archetype,
    dangerLevel,
    ...defaultIntent(skills),
  };
};


