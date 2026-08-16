/**
 * T-072 probe — Explosive Barrage 3×5 M/L + Exposed ×1.15; vs 13 + SPEED −20%.
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatRange,
  EffectType,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface ExplosiveBarrageProbe {
  authoring: boolean;
  multiPlant: boolean;
  exposed: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    hitCount: number;
    baseDamage: number;
    threeHitDamage: number;
    missDamage: number;
    rangedBefore: number;
    rangedAfter: number;
    leftoverSpeed: number;
  };
}

export function runExplosiveBarrageProbe(): ExplosiveBarrageProbe {
  const skill = SKILLS.EXPLOSIVE_BARRAGE;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false, damage: 0 }) };
  const full = resolveSkill({ skill }, state(), hit);
  const whiff = resolveSkill({ skill }, state(), miss);
  const rangedAttack = createMockSkill({
    id: 'fire_atk',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    attackMethod: AttackMethod.RANGED,
    allowedRanges: [CombatRange.MEDIUM, CombatRange.LONG],
    currentCooldown: 0,
  });
  const boosted =
    full.ok
      ? resolveSkill(
          { skill: rangedAttack },
          { ...full.state, skills: [rangedAttack] },
          { rollHit: () => ({ hit: true, damage: 10 }) },
        )
      : undefined;
  const clean = resolveSkill(
    { skill: rangedAttack },
    state({ skills: [rangedAttack] }),
    { rollHit: () => ({ hit: true, damage: 10 }) },
  );
  const leftoverSpeed =
    skill.effects?.find(
      (e) => e.type === EffectType.DEBUFF && e.targetStat === PrimaryStat.SPEED,
    )?.value ?? 0;
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 2 &&
      skill.chakraCost === 3 &&
      skill.cooldown === 4 &&
      skill.baseDamage === 5 &&
      skill.hitCount === 3 &&
      leftoverSpeed === 0,
    multiPlant:
      full.ok === true &&
      full.hitsLanded === 3 &&
      full.damageDealt === 15 &&
      full.state.marks.some((m) => m.id === 'exposed' && m.duration === 2) &&
      whiff.ok === true &&
      !whiff.state.marks.some((m) => m.id === 'exposed'),
    exposed:
      boosted?.ok === true &&
      boosted.damageDealt === 11 &&
      !boosted.state.marks.some((m) => m.id === 'exposed') &&
      clean.ok === true &&
      clean.damageDealt === 10,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      hitCount: skill.hitCount ?? 1,
      baseDamage: skill.baseDamage,
      threeHitDamage: full.ok ? full.damageDealt : -1,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
      rangedBefore: clean.ok ? clean.damageDealt : -1,
      rangedAfter: boosted?.ok ? boosted.damageDealt : -1,
      leftoverSpeed,
    },
  };
}

export function printExplosiveBarrageProbe(probe: ExplosiveBarrageProbe): void {
  const m = probe.metrics;
  console.log('\n── T-072 Explosive Barrage probe ──');
  console.log(`  authoring SIDE 3×5:     ${probe.authoring}`);
  console.log(`  3-hit plant / miss:     ${probe.multiPlant}`);
  console.log(`  next RANGED ×1.15:      ${probe.exposed}`);
  console.log('  ── balance vs 13 + SPEED −20%×2 ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 2 / 3)`);
  console.log(`  package:                ${m.hitCount}×${m.baseDamage}  (was 1×13)`);
  console.log(`  full / miss dmg:        ${m.threeHitDamage} / ${m.missDamage}  (was 13 / 0 flavor)`);
  console.log(`  next RANGED 10→:        ${m.rangedAfter}  (was ${m.rangedBefore}, unused SPEED %)`);
  console.log(`  leftover SPEED debuff:  ${m.leftoverSpeed}  (was 0.2)`);
  console.log('  ── equilibrium ──');
  console.log('  new EV if all hit: 15 + 15% next ranged ATTACK vs old 13 + secret SPEED %.');
  console.log('  Healthy fire chip + honest Exposed. Once per card, ATTACK consume only.');
}
