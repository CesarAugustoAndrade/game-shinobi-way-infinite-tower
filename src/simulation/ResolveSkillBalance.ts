/**
 * T-007 resolveSkill balance probe — commit / miss / reject rates.
 * Not a full battle sim; measures the new commit orchestrator in isolation.
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  DamageProperty,
  DamageType,
  ElementType,
  MarkConsumeTiming,
  PrimaryStat,
  Skill,
  SkillTier,
} from '../game/types';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { listMarks } from '../game/systems/MarkSystem';
import {
  resolveSkill,
  type ResolveSkillState,
} from '../game/systems/ResolveSkillSystem';

export interface ResolveSkillProbeMetrics {
  trials: number;
  rejectNoConsume: number;
  missCommit: number;
  missImpactPreserved: number;
  hitImpactConsumed: number;
  supportMarkApplied: number;
  supportZeroDamage: number;
  modePortCalls: number;
  meanDamageOnHit: number;
}

function attackSkill(): Skill {
  return {
    id: 'probe-attack',
    name: 'Probe Attack',
    tier: SkillTier.BASIC,
    description: 'probe',
    actionType: ActionType.ACTIVE,
    cardRole: CardRole.ATTACK,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    readyOnTurn: 0,
    baseDamage: 10,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    apCost: 2,
    hitCount: 2,
    allowedRanges: [CombatRange.CLOSE],
  };
}

function baseState(): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 1,
    marks: [
      {
        id: 'focus',
        sourceSkillId: 'prep',
        owner: CombatActor.PLAYER,
        target: CombatActor.ENEMY,
        duration: 2,
        stacks: 1,
        consume: MarkConsumeTiming.ATTEMPT,
      },
      {
        id: 'brand',
        sourceSkillId: 'prep',
        owner: CombatActor.PLAYER,
        target: CombatActor.ENEMY,
        duration: 2,
        stacks: 1,
        consume: MarkConsumeTiming.IMPACT,
      },
    ],
    modes: emptyModeBoard(),
    skills: [attackSkill()],
    playerBuffs: [],
    enemyHp: 50,
  };
}

export function runResolveSkillBalanceProbe(trials = 200, hitChance = 0.55): ResolveSkillProbeMetrics {
  const metrics: ResolveSkillProbeMetrics = {
    trials,
    rejectNoConsume: 0,
    missCommit: 0,
    missImpactPreserved: 0,
    hitImpactConsumed: 0,
    supportMarkApplied: 0,
    supportZeroDamage: 0,
    modePortCalls: 0,
    meanDamageOnHit: 0,
  };

  let hitDamageSum = 0;
  let hitN = 0;

  const rejectState = baseState();
  rejectState.pools.ap = 1;
  const rejected = resolveSkill({ skill: attackSkill() }, rejectState);
  if (
    !rejected.ok &&
    rejected.state.pools.ap === 1 &&
    rejected.state.pools.chakra === 20 &&
    rejected.state.marks.length === 2
  ) {
    metrics.rejectNoConsume = trials;
  }

  for (let i = 0; i < trials; i++) {
    const hitA = ((i * 17) % 100) / 100 < hitChance;
    const hitB = ((i * 31) % 100) / 100 < hitChance;
    let roll = 0;
    const result = resolveSkill(
      { skill: attackSkill() },
      baseState(),
      {
        rollHit: () => {
          const hit = roll === 0 ? hitA : hitB;
          roll += 1;
          return { hit, damage: hit ? 10 : 0 };
        },
      },
    );
    if (!result.ok) continue;
    if (result.hitsLanded === 0) {
      metrics.missCommit += 1;
      if (listMarks(result.state.marks, { id: 'brand' }).length === 1) {
        metrics.missImpactPreserved += 1;
      }
    } else {
      hitN += 1;
      hitDamageSum += result.damageDealt;
      if (listMarks(result.state.marks, { id: 'brand' }).length === 0) {
        metrics.hitImpactConsumed += 1;
      }
    }
  }

  const support = {
    ...attackSkill(),
    id: 'probe-support',
    cardRole: CardRole.SUPPORT,
    baseDamage: 0,
    hitCount: 1,
    markEffects: [{ id: 'aim', duration: 2, stacks: 1, consume: MarkConsumeTiming.ATTEMPT }],
  };
  const supportResult = resolveSkill({ skill: support }, baseState());
  if (supportResult.ok && supportResult.damageDealt === 0 && supportResult.state.enemyHp === 50) {
    metrics.supportZeroDamage = trials;
  }
  if (supportResult.ok && listMarks(supportResult.state.marks, { id: 'aim' }).length === 1) {
    metrics.supportMarkApplied = trials;
  }

  const modeSkill = {
    ...attackSkill(),
    id: 'probe-mode',
    cardRole: CardRole.MODE,
    actionType: ActionType.TOGGLE,
  };
  resolveSkill(
    { skill: modeSkill },
    baseState(),
    {
      activateMode: (board, _def, pools) => {
        metrics.modePortCalls += 1;
        return { ok: true, board, pools };
      },
    },
  );

  metrics.meanDamageOnHit = hitN === 0 ? 0 : hitDamageSum / hitN;
  return metrics;
}

export function printResolveSkillProbe(metrics: ResolveSkillProbeMetrics): void {
  const pct = (n: number) => ((n / metrics.trials) * 100).toFixed(1);
  console.log('\n── T-007 resolveSkill commit probe ──');
  console.log(`  trials:                 ${metrics.trials}`);
  console.log(`  reject no-consume:      ${pct(metrics.rejectNoConsume)}%`);
  console.log(`  miss (costs committed): ${pct(metrics.missCommit)}%`);
  console.log(`  miss impact preserved:  ${pct(metrics.missImpactPreserved)}%`);
  console.log(`  hit impact consumed:    ${pct(metrics.hitImpactConsumed)}%`);
  console.log(`  support 0-dmg + mark:   ${pct(metrics.supportMarkApplied)}% / ${pct(metrics.supportZeroDamage)}%`);
  console.log(`  mode port calls:        ${metrics.modePortCalls}`);
  console.log(`  mean dmg on ≥1 hit:     ${metrics.meanDamageOnHit.toFixed(2)}`);
}
