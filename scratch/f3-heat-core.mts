import {
  clampHeat, tierFromHeat, applyHeatDelta, approachFailHeatDelta, approachHeatPenaltyPp,
  eliteChainChance, formatHeatTier, initialHeatState
} from "../src/game/systems/HeatSystem.ts";
import { HeatTier, ApproachType } from "../src/game/types.ts";
import fs from "fs";

const lines: string[] = [];
const boundaries = [0, 24, 25, 49, 50, 74, 75, 99, 100, -5, 150];
for (const h of boundaries) {
  lines.push(`tier@${h}=${tierFromHeat(h)} clamp=${clampHeat(h)}`);
}
// latch
let r = applyHeatDelta(90, 15, false);
lines.push(`arm100 heat=${r.heat} armed=${r.hunterArmed} newly=${r.newlyArmed}`);
r = applyHeatDelta(r.heat, -40, r.hunterArmed);
lines.push(`after_drop heat=${r.heat} armed=${r.hunterArmed} newly=${r.newlyArmed} tier=${r.tier}`);
// fail deltas
for (const a of Object.values(ApproachType)) {
  lines.push(`failDelta_${a}=${approachFailHeatDelta(a)}`);
}
// penalties at 40, 60, 80
for (const heat of [10, 40, 60, 80]) {
  lines.push(`penalty_silent@${heat}=${approachHeatPenaltyPp(ApproachType.STEALTH_AMBUSH, heat)}`);
}
// chain chance
for (const heat of [0, 49, 50, 74, 75, 99, 100]) {
  lines.push(`eliteChance@${heat}=${eliteChainChance(heat)}`);
}
lines.push(`init=${JSON.stringify(initialHeatState())}`);
lines.push(`format_quiet=${formatHeatTier(HeatTier.QUIET)}`);
const path = process.argv[2] || "scratch/f3-heat-core.log";
fs.writeFileSync(path, lines.join("\n") + "\n");
console.log(lines.join("\n"));
// asserts
if (tierFromHeat(24) !== HeatTier.QUIET || tierFromHeat(25) !== HeatTier.SUSPICIOUS) process.exit(1);
if (tierFromHeat(49) !== HeatTier.SUSPICIOUS || tierFromHeat(50) !== HeatTier.ALERT) process.exit(1);
if (tierFromHeat(74) !== HeatTier.ALERT || tierFromHeat(75) !== HeatTier.HUNTED) process.exit(1);
if (!applyHeatDelta(100, -50, true).hunterArmed) process.exit(1);
if (eliteChainChance(100) !== 0 || eliteChainChance(50) !== 0.25) process.exit(1);
console.log("OK heat-core");
