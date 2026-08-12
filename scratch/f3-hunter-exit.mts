import { generateBranchingFloor, applyFloorHeatDelta, generateHunterFromGuardian, calculateExitProbability, armHunterOnFloor } from "../src/game/systems/LocationSystem.ts";
import { createPlayer } from "../src/game/entities/Player.ts";
import { Clan } from "../src/game/types.ts";
import fs from "fs";

const lines: string[] = [];
const player = createPlayer(Clan.LEE);
let floor = generateBranchingFloor(1, 50, player);
lines.push(`init heat=${floor.heat} armed=${floor.hunterArmed}`);
// no pre-min exit force from heat
const pPre = calculateExitProbability(0, floor.dangerLevel, 0, 0, true);
lines.push(`exitProb_preMin_armed=${pPre}`);
const pPost = calculateExitProbability(floor.minRoomsBeforeExit, floor.dangerLevel, 0, 0, false);
const pPostArmed = calculateExitProbability(floor.minRoomsBeforeExit, floor.dangerLevel, 0, 0, true);
lines.push(`exitProb_atMin=${pPost} armed=${pPostArmed} delta=${(pPostArmed - pPost).toFixed(2)}`);
// arm via heat 100
floor = applyFloorHeatDelta(floor, 100);
lines.push(`after100 heat=${floor.heat} armed=${floor.hunterArmed}`);
// drop heat, latch holds
floor = applyFloorHeatDelta(floor, -50);
lines.push(`after_drop heat=${floor.heat} armed=${floor.hunterArmed}`);
// synthetic exit room with guardian then arm
const guardian = { name: "Guardian Test", tier: "Guardian", primaryStats: player.primaryStats, currentHp: 100, currentChakra: 50, element: player.element as any, skills: [], activeBuffs: [], archetype: "TANK" };
const hunter = generateHunterFromGuardian(guardian as any);
lines.push(`hunter name=${hunter.name} tier=${hunter.tier} isHunter=${hunter.isHunter} rewardMult=${hunter.rewardMultiplier} hp=${hunter.currentHp}`);
const path = process.argv[2] || "scratch/f3-hunter-exit.log";
fs.writeFileSync(path, lines.join("\n") + "\n");
console.log(lines.join("\n"));
if (pPre !== 0) process.exit(1);
if (Math.abs((pPostArmed - pPost) - 0.4) > 0.001) process.exit(1);
if (!floor.hunterArmed || floor.heat !== 50) process.exit(1);
if (!hunter.isHunter || hunter.rewardMultiplier !== 2) process.exit(1);
console.log("OK hunter-exit");
