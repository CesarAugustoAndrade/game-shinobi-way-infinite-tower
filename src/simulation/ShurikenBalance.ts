/**
 * T-053 probe — Shuriken authoring; plant; next ATTACK +1 ACC.
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface ShurikenProbe {
  authoring: boolean;
  plant: boolean;
  payoff: boolean;
  metrics: {
    apCost: number;
    chipDamage: number;
    attackWith: number;
    attackWithout: number;
    sideKeepsMark: boolean;
    missPlant: boolean;
  };
}

export function runShurikenProbe(): ShurikenProbe {
  const skill = SKILLS.SHURIKEN;
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
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const accAttack = createMockSkill({
    id: 'aimed_shot',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    scalingPerPoint: 4,
    scalingStat: PrimaryStat.ACCURACY,
    attackMethod: AttackMethod.RANGED,
    allowedRanges: [CombatRange.MEDIUM, CombatRange.LONG],
    currentCooldown: 0,
  });
  const sideChip = createMockSkill({
    id: 'tool_chip',
    cardRole: CardRole.SIDE_ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 7,
    attackMethod: AttackMethod.RANGED,
    allowedRanges: [CombatRange.MEDIUM, CombatRange.LONG],
    currentCooldown: 0,
  });
  const planted = resolveSkill({ skill }, state(), hit);
  const missed = resolveSkill(
    { skill },
    state(),
    { rollHit: () => ({ hit: false as const, damage: 0 }) },
  );
  const sideAgain =
    planted.ok &&
    resolveSkill(
      { skill: sideChip },
      { ...planted.state, skills: [sideChip] },
      { rollHit: () => ({ hit: true as const, damage: sideChip.baseDamage }) },
    );
  let payoff = false;
  let attackWith = 0;
  let sideKeepsMark = false;
  if (sideAgain && sideAgain.ok && sideAgain.state.marks.some((m) => m.id === 'aim')) {
    sideKeepsMark = true;
    const boosted = resolveSkill(
      { skill: accAttack },
      { ...sideAgain.state, skills: [accAttack] },
      { rollHit: () => ({ hit: true as const, damage: 10 }) },
    );
    attackWith = boosted.ok ? boosted.damageDealt : 0;
    payoff =
      boosted.ok &&
      boosted.damageDealt === 14 &&
      !boosted.state.marks.some((m) => m.id === 'aim');
  }
  const clean = resolveSkill(
    { skill: accAttack },
    { ...state(), skills: [accAttack] },
    { rollHit: () => ({ hit: true as const, damage: 10 }) },
  );
  payoff = payoff && clean.ok === true && clean.damageDealt === 10;
  const mark = planted.ok ? planted.state.marks.find((m) => m.id === 'aim') : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 1 &&
      skill.cooldown === 1 &&
      skill.baseDamage === 11 &&
      skill.attackMethod === AttackMethod.RANGED &&
      skill.critBonus === undefined &&
      skill.markEffects?.some((m) => m.id === 'aim' && m.duration === 2) === true,
    plant:
      planted.ok === true &&
      planted.damageDealt === 11 &&
      mark?.target === CombatActor.PLAYER &&
      mark.duration === 2,
    payoff,
    metrics: {
      apCost: skill.apCost ?? 0,
      chipDamage: planted.ok ? planted.damageDealt : 0,
      attackWith,
      attackWithout: clean.ok ? clean.damageDealt : 0,
      sideKeepsMark,
      missPlant: missed.ok === true && missed.state.marks.some((m) => m.id === 'aim'),
    },
  };
}

export function printShurikenProbe(probe: ShurikenProbe): void {
  const m = probe.metrics;
  console.log('\n── T-053 Shuriken probe ──');
  console.log(`  authoring SIDE:         ${probe.authoring}`);
  console.log(`  chip + Aim 2:           ${probe.plant}`);
  console.log(`  ATTACK +1 ACC consume:  ${probe.payoff}`);
  console.log('  ── balance vs legacy critBonus 25 ACTIVE ──');
  console.log(`  AP:                     ${m.apCost}  (was 1)`);
  console.log(`  chip:                   ${m.chipDamage}  (was 11)`);
  console.log(`  next ACC ATTACK 10:     ${m.attackWithout} → ${m.attackWith}  (was 10 / dead crit)`);
  console.log(`  SIDE keeps Aim:         ${m.sideKeepsMark}`);
  console.log(`  miss plants Aim:        ${m.missPlant}`);
}
