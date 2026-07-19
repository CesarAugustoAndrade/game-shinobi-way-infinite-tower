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
    skills.find(s => s.id !== SKILLS.BASIC_ATTACK.id && (s.damageMult ?? 0) > 0) ??
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
export function humanizeEnemyPoolId(id: string): string {
  const cleaned = id.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!cleaned) return 'Rogue';
  return cleaned
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ')
    .trim() || 'Rogue';
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

  // Calculate scaling multipliers (danger-based formula)
  // Danger scaling: D1=0.80, D4=1.25, D7=1.70
  const dangerMult = DIFFICULTY.DANGER_BASE + (dangerLevel * DIFFICULTY.DANGER_PER_LEVEL);
  // Progression scaling: +4% per location cleared globally
  const progressionMult = 1 + (locationsCleared * DIFFICULTY.PROGRESSION_PER_LOCATION);
  // Difficulty scaling: 50% to 100% based on difficulty value
  const diffMult = DIFFICULTY.DIFFICULTY_BASE + (diff / DIFFICULTY.DIFFICULTY_DIVISOR);
  // Apply global ease factor (0.85 = 15% easier) and launch property multiplier
  const totalScaling = dangerMult * progressionMult * diffMult * DIFFICULTY.ENEMY_EASE_FACTOR * LaunchProperties.ENEMY_SCALING_MULTIPLIER;
  // T-006 B.2: ENDGAME HP WALL — extra willpower(HP)-only scaling keyed to
  // dangerLevel (see scaledStats below). ~nil at D1, large at D6-7 so endgame
  // enemies survive a burst nuke and retaliate instead of being one-shot.
  const hpDangerMult = 1 + (dangerLevel * DIFFICULTY.ENEMY_HP_DANGER_FACTOR);
  // T-006 B.2: ENDGAME OFFENSE — extra scaling on enemy damage/crit/hit stats
  // keyed to dangerLevel (see scaledStats below). ~nil at D1, large at D6-7 so
  // the endgame hits hard enough to punish high-HP bruisers, not just survive.
  const dmgDangerMult = 1 + (dangerLevel * DIFFICULTY.ENEMY_DMG_DANGER_FACTOR);

  if (type === 'BOSS') {
    // A-003: danger 1–7 (+ arc theme), not legacy floors 8/17/25…
    const bossData = getBossData(dangerLevel, arcName);

    // Portrait from art registry (T-021) — offline cascade, no GenAI required
    const bossImage = resolveEnemyImageSrc({
      name: bossData.name,
      archetype: 'TANK',
      isBoss: true,
    });

    const bossStats: PrimaryAttributes = {
      willpower: Math.floor(40 * totalScaling * hpDangerMult),
      chakra: Math.floor(30 * totalScaling),
      strength: Math.floor(25 * totalScaling * dmgDangerMult),
      spirit: Math.floor(25 * totalScaling * dmgDangerMult),
      intelligence: Math.floor(20 * totalScaling),
      calmness: Math.floor(18 * totalScaling * dmgDangerMult),
      speed: Math.floor(18 * totalScaling),
      accuracy: Math.floor(15 * totalScaling * dmgDangerMult),
      dexterity: Math.floor(15 * totalScaling * dmgDangerMult)
    };
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

  let baseStats: PrimaryAttributes;
  switch (archetype) {
    case 'TANK':
      baseStats = { willpower: 22, chakra: 10, strength: 18, spirit: 8, intelligence: 8, calmness: 12, speed: 8, accuracy: 8, dexterity: 8 };
      break;
    case 'ASSASSIN':
      baseStats = { willpower: 10, chakra: 12, strength: 16, spirit: 8, intelligence: 10, calmness: 8, speed: 22, accuracy: 14, dexterity: 18 };
      break;
    case 'CASTER':
      baseStats = { willpower: 10, chakra: 18, strength: 6, spirit: 22, intelligence: 16, calmness: 10, speed: 12, accuracy: 10, dexterity: 10 };
      break;
    case 'GENJUTSU':
      baseStats = { willpower: 10, chakra: 16, strength: 6, spirit: 12, intelligence: 18, calmness: 22, speed: 10, accuracy: 8, dexterity: 12 };
      break;
    default:
      baseStats = { willpower: 14, chakra: 12, strength: 12, spirit: 12, intelligence: 12, calmness: 12, speed: 12, accuracy: 12, dexterity: 12 };
  }

  // T-006 B.2: ENDGAME HP WALL. At the level-10 baseline the player builds
  // out-stat the enemies so hard that high-mult nukes (Primary Lotus,
  // Rasenshuriken, Gentle Fist crits) one-shot enemies before they ever
  // retaliate — which is why tanky offense builds cleared 100% at every danger.
  // This extra willpower (HP) scaling is keyed to dangerLevel so it is ~nil at
  // D1 (keeps the early game accessible for squishy builds) but large at D6-7,
  // letting endgame enemies SURVIVE a burst and hit back. Willpower is chosen so
  // it raises HP/survivability without inflating enemy damage output.
  const scaledStats: PrimaryAttributes = {
    willpower: Math.floor(baseStats.willpower * totalScaling * hpDangerMult),
    chakra: Math.floor(baseStats.chakra * totalScaling),
    strength: Math.floor(baseStats.strength * totalScaling * dmgDangerMult),
    spirit: Math.floor(baseStats.spirit * totalScaling * dmgDangerMult),
    intelligence: Math.floor(baseStats.intelligence * totalScaling),
    calmness: Math.floor(baseStats.calmness * totalScaling * dmgDangerMult),
    speed: Math.floor(baseStats.speed * totalScaling),
    accuracy: Math.floor(baseStats.accuracy * totalScaling * dmgDangerMult),
    dexterity: Math.floor(baseStats.dexterity * totalScaling * dmgDangerMult)
  };

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
      if (arc.name === 'WAVES_ARC') namePool = ['Mist', 'Demon Brother', 'Mercenary'];
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
  if (isElite) {
    scaledStats.willpower = Math.floor(scaledStats.willpower * ENEMY_BALANCE.ELITE_WILLPOWER_MULT);
    scaledStats.strength = Math.floor(scaledStats.strength * ENEMY_BALANCE.ELITE_STRENGTH_MULT);
    scaledStats.spirit = Math.floor(scaledStats.spirit * ENEMY_BALANCE.ELITE_SPIRIT_MULT);
  }

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

export const generateEnemyImage = async (enemy: Enemy, genImageSize: '1K' | '2K' | '4K'): Promise<string | null> => {
  if (!enemy) return null;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A dark fantasy, gritty anime style character portrait of a Naruto-inspired ninja enemy named "${enemy.name}". Rank: ${enemy.tier}. Chakra Element: ${enemy.element}. The character looks dangerous and powerful. High contrast, detailed, atmospheric lighting. Close-up or waist-up shot.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { imageSize: genImageSize, aspectRatio: '1:1' } }
    });

    let imageUrl = null;
    if (response.candidates && response.candidates[0].content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if ((part as any).inlineData) {
          imageUrl = `data:image/png;base64,${(part as any).inlineData.data}`;
          break;
        }
      }
    }
    return imageUrl;
  } catch (error) {
    console.error("Image Gen Error", error);
    throw error;
  }
};
