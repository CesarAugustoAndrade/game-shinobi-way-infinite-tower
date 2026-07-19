/**
 * Enemy Archetypes for Battle Simulation
 *
 * ## Live parity (A-007)
 *
 * `generateSimEnemy` is a **thin wrapper** over `EnemySystem.generateEnemy`
 * with a forced archetype. Scaling, base stats, skills, and HP/DMG danger
 * multipliers are therefore identical to the live game.
 *
 * The 1v1 CLI still accepts `--floor` (legacy). Floor is reverse-mapped to a
 * danger level via `floorToApproxDanger` so the live danger formula can run.
 * Prefer `--location` / `--campaign` when you need true danger-based attrition.
 *
 * Remaining intentional differences vs live:
 * - Display name comes from the sim archetype label (reports stay readable).
 * - Optional starting buffs (e.g. TANK thorns) are applied after generation for
 *   archetype-identity tests; live NORMAL enemies do not start with those.
 * - `locationsCleared` defaults to 0 (start-of-region baseline).
 */

import {
  ElementType,
  Enemy,
  Buff,
  EffectType,
} from '../game/types';
import { generateEnemy, type EnemyArchetype as LiveArchetype } from '../game/systems/EnemySystem';
import { ArchetypeConfig, EnemyArchetype } from './types';

// Re-export EnemyArchetype from types
export { EnemyArchetype } from './types';

// ============================================================================
// ARCHETYPE METADATA (names / descriptions / optional sim-only starting buffs)
// ============================================================================

export const ARCHETYPE_CONFIGS: Record<EnemyArchetype, ArchetypeConfig> = {
  [EnemyArchetype.TANK]: {
    name: 'Stone Wall Tank',
    description: 'High HP and physical defense with retaliation damage',
    // baseStats / skillIds kept for BuildGenerator / docs consumers; live
    // generation uses EnemySystem base stats when generateSimEnemy runs.
    baseStats: {
      willpower: 22, chakra: 10, strength: 18, spirit: 8, intelligence: 8,
      calmness: 12, speed: 8, accuracy: 8, dexterity: 8,
    },
    element: ElementType.EARTH,
    skillIds: ['basic_atk', 'mud_wall', 'sand_coffin'],
    startingBuffs: [
      {
        id: 'thorns_aura',
        name: 'Stone Skin Thorns',
        duration: 99,
        effect: {
          type: EffectType.REFLECTION,
          value: 0.15,
          duration: 99,
          chance: 1.0,
        },
        source: 'archetype',
      },
    ],
  },

  [EnemyArchetype.ASSASSIN]: {
    name: 'Shadow Assassin',
    description: 'High speed and crit, glass cannon physical attacker',
    baseStats: {
      willpower: 10, chakra: 12, strength: 16, spirit: 8, intelligence: 10,
      calmness: 8, speed: 22, accuracy: 14, dexterity: 18,
    },
    element: ElementType.LIGHTNING,
    skillIds: ['basic_atk', 'shuriken'],
  },

  [EnemyArchetype.CASTER]: {
    name: 'Elemental Caster',
    description: 'High spirit for elemental damage, ranged attacks',
    baseStats: {
      willpower: 10, chakra: 18, strength: 6, spirit: 22, intelligence: 16,
      calmness: 10, speed: 12, accuracy: 10, dexterity: 10,
    },
    element: ElementType.FIRE,
    skillIds: ['basic_atk', 'phoenix_flower'],
  },

  [EnemyArchetype.GENJUTSU]: {
    name: 'Mind Weaver',
    description: 'Mental attacks specialist, weaker defenses',
    baseStats: {
      willpower: 10, chakra: 16, strength: 6, spirit: 12, intelligence: 18,
      calmness: 22, speed: 10, accuracy: 8, dexterity: 12,
    },
    element: ElementType.MENTAL,
    skillIds: ['basic_atk', 'hell_viewing'],
  },

  [EnemyArchetype.BALANCED]: {
    name: 'Veteran Shinobi',
    description: 'Well-rounded stats, adaptable fighter',
    baseStats: {
      willpower: 14, chakra: 12, strength: 12, spirit: 12, intelligence: 12,
      calmness: 12, speed: 12, accuracy: 12, dexterity: 12,
    },
    element: ElementType.WATER,
    skillIds: ['basic_atk', 'water_dragon', 'shuriken'],
  },
};

// ============================================================================
// FLOOR ↔ DANGER BRIDGE (1v1 CLI only)
// ============================================================================

/**
 * Reverse of `dangerToFloor` (ScalingSystem):
 *   floor = 10 + (danger * 2) + floor(baseDifficulty / 20)
 *
 * Used so the legacy `--floor` flag can feed the live danger-based generator.
 * Lossy at edges — clamp to 1–7. Prefer danger-native modes for balance work.
 */
export function floorToApproxDanger(
  floorNumber: number,
  baseDifficulty: number = 40
): number {
  const danger = Math.round(
    (floorNumber - 10 - Math.floor(baseDifficulty / 20)) / 2
  );
  return Math.max(1, Math.min(7, danger));
}

function toLiveArchetype(archetype: EnemyArchetype): LiveArchetype {
  return archetype as LiveArchetype;
}

// ============================================================================
// ENEMY GENERATION (wraps EnemySystem.generateEnemy)
// ============================================================================

/**
 * Generate a sim enemy via the **live** `EnemySystem.generateEnemy` pipeline.
 *
 * @param archetype - Fixed matchup archetype (forces generateEnemy archetype)
 * @param floorNumber - Legacy 1v1 floor; reverse-mapped to danger 1–7
 * @param difficulty - Difficulty 0–100 (same as live `diff`)
 * @param options.locationsCleared - Progression stack (default 0)
 * @param options.arcName - Story arc theming (default WAVES_ARC)
 * @param options.baseDifficulty - Used only for floor→danger reverse map
 */
export function generateSimEnemy(
  archetype: EnemyArchetype,
  floorNumber: number,
  difficulty: number,
  options?: {
    locationsCleared?: number;
    arcName?: string;
    baseDifficulty?: number;
  }
): Enemy {
  const meta = ARCHETYPE_CONFIGS[archetype];
  const dangerLevel = floorToApproxDanger(
    floorNumber,
    options?.baseDifficulty ?? 40
  );
  const locationsCleared = options?.locationsCleared ?? 0;
  const arcName = options?.arcName ?? 'WAVES_ARC';

  const enemy = generateEnemy(
    dangerLevel,
    locationsCleared,
    'NORMAL',
    difficulty,
    arcName,
    toLiveArchetype(archetype)
  );

  // Keep report-friendly names; apply optional sim-only starting buffs (TANK thorns).
  const startingBuffs: Buff[] = meta.startingBuffs
    ? meta.startingBuffs.map(buff => ({ ...buff }))
    : [];

  return {
    ...enemy,
    name: meta.name,
    activeBuffs: [...enemy.activeBuffs, ...startingBuffs],
  };
}

/**
 * Get all archetypes as an array
 */
export function getAllArchetypes(): EnemyArchetype[] {
  return Object.values(EnemyArchetype);
}

/**
 * Get archetype config by type
 */
export function getArchetypeConfig(archetype: EnemyArchetype): ArchetypeConfig {
  return ARCHETYPE_CONFIGS[archetype];
}
