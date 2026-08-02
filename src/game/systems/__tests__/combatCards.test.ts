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
  weightFor,
  CARD_BASE_WEIGHT,
} from '../../constants/combatCards';
import { SKILLS } from '../../constants';
import { ActionType, EffectType, Posture, PrimaryStat } from '../../types';
import { createMockSkill } from './testFixtures';

describe('getCardCategory', () => {
  it('classifies a low-damage defensive technique (Rotation) as defensive', () => {
    // damageMult 0.5 (not above the 0.5 threshold) + REFLECTION/SHIELD effects.
    expect(SKILLS.ROTATION.damageMult).toBe(0.5);
    expect(getCardCategory(SKILLS.ROTATION)).toBe('defensive');
  });

  it('classifies a damage skill (Senbon Rain, 0.8 mult ACTIVE) as offensive', () => {
    expect(SKILLS.SENBON_RAIN.damageMult).toBe(0.8);
    expect(getCardCategory(SKILLS.SENBON_RAIN)).toBe('offensive');
  });

  it('classifies a zero-damage buff to a survival stat (WILLPOWER) as defensive', () => {
    const guard = createMockSkill({
      damageMult: 0,
      actionType: ActionType.ACTIVE,
      effects: [
        { type: EffectType.BUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.3, duration: 1, chance: 1.0 },
      ],
    });
    expect(getCardCategory(guard)).toBe('defensive');
  });

  it('classifies a zero-damage buff to a survival stat (CALMNESS) as defensive', () => {
    const calm = createMockSkill({
      damageMult: 0,
      actionType: ActionType.ACTIVE,
      effects: [
        { type: EffectType.BUFF, targetStat: PrimaryStat.CALMNESS, value: 0.5, duration: 3, chance: 1.0 },
      ],
    });
    expect(getCardCategory(calm)).toBe('defensive');
  });

  it('classifies a zero-damage buff to an offensive stat (STRENGTH) as utility', () => {
    const attackBuff = createMockSkill({
      damageMult: 0,
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

describe('weightFor', () => {
  const offensive = createMockSkill({ damageMult: 2.0 });
  const defensive = createMockSkill({
    damageMult: 0,
    effects: [{ type: EffectType.SHIELD, value: 40, duration: 2, chance: 1.0 }],
  });

  it('never returns a non-positive weight for any posture/category', () => {
    for (const posture of [Posture.AGGRESSIVE, Posture.BALANCED, Posture.DEFENSIVE]) {
      expect(weightFor(offensive, posture)).toBeGreaterThan(0);
      expect(weightFor(defensive, posture)).toBeGreaterThan(0);
    }
  });

  it('biases offensive cards up under the aggressive posture', () => {
    // Aggressive: offensive ×2.0, defensive ×0.5 (relative to CARD_BASE_WEIGHT).
    expect(weightFor(offensive, Posture.AGGRESSIVE)).toBe(CARD_BASE_WEIGHT * 2.0);
    expect(weightFor(defensive, Posture.AGGRESSIVE)).toBe(CARD_BASE_WEIGHT * 0.5);
    expect(weightFor(offensive, Posture.AGGRESSIVE)).toBeGreaterThan(
      weightFor(defensive, Posture.AGGRESSIVE)
    );
  });

  it('biases defensive cards up under the defensive posture', () => {
    // Defensive: offensive ×0.5, defensive ×2.0.
    expect(weightFor(defensive, Posture.DEFENSIVE)).toBe(CARD_BASE_WEIGHT * 2.0);
    expect(weightFor(offensive, Posture.DEFENSIVE)).toBe(CARD_BASE_WEIGHT * 0.5);
    expect(weightFor(defensive, Posture.DEFENSIVE)).toBeGreaterThan(
      weightFor(offensive, Posture.DEFENSIVE)
    );
  });

  it('keeps every category neutral under the balanced posture', () => {
    expect(weightFor(offensive, Posture.BALANCED)).toBe(CARD_BASE_WEIGHT);
    expect(weightFor(defensive, Posture.BALANCED)).toBe(CARD_BASE_WEIGHT);
  });
});
