/**
 * T-011 probe — seven Mode skills vs SOUL §8 costs and leftover % Mode buffs.
 */

import { CardRole, EffectType, PrimaryStat } from '../game/types';
import { SKILLS } from '../game/constants';
import { getModeDefinition } from '../game/constants/modes';
import {
  SOUL_MODE_SKILL_REAUTHOR,
  T011_MODE_SKILL_IDS,
} from '../game/constants/modeSkillReauthor';

const PERCENT_MODE_STATS = new Set<PrimaryStat>([
  PrimaryStat.SPEED,
  PrimaryStat.DEXTERITY,
  PrimaryStat.STRENGTH,
]);

export interface ModeSkillsReauthorProbe {
  rows: number;
  costMatches: number;
  linkedDefinitions: number;
  leftoverPercentBuffs: number;
}

export function runModeSkillsReauthorProbe(): ModeSkillsReauthorProbe {
  const byId = new Map(Object.values(SKILLS).map((skill) => [skill.id, skill]));
  let costMatches = 0;
  let linkedDefinitions = 0;
  let leftoverPercentBuffs = 0;

  for (const row of SOUL_MODE_SKILL_REAUTHOR) {
    const skill = byId.get(row.id);
    if (!skill) continue;
    const costsOk =
      skill.cardRole === CardRole.MODE &&
      skill.apCost === row.ap &&
      skill.chakraCost === row.activationChakra &&
      skill.hpCost === row.activationHp &&
      skill.upkeepCost === row.upkeep &&
      skill.cooldown === row.cooldown;
    if (costsOk) costMatches += 1;

    const def = getModeDefinition(skill.modeInteraction?.modeId ?? '');
    if (def && def.id === row.id && def.maxCharges === row.maxCharges) {
      linkedDefinitions += 1;
    }

    leftoverPercentBuffs += (skill.effects ?? []).filter(
      (effect) =>
        effect.type === EffectType.BUFF &&
        effect.targetStat != null &&
        PERCENT_MODE_STATS.has(effect.targetStat) &&
        typeof effect.value === 'number' &&
        effect.value > 0 &&
        effect.value <= 2,
    ).length;
  }

  return {
    rows: T011_MODE_SKILL_IDS.length,
    costMatches,
    linkedDefinitions,
    leftoverPercentBuffs,
  };
}

export function printModeSkillsReauthorProbe(probe: ModeSkillsReauthorProbe): void {
  console.log('\n── T-011 Mode skill reauthor probe ──');
  console.log(`  rows:                  ${probe.rows}`);
  console.log(`  SOUL cost matches:     ${probe.costMatches}/${probe.rows}`);
  console.log(`  ModeDefinition links:  ${probe.linkedDefinitions}/${probe.rows}`);
  console.log(`  leftover % Mode buffs: ${probe.leftoverPercentBuffs}`);
}
