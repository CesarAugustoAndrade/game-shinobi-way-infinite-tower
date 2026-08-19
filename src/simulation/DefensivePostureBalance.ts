/**
 * T-126 probe — Defensive Posture SUPPORT Defensive + Shield 25; not toggle buffs.
 */

import { ActionType, CardRole, Clan, Posture } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { CLAN_START_LOADOUT } from '../game/constants';
import { CombatRange } from '../game/types';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { stanceShiftFromSkill } from '../game/systems/PostureSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface DefensivePostureProbe {
  authoring: boolean;
  plant: boolean;
  notToggle: boolean;
  metrics: {
    legacyAp: number;
    apCost: number;
    chakraCost: number;
    shield: number;
    braceShield: number;
    braceAp: number;
    braceCp: number;
  };
}

export function runDefensivePostureProbe(): DefensivePostureProbe {
  const posture = SKILLS.DEFENSIVE_POSTURE;
  const brace = SKILLS.BRACE;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [posture],
    playerBuffs: [],
    enemyHp: 80,
  });
  const planted = resolveSkill({ skill: posture }, state());
  const mark = planted.ok
    ? planted.state.marks.find((m) => m.id === 'defensive_shield')
    : undefined;
  const uzumakiToggle = CLAN_START_LOADOUT[Clan.UZUMAKI]?.toggle ?? [];
  const braceShield = brace.markEffects?.find((m) => m.id === 'brace_shield')?.stacks ?? 0;
  return {
    authoring:
      posture.cardRole === CardRole.SUPPORT &&
      posture.actionType === ActionType.ACTIVE &&
      posture.apCost === 1 &&
      posture.chakraCost === 3 &&
      posture.cooldown === 5 &&
      posture.stanceShift === Posture.DEFENSIVE &&
      posture.markEffects?.some(
        (m) => m.id === 'defensive_shield' && m.stacks === 25 && m.duration === 1,
      ) === true,
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      mark?.stacks === 25 &&
      mark.duration === 1 &&
      stanceShiftFromSkill(posture) === Posture.DEFENSIVE,
    notToggle:
      posture.isToggle !== true &&
      posture.upkeepCost === undefined &&
      posture.modeInteraction === undefined &&
      uzumakiToggle.every((s) => s.id !== 'defensive_posture'),
    metrics: {
      legacyAp: 2,
      apCost: posture.apCost ?? 0,
      chakraCost: posture.chakraCost ?? 0,
      shield: mark?.stacks ?? 0,
      braceShield,
      braceAp: brace.apCost ?? 0,
      braceCp: brace.chakraCost ?? 0,
    },
  };
}

export function printDefensivePostureProbe(probe: DefensivePostureProbe): void {
  const m = probe.metrics;
  console.log('\n── T-126 Defensive Posture probe ──');
  console.log(`  authoring SUPPORT ACTIVE AP1/CP3 Defensive Shield 25: ${probe.authoring}`);
  console.log(`  plant self Shield 25/1; dmg 0:                        ${probe.plant}`);
  console.log(`  not TOGGLE/upkeep; Uzumaki kit not toggle:            ${probe.notToggle}`);
  console.log('  ── balance vs mute TOGGLE AP2/% WIL-SPD and Brace Shield 20 ──');
  console.log(`  AP/CP:    ${m.apCost}/${m.chakraCost}  (was AP${m.legacyAp} toggle upkeep 3)`);
  console.log(
    `  shield:   ${m.shield}  (Brace sibling ${m.braceShield} at AP${m.braceAp}/CP${m.braceCp} CD3)`,
  );
}
