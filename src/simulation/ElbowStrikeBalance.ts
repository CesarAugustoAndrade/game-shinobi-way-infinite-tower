/**
 * T-054 probe — Elbow Strike authoring; plant; next ATTACK 15% pen.
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  DamageProperty,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface ElbowStrikeProbe {
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

export function runElbowStrikeProbe(): ElbowStrikeProbe {
  const skill = SKILLS.ELBOW_STRIKE;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const smash = createMockSkill({
    id: 'smash',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 20,
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE],
    currentCooldown: 0,
  });
  const sideChip = createMockSkill({
    id: 'jab',
    cardRole: CardRole.SIDE_ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 7,
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE],
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
      { ...planted.state, skills: [sideChip], enemyDefensePercent: 0.4 },
      { rollHit: () => ({ hit: true as const, damage: sideChip.baseDamage }) },
    );
  let payoff = false;
  let attackWith = 0;
  let sideKeepsMark = false;
  if (sideAgain && sideAgain.ok && sideAgain.state.marks.some((m) => m.id === 'guard_break')) {
    sideKeepsMark = true;
    const boosted = resolveSkill(
      { skill: smash },
      { ...sideAgain.state, skills: [smash], enemyDefensePercent: 0.4 },
      { rollHit: () => ({ hit: true as const, damage: 20 }) },
    );
    attackWith = boosted.ok ? boosted.damageDealt : 0;
    payoff =
      boosted.ok &&
      boosted.damageDealt === 13 &&
      !boosted.state.marks.some((m) => m.id === 'guard_break');
  }
  const clean = resolveSkill(
    { skill: smash },
    { ...state(), skills: [smash], enemyDefensePercent: 0.4 },
    { rollHit: () => ({ hit: true as const, damage: 20 }) },
  );
  payoff = payoff && clean.ok === true && clean.damageDealt === 12;
  const mark = planted.ok ? planted.state.marks.find((m) => m.id === 'guard_break') : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 1 &&
      skill.cooldown === 1 &&
      skill.baseDamage === 8 &&
      skill.attackMethod === AttackMethod.MELEE &&
      skill.damageProperty === DamageProperty.NORMAL &&
      skill.markEffects?.some((m) => m.id === 'guard_break' && m.duration === 2) === true,
    plant:
      planted.ok === true &&
      planted.damageDealt === 8 &&
      mark?.target === CombatActor.PLAYER &&
      mark.duration === 2,
    payoff,
    metrics: {
      apCost: skill.apCost ?? 0,
      chipDamage: planted.ok ? planted.damageDealt : 0,
      attackWith,
      attackWithout: clean.ok ? clean.damageDealt : 0,
      sideKeepsMark,
      missPlant: missed.ok === true && missed.state.marks.some((m) => m.id === 'guard_break'),
    },
  };
}

export function printElbowStrikeProbe(probe: ElbowStrikeProbe): void {
  const m = probe.metrics;
  console.log('\n── T-054 Elbow Strike probe ──');
  console.log(`  authoring SIDE:         ${probe.authoring}`);
  console.log(`  chip + Guard Break 2:   ${probe.plant}`);
  console.log(`  ATTACK 15% pen consume: ${probe.payoff}`);
  console.log('  ── balance vs legacy AP2 PIERCING ──');
  console.log(`  AP:                     ${m.apCost}  (was 2)`);
  console.log(`  chip:                   ${m.chipDamage}  (was 8)`);
  console.log(`  next ATTACK 20@40% def: ${m.attackWithout} → ${m.attackWith}  (was 12 / dead PIERCING)`);
  console.log(`  SIDE keeps Guard Break: ${m.sideKeepsMark}`);
  console.log(`  miss plants:            ${m.missPlant}`);
}
