/**
 * T-060 probe — Wire Trap plant; ATTACK 10→12 + Bleed 5×2 consume; miss/SIDE leave.
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatRange,
  EffectType,
  MarkFamily,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface WireSetupProbe {
  authoring: boolean;
  plant: boolean;
  payoff: boolean;
  missKeeps: boolean;
  sideLeaves: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    plantDamage: number;
    attackWith: number;
    attackMiss: number;
    sideDamage: number;
    bleedStacks: number;
  };
}

export function runWireSetupProbe(): WireSetupProbe {
  const skill = SKILLS.WIRE_SETUP;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
  });
  const attack = createMockSkill({
    id: 'probe_attack',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    hitCount: 1,
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  const side = createMockSkill({
    id: 'probe_side',
    cardRole: CardRole.SIDE_ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    hitCount: 1,
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: 10 }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const planted = resolveSkill({ skill }, state());
  const armed = planted.ok
    ? resolveSkill({ skill: attack }, planted.state, hit)
    : planted;
  const whiffPlant = resolveSkill({ skill }, state());
  const whiff = whiffPlant.ok
    ? resolveSkill({ skill: attack }, whiffPlant.state, miss)
    : whiffPlant;
  const sidePlant = resolveSkill({ skill }, state());
  const sideHit = sidePlant.ok
    ? resolveSkill({ skill: side }, sidePlant.state, hit)
    : sidePlant;
  const bleed = armed.ok ? armed.state.marks.find((m) => m.id === 'bleed') : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 1 &&
      skill.cooldown === 4 &&
      skill.baseDamage === 0 &&
      skill.markEffects?.some(
        (m) => m.id === 'wire_trap' && m.duration === 2 && m.family === MarkFamily.STAT,
      ) === true &&
      !skill.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.STRENGTH,
      ) &&
      !skill.effects?.some((e) => e.type === EffectType.BLEED),
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      planted.state.marks.some((m) => m.id === 'wire_trap' && m.duration === 2) &&
      !planted.state.marks.some((m) => m.id === 'bleed'),
    payoff:
      armed.ok === true &&
      armed.damageDealt === 12 &&
      !armed.state.marks.some((m) => m.id === 'wire_trap') &&
      bleed?.stacks === 5 &&
      bleed.duration === 2,
    missKeeps:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.marks.some((m) => m.id === 'wire_trap') &&
      !whiff.state.marks.some((m) => m.id === 'bleed'),
    sideLeaves:
      sideHit.ok === true &&
      sideHit.damageDealt === 10 &&
      sideHit.state.marks.some((m) => m.id === 'wire_trap') &&
      !sideHit.state.marks.some((m) => m.id === 'bleed'),
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      plantDamage: planted.ok ? planted.damageDealt : -1,
      attackWith: armed.ok ? armed.damageDealt : -1,
      attackMiss: whiff.ok ? whiff.damageDealt : -1,
      sideDamage: sideHit.ok ? sideHit.damageDealt : -1,
      bleedStacks: bleed?.stacks ?? 0,
    },
  };
}

export function printWireSetupProbe(probe: WireSetupProbe): void {
  const m = probe.metrics;
  console.log('\n── T-060 Wire Trap probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  plant trap no bleed:    ${probe.plant}`);
  console.log(`  ATTACK 10→12 + consume: ${probe.payoff}`);
  console.log(`  miss keeps trap:        ${probe.missKeeps}`);
  console.log(`  SIDE leaves trap:       ${probe.sideLeaves}`);
  console.log('  ── balance vs legacy self STR +20% / 40% Bleed 8 ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 1 / 1)`);
  console.log(`  plant dmg:              ${m.plantDamage}  (must be 0)`);
  console.log(`  ATTACK with trap:       ${m.attackWith}  (was 10 + secret STR)`);
  console.log(`  bleed on consume:       ${m.bleedStacks}  (was 0 under resolve / 40% of 8)`);
  console.log(`  miss / SIDE dmg:        ${m.attackMiss} / ${m.sideDamage}`);
}
