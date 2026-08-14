/**
 * T-050 probe — Feint Strike authoring; plant; next ATTACK +15.
 */

import { ActionType, AttackMethod, CardRole, CombatActor, CombatRange } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface FeintStrikeProbe {
  authoring: boolean;
  plant: boolean;
  payoff: boolean;
  metrics: {
    apCost: number;
    chipDamage: number;
    attackWith: number;
    attackWithout: number;
  };
}

export function runFeintStrikeProbe(): FeintStrikeProbe {
  const skill = SKILLS.FEINT_STRIKE;
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
  const nextAttack = createMockSkill({
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
  let attackWith = 0;
  if (sideAgain && sideAgain.ok && sideAgain.state.marks.some((m) => m.id === 'feint')) {
    const boosted = resolveSkill(
      { skill: nextAttack },
      { ...sideAgain.state, skills: [nextAttack] },
      { rollHit: () => ({ hit: true as const, damage: 10 }) },
    );
    attackWith = boosted.ok ? boosted.damageDealt : 0;
    payoff = boosted.ok && boosted.damageDealt === 25 && !boosted.state.marks.some((m) => m.id === 'feint');
  }
  const clean = resolveSkill(
    { skill: nextAttack },
    { ...state(), skills: [nextAttack] },
    { rollHit: () => ({ hit: true as const, damage: 10 }) },
  );
  payoff = payoff && clean.ok === true && clean.damageDealt === 10;
  const mark = planted.ok ? planted.state.marks.find((m) => m.id === 'feint') : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 1 &&
      skill.cooldown === 2 &&
      skill.baseDamage === 7 &&
      skill.attackMethod === AttackMethod.AUTO &&
      skill.markEffects?.some((m) => m.id === 'feint' && m.duration === 2) === true,
    plant:
      planted.ok &&
      planted.damageDealt === 7 &&
      mark?.target === CombatActor.PLAYER &&
      mark.duration === 2,
    payoff,
    metrics: {
      apCost: skill.apCost ?? 0,
      chipDamage: planted.ok ? planted.damageDealt : 0,
      attackWith,
      attackWithout: clean.ok ? clean.damageDealt : 0,
    },
  };
}

export function printFeintStrikeProbe(probe: FeintStrikeProbe): void {
  const m = probe.metrics;
  console.log('\n── T-050 Feint Strike probe ──');
  console.log(`  authoring SIDE:     ${probe.authoring}`);
  console.log(`  chip + Feint 2:     ${probe.plant}`);
  console.log(`  ATTACK +15 consume: ${probe.payoff}`);
  console.log('  ── balance vs legacy AP2 unmarked AUTO ──');
  console.log(`  AP:                 ${m.apCost}  (was 2)`);
  console.log(`  chip:               ${m.chipDamage}  (was 7)`);
  console.log(`  next ATTACK 10:     ${m.attackWithout} → ${m.attackWith}  (was 10 / no Feint)`);
}
