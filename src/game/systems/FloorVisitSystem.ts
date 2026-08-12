/**
 * FloorVisitSystem — pure floor heat / hunter visit helpers (F3)
 *
 * Heat deltas, hunter arming, and Guardian → Hunter upgrade.
 * Zero React/DOM.
 */

import { BranchingFloor, Enemy } from '../types';
import { applyHeatDelta } from './HeatSystem';
import { preferredRangeForEnemy } from './RangeSystem';
import { getEnemyFullStats } from './StatSystem';

/**
 * F3: Upgrade a Guardian (or any exit foe) into a Hunter.
 * ×1.75 HP, ×1.35 damage (STR/SPI scaled), preferred range, 2× XP/Ryo, artifact guaranteed.
 */
export function generateHunterFromGuardian(guardian: Enemy): Enemy {
  const primaryStats = {
    ...guardian.primaryStats,
    strength: Math.max(1, Math.round(guardian.primaryStats.strength * 1.35)),
    spirit: Math.max(1, Math.round(guardian.primaryStats.spirit * 1.35)),
    intelligence: Math.max(1, Math.round(guardian.primaryStats.intelligence * 1.2)),
  };
  const base = { ...guardian, primaryStats, isHunter: true, isBoss: false };
  const derived = getEnemyFullStats(base).derived;
  const maxHp = Math.max(1, Math.floor(derived.maxHp * 1.75));
  const preferred = preferredRangeForEnemy(guardian);
  const nameBase = guardian.name.replace(/^Guardian\s+/i, '').replace(/^Hunter\s+/i, '');
  return {
    ...base,
    name: `Hunter ${nameBase}`,
    tier: 'Hunter',
    isHunter: true,
    preferredRange: preferred,
    rewardMultiplier: 2,
    currentHp: maxHp,
    currentChakra: derived.maxChakra,
    dropRateBonus: Math.max(guardian.dropRateBonus ?? 0, 100),
  };
}

/**
 * F3: Latch hunter + immutably replace EXIT combat enemy with Hunter when present and not cleared.
 * Does not force EXIT spawn before min rooms.
 */
export function armHunterOnFloor(floor: BranchingFloor): BranchingFloor {
  let rooms = floor.rooms;
  if (floor.exitRoomId) {
    rooms = floor.rooms.map((room) => {
      if (room.id !== floor.exitRoomId) return room;
      if (room.isCleared) return room;
      const combat = room.activities.combat;
      if (!combat || combat.completed) return room;
      if (combat.enemy.isHunter) return room;
      const hunter = generateHunterFromGuardian(combat.enemy);
      return {
        ...room,
        name: room.name.includes('Hunter') ? room.name : `Hunter Gate`,
        description: room.description,
        activities: {
          ...room.activities,
          combat: {
            ...combat,
            enemy: hunter,
          },
        },
      };
    });
  }
  return {
    ...floor,
    hunterArmed: true,
    rooms,
  };
}

/**
 * F3: Apply heat delta to a floor; if newly armed, swap EXIT guardian → Hunter.
 */
export function applyFloorHeatDelta(
  floor: BranchingFloor,
  delta: number,
): BranchingFloor {
  const result = applyHeatDelta(floor.heat ?? 0, delta, floor.hunterArmed ?? false);
  let next: BranchingFloor = {
    ...floor,
    heat: result.heat,
    hunterArmed: result.hunterArmed,
  };
  if (result.newlyArmed || (result.hunterArmed && !floor.hunterArmed)) {
    next = armHunterOnFloor(next);
  }
  return next;
}
