/**
 * F2 combat-path evidence driver.
 * Proves: player move/gate, OOR reject, enemy move-then-skill, enemy Guard.
 */
import { createCombatState } from "../src/game/systems/CombatWorkflowSystem.ts";
import { voluntaryPlayerMove, useSkill } from "../src/game/systems/PlayerTurnSystem.ts";
import { planEnemyAction } from "../src/game/systems/EnemyAISystem.ts";
import {
  resolveInitialRange,
  skillAllowedAt,
  outOfRangeBlockReason,
} from "../src/game/systems/RangeSystem.ts";
import { createPlayer } from "../src/game/entities/Player.ts";
import { generateEnemy } from "../src/game/systems/EnemySystem.ts";
import { getPlayerFullStats, getEnemyFullStats } from "../src/game/systems/StatSystem.ts";
import {
  Clan,
  ApproachType,
  RangeMoveDirection,
  CombatRange,
  AttackMethod,
} from "../src/game/types.ts";
import { createMockSkill } from "../src/game/systems/__tests__/testFixtures.ts";
import fs from "fs";

const lines: string[] = [];
const player = createPlayer(Clan.LEE);
const pStats = getPlayerFullStats(player);
const enemy = generateEnemy(1, 0, "NORMAL", 40, "WAVES_ARC", "TANK");
const eStats = getEnemyFullStats(enemy);

const init = resolveInitialRange({
  approach: ApproachType.FRONTAL_ASSAULT,
  success: true,
  enemy,
});
lines.push("seed_range=" + init);

let cs = createCombatState();
cs.currentRange = init;
cs.currentAp = 5;
cs.maxAp = 5;
cs.enemyMaxAp = eStats.derived.actionPointsPerTurn;
cs.enemyCurrentAp = cs.enemyMaxAp;

const melee = createMockSkill({ attackMethod: AttackMethod.MELEE, name: "Punch" });
const ranged = createMockSkill({
  attackMethod: AttackMethod.RANGED,
  name: "Shuriken",
  id: "shuriken_test",
});

lines.push("melee_at_medium=" + skillAllowedAt(melee, cs.currentRange));
lines.push("ranged_at_medium=" + skillAllowedAt(ranged, cs.currentRange));
lines.push("oor_reason=" + outOfRangeBlockReason(melee, cs.currentRange));

// Move to close
const mv = voluntaryPlayerMove(cs, RangeMoveDirection.APPROACH);
cs = mv.combatState;
lines.push(
  "after_move=" +
    cs.currentRange +
    " ap=" +
    cs.currentAp +
    " moved=" +
    cs.playerMoveUsedThisTurn
);
lines.push("melee_after_close=" + skillAllowedAt(melee, cs.currentRange));

// useSkill should work at close for melee
const hit = useSkill(player, pStats, enemy, eStats, melee, {
  ...cs,
  currentAp: 5,
});
lines.push(
  "useSkill_melee_apCost=" + hit?.apCost + " msg=" + (hit?.logMessage || "").slice(0, 40)
);

// OOR at long
const longState = { ...cs, currentRange: CombatRange.LONG, currentAp: 5 };
const oor = useSkill(player, pStats, enemy, eStats, melee, longState);
lines.push("useSkill_oor=" + (oor?.logMessage || "").includes("Out of range"));

// ── Enemy path: stock kit at LONG (may pick in-range brace) ──
const planStockLong = planEnemyAction({
  enemy,
  enemyStats: eStats,
  player,
  playerStats: pStats,
  currentRange: CombatRange.LONG,
  enemyAp: eStats.derived.actionPointsPerTurn,
});
lines.push(
  "enemy_stock_long_guard=" +
    planStockLong.guard +
    " move=" +
    planStockLong.moveDirection +
    " skill=" +
    (planStockLong.skill?.id || "none")
);

// ── Enemy path: pure MELEE kit at MEDIUM → move-then-skill (CLOSE is one band) ──
const pureMelee = createMockSkill({
  id: "pure_melee",
  name: "Pure Melee",
  attackMethod: AttackMethod.MELEE,
  chakraCost: 0,
  hpCost: 0,
  cooldown: 0,
  currentCooldown: 0,
  baseDamage: 12,
  scalingPerPoint: 4,
});
const meleeOnlyEnemy = {
  ...enemy,
  skills: [pureMelee],
  intendedSkillId: undefined as string | undefined,
};
const planMoveThenSkill = planEnemyAction({
  enemy: meleeOnlyEnemy,
  enemyStats: eStats,
  player,
  playerStats: pStats,
  currentRange: CombatRange.MEDIUM,
  enemyAp: Math.max(3, eStats.derived.actionPointsPerTurn),
});
lines.push(
  "enemy_melee_medium_guard=" +
    planMoveThenSkill.guard +
    " move=" +
    planMoveThenSkill.moveDirection +
    " skill=" +
    (planMoveThenSkill.skill?.id || "none")
);
const moveThenSkillOk =
  planMoveThenSkill.guard === false &&
  planMoveThenSkill.moveDirection === RangeMoveDirection.APPROACH &&
  planMoveThenSkill.skill?.id === "pure_melee";
lines.push("enemy_move_then_skill_ok=" + moveThenSkillOk);

// ── Enemy path: pure MELEE kit at LONG → cannot reach in 1 band → move + Guard ──
const planGuardLong = planEnemyAction({
  enemy: meleeOnlyEnemy,
  enemyStats: eStats,
  player,
  playerStats: pStats,
  currentRange: CombatRange.LONG,
  enemyAp: Math.max(3, eStats.derived.actionPointsPerTurn),
});
lines.push(
  "enemy_melee_long_guard=" +
    planGuardLong.guard +
    " move=" +
    planGuardLong.moveDirection +
    " skill=" +
    (planGuardLong.skill?.id || "none")
);
const guardOk =
  planGuardLong.guard === true &&
  planGuardLong.skill === undefined &&
  planGuardLong.moveDirection === RangeMoveDirection.APPROACH;
lines.push("enemy_move_guard_ok=" + guardOk);

// ── Enemy path: 0 AP at CLOSE with melee → Guard (can't afford skill) ──
const planZeroAp = planEnemyAction({
  enemy: meleeOnlyEnemy,
  enemyStats: eStats,
  player,
  playerStats: pStats,
  currentRange: CombatRange.CLOSE,
  enemyAp: 0,
});
lines.push(
  "enemy_zero_ap_guard=" +
    planZeroAp.guard +
    " move=" +
    planZeroAp.moveDirection +
    " skill=" +
    (planZeroAp.skill?.id || "none")
);
lines.push("enemy_zero_ap_guard_ok=" + (planZeroAp.guard === true && !planZeroAp.skill));

const path = process.argv[2] || "scratch/f2-combat-path.log";
fs.writeFileSync(path, lines.join("\n") + "\n");
console.log(lines.join("\n"));

if (!moveThenSkillOk || !guardOk) {
  console.error("FAIL: enemy move-then-skill or Guard policy not proven");
  process.exit(1);
}
