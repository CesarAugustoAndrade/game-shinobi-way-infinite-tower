/**
 * T-052 probe — Rising Wind authoring; plant; next MELEE ATTACK ×1.20.
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface RisingWindProbe {
  authoring: boolean;
  plant: boolean;
  payoff: boolean;
  metrics: {
    apCost: number;
    chipDamage: number;
    meleeWith: number;
    meleeWithout: number;
    rangedWithMark: number;
  };
}

export function runRisingWindProbe(): RisingWindProbe {
  const skill = SKILLS.RISING_WIND;
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
  const nextMelee = createMockSkill({
    id: 'smash',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE],
    currentCooldown: 0,
  });
  const nextRanged = createMockSkill({
    id: 'kunai_shot',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    attackMethod: AttackMethod.RANGED,
    allowedRanges: [CombatRange.MEDIUM],
    currentCooldown: 0,
  });
  const planted = resolveSkill({ skill }, state(), hit);
  const slash = SKILLS.KUNAI_SLASH;
  const sideAgain =
    planted.ok &&
    resolveSkill(
      { skill: slash },
      { ...planted.state, skills: [slash] },
      { rollHit: () => ({ hit: true as const, damage: slash.baseDamage }) },
    );
  let payoff = false;
  let meleeWith = 0;
  let rangedWithMark = 0;
  if (sideAgain && sideAgain.ok && sideAgain.state.marks.some((m) => m.id === 'launched')) {
    const ranged = resolveSkill(
      { skill: nextRanged },
      { ...sideAgain.state, skills: [nextRanged], range: CombatRange.MEDIUM },
      { rollHit: () => ({ hit: true as const, damage: 10 }) },
    );
    rangedWithMark = ranged.ok ? ranged.damageDealt : 0;
    const markKept = ranged.ok && ranged.state.marks.some((m) => m.id === 'launched');
    const boosted = resolveSkill(
      { skill: nextMelee },
      { ...(ranged.ok ? ranged.state : sideAgain.state), skills: [nextMelee], range: CombatRange.CLOSE },
      { rollHit: () => ({ hit: true as const, damage: 10 }) },
    );
    meleeWith = boosted.ok ? boosted.damageDealt : 0;
    payoff =
      markKept &&
      rangedWithMark === 10 &&
      boosted.ok &&
      boosted.damageDealt === 12 &&
      !boosted.state.marks.some((m) => m.id === 'launched');
  }
  const clean = resolveSkill(
    { skill: nextMelee },
    { ...state(), skills: [nextMelee] },
    { rollHit: () => ({ hit: true as const, damage: 10 }) },
  );
  payoff = payoff && clean.ok === true && clean.damageDealt === 10;
  const mark = planted.ok ? planted.state.marks.find((m) => m.id === 'launched') : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 1 &&
      skill.cooldown === 2 &&
      skill.baseDamage === 8 &&
      skill.attackMethod === AttackMethod.MELEE &&
      skill.markEffects?.some((m) => m.id === 'launched' && m.duration === 2) === true &&
      !skill.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.STRENGTH &&
          e.value === 0.25,
      ),
    plant:
      planted.ok &&
      planted.damageDealt === 8 &&
      mark?.target === CombatActor.PLAYER &&
      mark.duration === 2,
    payoff,
    metrics: {
      apCost: skill.apCost ?? 0,
      chipDamage: planted.ok ? planted.damageDealt : 0,
      meleeWith,
      meleeWithout: clean.ok ? clean.damageDealt : 0,
      rangedWithMark,
    },
  };
}

export function printRisingWindProbe(probe: RisingWindProbe): void {
  const m = probe.metrics;
  console.log('\n── T-052 Leaf Rising Wind probe ──');
  console.log(`  authoring SIDE:         ${probe.authoring}`);
  console.log(`  chip + Launched 2:      ${probe.plant}`);
  console.log(`  MELEE ×1.20 consume:    ${probe.payoff}`);
  console.log('  ── balance vs legacy AP2 STR +25% ×1 ──');
  console.log(`  AP:                     ${m.apCost}  (was 2)`);
  console.log(`  chip:                   ${m.chipDamage}  (was 8)`);
  console.log(`  next MELEE 10:          ${m.meleeWithout} → ${m.meleeWith}  (was 10 / dead STR buff)`);
  console.log(`  ranged ATTACK w/ mark:  ${m.rangedWithMark}  (no +20%)`);
}
