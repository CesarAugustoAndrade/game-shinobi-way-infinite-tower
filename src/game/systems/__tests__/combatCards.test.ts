/**
 * Tests for combatCards helpers (T-004 F1 foundation).
 *
 * These lock the card-classification boundaries so the deckbuilder economy
 * (DeckSystem / PostureSystem, F2) cannot silently drift: category resolution,
 * AP cost derivation, and posture draw weights.
 */

import { describe, it, expect } from 'vitest';
import {
  getCardCategory,
  getDefaultApCost,
  getApCost,
} from '../../constants/combatCards';
import { SKILLS } from '../../constants';
import { ActionType, EffectType, PrimaryStat } from '../../types';
import { createMockSkill } from './testFixtures';

describe('getCardCategory', () => {
  it('classifies a low-damage defensive technique (Rotation) as defensive', () => {
    // damageMult 0.5 (not above the 0.5 threshold) + REFLECTION/SHIELD effects.
    // Defensive utility: 0 damage budget + REFLECTION/SHIELD
    expect((SKILLS.ROTATION.baseDamage ?? 0) + (SKILLS.ROTATION.scalingPerPoint ?? 0) * 3).toBe(0);
    expect(getCardCategory(SKILLS.ROTATION)).toBe('defensive');
  });

  it('classifies a damage skill (Senbon Rain ACTIVE) as offensive', () => {
    const senExpected = (SKILLS.SENBON_RAIN.baseDamage ?? 0) + (SKILLS.SENBON_RAIN.scalingPerPoint ?? 0) * 3;
    expect(senExpected).toBeGreaterThan(0);
    expect(getCardCategory(SKILLS.SENBON_RAIN)).toBe('offensive');
  });

  it('classifies a zero-damage buff to a survival stat (WILLPOWER) as defensive', () => {
    const guard = createMockSkill({
      baseDamage: 0, scalingPerPoint: 0,
      actionType: ActionType.ACTIVE,
      effects: [
        { type: EffectType.BUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.3, duration: 1, chance: 1.0 },
      ],
    });
    expect(getCardCategory(guard)).toBe('defensive');
  });

  it('classifies a zero-damage buff to a survival stat (CALMNESS) as defensive', () => {
    const calm = createMockSkill({
      baseDamage: 0, scalingPerPoint: 0,
      actionType: ActionType.ACTIVE,
      effects: [
        { type: EffectType.BUFF, targetStat: PrimaryStat.CALMNESS, value: 0.5, duration: 3, chance: 1.0 },
      ],
    });
    expect(getCardCategory(calm)).toBe('defensive');
  });

  it('classifies a zero-damage buff to an offensive stat (STRENGTH) as utility', () => {
    const attackBuff = createMockSkill({
      baseDamage: 0, scalingPerPoint: 0,
      actionType: ActionType.ACTIVE,
      effects: [
        { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.25, duration: 2, chance: 1.0 },
      ],
    });
    expect(getCardCategory(attackBuff)).toBe('utility');
  });
});

describe('getApCost', () => {
  it('respects an explicit apCost on the skill', () => {
    const skill = createMockSkill({ actionType: ActionType.ACTIVE, apCost: 3 });
    expect(getApCost(skill)).toBe(3);
  });

  it('derives default cost from ActionType when apCost is absent', () => {
    expect(getDefaultApCost(createMockSkill({ actionType: ActionType.ACTIVE }))).toBe(2);
    expect(getDefaultApCost(createMockSkill({ actionType: ActionType.TOGGLE }))).toBe(2);
    expect(getDefaultApCost(createMockSkill({ actionType: ActionType.PASSIVE }))).toBe(0);
  });

  it('falls back to the ActionType default through getApCost', () => {
    expect(getApCost(createMockSkill({ actionType: ActionType.ACTIVE, apCost: undefined }))).toBe(2);
  });
});

// T-003: draw weights moved to DeckSystem.effectiveWeight (cardRole, not getCardCategory).
