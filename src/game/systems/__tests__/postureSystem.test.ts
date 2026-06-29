/**
 * Tests for PostureSystem helpers (T-004 F2).
 *
 * These lock the posture trade-off so it cannot silently drift back to a state
 * where DEFENSIVE is strictly worse:
 *  - `postureDamageMod`  — outgoing damage multiplier.
 *  - `postureDefenseMod` — incoming damage multiplier (wired into EnemyTurnSystem).
 *  - reciprocity         — deal-mod === take-mod per posture (symmetric trade-off).
 *  - `stanceShiftFromSkill` — passthrough of `Skill.stanceShift`.
 */

import { describe, it, expect } from 'vitest';
import {
  postureDamageMod,
  postureDefenseMod,
  stanceShiftFromSkill,
} from '../PostureSystem';
import { Posture } from '../../types';
import { createMockSkill } from './testFixtures';

describe('postureDamageMod', () => {
  it('boosts outgoing damage in AGGRESSIVE (+15%)', () => {
    expect(postureDamageMod(Posture.AGGRESSIVE)).toBe(1.15);
  });

  it('is neutral in BALANCED (×1.0)', () => {
    expect(postureDamageMod(Posture.BALANCED)).toBe(1.0);
  });

  it('softens outgoing damage in DEFENSIVE (-15%)', () => {
    expect(postureDamageMod(Posture.DEFENSIVE)).toBe(0.85);
  });
});

describe('postureDefenseMod', () => {
  it('exposes the player in AGGRESSIVE (takes +15%)', () => {
    expect(postureDefenseMod(Posture.AGGRESSIVE)).toBe(1.15);
  });

  it('is neutral in BALANCED (×1.0)', () => {
    expect(postureDefenseMod(Posture.BALANCED)).toBe(1.0);
  });

  it('absorbs damage in DEFENSIVE (takes -15%)', () => {
    expect(postureDefenseMod(Posture.DEFENSIVE)).toBe(0.85);
  });
});

describe('posture trade-off symmetry', () => {
  // The deal-mod and take-mod are reciprocal per posture, so no posture is
  // strictly dominant: AGGRESSIVE = glass cannon, DEFENSIVE = tanky.
  it('keeps deal-mod and take-mod equal for every posture', () => {
    for (const posture of [Posture.AGGRESSIVE, Posture.BALANCED, Posture.DEFENSIVE]) {
      expect(postureDamageMod(posture)).toBe(postureDefenseMod(posture));
    }
  });

  it('orders AGGRESSIVE > BALANCED > DEFENSIVE on both axes', () => {
    expect(postureDamageMod(Posture.AGGRESSIVE)).toBeGreaterThan(postureDamageMod(Posture.BALANCED));
    expect(postureDamageMod(Posture.BALANCED)).toBeGreaterThan(postureDamageMod(Posture.DEFENSIVE));
    expect(postureDefenseMod(Posture.AGGRESSIVE)).toBeGreaterThan(postureDefenseMod(Posture.BALANCED));
    expect(postureDefenseMod(Posture.BALANCED)).toBeGreaterThan(postureDefenseMod(Posture.DEFENSIVE));
  });
});

describe('stanceShiftFromSkill', () => {
  it('passes through the card\'s declared stanceShift', () => {
    const shifter = createMockSkill({ stanceShift: Posture.DEFENSIVE });
    expect(stanceShiftFromSkill(shifter)).toBe(Posture.DEFENSIVE);
  });

  it('returns undefined when the card does not shift stance', () => {
    const plain = createMockSkill({ stanceShift: undefined });
    expect(stanceShiftFromSkill(plain)).toBeUndefined();
  });
});
