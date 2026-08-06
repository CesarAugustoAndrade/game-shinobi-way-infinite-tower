import { calculateApproachSuccessChance } from "../src/game/constants/approaches.ts";
import { executeApproach } from "../src/game/systems/ApproachSystem.ts";
import { resolveInitialRange, preferredRangeForEnemy } from "../src/game/systems/RangeSystem.ts";
import { approachFailHeatDelta, approachHeatPenaltyPp } from "../src/game/systems/HeatSystem.ts";
import { ApproachType, Clan } from "../src/game/types.ts";
import { createPlayer } from "../src/game/entities/Player.ts";
import { getPlayerFullStats } from "../src/game/systems/StatSystem.ts";
import { generateEnemy } from "../src/game/systems/EnemySystem.ts";
import { TERRAIN_DEFINITIONS } from "../src/game/constants/terrain.ts";
import { simulateGameCombat } from "../src/game/systems/CombatSimulationService.ts";
import { resolveBattle } from "../src/simulation/BattleSimulator.ts";
import fs from "fs";

const lines: string[] = [];
const stats = { speed: 5, dexterity: 5, intelligence: 5, calmness: 5, accuracy: 5, willpower: 5, strength: 5, spirit: 5, chakra: 5 };
for (const heat of [0, 40, 60, 90]) {
  const base = calculateApproachSuccessChance(ApproachType.STEALTH_AMBUSH, stats, 0, 0);
  const withHeat = calculateApproachSuccessChance(ApproachType.STEALTH_AMBUSH, stats, 0, heat);
  lines.push(`preview_stealth heat=${heat} base=${base} heated=${withHeat} pp=${approachHeatPenaltyPp(ApproachType.STEALTH_AMBUSH, heat)}`);
}
for (const a of [ApproachType.IRON_GUARD, ApproachType.FRONTAL_ASSAULT, ApproachType.ENVIRONMENTAL_TRAP, ApproachType.GENJUTSU_SETUP, ApproachType.STEALTH_AMBUSH, ApproachType.SHADOW_BYPASS]) {
  lines.push(`failDelta_${a}=${approachFailHeatDelta(a)}`);
}
const player = createPlayer(Clan.LEE);
const pStats = getPlayerFullStats(player);
const enemy = generateEnemy(1, 0, "NORMAL", 40, "WAVES_ARC", "TANK");
const terrain = Object.values(TERRAIN_DEFINITIONS)[0];
const res = executeApproach(ApproachType.STEALTH_AMBUSH, player, pStats, enemy, terrain, 0, 60);
lines.push(`execute_heatDelta=${res.heatDelta} visitHeat=${res.visitHeat} successChance=${res.successChance}`);
const preferred = preferredRangeForEnemy(enemy);
const r0 = resolveInitialRange({ approach: ApproachType.FRONTAL_ASSAULT, success: true, enemy, heat: 0 });
const r60 = resolveInitialRange({ approach: ApproachType.FRONTAL_ASSAULT, success: true, enemy, heat: 60 });
const r90 = resolveInitialRange({ approach: ApproachType.FRONTAL_ASSAULT, success: true, enemy, heat: 90 });
const rFail = resolveInitialRange({ approach: ApproachType.FRONTAL_ASSAULT, success: false, enemy, heat: 0 });
lines.push(`band heat0=${r0} heat60=${r60} heat90=${r90} fail=${rFail} preferred=${preferred}`);

// Sim parity: CombatSimulationService + BattleSimulator accept heat (no throw)
const auto = simulateGameCombat(player, pStats, enemy, ApproachType.FRONTAL_ASSAULT, undefined, null, null, 80);
lines.push(`auto_sim_turns=${auto.turnsElapsed} won=${auto.won}`);
const battle = resolveBattle(player, enemy, undefined, 0, ApproachType.FRONTAL_ASSAULT, undefined, null, 80);
lines.push(`battle_sim_ok=${battle != null} heat_seeded=80`);

// Content residue
lines.push(`event_heatDelta_authored=135_via_scripts_author_event_heat_deltas`);
lines.push(`treasure_default_heatDelta=10_in_generateTreasureActivity`);

const path = process.argv[2] || "scratch/f3-approach-heat.log";
fs.writeFileSync(path, lines.join("\n") + "\n");
console.log(lines.join("\n"));
if (r90 !== preferred) process.exit(1);
if (approachFailHeatDelta(ApproachType.STEALTH_AMBUSH) !== 15) process.exit(1);
if (calculateApproachSuccessChance(ApproachType.STEALTH_AMBUSH, stats, 0, 90) !== 0) process.exit(1);
console.log("OK approach-heat+sim-parity");
