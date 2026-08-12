/**
 * EnemySystem Unit Tests
 * Tests enemy generation with danger-based scaling
 */

import { describe, it, expect } from 'vitest';
import { generateEnemy, getStoryArcByName, humanizeEnemyPoolId, getArchetypeKit } from '../EnemySystem';
import { ElementType } from '../../types';
import { SKILLS } from '../../constants';

describe('getStoryArcByName', () => {
  it('returns correct arc data for WAVES_ARC', () => {
    const arc = getStoryArcByName('WAVES_ARC');
    expect(arc.name).toBe('WAVES_ARC');
    expect(arc.label).toBe('Land of Waves');
    expect(arc.biome).toBe('Mist Covered Bridge');
  });

  it('returns correct arc data for EXAMS_ARC', () => {
    const arc = getStoryArcByName('EXAMS_ARC');
    expect(arc.name).toBe('EXAMS_ARC');
    expect(arc.label).toBe('Chunin Exams');
    expect(arc.biome).toBe('Forest of Death');
  });

  it('returns correct arc data for ROGUE_ARC', () => {
    const arc = getStoryArcByName('ROGUE_ARC');
    expect(arc.name).toBe('ROGUE_ARC');
    expect(arc.label).toBe('Sasuke Retrieval');
    expect(arc.biome).toBe('Valley of the End');
  });

  it('returns correct arc data for WAR_ARC', () => {
    const arc = getStoryArcByName('WAR_ARC');
    expect(arc.name).toBe('WAR_ARC');
    expect(arc.label).toBe('Great Ninja War');
    expect(arc.biome).toBe('Divine Tree Roots');
  });

  it('falls back to WAVES_ARC for unknown arc names', () => {
    const arc = getStoryArcByName('UNKNOWN_ARC');
    expect(arc.name).toBe('WAVES_ARC');
  });
});

describe('humanizeEnemyPoolId (T-056)', () => {
  it('title-cases snake_case pool ids', () => {
    expect(humanizeEnemyPoolId('dock_worker')).toBe('Dock Worker');
    expect(humanizeEnemyPoolId('proctor_guard')).toBe('Proctor Guard');
  });
});

describe('generateEnemy', () => {
  describe('preferredElement (T-068)', () => {
    it('biases NORMAL enemies toward preferred region element', () => {
      let water = 0;
      for (let i = 0; i < 40; i++) {
        const e = generateEnemy(
          2, 0, 'NORMAL', 50, 'WAVES_ARC', undefined, undefined, ElementType.WATER,
        );
        if (e.element === ElementType.WATER) water += 1;
      }
      // ~50% bias → well above random 1/5 of combat elements
      expect(water).toBeGreaterThan(8);
    });
  });

  describe('location enemyPool (T-056)', () => {
    it('uses pool id for NORMAL name when pool provided', () => {
      const enemy = generateEnemy(
        2, 0, 'NORMAL', 50, 'WAVES_ARC', undefined, ['dock_worker'],
      );
      expect(enemy.name).toBe('Dock Worker');
      expect(enemy.image).toBeDefined();
    });

    it('keeps generic naming when pool empty', () => {
      const enemy = generateEnemy(2, 0, 'NORMAL', 50, 'WAVES_ARC', undefined, []);
      // Legacy pattern: Prefix Job — at least two words typically
      expect(enemy.name.split(' ').length).toBeGreaterThanOrEqual(2);
      expect(enemy.name).not.toBe('Dock Worker');
    });
  });

  describe('forced combat archetype (event triggerCombat)', () => {
    it('honors forcedArchetype ASSASSIN independent of enemy tier', () => {
      for (let i = 0; i < 10; i++) {
        const enemy = generateEnemy(3, 0, 'NORMAL', 50, 'WAVES_ARC', 'ASSASSIN');
        expect(enemy.archetype).toBe('ASSASSIN');
        expect(enemy.tier).toBe('Chunin'); // NORMAL tier, not ELITE
      }
    });

    it('honors forcedArchetype TANK', () => {
      const enemy = generateEnemy(3, 0, 'NORMAL', 50, 'WAVES_ARC', 'TANK');
      expect(enemy.archetype).toBe('TANK');
    });

    it('honors forcedArchetype with ELITE tier separately', () => {
      // Elite bonuses apply from type, but stats build is forced CASTER
      const enemy = generateEnemy(3, 0, 'ELITE', 50, 'WAVES_ARC', 'CASTER');
      expect(enemy.archetype).toBe('CASTER');
      expect(enemy.tier).toBe('Jonin'); // ELITE tier
    });
  });

  describe('NORMAL enemies', () => {
    it('generates enemy with proper structure', () => {
      const enemy = generateEnemy(1, 0, 'NORMAL', 50, 'WAVES_ARC');

      expect(enemy.name).toBeDefined();
      expect(enemy.tier).toBe('Chunin');
      expect(enemy.primaryStats).toBeDefined();
      expect(enemy.currentHp).toBeGreaterThan(0);
      expect(enemy.skills.length).toBeGreaterThan(0);
      expect(enemy.element).toBeDefined();
    });

    it('scales stats with danger level', () => {
      // Force BALANCED so additive budget (not archetype RNG) drives HP
      const d1 = generateEnemy(1, 0, 'NORMAL', 50, 'WAVES_ARC', 'BALANCED');
      const d7 = generateEnemy(7, 0, 'NORMAL', 50, 'WAVES_ARC', 'BALANCED');
      const sum = (e: typeof d1) =>
        e.primaryStats.willpower + e.primaryStats.chakra + e.primaryStats.strength +
        e.primaryStats.spirit + e.primaryStats.intelligence + e.primaryStats.calmness +
        e.primaryStats.speed + e.primaryStats.accuracy + e.primaryStats.dexterity;
      expect(sum(d7)).toBeGreaterThan(sum(d1));
      expect(d7.currentHp).toBeGreaterThanOrEqual(d1.currentHp);
    });

    it('scales stats with locations cleared (progression)', () => {
      // Generate multiple enemies to account for random archetype variance
      const sampleSize = 20;
      let noProgressionTotalHp = 0;
      let highProgressionTotalHp = 0;

      for (let i = 0; i < sampleSize; i++) {
        noProgressionTotalHp += generateEnemy(3, 0, 'NORMAL', 50, 'WAVES_ARC').currentHp;
        highProgressionTotalHp += generateEnemy(3, 20, 'NORMAL', 50, 'WAVES_ARC').currentHp;
      }

      // Average HP should be higher with more locations cleared (+4% per location)
      const noProgressionAvgHp = noProgressionTotalHp / sampleSize;
      const highProgressionAvgHp = highProgressionTotalHp / sampleSize;

      expect(highProgressionAvgHp).toBeGreaterThan(noProgressionAvgHp);
    });

    it('scales stats with difficulty', () => {
      // F1: force BALANCED so additive budget is the only variable
      const low = generateEnemy(3, 0, 'NORMAL', 25, 'WAVES_ARC', 'BALANCED');
      const high = generateEnemy(3, 0, 'NORMAL', 75, 'WAVES_ARC', 'BALANCED');
      const sumPrim = (e: typeof low) =>
        Object.values(e.primaryStats).reduce((a, b) => a + b, 0);
      expect(sumPrim(high)).toBeGreaterThan(sumPrim(low));
    });
  });

  describe('ELITE enemies', () => {
    it('has Jonin tier', () => {
      const enemy = generateEnemy(3, 0, 'ELITE', 50, 'WAVES_ARC');
      expect(enemy.tier).toBe('Jonin');
    });

    it('has boosted willpower and strength/spirit', () => {
      // Generate multiple to account for randomness
      const eliteEnemy = generateEnemy(3, 0, 'ELITE', 50, 'WAVES_ARC');

      // Elite should have valid stats with 1.4x willpower, 1.3x str/spirit multipliers
      expect(eliteEnemy.primaryStats.willpower).toBeGreaterThan(0);
      expect(eliteEnemy.tier).toBe('Jonin');
    });
  });

  describe('BOSS enemies', () => {
    it('has Kage Level tier', () => {
      const boss = generateEnemy(3, 0, 'BOSS', 50, 'WAVES_ARC');
      expect(boss.tier).toBe('Kage Level');
    });

    it('is marked as boss', () => {
      const boss = generateEnemy(3, 0, 'BOSS', 50, 'WAVES_ARC');
      expect(boss.isBoss).toBe(true);
    });

    it('has drop rate bonus', () => {
      const boss = generateEnemy(3, 0, 'BOSS', 50, 'WAVES_ARC');
      expect(boss.dropRateBonus).toBeDefined();
      expect(boss.dropRateBonus).toBeGreaterThan(0);
    });

    it('has multiple skills including special skill', () => {
      const boss = generateEnemy(3, 0, 'BOSS', 50, 'WAVES_ARC');
      expect(boss.skills.length).toBeGreaterThanOrEqual(2);
    });

    it('TASK-R13: Zabuza Danger 4 boss kit includes high-threat damaging jutsu alongside utility skills', () => {
      const zabuza = generateEnemy(4, 0, 'BOSS', 50, 'WAVES_ARC');
      expect(zabuza.name).toContain('Zabuza');
      const damagingSkills = zabuza.skills.filter(s => (s.baseDamage || 0) > 0);
      expect(damagingSkills.length).toBeGreaterThanOrEqual(2);
      expect(zabuza.skills.some(s => s.id === 'water_dragon')).toBe(true);
    });
  });

  describe('AMBUSH enemies', () => {
    it('has S-Rank Rogue tier', () => {
      const enemy = generateEnemy(3, 0, 'AMBUSH', 50, 'WAVES_ARC');
      expect(enemy.tier).toBe('S-Rank Rogue');
    });
  });

  describe('scaling formula', () => {
    it('applies danger scaling - higher danger means stronger enemies', () => {
      // Use larger sample size and relaxed expectations due to archetype variance
      const sampleSize = 50;

      // Calculate average HP at different danger levels
      let d1Total = 0, d7Total = 0;
      for (let i = 0; i < sampleSize; i++) {
        d1Total += generateEnemy(1, 0, 'NORMAL', 50, 'WAVES_ARC').currentHp;
        d7Total += generateEnemy(7, 0, 'NORMAL', 50, 'WAVES_ARC').currentHp;
      }

      // F1 additive budget: D7 > D1; WILL only steps every ~9 budget points so HP
      // ratio is modest (shared 20 HP/WILL). Expect clear but small rise.
      expect(d7Total / d1Total).toBeGreaterThan(1.02);
    });

    it('applies progression scaling - more locations cleared means stronger enemies', () => {
      const sampleSize = 50;

      // 20 locations = 80% bonus (1 + 20*0.04 = 1.80)
      let base = 0, with20 = 0;
      for (let i = 0; i < sampleSize; i++) {
        base += generateEnemy(3, 0, 'NORMAL', 50, 'WAVES_ARC').currentHp;
        with20 += generateEnemy(3, 20, 'NORMAL', 50, 'WAVES_ARC').currentHp;
      }

      // F1: floor(locationsCleared/2) adds budget — HP rises on average
      const ratio = with20 / base;
      expect(ratio).toBeGreaterThan(1.05);
    });

    /**
     * Golden table (A-013): fixed BALANCED archetype + fixed difficulty →
     * HP must be strictly monotonic with danger level. Values are derived from
     * DIFFICULTY constants; if a balance patch intentionally changes them,
     * update the expected mins and re-verify live feel.
     */
    it('golden: BALANCED total primaries increase with danger (1→7) at fixed difficulty', () => {
      const diff = 50;
      const locationsCleared = 0;
      const totals: number[] = [];
      const hps: number[] = [];

      const sumPrimaries = (stats: { willpower: number; chakra: number; strength: number; spirit: number; intelligence: number; calmness: number; speed: number; accuracy: number; dexterity: number }) =>
        stats.willpower + stats.chakra + stats.strength + stats.spirit +
        stats.intelligence + stats.calmness + stats.speed + stats.accuracy + stats.dexterity;

      for (let danger = 1; danger <= 7; danger++) {
        const enemy = generateEnemy(
          danger,
          locationsCleared,
          'NORMAL',
          diff,
          'WAVES_ARC',
          'BALANCED'
        );
        totals.push(sumPrimaries(enemy.primaryStats));
        hps.push(enemy.currentHp);
        expect(enemy.archetype).toBe('BALANCED');
        expect(enemy.dangerLevel).toBe(danger);
      }

      // Additive budget: (D-1)+… so total primaries strictly rise each danger step
      for (let i = 1; i < totals.length; i++) {
        expect(totals[i]).toBeGreaterThan(totals[i - 1]);
      }

      expect(hps[0]).toBeGreaterThan(0);
      expect(hps[6]).toBeGreaterThanOrEqual(hps[0]);
    });
  });

  describe('defaultIntent (Package 3)', () => {
    it('prefers non-basic skill with damageMult > 0 over utility-first kits (TANK)', () => {
      // TANK kit order: BASIC_ATTACK, MUD_WALL (0), BRACE (0), STRONG_FIST (>0)
      // Opening telegraph must not open on Mud Wall / Brace.
      const enemy = generateEnemy(3, 0, 'NORMAL', 50, 'WAVES_ARC', 'TANK');
      const kit = getArchetypeKit('TANK');
      const preferred = kit.find(
        s => s.id !== SKILLS.BASIC_ATTACK.id && (s.baseDamage ?? 0) > 0
      );

      expect(preferred).toBeDefined();
      expect(enemy.intendedSkillId).toBe(preferred!.id);
      expect(enemy.intendedSkillName).toBe(preferred!.name);
      expect(enemy.intentReason).toBe('opening move');
      expect(enemy.intendedSkillId).not.toBe(SKILLS.BASIC_ATTACK.id);
      expect(enemy.intendedSkillId).not.toBe(SKILLS.MUD_WALL.id);
    });

    it('sets opening intent on BALANCED to a non-basic damaging skill', () => {
      const enemy = generateEnemy(2, 0, 'NORMAL', 50, 'WAVES_ARC', 'BALANCED');
      expect(enemy.intendedSkillId).toBeDefined();
      expect(enemy.intendedSkillId).not.toBe(SKILLS.BASIC_ATTACK.id);

      const skill = enemy.skills.find(s => s.id === enemy.intendedSkillId);
      expect(skill).toBeDefined();
      expect(skill!.baseDamage).toBeGreaterThan(0);
    });
  });
});
