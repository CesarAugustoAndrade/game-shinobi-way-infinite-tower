/**
 * T-145 AC: playability + kill reset honor readyOnTurn, not only currentCooldown.
 */

import { describe, expect, it } from 'vitest';
import { CombatRange, EquipmentSlot, PassiveEffectType } from '../../types';
import { getSkillBlockReason } from '../skillPlayability';
import { processPassivesOnKill } from '../EquipmentPassiveSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockArtifact, createMockEnemy, createMockPlayer, createMockSkill } from './testFixtures';

const T = 2;

function playCtx(overrides: {
  readyOnTurn?: number;
  currentCooldown?: number;
  turnIndex?: number;
}) {
  const skill = createMockSkill({
    id: 'chidori',
    cooldown: 2,
    currentCooldown: overrides.currentCooldown ?? 0,
    readyOnTurn: overrides.readyOnTurn,
    chakraCost: 0,
    hpCost: 0,
    apCost: 1,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  return {
    skill,
    currentChakra: 20,
    currentHp: 40,
    maxHp: 40,
    currentAp: 6,
    currentRange: CombatRange.MEDIUM,
    activeBuffs: [],
    turnIndex: overrides.turnIndex,
  };
}

describe('T-145 playability', () => {
  it('readyOnTurn T+2 blocks at T+1 and is ready at T+2', () => {
    expect(
      getSkillBlockReason(playCtx({ readyOnTurn: T + 2, turnIndex: T + 1 })),
    ).toBe('cooldown');
    expect(
      getSkillBlockReason(playCtx({ readyOnTurn: T + 2, turnIndex: T + 2 })),
    ).not.toBe('cooldown');
    expect(getSkillBlockReason(playCtx({ readyOnTurn: T + 2, turnIndex: T + 2 }))).toBeNull();
  });
});

describe('T-145 kill', () => {
  it('COOLDOWN_RESET_ON_KILL clears readyOnTurn and currentCooldown', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.COOLDOWN_RESET_ON_KILL,
      triggerCondition: 'on_kill',
    };
    const locked = createMockSkill({
      id: 'chidori',
      cooldown: 2,
      currentCooldown: 3,
      readyOnTurn: 9,
    });
    const player = createMockPlayer({
      skills: [locked],
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const result = processPassivesOnKill(player, createMockEnemy());
    expect(result.player.skills[0]?.currentCooldown).toBe(0);
    expect(result.player.skills[0]?.readyOnTurn).toBe(0);
  });
});

describe('T-145 parity', () => {
  it('currentCooldown 0 with future readyOnTurn is cooldown in playability and rejected by resolve', () => {
    const skill = createMockSkill({
      id: 'chidori',
      cooldown: 2,
      currentCooldown: 0,
      readyOnTurn: T + 2,
      chakraCost: 0,
      hpCost: 0,
      apCost: 1,
      allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
    });
    expect(
      getSkillBlockReason({
        skill,
        currentChakra: 20,
        currentHp: 40,
        maxHp: 40,
        currentAp: 6,
        currentRange: CombatRange.MEDIUM,
        activeBuffs: [],
        turnIndex: T + 1,
      }),
    ).toBe('cooldown');

    const state: ResolveSkillState = {
      pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
      range: CombatRange.MEDIUM,
      turnIndex: T + 1,
      marks: [],
      modes: emptyModeBoard(),
      skills: [skill],
      playerBuffs: [],
      enemyHp: 80,
    };
    const resolved = resolveSkill({ skill }, state);
    expect(resolved.ok).toBe(false);
  });
});
