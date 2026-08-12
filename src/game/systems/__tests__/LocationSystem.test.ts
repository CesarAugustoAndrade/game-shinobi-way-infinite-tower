/**
 * LocationSystem Unit Tests
 * Tests floor generation, room navigation, and activity management
 */

import { describe, it, expect } from 'vitest';
import {
  generateBranchingFloor,
  generateBranchingFloorFromConfig,
  pickEventForLocation,
  isRoomAccessible,
  moveToRoom,
  getCurrentActivity,
  completeActivity,
  isFloorComplete,
  getRoomById,
  getCurrentRoom,
  calculateExitProbability,
  generateChildrenForRoom,
} from '../LocationSystem';
import { BranchingRoomType, ACTIVITY_ORDER } from '../../types';
import { createMockPlayer } from './testFixtures';
import { EVENTS } from '../../constants';

describe('generateBranchingFloor', () => {
  const player = createMockPlayer();

  it('generates floor with proper structure', () => {
    const floor = generateBranchingFloor(1, 50, player);

    expect(floor.floor).toBe(1);
    expect(floor.rooms.length).toBeGreaterThan(0);
    expect(floor.currentRoomId).toBeDefined();
    expect(floor.arc).toBeDefined();
    expect(floor.biome).toBeDefined();
  });

  it('always has an internal entry hub (START), pre-cleared and not visited', () => {
    for (const floorNum of [1, 2, 14]) {
      const floor = generateBranchingFloor(floorNum, 50, player);
      const hub = floor.rooms.find(r => r.type === BranchingRoomType.START);

      expect(hub).toBeDefined();
      expect(hub!.tier).toBe(0);
      expect(hub!.isCleared).toBe(true);
      expect(hub!.isVisible).toBe(false);
      expect(floor.currentRoomId).toBe(hub!.id);
      expect(floor.roomsVisited).toBe(0);
      expect(hub!.childIds.length).toBe(2);
    }
  });

  it('generates branching structure hub → 2 → 4', () => {
    const floor = generateBranchingFloor(1, 50, player);

    const tier0 = floor.rooms.filter(r => r.tier === 0);
    expect(tier0.length).toBe(1);

    const tier1 = floor.rooms.filter(r => r.tier === 1);
    expect(tier1.length).toBe(2);

    const tier2 = floor.rooms.filter(r => r.tier === 2);
    expect(tier2.length).toBe(4);

    // Every playable parent has exactly 2 children
    tier1.forEach(room => {
      expect(room.childIds.length).toBe(2);
    });
  });

  it('tier 1 rooms are accessible from the entry hub', () => {
    const floor = generateBranchingFloor(1, 50, player);
    const tier1Rooms = floor.rooms.filter(r => r.tier === 1);

    tier1Rooms.forEach(room => {
      expect(room.isAccessible).toBe(true);
    });
  });

  it('minRoomsBeforeExit is at least 3', () => {
    const floor = generateBranchingFloor(1, 50, player);
    expect(floor.minRoomsBeforeExit).toBeGreaterThanOrEqual(3);
  });
});

describe('isRoomAccessible', () => {
  const player = createMockPlayer();

  it('current room is always accessible', () => {
    const floor = generateBranchingFloor(1, 50, player);

    expect(isRoomAccessible(floor, floor.currentRoomId)).toBe(true);
  });

  it('entry paths accessible from cleared hub', () => {
    const floor = generateBranchingFloor(1, 50, player);
    const currentRoom = getCurrentRoom(floor);

    expect(currentRoom).toBeDefined();
    expect(currentRoom!.isCleared).toBe(true); // entry hub pre-cleared
    expect(currentRoom!.type).toBe(BranchingRoomType.START);

    currentRoom!.childIds.forEach(childId => {
      expect(isRoomAccessible(floor, childId)).toBe(true);
    });
  });
});

describe('moveToRoom', () => {
  const player = createMockPlayer();

  it('updates current room when moving', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const hub = getCurrentRoom(floor);
    const targetId = hub!.childIds[0];

    floor = moveToRoom(floor, targetId);

    expect(floor.currentRoomId).toBe(targetId);
  });

  it('increments rooms visited counter on first real room (hub does not count)', () => {
    let floor = generateBranchingFloor(1, 50, player);
    expect(floor.roomsVisited).toBe(0);
    const hub = getCurrentRoom(floor);
    const targetId = hub!.childIds[0];

    floor = moveToRoom(floor, targetId);

    expect(floor.roomsVisited).toBe(1);
  });

  it('does not increment rooms visited when re-entering same room', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const hub = getCurrentRoom(floor);
    const targetId = hub!.childIds[0];
    floor = moveToRoom(floor, targetId);
    const initialVisited = floor.roomsVisited;

    floor = moveToRoom(floor, targetId);

    expect(floor.roomsVisited).toBe(initialVisited);
  });

  it('does not move to inaccessible foresight room from hub', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const tier2Room = floor.rooms.find(r => r.tier === 2);

    // Tier 2 is not accessible until its parent is entered/cleared
    const originalRoomId = floor.currentRoomId;
    floor = moveToRoom(floor, tier2Room!.id);

    expect(floor.currentRoomId).toBe(originalRoomId);
  });
});

describe('getCurrentActivity', () => {
  const player = createMockPlayer();

  it('returns first incomplete activity', () => {
    const floor = generateBranchingFloor(1, 50, player);
    // Move to a room with activities
    const targetRoom = floor.rooms.find(r => r.tier === 1 && r.activities.combat);

    if (targetRoom) {
      const activity = getCurrentActivity(targetRoom);
      // Should return combat first (it's first in ACTIVITY_ORDER)
      expect(activity).toBe('combat');
    }
  });

  it('returns null when all activities completed', () => {
    const floor = generateBranchingFloor(1, 50, player);
    const hub = getCurrentRoom(floor)!;

    // Entry hub has no activities
    const activity = getCurrentActivity(hub);
    expect(activity).toBeNull();
  });
});

describe('completeActivity', () => {
  const player = createMockPlayer();

  it('marks activity as completed', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const roomWithCombat = floor.rooms.find(r => r.activities.combat && !r.activities.combat.completed);

    if (roomWithCombat) {
      floor = completeActivity(floor, roomWithCombat.id, 'combat');
      const updatedRoom = getRoomById(floor, roomWithCombat.id);
      expect(updatedRoom!.activities.combat!.completed).toBe(true);
    }
  });

  it('marks room as cleared when all activities done', () => {
    let floor = generateBranchingFloor(1, 50, player);
    // Find a room with activities to complete
    const tier1Room = floor.rooms.find(r => r.tier === 1);

    if (tier1Room) {
      // Complete all activities in order
      for (const actKey of ACTIVITY_ORDER) {
        if (tier1Room.activities[actKey]) {
          floor = completeActivity(floor, tier1Room.id, actKey);
        }
      }

      const updatedRoom = getRoomById(floor, tier1Room.id);
      expect(updatedRoom!.isCleared).toBe(true);
    }
  });

  it('makes child rooms accessible when room cleared', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const tier1Room = floor.rooms.find(r => r.tier === 1);

    if (tier1Room && tier1Room.childIds.length > 0) {
      // Complete all activities
      for (const actKey of ACTIVITY_ORDER) {
        if (tier1Room.activities[actKey]) {
          floor = completeActivity(floor, tier1Room.id, actKey);
        }
      }

      // Child rooms should now be accessible
      tier1Room.childIds.forEach(childId => {
        const childRoom = getRoomById(floor, childId);
        expect(childRoom!.isAccessible).toBe(true);
      });
    }
  });

  it('does not mutate prior floor snapshot when unlocking children', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const tier1Room = floor.rooms.find(r => r.tier === 1 && r.childIds.length > 0);
    if (!tier1Room) return;

    const snapshotBefore = floor;
    const childBefore = getRoomById(snapshotBefore, tier1Room.childIds[0]);
    const wasAccessible = childBefore?.isAccessible ?? false;

    for (const actKey of ACTIVITY_ORDER) {
      if (tier1Room.activities[actKey]) {
        floor = completeActivity(floor, tier1Room.id, actKey);
      }
    }

    // Previous floor object must keep original accessibility on shared children
    const childStillOnSnapshot = getRoomById(snapshotBefore, tier1Room.childIds[0]);
    expect(childStillOnSnapshot!.isAccessible).toBe(wasAccessible);

    // New floor unlocks children
    const childOnNewFloor = getRoomById(floor, tier1Room.childIds[0]);
    expect(childOnNewFloor!.isAccessible).toBe(true);
  });
});

describe('isFloorComplete', () => {
  const player = createMockPlayer();

  it('returns false when no exit room exists', () => {
    const floor = generateBranchingFloor(1, 50, player);
    // Initially, exit room may not exist yet
    if (!floor.exitRoomId) {
      expect(isFloorComplete(floor)).toBe(false);
    }
  });

  it('returns false when exit room not cleared', () => {
    let floor = generateBranchingFloor(1, 50, player);

    // Generate enough rooms to potentially create an exit
    // Move through rooms to trigger exit generation
    let currentRoom = getCurrentRoom(floor);
    for (let i = 0; i < 20 && currentRoom && currentRoom.childIds.length > 0; i++) {
      // Complete activities
      for (const actKey of ACTIVITY_ORDER) {
        if (currentRoom.activities[actKey]) {
          floor = completeActivity(floor, currentRoom.id, actKey);
        }
      }

      // Move to first child
      floor = moveToRoom(floor, currentRoom.childIds[0]);
      currentRoom = getCurrentRoom(floor);
    }

    // If exit exists and not cleared, should return false
    if (floor.exitRoomId) {
      const exitRoom = getRoomById(floor, floor.exitRoomId);
      if (exitRoom && !exitRoom.isCleared) {
        expect(isFloorComplete(floor)).toBe(false);
      }
    }
  });
});

describe('calculateExitProbability', () => {
  it('is zero before the 3rd room (and before danger min)', () => {
    expect(calculateExitProbability(0, 1)).toBe(0);
    expect(calculateExitProbability(1, 1)).toBe(0);
    expect(calculateExitProbability(2, 1)).toBe(0);
    // D4 min is 6
    expect(calculateExitProbability(5, 4)).toBe(0);
  });

  it('opens at min rooms and rises with intel', () => {
    const atMinNoIntel = calculateExitProbability(3, 1, 0, 0);
    const atMinFullIntel = calculateExitProbability(3, 1, 0, 100);
    expect(atMinNoIntel).toBeCloseTo(0.25, 5);
    expect(atMinFullIntel).toBeCloseTo(0.65, 5); // 0.25 + 0.40 intel
    expect(atMinFullIntel).toBeGreaterThan(atMinNoIntel);
  });

  it('caps at 0.9', () => {
    const p = calculateExitProbability(50, 1, 0.5, 100);
    expect(p).toBe(0.9);
  });
});

describe('generateChildrenForRoom exit batch', () => {
  const player = createMockPlayer();

  it('never places exit before min rooms visited', () => {
    let floor = generateBranchingFloor(1, 50, player);
    // Force high intel so exit would fire if allowed
    floor = { ...floor, currentIntel: 100, roomsVisited: 0 };

    const hub = getCurrentRoom(floor)!;
    const entryId = hub.childIds[0];
    // Entry already has children; generate for a tier-2 parent with no kids yet
    floor = moveToRoom(floor, entryId, player);
    const entry = getCurrentRoom(floor)!;
    // Complete entry so we can go deeper without caring about activities for this unit
    for (const actKey of ACTIVITY_ORDER) {
      if (entry.activities[actKey]) {
        floor = completeActivity(floor, entry.id, actKey);
      }
    }
    const childId = entry.childIds[0];
    floor = moveToRoom(floor, childId, player);
    // roomsVisited is 2 here — still below min 3 for D from floor 1
    floor = { ...floor, roomsVisited: 2, currentIntel: 100, exitRoomId: null };

    const parent = getCurrentRoom(floor)!;
    // Clear prior children flag to re-generate (clone without children)
    const stripped = {
      ...floor,
      rooms: floor.rooms.map((r) =>
        r.id === parent.id
          ? { ...r, hasGeneratedChildren: false, childIds: [] }
          : r,
      ).filter((r) => r.parentId !== parent.id),
      exitRoomId: null,
    };

    const next = generateChildrenForRoom(stripped, parent.id, player);
    expect(next.exitRoomId).toBeNull();
    const kids = next.rooms.filter((r) => r.parentId === parent.id);
    expect(kids.length).toBe(2);
    expect(kids.every((k) => !k.isExit)).toBe(true);
  });
});

describe('pickEventForLocation (T-033 tiedStoryEvents)', () => {
  const player = createMockPlayer();

  it('prefers preferredEventIds when they are eligible', () => {
    const preferred = 'forest_death_trap';
    expect(EVENTS.some((e) => e.id === preferred)).toBe(true);

    // Fixed rng — preference pool is used first, so only preferred ids compete
    for (let i = 0; i < 20; i++) {
      const event = pickEventForLocation('EXAMS_ARC', player, [preferred], () => 0.5);
      expect(event?.id).toBe(preferred);
    }
  });

  it('falls back to arc pool when preferred ids are missing or ineligible', () => {
    const event = pickEventForLocation('EXAMS_ARC', player, ['totally_fake_event_id'], () => 0.1);
    expect(event).toBeDefined();
    expect(event!.id).not.toBe('totally_fake_event_id');
    expect(!event!.allowedArcs || event!.allowedArcs.includes('EXAMS_ARC')).toBe(true);
  });

  it('stores preferredEventIds on floor from config', () => {
    const floor = generateBranchingFloorFromConfig({
      floor: 5,
      arc: 'EXAMS_ARC',
      biome: 'Forest of Death',
      dangerLevel: 3,
      wealthLevel: 3,
      roomGenerationMode: 'dynamic',
      targetRoomCount: 10,
      difficulty: 55,
      player,
      preferredEventIds: ['rival_team_encounter'],
    });
    expect(floor.preferredEventIds).toEqual(['rival_team_encounter']);
  });
});

describe('generateBranchingFloorFromConfig — dangerLevel plumbing (no double-count)', () => {
  const player = createMockPlayer();

  /**
   * Regression: location danger 1 with baseDifficulty often yields effectiveFloor ≈ 12–14.
   * Old code used floorToDangerLevel(floor) on combat/elite/guardian → D5 enemies on D1 maps.
   * Config dangerLevel must drive enemy.dangerLevel, not ceil(effectiveFloor/3).
   */
  it('floor=14 dangerLevel=1 must NOT spawn enemies as D5', () => {
    const floor = generateBranchingFloorFromConfig({
      floor: 14, // typical effectiveFloor for danger 1 + mid baseDifficulty
      arc: 'WAVES_ARC',
      biome: 'Mist Covered Bridge',
      dangerLevel: 1,
      wealthLevel: 2,
      roomGenerationMode: 'dynamic',
      targetRoomCount: 10,
      difficulty: 40,
      enemyPool: ['beach_bandit'],
      player,
    });

    expect(floor.dangerLevel).toBe(1);
    // minRoomsBeforeExit = 2 + dangerLevel → D1 → 3 (not 2+14=16)
    expect(floor.minRoomsBeforeExit).toBe(3);
    expect(floor.wealthLevel).toBe(2);

    const combatEnemies = floor.rooms
      .map((r) => r.activities.combat?.enemy)
      .filter((e): e is NonNullable<typeof e> => e != null);

    expect(combatEnemies.length).toBeGreaterThan(0);
    for (const enemy of combatEnemies) {
      // Must be D1, never ceil(14/3)=5
      expect(enemy.dangerLevel).toBe(1);
      expect(enemy.dangerLevel).not.toBe(5);
    }
  });

  it('uses config dangerLevel for combat enemies across multiple effective floors', () => {
    for (const { effectiveFloor, dangerLevel } of [
      { effectiveFloor: 12, dangerLevel: 1 as const },
      { effectiveFloor: 14, dangerLevel: 1 as const },
      { effectiveFloor: 20, dangerLevel: 4 as const },
      { effectiveFloor: 26, dangerLevel: 7 as const },
    ]) {
      const floor = generateBranchingFloorFromConfig({
        floor: effectiveFloor,
        arc: 'WAVES_ARC',
        biome: 'Test',
        dangerLevel,
        wealthLevel: 4,
        roomGenerationMode: 'dynamic',
        targetRoomCount: 10,
        difficulty: 40,
        enemyPool: ['beach_bandit'],
        player,
      });

      expect(floor.dangerLevel).toBe(dangerLevel);
      expect(floor.minRoomsBeforeExit).toBe(2 + dangerLevel);

      for (const room of floor.rooms) {
        const combat = room.activities.combat?.enemy;
        if (combat) {
          expect(combat.dangerLevel).toBe(dangerLevel);
        }
        const elite = room.activities.eliteChallenge?.enemy;
        if (elite) {
          // Elite is one step harder, capped at 7
          expect(elite.dangerLevel).toBe(Math.min(7, dangerLevel + 1));
        }
      }
    }
  });

  it('threads wealthLevel into floor (not hard-coded 4)', () => {
    const floor = generateBranchingFloorFromConfig({
      floor: 14,
      arc: 'WAVES_ARC',
      biome: 'Test',
      dangerLevel: 2,
      wealthLevel: 6,
      roomGenerationMode: 'dynamic',
      targetRoomCount: 10,
      difficulty: 40,
      player,
    });
    expect(floor.wealthLevel).toBe(6);
  });
});
