/**
 * T-063: location terrain effect helpers
 */

import { describe, it, expect } from 'vitest';
import {
  getLocationTerrainMods,
  skillLocationDamageMult,
  applyEnemyDefenseBonus,
  locationStealthBonusPoints,
  formatLocationTerrainEffectLines,
  applyMovementPenaltyToMaxAp,
  applyVisibilityToIntelGain,
  formatRoomTerrainEffectLines,
  getRoomVisibilityRange,
  getRoomHiddenRoomBonus,
  getRoomMovementCost,
  applyRoomMovementCostToMaxAp,
} from '../LocationTerrainSystem';
import { DamageType, ElementType, TerrainType } from '../../types';
import { createMockSkill } from './testFixtures';

describe('getLocationTerrainMods', () => {
  it('returns empty mods for missing effects', () => {
    const m = getLocationTerrainMods(undefined);
    expect(m.stealthBonus).toBe(0);
    expect(m.waterDamageBonus).toBe(0);
  });

  it('sums known effect types and ignores unknown', () => {
    const m = getLocationTerrainMods([
      { type: 'water_damage_bonus', value: 0.2 },
      { type: 'water_damage_bonus', value: 0.1 },
      { type: 'stealth_bonus', value: 0.15 },
      { type: 'enemy_defense_bonus', value: 0.2 },
      { type: 'poison_hazard', value: 0.5 },
    ]);
    expect(m.waterDamageBonus).toBeCloseTo(0.3);
    expect(m.stealthBonus).toBeCloseTo(0.15);
    expect(m.enemyDefenseBonus).toBeCloseTo(0.2);
  });
});

describe('skillLocationDamageMult', () => {
  it('boosts water skills on water_damage_bonus', () => {
    const skill = createMockSkill({ element: ElementType.WATER });
    const m = getLocationTerrainMods([{ type: 'water_damage_bonus', value: 0.2 }]);
    expect(skillLocationDamageMult(skill, m)).toBeCloseTo(1.2);
  });

  it('applies fire_damage_penalty (negative)', () => {
    const skill = createMockSkill({ element: ElementType.FIRE });
    const m = getLocationTerrainMods([{ type: 'fire_damage_penalty', value: -0.5 }]);
    expect(skillLocationDamageMult(skill, m)).toBeCloseTo(0.5);
  });

  it('boosts mental damage type', () => {
    const skill = createMockSkill({
      element: ElementType.PHYSICAL,
      damageType: DamageType.MENTAL,
    });
    const m = getLocationTerrainMods([{ type: 'mental_damage_bonus', value: 0.25 }]);
    expect(skillLocationDamageMult(skill, m)).toBeCloseTo(1.25);
  });
});

describe('applyEnemyDefenseBonus', () => {
  it('reduces damage by enemy_defense_bonus', () => {
    const m = getLocationTerrainMods([{ type: 'enemy_defense_bonus', value: 0.2 }]);
    expect(applyEnemyDefenseBonus(100, m)).toBe(80);
  });
});

describe('enemy_attack_bonus and ambush_chance (T-064)', () => {
  it('sums enemy_attack_bonus for combat mult', () => {
    const m = getLocationTerrainMods([{ type: 'enemy_attack_bonus', value: 0.15 }]);
    expect(m.enemyAttackBonus).toBeCloseTo(0.15);
    // floor(100 * 1.15) may be 114 with float error; use round for expectation
    expect(Math.round(100 * (1 + m.enemyAttackBonus))).toBe(115);
  });

  it('sums ambush_chance for elite roll boost', () => {
    const m = getLocationTerrainMods([
      { type: 'ambush_chance', value: 0.2 },
      { type: 'ambush_chance', value: 0.1 },
    ]);
    expect(m.ambushChance).toBeCloseTo(0.3);
    expect(Math.min(0.7, 0.3 + m.ambushChance)).toBeCloseTo(0.6);
  });
});

describe('locationStealthBonusPoints', () => {
  it('converts fraction stealth to approach points', () => {
    const m = getLocationTerrainMods([{ type: 'stealth_bonus', value: 0.15 }]);
    expect(locationStealthBonusPoints(m)).toBe(15);
  });
});

describe('formatLocationTerrainEffectLines', () => {
  it('formats human-readable labels', () => {
    const lines = formatLocationTerrainEffectLines([
      { type: 'stealth_bonus', value: 0.15 },
      { type: 'water_damage_bonus', value: 0.2 },
    ]);
    expect(lines.some((l) => l.includes('Stealth'))).toBe(true);
    expect(lines.some((l) => l.includes('Water'))).toBe(true);
  });

  it('formats hazard and evasion lines (T-066)', () => {
    const lines = formatLocationTerrainEffectLines([
      { type: 'poison_hazard', value: 0.1 },
      { type: 'chakra_drain', value: 0.15 },
      { type: 'evasion_bonus', value: 0.1 },
    ]);
    expect(lines.some((l) => l.includes('Poison'))).toBe(true);
    expect(lines.some((l) => l.includes('Chakra'))).toBe(true);
    expect(lines.some((l) => l.includes('Evasion'))).toBe(true);
  });
});

describe('location hazards (T-066)', () => {
  it('sums poison, fall, chakra, evasion', () => {
    const m = getLocationTerrainMods([
      { type: 'poison_hazard', value: 0.1 },
      { type: 'fall_hazard', value: 0.05 },
      { type: 'chakra_drain', value: 0.2 },
      { type: 'evasion_bonus', value: 0.12 },
    ]);
    expect(m.poisonHazard).toBeCloseTo(0.1);
    expect(m.fallHazard).toBeCloseTo(0.05);
    expect(m.chakraDrain).toBeCloseTo(0.2);
    expect(m.evasionBonus).toBeCloseTo(0.12);
  });
});

describe('movement and visibility (T-067)', () => {
  it('reduces max AP by movement_penalty', () => {
    const m = getLocationTerrainMods([{ type: 'movement_penalty', value: 0.2 }]);
    expect(applyMovementPenaltyToMaxAp(10, m)).toBe(8);
    expect(applyMovementPenaltyToMaxAp(2, m)).toBe(1);
  });

  it('scales intel gain by visibility_penalty', () => {
    const m = getLocationTerrainMods([{ type: 'visibility_penalty', value: -0.2 }]);
    expect(applyVisibilityToIntelGain(25, m)).toBe(20);
    expect(applyVisibilityToIntelGain(5, m)).toBe(4);
  });
});

describe('formatRoomTerrainEffectLines (T-079)', () => {
  it('labels room evasion and element amplify', () => {
    const lines = formatRoomTerrainEffectLines({
      id: TerrainType.FOG_BANK,
      name: 'Fog',
      description: 'test',
      biome: 'WAVES',
      effects: {
        stealthModifier: 30,
        visibilityRange: 1,
        hiddenRoomBonus: 0,
        movementCost: 1,
        initiativeModifier: 5,
        evasionModifier: 0.12,
        elementAmplify: ElementType.WATER,
        elementAmplifyPercent: 25,
      },
    });
    expect(lines.some((l) => l.includes('evade'))).toBe(true);
    expect(lines.some((l) => l.includes('WATER') || l.includes('Water'))).toBe(true);
    expect(lines.some((l) => l.includes('Init'))).toBe(true);
  });

  it('includes Pace when movementCost != 1 (T-083)', () => {
    const lines = formatRoomTerrainEffectLines({
      id: TerrainType.FOG_BANK,
      name: 'Fog',
      description: 'test',
      biome: 'WAVES',
      effects: {
        stealthModifier: 0,
        visibilityRange: 1,
        hiddenRoomBonus: 0,
        movementCost: 1.3,
        initiativeModifier: 0,
        evasionModifier: 0,
      },
    });
    expect(lines.some((l) => l.includes('Pace'))).toBe(true);
  });
});

describe('getRoomVisibilityRange (T-080)', () => {
  it('returns authored range clamped 1–3', () => {
    expect(getRoomVisibilityRange({
      id: TerrainType.FOG_BANK,
      name: 'Fog',
      description: 'test',
      biome: 'WAVES',
      effects: {
        stealthModifier: 0,
        visibilityRange: 1,
        hiddenRoomBonus: 0,
        movementCost: 1,
        initiativeModifier: 0,
        evasionModifier: 0,
      },
    })).toBe(1);
    expect(getRoomVisibilityRange(null)).toBe(2);
  });
});

describe('getRoomHiddenRoomBonus (T-081)', () => {
  it('converts percent points to fraction and clamps', () => {
    expect(getRoomHiddenRoomBonus({
      id: TerrainType.FOG_BANK,
      name: 'Fog',
      description: 'test',
      biome: 'WAVES',
      effects: {
        stealthModifier: 0,
        visibilityRange: 1,
        hiddenRoomBonus: 20,
        movementCost: 1,
        initiativeModifier: 0,
        evasionModifier: 0,
      },
    })).toBeCloseTo(0.2);
    expect(getRoomHiddenRoomBonus(null)).toBe(0);
  });
});

describe('room movementCost (T-082)', () => {
  const mk = (cost: number) => ({
    id: TerrainType.FOG_BANK,
    name: 'Fog',
    description: 'test',
    biome: 'WAVES',
    effects: {
      stealthModifier: 0,
      visibilityRange: 1,
      hiddenRoomBonus: 0,
      movementCost: cost,
      initiativeModifier: 0,
      evasionModifier: 0,
    },
  });

  it('clamps cost and scales max AP', () => {
    expect(getRoomMovementCost(mk(1.5))).toBe(1.5);
    expect(getRoomMovementCost(mk(0.5))).toBe(0.8);
    expect(applyRoomMovementCostToMaxAp(10, mk(1.0))).toBe(10);
    expect(applyRoomMovementCostToMaxAp(10, mk(1.5))).toBe(7);
    expect(applyRoomMovementCostToMaxAp(10, mk(0.8))).toBe(13);
    expect(applyRoomMovementCostToMaxAp(1, mk(1.5))).toBe(1);
  });
});
