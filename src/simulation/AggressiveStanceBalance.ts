/**
 * T-127 probe — Aggressive Stance SUPPORT Aggressive + next ATTACK ×1.2 Setup; open plant.
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  Clan,
  CombatRange,
  Posture,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { CLAN_START_LOADOUT } from '../game/constants';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { stanceShiftFromSkill } from '../game/systems/PostureSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface AggressiveStanceProbe {
  authoring: boolean;
  plant: boolean;
  setup: boolean;
  metrics: {
    legacyAp: number;
    apCost: number;
    chakraCost: number;
    setupMult: number;
    openStacks: number;
    baselineDmg: number;
    armedDmg: number;
    focusedAp: number;
    focusedCp: number;
  };
}

export function runAggressiveStanceProbe(): AggressiveStanceProbe {
  const stance = SKILLS.AGGRESSIVE_STANCE;
  const focused = SKILLS.FOCUSED_STANCE;
  const nextAttack = createMockSkill({
    id: 'next_attack',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    hitCount: 1,
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE],
  });
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [stance],
    playerBuffs: [],
    enemyHp: 80,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: 10 }) };
  const planted = resolveSkill({ skill: stance }, state());
  const armed =
    planted.ok ? resolveSkill({ skill: nextAttack }, planted.state, hit) : planted;
  const clean = resolveSkill({ skill: nextAttack }, { ...state(), skills: [nextAttack] }, hit);
  const leeToggle = CLAN_START_LOADOUT[Clan.LEE]?.toggle ?? [];
  const leeActive = CLAN_START_LOADOUT[Clan.LEE]?.active ?? [];
  return {
    authoring:
      stance.cardRole === CardRole.SUPPORT &&
      stance.actionType === ActionType.ACTIVE &&
      stance.apCost === 1 &&
      stance.chakraCost === 3 &&
      stance.cooldown === 5 &&
      stance.stanceShift === Posture.AGGRESSIVE &&
      stance.isToggle !== true &&
      stance.upkeepCost === undefined &&
      leeActive.some((s) => s.id === 'aggressive_stance') &&
      leeToggle.every((s) => s.id !== 'aggressive_stance'),
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      planted.state.marks.some((m) => m.id === 'aggressive_focus' && m.duration === 2) &&
      planted.state.marks.some(
        (m) => m.id === 'aggressive_open' && m.duration === 1 && m.stacks === 20,
      ) &&
      stanceShiftFromSkill(stance) === Posture.AGGRESSIVE,
    setup:
      armed.ok === true &&
      armed.attemptSpent.some((m) => m.id === 'aggressive_focus') &&
      !armed.state.marks.some((m) => m.id === 'aggressive_focus') &&
      armed.state.marks.some((m) => m.id === 'aggressive_open') &&
      armed.damageDealt === Math.floor(10 * 1.2) &&
      clean.ok === true &&
      clean.damageDealt === 10,
    metrics: {
      legacyAp: 2,
      apCost: stance.apCost ?? 0,
      chakraCost: stance.chakraCost ?? 0,
      setupMult: 1.2,
      openStacks: 20,
      baselineDmg: clean.ok ? clean.damageDealt : 0,
      armedDmg: armed.ok ? armed.damageDealt : 0,
      focusedAp: focused.apCost ?? 0,
      focusedCp: focused.chakraCost ?? 0,
    },
  };
}

export function printAggressiveStanceProbe(probe: AggressiveStanceProbe): void {
  const m = probe.metrics;
  console.log('\n── T-127 Aggressive Stance probe ──');
  console.log(`  authoring SUPPORT ACTIVE AP1/CP3 Aggressive Setup+open: ${probe.authoring}`);
  console.log(`  plant self focus 2 + open 20/1; dmg 0:                   ${probe.plant}`);
  console.log(`  next ATTACK ×1.2 Setup consume focus; open remains:      ${probe.setup}`);
  console.log('  ── balance vs mute TOGGLE AP2/% STR-WIL and Focused sibling ──');
  console.log(`  AP/CP:       ${m.apCost}/${m.chakraCost}  (was AP${m.legacyAp} toggle upkeep 5)`);
  console.log(
    `  Setup dmg:   ${m.baselineDmg} → ${m.armedDmg} (×${m.setupMult}); open stacks ${m.openStacks} plant-only`,
  );
  console.log(`  Focused sibling: AP${m.focusedAp}/CP${m.focusedCp} Balanced +20 crit (not +20% dmg)`);
}
