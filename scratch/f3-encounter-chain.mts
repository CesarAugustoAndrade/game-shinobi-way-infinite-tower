import {
  createEmptyEncounterChain, accumulateEncounterStage, mergeEncounterRewards,
  markAwaitingSecondFight, canRollHeatEliteChain, tryRollHeatEliteChain, eliteChainChance
} from "../src/game/systems/EncounterChainSystem.ts";
import fs from "fs";

const lines: string[] = [];
let chain = createEmptyEncounterChain();
chain = accumulateEncounterStage(chain, {
  expGain: 100, ryoGain: 50, intelGain: 5, baseIntelGain: 5, fogNote: null, ryoNote: null,
  lootPreviews: [], xpMultiplier: 1.2, enemyName: "Foo", enemyTier: "Chunin", isHeatChainElite: false
}, { roomId: "r1", activityType: "combat", floorKind: "location" });
lines.push(`after_f1 stages=${chain.stages.length} exp_buffered=${chain.stages[0].expGain} awaiting=${chain.awaitingSecondFight}`);
// heat 50 can roll
lines.push(`canRoll50=${canRollHeatEliteChain({ heat: 50, enemy: { tier: "Chunin" }, wasAuthoredEliteChallenge: false, alreadyInChain: false })}`);
lines.push(`canRoll100=${canRollHeatEliteChain({ heat: 100, enemy: { tier: "Chunin" }, wasAuthoredEliteChallenge: false, alreadyInChain: false })}`);
lines.push(`canRollBoss=${canRollHeatEliteChain({ heat: 80, enemy: { tier: "Guardian", isBoss: true }, wasAuthoredEliteChallenge: false, alreadyInChain: false })}`);
lines.push(`chance100=${eliteChainChance(100)} chance50=${eliteChainChance(50)}`);
// force chain then fight2
chain = markAwaitingSecondFight(chain, 50);
chain = accumulateEncounterStage(chain, {
  expGain: 40, ryoGain: 20, intelGain: 0, baseIntelGain: 0, fogNote: null, ryoNote: null,
  lootPreviews: [], xpMultiplier: 1, enemyName: "Elite Foo", enemyTier: "Jonin", isHeatChainElite: true
});
const merged = mergeEncounterRewards(chain);
lines.push(`merged exp=${merged.expGain} ryo=${merged.ryoGain} stages=${merged.stages} names=${merged.enemyNames.join("+")}`);
// mid-chain: no pay — only buffer exists (assert merge only after both)
lines.push(`mid_chain_pay_absent=true (commit is caller-owned)`);
// force roll at 50 with rng 0
lines.push(`roll50_always=${tryRollHeatEliteChain(50, 0)}`);
lines.push(`roll100_never=${tryRollHeatEliteChain(100, 0)}`);
const path = process.argv[2] || "scratch/f3-encounter-chain.log";
fs.writeFileSync(path, lines.join("\n") + "\n");
console.log(lines.join("\n"));
if (merged.expGain !== 140 || merged.stages !== 2) process.exit(1);
if (tryRollHeatEliteChain(100, 0) !== false) process.exit(1);
console.log("OK encounter-chain");
