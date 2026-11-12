/**
 * T-067 live wiring: pendingCpUpkeepDiscount survives finishCardPlay → processUpkeep.
 */
import { describe, expect, it } from 'vitest';
import {
  Clan,
  ElementType,
  ModeRuntimeState,
  Player,
  Posture,
  PrimaryAttributes,
  TreasureQuality,
  ApproachType,
  EquipmentSlot,
} from '../../types';
import { createCombatState } from '../CombatWorkflowSystem';
import { processUpkeep } from '../PlayerTurnSystem';
import { calculateDerivedStats } from '../StatSystem';
import {
  FOCUSED_BREATHING_UPKEEP_DISCOUNT,
  applyCpUpkeepDiscount,
} from '../FocusedBreathingDiscountSystem';

const PRIMARY: PrimaryAttributes = {
  willpower: 5,
  chakra: 5,
  strength: 5,
  spirit: 5,
  intelligence: 5,
  calmness: 5,
  speed: 5,
  accuracy: 5,
  dexterity: 5,
};

function stubPlayer(chakra: number): Player {
  return {
    clan: Clan.UZUMAKI,
    level: 1,
    exp: 0,
    maxExp: 100,
    unspentStatPoints: 0,
    primaryStats: { ...PRIMARY },
    currentHp: 100,
    currentChakra: chakra,
    element: ElementType.FIRE,
    ryo: 0,
    equipment: {
      [EquipmentSlot.SLOT_1]: null,
      [EquipmentSlot.SLOT_2]: null,
      [EquipmentSlot.SLOT_3]: null,
      [EquipmentSlot.SLOT_4]: null,
    },
    skills: [],
    activeBuffs: [],
    bag: Array(12).fill(null),
    treasureQuality: TreasureQuality.BROKEN,
    merchantSlots: 1,
    locationsCleared: 0,
    clanLevel: 0,
    eventFlags: {},
    preferredApproach: ApproachType.FRONTAL_ASSAULT,
  };
}

function stubStats() {
  const derived = calculateDerivedStats(PRIMARY);
  return {
    primary: { ...PRIMARY },
    derived,
    effectivePrimary: { ...PRIMARY },
  };
}

describe('pendingCpUpkeepDiscount live upkeep', () => {
  it('applyCpUpkeepDiscount reduces first CP cost and consumes', () => {
    const applied = applyCpUpkeepDiscount(
      { chakra: 4 },
      FOCUSED_BREATHING_UPKEEP_DISCOUNT,
    );
    expect(applied.cost.chakra).toBe(2);
    expect(applied.consumed).toBe(true);
    expect(applied.remaining).toBe(0);
  });

  it('processUpkeep pays discounted CP Mode upkeep and clears pending', () => {
    const player = stubPlayer(10);
    const stats = stubStats();
    const combatState = {
      ...createCombatState(),
      posture: Posture.BALANCED,
      hand: [],
      playablePool: [],
      turnIndex: 1,
      pendingCpUpkeepDiscount: FOCUSED_BREATHING_UPKEEP_DISCOUNT,
      activeModes: [
        {
          id: 'byakugan',
          family: 'HYUGA',
          charges: 2,
          cooldown: 4,
          state: ModeRuntimeState.ON,
          stage: 1,
        },
      ],
      modeUpkeepPriority: ['byakugan'],
    };

    const result = processUpkeep(player, stats, combatState);
    expect(result.player.currentChakra).toBe(8);
    expect(result.pendingCpUpkeepDiscount).toBeUndefined();
    expect(result.activeModes.some((m) => m.id === 'byakugan' && m.state === ModeRuntimeState.ON)).toBe(
      true,
    );
  });

  it('processUpkeep does not consume discount on HP-only Mode upkeep', () => {
    const player = stubPlayer(10);
    const stats = stubStats();
    const combatState = {
      ...createCombatState(),
      posture: Posture.BALANCED,
      hand: [],
      playablePool: [],
      turnIndex: 1,
      pendingCpUpkeepDiscount: FOCUSED_BREATHING_UPKEEP_DISCOUNT,
      activeModes: [
        {
          id: 'gate_of_life',
          family: 'GATES',
          charges: 2,
          cooldown: 6,
          state: ModeRuntimeState.ON,
          stage: 3,
        },
      ],
      modeUpkeepPriority: ['gate_of_life'],
    };

    const result = processUpkeep(player, stats, combatState);
    expect(result.pendingCpUpkeepDiscount).toBe(FOCUSED_BREATHING_UPKEEP_DISCOUNT);
    expect(result.player.currentChakra).toBe(10);
    expect(result.player.currentHp).toBe(92);
  });
});
