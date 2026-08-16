/**
 * T-082 probe — live useSkill adapter vs resolveSkill: call + bandMove PULL.
 */

import { CombatRange, Posture } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { useSkill } from '../game/systems/PlayerTurnSystem';
import { resolveSkill } from '../game/systems/ResolveSkillSystem';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import type { CombatState } from '../game/systems/combat-types';
import { BASE_STATS, createMockEnemy, createMockPlayer } from '../game/systems/__tests__/testFixtures';

export interface LiveCutoverProbe {
  liveCallsResolve: boolean;
  rangeParity: boolean;
  metrics: {
    liveRange: string;
    resolveRange: string;
    liveDamage: number;
    resolveDamage: number;
    liveMoveUsed: boolean;
  };
}

const makeStats = () => ({
  primary: { ...BASE_STATS },
  effectivePrimary: { ...BASE_STATS },
  derived: calculateDerivedStats(BASE_STATS, {}),
});

function combatState(): CombatState {
  return {
    isFirstTurn: false,
    firstHitMultiplier: 1,
    playerGoesFirst: true,
    playerInitiativeBonus: 0,
    xpMultiplier: 1,
    terrain: null,
    approachApplied: true,
    skipFirstSkillCost: false,
    artifactGutsUsed: false,
    locationTerrainMods: null,
    roomCombatEvasion: 0,
    fallDamageOnMiss: 0,
    roomConditionNames: [],
    enemyFirstHitMultiplier: 1,
    currentAp: 6,
    maxAp: 10,
    posture: Posture.BALANCED,
    hand: [],
    playablePool: [],
    currentRange: CombatRange.MEDIUM,
    playerMoveUsedThisTurn: false,
    enemyMoveUsedThisTurn: false,
    enemyCurrentAp: 5,
    enemyMaxAp: 5,
    turnIndex: 2,
    activeModes: [],
    marks: [],
  };
}

export function runLiveCutoverProbe(): LiveCutoverProbe {
  const reel = SKILLS.WIRE_KUNAI_REEL;
  const stats = makeStats();
  const player = createMockPlayer({
    skills: [reel],
    currentChakra: 30,
    currentHp: 200,
  });
  const enemy = createMockEnemy({ currentHp: 80 });
  const rng = Math.random;
  let live;
  try {
    Math.random = () => 0.05;
    live = useSkill(player, stats, enemy, stats, reel, combatState());
  } finally {
    Math.random = rng;
  }
  const resolved = resolveSkill(
    { skill: reel },
    {
      pools: { ap: 6, chakra: 30, hp: 200, maxHp: 200 },
      range: CombatRange.MEDIUM,
      turnIndex: 2,
      marks: [],
      modes: emptyModeBoard(),
      skills: [reel],
      playerBuffs: [],
      enemyHp: 80,
      playerMoveUsedThisTurn: false,
    },
    { rng: () => 0.05, rollHit: () => ({ hit: true, damage: reel.baseDamage }) },
  );
  const resolveRange = resolved.ok ? resolved.state.range : 'fail';
  const resolveDmg = resolved.ok ? resolved.damageDealt : -1;
  return {
    liveCallsResolve: live !== null && live.currentRange === CombatRange.CLOSE,
    rangeParity: live?.currentRange === resolveRange,
    metrics: {
      liveRange: live?.currentRange ?? 'null',
      resolveRange: String(resolveRange),
      liveDamage: live?.damageDealt ?? -1,
      resolveDamage: resolveDmg,
      liveMoveUsed: live?.playerMoveUsedThisTurn ?? true,
    },
  };
}

export function printLiveCutoverProbe(probe: LiveCutoverProbe): void {
  const m = probe.metrics;
  console.log('\n── T-082 live cutover probe ──');
  console.log(`  live PULL MEDIUM→CLOSE: ${probe.liveCallsResolve}`);
  console.log(`  live/resolve range Δ:   ${probe.rangeParity}`);
  console.log('  ── adapter vs resolveSkill ──');
  console.log(`  range live / resolve:   ${m.liveRange} / ${m.resolveRange}  (expect CLOSE / CLOSE)`);
  console.log(`  dmg live / resolve:     ${m.liveDamage} / ${m.resolveDamage}`);
  console.log(`  voluntary move used:    ${m.liveMoveUsed}  (expect false)`);
}
