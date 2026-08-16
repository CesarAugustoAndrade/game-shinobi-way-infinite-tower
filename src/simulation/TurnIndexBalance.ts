/**
 * T-083 probe — turnIndex increment vs echo; CD unlock; encounter reset.
 */

import { CombatRange, Posture } from '../game/types';
import {
  isSkillReadyOnTurn,
  markSkillUsedOnTurn,
  runTurnStartClock,
  type TurnClockInput,
} from '../game/systems/TurnClockSystem';
import { applyEncounterReset, createCombatState } from '../game/systems/CombatWorkflowSystem';
import { processUpkeep } from '../game/systems/PlayerTurnSystem';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { BASE_STATS, createMockPlayer, createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface TurnIndexProbe {
  increments: boolean;
  consecutiveDiffer: boolean;
  echoNeverUnlocks: boolean;
  incrementUnlocks: boolean;
  encounterReady: boolean;
  liveUpkeepAdvances: boolean;
  metrics: {
    inputT: number;
    afterOneClock: number;
    afterTwoClocks: number;
    echoT: number;
    usedOnT: number;
    cooldown: number;
    readyOnTurn: number;
    clocksToReady: number;
    echoReadyAfterClocks: boolean;
    incrementReadyAfterClocks: boolean;
    upkeepFrom: number;
    upkeepTo: number;
  };
}

const clockInput = (turnIndex: number): TurnClockInput => ({
  turnIndex,
  chakra: 10,
  hp: 20,
  regen: { chakra: 0, hp: 0, maxChakra: 10, maxHp: 20 },
  modes: [],
  modeCosts: {},
  modeUpkeepPriority: [],
  marks: [],
  hand: [],
});

export function runTurnIndexProbe(): TurnIndexProbe {
  const inputT = 4;
  const first = runTurnStartClock(clockInput(inputT));
  const second = runTurnStartClock(clockInput(first.turnIndex));

  const usedOnT = 1;
  const cooldown = 2;
  const locked = markSkillUsedOnTurn(createMockSkill({ id: 'chidori', cooldown }), usedOnT);
  const readyOnTurn = locked.readyOnTurn ?? -1;

  // Echo baseline: T never moves, so readyOnTurn = T+N+1 never arrives.
  const echoT = usedOnT;
  let echoReadyAfterClocks = isSkillReadyOnTurn(readyOnTurn, echoT);
  for (let i = 0; i < cooldown + 1; i += 1) {
    echoReadyAfterClocks = isSkillReadyOnTurn(readyOnTurn, echoT);
  }

  // Increment path: each start-of-turn is T+1; CD=2 used on T=1 is ready on T=4.
  let t = usedOnT;
  let clocksToReady = 0;
  while (!isSkillReadyOnTurn(readyOnTurn, t) && clocksToReady < 8) {
    t = runTurnStartClock(clockInput(t)).turnIndex;
    clocksToReady += 1;
  }
  const incrementReadyAfterClocks = isSkillReadyOnTurn(readyOnTurn, t);

  const reset = applyEncounterReset([locked]);
  const state = createCombatState();
  const encounterReady =
    (reset[0].readyOnTurn === undefined || reset[0].readyOnTurn <= 1) &&
    isSkillReadyOnTurn(reset[0].readyOnTurn, state.turnIndex ?? 1) &&
    state.playablePool.every((skill) => skill.readyOnTurn === undefined || skill.readyOnTurn <= 1);

  const upkeepFrom = 1;
  const pool = ['a', 'b', 'c', 'd'].map((id) => createMockSkill({ id, name: id }));
  const upkeep = processUpkeep(
    createMockPlayer({ skills: pool, currentChakra: 20, currentHp: 80 }),
    {
      primary: { ...BASE_STATS },
      effectivePrimary: { ...BASE_STATS },
      derived: calculateDerivedStats(BASE_STATS, {}),
    },
    {
      ...state,
      isFirstTurn: false,
      playablePool: pool,
      turnIndex: upkeepFrom,
      posture: Posture.BALANCED,
      currentRange: CombatRange.CLOSE,
    },
  );

  return {
    increments: first.turnIndex === inputT + 1,
    consecutiveDiffer: second.turnIndex !== first.turnIndex,
    echoNeverUnlocks: echoReadyAfterClocks === false,
    incrementUnlocks: incrementReadyAfterClocks && clocksToReady === cooldown + 1,
    encounterReady,
    liveUpkeepAdvances: upkeep.turnIndex === upkeepFrom + 1,
    metrics: {
      inputT,
      afterOneClock: first.turnIndex,
      afterTwoClocks: second.turnIndex,
      echoT,
      usedOnT,
      cooldown,
      readyOnTurn,
      clocksToReady,
      echoReadyAfterClocks,
      incrementReadyAfterClocks,
      upkeepFrom,
      upkeepTo: upkeep.turnIndex,
    },
  };
}

export function printTurnIndexProbe(probe: TurnIndexProbe): void {
  const m = probe.metrics;
  console.log('\n── T-083 turnIndex / CD unlock probe ──');
  console.log(`  clock T+1:              ${probe.increments}  (${m.inputT} → ${m.afterOneClock})`);
  console.log(`  consecutive differ:     ${probe.consecutiveDiffer}  (${m.afterOneClock} → ${m.afterTwoClocks})`);
  console.log(`  echo never unlocks:     ${probe.echoNeverUnlocks}  (T stuck at ${m.echoT})`);
  console.log(`  increment unlocks CD:   ${probe.incrementUnlocks}  (used T=${m.usedOnT} CD=${m.cooldown} → ready ${m.readyOnTurn} after ${m.clocksToReady} clocks)`);
  console.log(`  encounter reset ready:  ${probe.encounterReady}`);
  console.log(`  live upkeep advances:   ${probe.liveUpkeepAdvances}  (${m.upkeepFrom} → ${m.upkeepTo})`);
  console.log('  ── balance vs echo ──');
  console.log(`  echo ready after clocks:      ${m.echoReadyAfterClocks}  (stuck; CD cards never recycle)`);
  console.log(`  increment ready after clocks: ${m.incrementReadyAfterClocks}  (CD=2 returns on T+3)`);
}
