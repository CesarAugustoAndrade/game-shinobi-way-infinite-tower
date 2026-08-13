/**
 * T-009 probe — AI setup pick vs DPS, resolve reject, metric increments.
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatRange,
  DamageProperty,
  DamageType,
  ElementType,
  MarkConsumeTiming,
  PrimaryStat,
  Skill,
  SkillTier,
} from '../game/types';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { planEnemyAction } from '../game/systems/EnemyAISystem';
import { commitSimPlayerSkill } from '../game/systems/ResolveSkillSystem';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import {
  applyResolveToMetrics,
  emptySoulMetrics,
} from '../game/systems/CombatMetrics';
import { createMockEnemy, createMockPlayer } from '../game/systems/__tests__/testFixtures';

function skill(partial: Partial<Skill> & Pick<Skill, 'id'>): Skill {
  return {
    name: partial.id,
    tier: SkillTier.BASIC,
    description: 'probe',
    actionType: ActionType.ACTIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    ...partial,
  };
}

export interface AiSimParityProbe {
  aiPickedSetup: boolean;
  rejectConsumedNothing: boolean;
  metricsIncremented: number;
}

export function runAiSimParityProbe(): AiSimParityProbe {
  const derived = calculateDerivedStats(
    {
      willpower: 3, chakra: 3, strength: 3, spirit: 3, intelligence: 3,
      calmness: 3, speed: 3, accuracy: 3, dexterity: 3,
    },
    {},
  );
  const stats = {
    primary: derived as never,
    effectivePrimary: {
      willpower: 3, chakra: 3, strength: 3, spirit: 3, intelligence: 3,
      calmness: 3, speed: 3, accuracy: 3, dexterity: 3,
    },
    derived,
  };
  const damage = skill({ id: 'smash', cardRole: CardRole.ATTACK, baseDamage: 30, apCost: 2 });
  const setup = skill({
    id: 'brand',
    cardRole: CardRole.SUPPORT,
    apCost: 1,
    markEffects: [{ id: 'aim', duration: 2, consume: MarkConsumeTiming.ATTEMPT }],
  });
  const plan = planEnemyAction({
    enemy: createMockEnemy({ skills: [damage, setup] }),
    enemyStats: stats,
    player: createMockPlayer(),
    playerStats: stats,
    currentRange: CombatRange.CLOSE,
    enemyAp: 6,
    tactical: { setupPressure: true },
  });

  const costly = skill({ id: 'rasengan', cardRole: CardRole.ATTACK, apCost: 5, chakraCost: 6 });
  const state = {
    pools: { ap: 1, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 1,
    marks: [],
    modes: emptyModeBoard(),
    skills: [costly],
    playerBuffs: [],
    enemyHp: 50,
  };
  const rejected = commitSimPlayerSkill({ skill: costly }, state);
  const rejectConsumedNothing =
    !rejected.ok && rejected.state.pools.ap === 1 && rejected.state.pools.chakra === 20;

  const support = skill({
    id: 'cloak',
    cardRole: CardRole.SUPPORT,
    apCost: 1,
    markEffects: [{ id: 'aim', duration: 2 }],
  });
  const ok = commitSimPlayerSkill(
    { skill: support },
    { ...state, pools: { ap: 5, chakra: 10, hp: 40, maxHp: 40 }, skills: [support] },
  );
  const bag = applyResolveToMetrics(emptySoulMetrics(), ok);

  return {
    aiPickedSetup: plan.skill?.id === 'brand',
    rejectConsumedNothing,
    metricsIncremented: bag.setupCompletion,
  };
}

export function printAiSimParityProbe(probe: AiSimParityProbe): void {
  console.log('\n── T-009 AI / sim parity probe ──');
  console.log(`  AI picked setup over DPS: ${probe.aiPickedSetup}`);
  console.log(`  invalid consume nothing:  ${probe.rejectConsumedNothing}`);
  console.log(`  setupCompletion metric:   ${probe.metricsIncremented}`);
}
