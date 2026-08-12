/**
 * Prove: event heat + completeActivity chain preserves heat (no stale overwrite).
 * Mirrors the fixed working-floor pattern in useActivityHandlers.
 */
import {
  generateBranchingFloor,
  applyFloorHeatDelta,
  completeActivity,
  getCurrentRoom,
} from "../src/game/systems/LocationSystem.ts";
import { createPlayer } from "../src/game/entities/Player.ts";
import { Clan } from "../src/game/types.ts";
import { approachFailHeatDelta } from "../src/game/systems/HeatSystem.ts";
import { ApproachType } from "../src/game/types.ts";
import fs from "fs";

const lines: string[] = [];
const player = createPlayer(Clan.LEE);
let floor = generateBranchingFloor(1, 50, player);
// move off hub to a playable room if needed
const room =
  floor.rooms.find((r) => r.activities.event || r.activities.combat) ||
  floor.rooms.find((r) => r.depth >= 1) ||
  getCurrentRoom(floor);
if (!room) {
  console.error("no room");
  process.exit(1);
}
// ensure event activity for completeActivity
if (!room.activities.event) {
  floor = {
    ...floor,
    rooms: floor.rooms.map((r) =>
      r.id === room.id
        ? {
            ...r,
            activities: {
              ...r.activities,
              event: {
                definition: { id: "test", title: "t", description: "d", choices: [] } as any,
                completed: false,
              },
            },
          }
        : r
    ),
  };
}
const roomId = room.id;
lines.push(`start heat=${floor.heat} room=${roomId}`);

// 1) event heatDelta +20 (working floor)
const eventHeat = 20;
let working = applyFloorHeatDelta(floor, eventHeat);
lines.push(`after_event_heat heat=${working.heat}`);

// 2) completeActivity on WORKING (not stale start floor) — heat must survive
working = completeActivity(working, roomId, "event");
lines.push(`after_complete heat=${working.heat} armed=${working.hunterArmed}`);

// 3) approach fail heat on top
const approachHeat = approachFailHeatDelta(ApproachType.STEALTH_AMBUSH); // 15
working = applyFloorHeatDelta(working, approachHeat);
lines.push(`after_approach_fail heat=${working.heat} expected=${20 + 15}`);

// BUG pattern (stale): complete on original floor after heat on copy → loses heat
const stale = completeActivity(floor, roomId, "event");
lines.push(`stale_complete_heat=${stale.heat} (would drop event heat if used)`);

const ok = working.heat === 35 && stale.heat === 0;
lines.push(`chain_preserves_heat_ok=${ok} working=${working.heat} stale=${stale.heat}`);

const path = process.argv[2] || "scratch/f3-event-floor-chain.log";
fs.writeFileSync(path, lines.join("\n") + "\n");
console.log(lines.join("\n"));
if (!ok) process.exit(1);
console.log("OK event-floor-chain");
