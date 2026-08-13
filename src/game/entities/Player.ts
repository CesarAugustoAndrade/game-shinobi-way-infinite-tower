import { Player, Clan, EquipmentSlot, TreasureQuality, DEFAULT_MERCHANT_SLOTS, MAX_BAG_SLOTS, ApproachType } from '../types';
import { CLAN_STATS, CLAN_ELEMENTS, getClanStartingSkills } from '../constants';
import { calculateDerivedStats } from '../systems/StatSystem';
import { LaunchProperties } from '../../config/featureFlags';
import { bootstrapPlayerSkillConfig } from '../systems/SkillConfigLive';

/**
 * Create a new player with starting stats for the given clan (F1: bases 1 / affinity 3).
 */
export const createPlayer = (clan: Clan): Player => {
  const baseStats = CLAN_STATS[clan];
  const startingSkills = getClanStartingSkills(clan);
  const derived = calculateDerivedStats(baseStats, {});

  const skills = startingSkills.map(skill => ({ ...skill, level: 1 }));
  const bootstrapped = bootstrapPlayerSkillConfig(
    {
      clan,
      level: 1,
      exp: 0,
      maxExp: 100,
      primaryStats: { ...baseStats },
      unspentStatPoints: 0,
      currentHp: derived.maxHp,
      currentChakra: derived.maxChakra,
      element: CLAN_ELEMENTS[clan],
      ryo: LaunchProperties.STARTING_RYO,
      equipment: {
        [EquipmentSlot.SLOT_1]: null,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
      skills,
      skillConfig: { mainAttackId: null, modeUpkeepPriority: [] },
      activeBuffs: [],
      bag: Array(MAX_BAG_SLOTS).fill(null),
      treasureQuality: TreasureQuality.BROKEN,
      merchantSlots: DEFAULT_MERCHANT_SLOTS,
      locationsCleared: 0,
      clanLevel: 0,
      eventFlags: {},
      preferredApproach: ApproachType.FRONTAL_ASSAULT,
    },
    Math.random,
  );

  return bootstrapped.player;
};
