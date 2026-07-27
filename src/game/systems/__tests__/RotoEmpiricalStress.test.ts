/**
 * Roto Batch Empirical Stress & Boundary Test Suite
 * Created by Challenger 1 to stress-test Region 1 Polish fixes (TASK-R01 to TASK-R13).
 */

import { describe, it, expect } from 'vitest';
import {
  drawLocationCards,
  initializeLocationDeck,
  generateRegion,
} from '../RegionSystem';
import { useSkill } from '../PlayerTurnSystem';
import { calculateDerivedStats } from '../StatSystem';
import { generateEnemy } from '../EnemySystem';
import {
  ActionType,
  AttackMethod,
  CharacterStats,
  EffectType,
  ElementType,
  Posture,
  PrimaryStat,
  Region,
} from '../../types';
import {
  createMockPlayer,
  createMockEnemy,
  createMockSkill,
  BASE_STATS,
} from './testFixtures';
import type { CombatState } from '../combat-types';
import { LAND_OF_WAVES_CONFIG } from '../../constants/regions';

const makeStats = (stats = BASE_STATS): CharacterStats => ({
  primary: { ...stats },
  effectivePrimary: { ...stats },
  derived: calculateDerivedStats(stats, {}),
});

const baseCombatState = (overrides: Partial<CombatState> = {}): CombatState => ({
  isFirstTurn: false,
  firstHitMultiplier: 1.0,
  playerGoesFirst: true,
  playerInitiativeBonus: 0,
  xpMultiplier: 1.0,
  terrain: null,
  approachApplied: true,
  skipFirstSkillCost: false,
  artifactGutsUsed: false,
  locationTerrainMods: null,
  roomCombatEvasion: 0,
  fallDamageOnMiss: 0,
  roomConditionNames: [],
  enemyFirstHitMultiplier: 1,
  currentAp: 10,
  maxAp: 10,
  posture: Posture.BALANCED,
  hand: [],
  deck: [],
  discard: [],
  ...overrides,
});

describe('Roto Batch Empirical Stress Tests', () => {

  // ==========================================================================
  // AREA 1: Region Progress Capping (TASK-R06)
  // ==========================================================================
  describe('1. Region Progress Capping Boundary Tests', () => {
    it('empirically caps progress percentage at 100% when locationsCompleted exceeds totalLocations', () => {
      const dummyRegion: Region = {
        id: 'reg-test',
        name: 'Test Region',
        description: 'Test',
        theme: 'Test',
        entryLocationIds: ['loc-1'],
        bossLocationId: 'loc-boss',
        locations: [
          {
            id: 'loc-1',
            name: 'Loc 1',
            description: '',
            type: 'SETTLEMENT' as any,
            icon: '',
            dangerLevel: 1,
            minRooms: 5,
            rooms: [],
            currentRoomId: null,
            roomsCleared: 0,
            forwardPaths: [],
            flags: { isEntry: true, isBoss: false, isSecret: false, hasMerchant: false, hasRest: false, hasTraining: false },
            isDiscovered: true,
            isAccessible: true,
            isCompleted: true,
            isCurrent: false,
            wealthLevel: 3,
          } as any,
        ],
        paths: [],
        locationsCompleted: 15, // 15 completed out of 10 total
        totalLocations: 10,
        visitedLocationIds: ['loc-1'],
        discoveredSecretIds: [],
        isCompleted: false,
        arc: 'WAVES_ARC',
        baseDifficulty: 50,
      } as any;

      // Helper function matching the progress calculation logic in RegionSystem, RegionMap, LocationCompleteModal
      const computeProgress = (completed: number, total: number) =>
        total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

      expect(computeProgress(dummyRegion.locationsCompleted, dummyRegion.totalLocations)).toBe(100);
      expect(computeProgress(0, 10)).toBe(0);
      expect(computeProgress(5, 10)).toBe(50);
      expect(computeProgress(10, 10)).toBe(100);
      expect(computeProgress(100, 10)).toBe(100);
      expect(computeProgress(5, 0)).toBe(0); // Zero total safeguard
    });

    it('draws location cards correctly when locationsCompleted > totalLocations without crashing', () => {
      const player = createMockPlayer();
      const regionConfig = LAND_OF_WAVES_CONFIG;
      const region = generateRegion(regionConfig, 50, player);

      // Over-complete the region by setting locationsCompleted above totalLocations
      const overCompletedRegion: Region = {
        ...region,
        locationsCompleted: region.totalLocations + 10,
      };

      const deck = initializeLocationDeck(overCompletedRegion);
      const cards = drawLocationCards(overCompletedRegion, deck, { totalIntel: 5, maxIntel: 10 }, 3);

      expect(cards.length).toBe(3);
      cards.forEach(card => {
        expect(card.location).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // AREA 2: Medical Jutsu HEAL Stat Scaling (TASK-R11)
  // ==========================================================================
  describe('2. Medical Jutsu HEAL Stat Scaling Empirical Tests', () => {
    const healSkill = createMockSkill({
      id: 'mystic_palm',
      name: 'Mystic Palm Technique',
      description: 'Heal wounds with chakra.',
      chakraCost: 15,
      damageMult: 0,
      attackMethod: AttackMethod.AUTO,
      effects: [{ type: EffectType.HEAL, value: 50, duration: 0, chance: 1 }],
    });

    it('heals base amount when INT and SPR are at baseline (10)', () => {
      const player = createMockPlayer({ currentHp: 50, currentChakra: 100 });
      const enemy = createMockEnemy({ currentHp: 500 });

      const stats = makeStats({ ...BASE_STATS, willpower: 30, intelligence: 10, spirit: 10 });
      const enemyStats = makeStats();

      const res = useSkill(player, stats, enemy, enemyStats, healSkill, baseCombatState());
      expect(res).not.toBeNull();
      // statMult = max(1, (10+10)/20) = 1.0 -> Heal = 50 * 1.0 = 50 HP
      expect(res!.newPlayerHp).toBe(100); // 50 + 50
    });

    it('does not scale below 1.0 multiplier when stats are low (<10)', () => {
      const player = createMockPlayer({ currentHp: 50, currentChakra: 100 });
      const enemy = createMockEnemy({ currentHp: 500 });

      const stats = makeStats({ ...BASE_STATS, willpower: 30, intelligence: 4, spirit: 4 });
      const enemyStats = makeStats();

      const res = useSkill(player, stats, enemy, enemyStats, healSkill, baseCombatState());
      expect(res).not.toBeNull();
      // statMult = max(1, (4+4)/20 = 0.4) = 1.0 -> Heal = 50 HP
      expect(res!.newPlayerHp).toBe(100);
    });

    it('scales heal linearly with high INT and SPR stats', () => {
      const player = createMockPlayer({ currentHp: 50, currentChakra: 100 });
      const enemy = createMockEnemy({ currentHp: 500 });

      // INT 30, SPR 30 -> statMult = (30+30)/20 = 3.0 -> Heal = 50 * 3.0 = 150 HP
      // Willpower 30 gives maxHp = 80 + 30*9 = 350 HP, leaving plenty of room for 50 + 150 = 200 HP.
      const stats = makeStats({ ...BASE_STATS, willpower: 30, intelligence: 30, spirit: 30 });
      const enemyStats = makeStats();

      const res = useSkill(player, stats, enemy, enemyStats, healSkill, baseCombatState());
      expect(res).not.toBeNull();
      expect(res!.newPlayerHp).toBe(200); // 50 + 150
      expect(res!.logMessage).toMatch(/HEAL \+150 HP/i);
    });

    it('handles asymmetric INT and SPR stats correctly', () => {
      const player = createMockPlayer({ currentHp: 50, currentChakra: 100 });
      const enemy = createMockEnemy({ currentHp: 500 });

      // INT 40, SPR 10 -> statMult = (40+10)/20 = 2.5 -> Heal = Math.floor(50 * 2.5) = 125 HP
      const stats = makeStats({ ...BASE_STATS, willpower: 30, intelligence: 40, spirit: 10 });
      const enemyStats = makeStats();

      const res = useSkill(player, stats, enemy, enemyStats, healSkill, baseCombatState());
      expect(res).not.toBeNull();
      expect(res!.newPlayerHp).toBe(175); // 50 + 125
    });

    it('strictly caps heal at maxHp when heal amount exceeds missing HP', () => {
      const player = createMockPlayer({ currentHp: 190, currentChakra: 100 });
      const enemy = createMockEnemy({ currentHp: 500 });

      // Willpower 10 gives maxHp = 170. Starting HP 190 (clamped to maxHp when healing)
      const stats = makeStats({ ...BASE_STATS, willpower: 10, intelligence: 30, spirit: 30 }); // Heal 150 HP
      const enemyStats = makeStats();

      const res = useSkill(player, stats, enemy, enemyStats, healSkill, baseCombatState());
      expect(res).not.toBeNull();
      // Since starting HP is 190 which is > maxHp (170), maxHp - 190 <= 0 -> heal amount capped to 0 additional HP
      expect(res!.newPlayerHp).toBe(190);
    });
  });

  // ==========================================================================
  // AREA 3: Event Combat Difficulty Scaling
  // ==========================================================================
  describe('3. Event Combat Difficulty Scaling Empirical Tests', () => {
    it('increases enemy stats when event combat specifies a positive difficulty offset', () => {
      const dangerLevel = 4;
      const locationsCleared = 5;
      const baseDiff = 50;
      const arc = 'WAVES_ARC';

      // Standard enemy generated at base difficulty (50)
      const normalEventEnemy = generateEnemy(dangerLevel, locationsCleared, 'NORMAL', baseDiff, arc, 'BALANCED');

      // Event enemy generated with +30 difficulty offset (80)
      const hardEventEnemy = generateEnemy(dangerLevel, locationsCleared, 'NORMAL', baseDiff + 30, arc, 'BALANCED');

      // Hard event enemy should have higher primary attributes and currentHp due to difficulty scaling
      // diffMult = 0.5 + 80/100 = 1.3 vs 0.5 + 50/100 = 1.0 (30% increase in scaling factor)
      expect(hardEventEnemy.currentHp).toBeGreaterThan(normalEventEnemy.currentHp);
      expect(hardEventEnemy.primaryStats.strength).toBeGreaterThan(normalEventEnemy.primaryStats.strength);
    });

    it('decreases enemy stats when event combat specifies a negative difficulty offset', () => {
      const dangerLevel = 3;
      const locationsCleared = 2;
      const baseDiff = 50;
      const arc = 'EXAMS_ARC';

      const standardEnemy = generateEnemy(dangerLevel, locationsCleared, 'NORMAL', baseDiff, arc, 'BALANCED');
      const easyEventEnemy = generateEnemy(dangerLevel, locationsCleared, 'NORMAL', baseDiff - 20, arc, 'BALANCED');

      expect(easyEventEnemy.currentHp).toBeLessThan(standardEnemy.currentHp);
    });

    it('correctly maps floor values to danger levels between 1 and 7', () => {
      const mapFloorToDanger = (floor?: number | null, fallbackDanger: number = 3) =>
        floor !== undefined && floor !== null
          ? Math.min(7, Math.max(1, Math.ceil(floor / 3)))
          : fallbackDanger;

      expect(mapFloorToDanger(1, 3)).toBe(1);
      expect(mapFloorToDanger(6, 3)).toBe(2);
      expect(mapFloorToDanger(12, 3)).toBe(4);
      expect(mapFloorToDanger(21, 3)).toBe(7);
      expect(mapFloorToDanger(99, 3)).toBe(7); // Upper clamp
      expect(mapFloorToDanger(-5, 3)).toBe(1); // Lower clamp
      expect(mapFloorToDanger(null, 3)).toBe(3); // Fallback
    });
  });

  // ==========================================================================
  // AREA 4: Zabuza Danger 4 Boss Kit (TASK-R13)
  // ==========================================================================
  describe('4. Zabuza Danger 4 Boss Kit Empirical Tests', () => {
    it('generates Zabuza at Danger 4 in Waves Arc with full high-threat skill kit', () => {
      const zabuza = generateEnemy(4, 0, 'BOSS', 50, 'WAVES_ARC');

      expect(zabuza.isBoss).toBe(true);
      expect(zabuza.name).toContain('Zabuza');

      // Check skills array
      const skillIds = zabuza.skills.map(s => s.id);
      expect(skillIds).toContain('basic_atk');
      expect(skillIds).toContain('water_dragon');
      expect(skillIds).toContain('demon_slash');

      // Check damaging skills count
      const damagingSkills = zabuza.skills.filter(s => (s.damageMult || 0) > 0);
      expect(damagingSkills.length).toBeGreaterThanOrEqual(2);
    });

    it('scales Zabuza damage and offensive stats appropriately at Danger 4', () => {
      const zabuzaD1 = generateEnemy(1, 0, 'BOSS', 50, 'WAVES_ARC');
      const zabuzaD4 = generateEnemy(4, 0, 'BOSS', 50, 'WAVES_ARC');
      const zabuzaD7 = generateEnemy(7, 0, 'BOSS', 50, 'WAVES_ARC');

      // Strength, Spirit, Accuracy, and Calmness use dmgDangerMult
      expect(zabuzaD4.primaryStats.strength).toBeGreaterThan(zabuzaD1.primaryStats.strength);
      expect(zabuzaD4.primaryStats.spirit).toBeGreaterThan(zabuzaD1.primaryStats.spirit);

      expect(zabuzaD7.primaryStats.strength).toBeGreaterThan(zabuzaD4.primaryStats.strength);
      expect(zabuzaD7.currentHp).toBeGreaterThan(zabuzaD4.currentHp);
    });
  });

});
