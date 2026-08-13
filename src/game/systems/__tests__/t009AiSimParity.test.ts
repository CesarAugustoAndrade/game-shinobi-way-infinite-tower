/**
 * T-009 AC: AI direct selection + setup term, sim resolveSkill, metrics / FREE_FIRST / CD reset.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  MarkConsumeTiming,
  ModeRuntimeState,
} from '../../types';
import { calculateDerivedStats } from '../StatSystem';
import { planEnemyAction, scoreEnemySkill } from '../EnemyAISystem';
import { commitSimPlayerSkill, resolveSkill } from '../ResolveSkillSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import {
  applyResolveToMetrics,
  artifactsOncePerCard,
  emptySoulMetrics,
  recordSoulMetric,
} from '../CombatMetrics';
import { resetCooldownsKeepModesOff } from '../TurnClockSystem';
import { createMockEnemy, createMockPlayer, createMockSkill, BASE_STATS } from './testFixtures';

const stats = {
  primary: BASE_STATS,
  effectivePrimary: BASE_STATS,
  derived: calculateDerivedStats(BASE_STATS, {}),
};

describe('T-009 ai selection', () => {
  it('picks a setup/mark skill over a higher-damage skill when setup pressure is on', () => {
    const damage = createMockSkill({
      id: 'smash',
      cardRole: CardRole.ATTACK,
      baseDamage: 30,
      scalingPerPoint: 8,
      apCost: 2,
      currentCooldown: 0,
    });
    const setup = createMockSkill({
      id: 'brand',
      cardRole: CardRole.SUPPORT,
      baseDamage: 0,
      scalingPerPoint: 0,
      apCost: 1,
      currentCooldown: 0,
      markEffects: [{ id: 'aim', duration: 2, consume: MarkConsumeTiming.ATTEMPT }],
    });
    const enemy = createMockEnemy({ skills: [damage, setup] });
    const player = createMockPlayer();
    const context = {
      enemy,
      enemyStats: stats,
      player,
      playerStats: stats,
      currentRange: CombatRange.CLOSE,
      enemyAp: 6,
      tactical: { setupPressure: true },
    };

    const smashScore = scoreEnemySkill(damage, context);
    const setupScore = scoreEnemySkill(setup, context);
    expect(setupScore.score).toBeGreaterThan(smashScore.score);
    expect(setupScore.reason).toBe('setup / mark pressure');

    const plan = planEnemyAction(context);
    expect(plan.skill?.id).toBe('brand');
    expect(plan.guard).toBe(false);
  });

  it('never builds a player weighted hand — selection is from enemy.skills only', () => {
    const only = createMockSkill({ id: 'poke', currentCooldown: 0, apCost: 1 });
    const enemy = createMockEnemy({ skills: [only] });
    const plan = planEnemyAction({
      enemy,
      enemyStats: stats,
      player: createMockPlayer(),
      playerStats: stats,
      currentRange: CombatRange.CLOSE,
      enemyAp: 4,
      tactical: {},
    });
    expect(plan.skill?.id).toBe('poke');
    expect(enemy.skills.map((s) => s.id)).toEqual(['poke']);
  });
});

describe('T-009 sim resolve', () => {
  it('uses the same resolveSkill commit; invalid intent consumes nothing', () => {
    expect(commitSimPlayerSkill).toBe(resolveSkill);
    const skill = createMockSkill({
      id: 'chidori',
      cardRole: CardRole.ATTACK,
      apCost: 4,
      chakraCost: 6,
      allowedRanges: [CombatRange.CLOSE],
    });
    const state = {
      pools: { ap: 1, chakra: 20, hp: 40, maxHp: 40 },
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
      ],
      modes: emptyModeBoard(),
      skills: [skill],
      playerBuffs: [],
      enemyHp: 50,
    };
    const before = structuredClone(state);
    const result = commitSimPlayerSkill({ skill }, state);
    expect(result.ok).toBe(false);
    expect(result.state).toEqual(before);
  });
});

describe('T-009 metrics artifacts', () => {
  it('increments SOUL metrics, FREE_FIRST does not waive AP, CD reset does not ON/refill Modes', () => {
    let bag = emptySoulMetrics();
    bag = recordSoulMetric(bag, 'setupCompletion', 1);
    bag = recordSoulMetric(bag, 'upkeepFailure', 1);
    const support = createMockSkill({
      id: 'cloak',
      cardRole: CardRole.SUPPORT,
      apCost: 1,
      chakraCost: 2,
      markEffects: [{ id: 'aim', duration: 2 }],
    });
    const resolved = commitSimPlayerSkill(
      { skill: support },
      {
        pools: { ap: 5, chakra: 10, hp: 40, maxHp: 40 },
        range: CombatRange.CLOSE,
        turnIndex: 1,
        marks: [],
        modes: emptyModeBoard(),
        skills: [support],
        playerBuffs: [],
        enemyHp: 50,
      },
    );
    bag = applyResolveToMetrics(bag, resolved);
    expect(bag.setupCompletion).toBeGreaterThanOrEqual(2);
    expect(bag.upkeepFailure).toBe(1);
    expect(bag.deadCardRate).toBe(0);

    expect(artifactsOncePerCard(0)).toBe(false);
    expect(artifactsOncePerCard(1)).toBe(true);
    expect(artifactsOncePerCard(3)).toBe(true);

    const pricey = createMockSkill({
      id: 'rasengan',
      cardRole: CardRole.ATTACK,
      apCost: 3,
      chakraCost: 10,
      hpCost: 0,
      allowedRanges: [CombatRange.CLOSE],
    });
    const freeFirst = commitSimPlayerSkill(
      { skill: pricey },
      {
        pools: { ap: 2, chakra: 0, hp: 40, maxHp: 40 },
        range: CombatRange.CLOSE,
        turnIndex: 1,
        marks: [],
        modes: emptyModeBoard(),
        skills: [pricey],
        playerBuffs: [],
        enemyHp: 50,
        skipFirstSkillCost: true,
      },
    );
    expect(freeFirst.ok).toBe(false);
    if (!freeFirst.ok) expect(freeFirst.reason).toBe('ap');

    const reset = resetCooldownsKeepModesOff({
      skills: [{ ...pricey, currentCooldown: 4, readyOnTurn: 9 }],
      modes: [
        {
          id: 'byakugan',
          family: 'HYUGA',
          charges: 4,
          state: ModeRuntimeState.ON,
        },
      ],
      marks: [],
    });
    expect(reset.skills[0].currentCooldown).toBe(0);
    expect(reset.skills[0].readyOnTurn).toBe(0);
    expect(reset.modes[0].state).toBe(ModeRuntimeState.COOLDOWN);
    expect(reset.modes[0].charges).toBe(0);
    expect(reset.modes[0].state).not.toBe(ModeRuntimeState.ON);
  });
});
