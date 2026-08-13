/**
 * T-026 probe — Air Palm SIDE authoring; hit CP+PUSH no spend; miss none; 2-hit stacks.
 */

import {
  CardRole,
  CombatRange,
  MarkConsumeTiming,
  ModeRuntimeState,
} from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface AirPalmProbe {
  authoring: boolean;
  hitPushNoSpend: boolean;
  missAndMulti: boolean;
}

export function runAirPalmProbe(): AirPalmProbe {
  const airPalm = SKILLS.AIR_PALM;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [airPalm],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    ...overrides,
  });
  const byakugan = {
    instances: [
      { id: 'byakugan', family: MODE_FAMILY.HYUGA, charges: 4, state: ModeRuntimeState.ON },
    ],
  };
  const hit = { rollHit: () => ({ hit: true as const, damage: airPalm.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const on = resolveSkill({ skill: airPalm }, state({ modes: byakugan }), hit);
  const missed = resolveSkill({ skill: airPalm }, state({ modes: byakugan }), miss);
  const stacked = resolveSkill(
    { skill: { ...airPalm, hitCount: 2 } },
    state(),
    { rollHit: () => ({ hit: true as const, damage: airPalm.baseDamage }) },
  );
  const cp = on.ok ? on.state.marks.find((m) => m.id === 'chakra_point') : undefined;
  return {
    authoring:
      airPalm.cardRole === CardRole.SIDE_ATTACK &&
      airPalm.bandMove?.kind === 'PUSH' &&
      airPalm.markEffects?.some(
        (m) => m.id === 'chakra_point' && m.perHit === true && m.consume === MarkConsumeTiming.IMPACT,
      ) === true &&
      airPalm.modeInteraction === undefined,
    hitPushNoSpend:
      on.ok &&
      cp?.stacks === 1 &&
      on.state.range === CombatRange.LONG &&
      on.state.playerMoveUsedThisTurn === false &&
      on.state.modes.instances.find((m) => m.id === 'byakugan')?.charges === 4,
    missAndMulti:
      missed.ok &&
      !missed.state.marks.some((m) => m.id === 'chakra_point') &&
      stacked.ok &&
      stacked.state.marks.find((m) => m.id === 'chakra_point')?.stacks === 2,
  };
}

export function printAirPalmProbe(probe: AirPalmProbe): void {
  console.log('\n── T-026 Air Palm probe ──');
  console.log(`  authoring SIDE+CP+PUSH: ${probe.authoring}`);
  console.log(`  hit PUSH no spend:      ${probe.hitPushNoSpend}`);
  console.log(`  miss none / 2-hit stack:${probe.missAndMulti}`);
}
