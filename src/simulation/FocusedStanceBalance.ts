/**
 * T-125 probe — Focused Stance SUPPORT Balanced + Focused 2 (+20 crit next ATTACK).
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatRange,
  Posture,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { CLAN_START_LOADOUT } from '../game/constants';
import { Clan } from '../game/types';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { stanceShiftFromSkill } from '../game/systems/PostureSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface FocusedStanceProbe {
  authoring: boolean;
  plant: boolean;
  crit: boolean;
  metrics: {
    legacyAp: number;
    apCost: number;
    chakraCost: number;
    critPoints: number;
    cloakDuration: number;
    braceShift: string;
  };
}

export function runFocusedStanceProbe(): FocusedStanceProbe {
  const stance = SKILLS.FOCUSED_STANCE;
  const cloak = SKILLS.CLOAK_INVIS;
  const brace = SKILLS.BRACE;
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
    planted.ok
      ? resolveSkill({ skill: nextAttack }, planted.state, hit)
      : planted;
  const yamanakaToggle = CLAN_START_LOADOUT[Clan.YAMANAKA]?.toggle ?? [];
  const cloakMark = cloak.markEffects?.find((m) => m.id === 'cloaked');
  return {
    authoring:
      stance.cardRole === CardRole.SUPPORT &&
      stance.actionType === ActionType.ACTIVE &&
      stance.apCost === 1 &&
      stance.chakraCost === 3 &&
      stance.cooldown === 5 &&
      stance.stanceShift === Posture.BALANCED &&
      stance.isToggle !== true &&
      stance.upkeepCost === undefined &&
      yamanakaToggle.every((s) => s.id !== 'focused_stance'),
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      planted.state.marks.some(
        (m) => m.id === 'focused' && m.duration === 2,
      ) &&
      stanceShiftFromSkill(stance) === Posture.BALANCED,
    crit:
      armed.ok === true &&
      armed.attemptSpent.some((m) => m.id === 'focused') &&
      !armed.state.marks.some((m) => m.id === 'focused') &&
      armed.damageDealt === 10,
    metrics: {
      legacyAp: 2,
      apCost: stance.apCost ?? 0,
      chakraCost: stance.chakraCost ?? 0,
      critPoints: 20,
      cloakDuration: cloakMark?.duration ?? 0,
      braceShift: String(brace.stanceShift ?? ''),
    },
  };
}

export function printFocusedStanceProbe(probe: FocusedStanceProbe): void {
  const m = probe.metrics;
  console.log('\n── T-125 Focused Stance probe ──');
  console.log(`  authoring SUPPORT ACTIVE AP1/CP3 Balanced Focused 2: ${probe.authoring}`);
  console.log(`  plant self focused 20/2; dmg 0:                      ${probe.plant}`);
  console.log(`  next ATTACK consumes +20 crit stacks; dmg unchanged: ${probe.crit}`);
  console.log('  ── balance vs mute TOGGLE AP2/% ACC-DEX and Cloak/Brace SUPPORT ──');
  console.log(`  AP/CP:       ${m.apCost}/${m.chakraCost}  (was AP${m.legacyAp} toggle upkeep 3)`);
  console.log(`  crit points: +${m.critPoints} next ATTACK  (not +20% damage; Cloak dur ${m.cloakDuration})`);
  console.log(`  Brace sibling shift: ${m.braceShift}`);
}
