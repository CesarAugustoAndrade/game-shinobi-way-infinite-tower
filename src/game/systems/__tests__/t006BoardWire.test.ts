/**
 * T-006 AC tests: posture ±20%, PUSH@LONG reactions, FREE_FIRST + expensive AP card.
 */

import { describe, it, expect } from 'vitest';
import { ActionType, CombatRange, Posture, RangeMoveSubject, RangeMoveTrigger } from '../../types';
import { LaunchProperties } from '../../../config/featureFlags';
import { postureDamageMod, postureDefenseMod } from '../PostureSystem';
import {
  applyForcedMove,
  collectRangeReactions,
  resolveForcedMove,
} from '../RangeSystem';
import {
  getSkillBlockReason,
  snapshotHandSlot,
} from '../skillPlayability';
import { createMockSkill } from './testFixtures';

describe('T-006 posture', () => {
  it('uses SOUL ±20% deal/take mods', () => {
    expect(postureDamageMod(Posture.AGGRESSIVE)).toBe(1.2);
    expect(postureDefenseMod(Posture.AGGRESSIVE)).toBe(1.2);
    expect(postureDamageMod(Posture.BALANCED)).toBe(1.0);
    expect(postureDefenseMod(Posture.BALANCED)).toBe(1.0);
    expect(postureDamageMod(Posture.DEFENSIVE)).toBe(0.8);
    expect(postureDefenseMod(Posture.DEFENSIVE)).toBe(0.8);
  });

  it('keeps manual posture switch at 1 AP', () => {
    expect(LaunchProperties.POSTURE_SWITCH_AP_COST).toBe(1);
  });
});

describe('T-006 range reactions', () => {
  const trap = {
    id: 'wire',
    trigger: RangeMoveTrigger.PUSH,
    subject: RangeMoveSubject.FOE,
    baseDamage: 4,
  };

  it('PUSH from LONG does not move and yields no reactions', () => {
    const pushed = applyForcedMove(CombatRange.LONG, 'PUSH');
    expect(pushed.moved).toBe(false);
    expect(pushed.range).toBe(CombatRange.LONG);
    expect(collectRangeReactions(pushed.trigger, pushed.moved, false, [trap])).toEqual([]);
  });

  it('a real band change can enqueue provided reactions', () => {
    const fromClose = resolveForcedMove(CombatRange.CLOSE, 'PUSH', true, [trap]);
    expect(fromClose.moved).toBe(true);
    expect(fromClose.range).toBe(CombatRange.MEDIUM);
    expect(fromClose.reactions.map((r) => r.id)).toEqual(['wire']);
    expect(fromClose.playerMoveUsedThisTurn).toBe(true);
  });

  it('forced move does not flip the voluntary-move-used flag', () => {
    const unused = resolveForcedMove(CombatRange.MEDIUM, 'PULL', false, [trap]);
    expect(unused.moved).toBe(true);
    expect(unused.playerMoveUsedThisTurn).toBe(false);
    const already = resolveForcedMove(CombatRange.MEDIUM, 'PUSH', true, []);
    expect(already.playerMoveUsedThisTurn).toBe(true);
  });
});

describe('T-006 free first and ap', () => {
  const expensive = createMockSkill({
    id: 'rasengan',
    actionType: ActionType.ACTIVE,
    chakraCost: 40,
    hpCost: 8,
    apCost: 4,
  });

  it('waives chakra but still requires AP and HP when FREE_FIRST is set', () => {
    const apBlock = getSkillBlockReason({
      skill: expensive,
      currentChakra: 0,
      currentHp: 100,
      maxHp: 100,
      currentAp: 1,
      activeBuffs: [],
      skipFirstSkillCost: true,
    });
    expect(apBlock).toBe('ap');

    const hpBlock = getSkillBlockReason({
      skill: expensive,
      currentChakra: 0,
      currentHp: 5,
      maxHp: 100,
      currentAp: 10,
      activeBuffs: [],
      skipFirstSkillCost: true,
    });
    expect(hpBlock).toBe('hp');
  });

  it('keeps an over-AP card as a disabled hand slot', () => {
    const slot = snapshotHandSlot({
      skill: expensive,
      currentChakra: 50,
      currentHp: 100,
      maxHp: 100,
      currentAp: 2,
      activeBuffs: [],
    });
    expect(slot.reason).toBe('ap');
    expect(slot.disabled).toBe(true);
    expect(slot.skill.id).toBe('rasengan');
  });
});
