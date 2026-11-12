/**
 * Battle Simulator - Core automated battle engine
 * Runs battles without React dependencies for pure simulation
 */

import {
  Player,
  Enemy,
  Clan,
  EquipmentSlot,
  ApproachType,
  TreasureQuality,
  DEFAULT_MERCHANT_SLOTS,
  TerrainType,
  CombatModifierType,
  CombatRange,
  RangeMoveDirection,
  Mark,
  PrimaryAttributes,
  DerivedStats,
} from '../game/types';
import {
  calculateDerivedStats,
  getPlayerFullStats,
  getEnemyFullStats,
} from '../game/systems/StatSystem';
import {
  resolveInitialRange,
  shiftRange,
  enemyVoluntaryMoveBlocked,
} from '../game/systems/RangeSystem';
import { buildDeck, drawHand } from '../game/systems/DeckSystem';
import { openingPostureForApproach } from '../game/systems/PostureSystem';
import { createCombatState } from '../game/systems/CombatWorkflowSystem';
import { resetCombatFrontier } from '../game/systems/TurnClockSystem';
import { bootstrapPlayerSkillConfig, normalizeSkillConfig } from '../game/systems/SkillConfigLive';
import {
  applyRoomMovementCostToMaxAp,
  applyMovementPenaltyToMaxAp,
} from '../game/systems/LocationTerrainSystem';
import { runHeadlessCombat } from './headlessCombatLoop';
import {
  BattleResult,
  SimulationConfig,
  PlayerBuildConfig,
  DEFAULT_CONFIG
} from './types';
import { EnemyArchetype, generateSimEnemy } from './EnemyArchetypes';
import { createBuildFromConfig } from './BuildGenerator';
import {
  generateId,
  determineTurnOrder,
} from '../game/systems/CombatCalculationSystem';
import {
  processPassivesOnCombatStart,
} from '../game/systems/EquipmentPassiveSystem';
import { applyRoomCombatModifiers } from '../game/systems/RoomCombatModifierSystem';
import type { CombatModifiers } from '../game/systems/ApproachSystem';
import {
  APPROACH_DEFINITIONS,
  calculateApproachSuccessChance,
} from '../game/constants/approaches';
import { LaunchProperties } from '../config/featureFlags';
import { BIOME_TERRAINS, TERRAIN_DEFINITIONS } from '../game/constants/terrain';
import { getStoryArcForFloor } from '../game/entities/Enemy';

/**
 * Approach success roll using the **live** `calculateApproachSuccessChance`
 * (same formulas as ApproachSystem / APPROACH_DEFINITIONS).
 */
function rollApproachSuccess(
  approach: ApproachType,
  playerStats: { primary: PrimaryAttributes; derived: DerivedStats },
  terrainStealthBonus: number = 0,
  /** F3 visit heat — PP penalties (parity with live executeApproach) */
  visitHeat: number = 0,
): boolean {
  if (approach === ApproachType.FRONTAL_ASSAULT) {
    return true;
  }

  const stats: Record<string, number> = {
    speed: playerStats.primary.speed,
    dexterity: playerStats.primary.dexterity,
    intelligence: playerStats.primary.intelligence,
    calmness: playerStats.primary.calmness,
    accuracy: playerStats.primary.accuracy,
    willpower: playerStats.primary.willpower,
    strength: playerStats.primary.strength,
    spirit: playerStats.primary.spirit,
    chakra: playerStats.primary.chakra,
  };

  const successChance = calculateApproachSuccessChance(
    approach,
    stats,
    terrainStealthBonus,
    visitHeat,
  );
  return Math.random() * 100 < successChance;
}

// ============================================================================
// COMBAT HELPERS
// ============================================================================

// generateId imported from CombatCalculationSystem

/**
 * Create a simulation-ready player from build config
 */
export function createSimPlayer(config: PlayerBuildConfig): Player {
  const { stats, skills, element } = createBuildFromConfig(config);
  const derived = calculateDerivedStats(stats, {});

  return {
    clan: config.clan,
    level: config.level,
    exp: 0,
    maxExp: 100,
    primaryStats: stats,
    unspentStatPoints: 0,
    currentHp: derived.maxHp,
    currentChakra: derived.maxChakra,
    element,
    ryo: 0,
    equipment: {
      [EquipmentSlot.SLOT_1]: null,
      [EquipmentSlot.SLOT_2]: null,
      [EquipmentSlot.SLOT_3]: null,
      [EquipmentSlot.SLOT_4]: null
    },
    skills: skills.map(s => ({ ...s, currentCooldown: 0 })),
    activeBuffs: [],
    bag: Array(12).fill(null), // 12 fixed slots
    treasureQuality: TreasureQuality.BROKEN,
    merchantSlots: DEFAULT_MERCHANT_SLOTS,
    locationsCleared: 0,
    eventFlags: {},
    preferredApproach: ApproachType.FRONTAL_ASSAULT,
    clanLevel: 0,
  };
}


/**
 * T-147: sim voluntary move uses the live Bound helper before shiftRange.
 */
export function applySimEnemyVoluntaryMove(
  currentRange: CombatRange,
  moveDirection: RangeMoveDirection | undefined,
  marks: readonly Mark[] | undefined,
): { range: CombatRange; moved: boolean } {
  if (!moveDirection || enemyVoluntaryMoveBlocked(marks)) {
    return { range: currentRange, moved: false };
  }
  return shiftRange(currentRange, moveDirection);
}


/**
 * Helper to get a random terrain type appropriate for a given floor.
 */
export function getRandomTerrainForFloor(floor: number): TerrainType {
  const arc = getStoryArcForFloor(floor);
  const terrains = BIOME_TERRAINS[arc.name] || BIOME_TERRAINS.ACADEMY_ARC;
  return terrains[Math.floor(Math.random() * terrains.length)];
}

/**
 * Result of resolving one battle with carry-over awareness.
 *
 * `result` is the standard 1v1 `BattleResult` (whose `playerFinalHp` already
 * carries the surviving HP). `playerFinalChakra` is exposed separately so an
 * attrition driver (the LocationSimulator) can carry the player's chakra pool
 * into the next encounter — `BattleResult` only tracked HP.
 */
export interface BattleResolution {
  result: BattleResult;
  playerFinalChakra: number;
}

/**
 * Resolve a single battle between an ALREADY-BUILT player and enemy.
 *
 * Unlike `simulateBattle` (which mints a fresh, full-HP player every call), this
 * takes the combatants as-is, so the player can enter with its CURRENT HP/chakra
 * (and any cooldown/buff state the caller set up). This is the seam the
 * LocationSimulator uses to chain rooms with state carry-over.
 * Combat commands are live: processUpkeep → useSkill → processEnemyTurn.
 *
 * Mutation contract: combat runs on copies; read surviving pools from the resolution.
 * Exceptions before the copy: combat-start passives **replace** `player`/`enemy`
 * `activeBuffs` and may set `player.currentHp` (e.g. Uzumaki heal). Callers that
 * reuse a combatant should pass throwaway buff arrays (LocationSimulator already
 * does via `prepareForCombat` → `activeBuffs: []`) and re-sync HP if needed.
 */
export function resolveBattle(
  player: Player,
  enemy: Enemy,
  config: SimulationConfig = DEFAULT_CONFIG,
  battleId: number = 0,
  approach: ApproachType | null = null,
  terrain?: TerrainType,
  /** T-109: room combat activity modifiers (combat ?? elite) */
  roomCombatModifiers?: CombatModifierType[] | null,
  /** F3: visit heat for approach PP + initial band bias (balance sims default 0) */
  visitHeat: number = 0,
): BattleResolution {
  // Calculate derived stats
  const playerStats = getPlayerFullStats(player);
  const enemyStats = getEnemyFullStats(enemy);

  // Get/Determine terrain
  const selectedTerrain = terrain || (config.floorNumber ? getRandomTerrainForFloor(config.floorNumber) : undefined);
  const terrainDef = selectedTerrain ? TERRAIN_DEFINITIONS[selectedTerrain] : null;

  // Calculate approach success (only if approach is used) — shared formulas + F3 heat
  const approachSucceeded = approach
    ? rollApproachSuccess(
        approach,
        { primary: playerStats.primary, derived: playerStats.derived },
        terrainDef?.effects.stealthModifier ?? 0,
        visitHeat,
      )
    : false;

  // Process passives on combat start (SHIELD_ON_START uses max chakra — A-017).
  // Replace activeBuffs with passive result (no double-append — result already includes prior buffs).
  // Apply currentHp from result (e.g. Uzumaki combat-start heal).
  const combatStartResult = processPassivesOnCombatStart(player, enemy, {
    maxHp: playerStats.derived.maxHp,
    maxChakra: playerStats.derived.maxChakra,
  });
  player.activeBuffs = combatStartResult.player.activeBuffs;
  player.currentHp = combatStartResult.player.currentHp;
  enemy.activeBuffs = combatStartResult.enemy.activeBuffs;

  // Resolve approach effects from shared APPROACH_DEFINITIONS (parity with live game)
  const approachDef = approach ? APPROACH_DEFINITIONS[approach] : null;
  const approachEffects = approachDef
    ? (approachSucceeded ? approachDef.successEffects : (approachDef.failureEffects ?? approachDef.successEffects))
    : null;

  // First-hit mult from data (stealth = 2.0), not a hard-coded 2.5
  let firstHitMult =
    approachSucceeded && approachEffects
      ? (approachEffects.firstHitMultiplier ?? 1.0)
      : 1.0;

  // T-109: room combat modifiers (parity with simulateGameCombat / startCombat)
  const approachMods: CombatModifiers = {
    playerGoesFirst: approachSucceeded && (approachEffects?.guaranteedFirst ?? false),
    playerInitiativeBonus: approachEffects?.initiativeBonus ?? 0,
    firstHitMultiplier: firstHitMult,
    playerBuffs: [],
    enemyDebuffs: [],
    xpMultiplier: 1,
  };
  const roomApplied = applyRoomCombatModifiers(
    roomCombatModifiers,
    approachMods,
    player,
    playerStats.derived.maxHp,
  );
  player = roomApplied.player;
  firstHitMult = roomApplied.modifiers.firstHitMultiplier;
  const enemyFirstHitMult = roomApplied.enemyFirstHitMultiplier;
  const roomCombatEvasion = roomApplied.playerEvasionBonus;
  const fallDamageOnMiss = roomApplied.environment.fallDamageOnMiss;
  if (roomApplied.modifiers.playerBuffs.length > 0) {
    player = {
      ...player,
      activeBuffs: [...player.activeBuffs, ...roomApplied.modifiers.playerBuffs],
    };
  }

  const openingPosture = openingPostureForApproach(
    approach ?? ApproachType.FRONTAL_ASSAULT,
    Boolean(approach) && approachSucceeded,
  );

  const currentRange = resolveInitialRange({
    approach: approach ?? ApproachType.FRONTAL_ASSAULT,
    success: approach ? approachSucceeded : true,
    enemy,
    heat: visitHeat,
  });

  if (approachEffects) {
    const sourceName = approachDef?.name ?? 'Approach';
    for (const eff of approachEffects.enemyDebuffs ?? []) {
      if (Math.random() > (eff.chance ?? 1)) continue;
      enemy = {
        ...enemy,
        activeBuffs: [
          ...enemy.activeBuffs,
          {
            id: generateId(),
            name: eff.type,
            duration: eff.duration,
            effect: {
              type: eff.type,
              value: eff.value,
              duration: eff.duration,
              targetStat: eff.targetStat,
              chance: eff.chance,
            },
            source: sourceName,
          },
        ],
      };
    }
    for (const eff of approachEffects.playerBuffs ?? []) {
      if (Math.random() > (eff.chance ?? 1)) continue;
      player = {
        ...player,
        activeBuffs: [
          ...player.activeBuffs,
          {
            id: generateId(),
            name: eff.type,
            duration: eff.duration,
            effect: {
              type: eff.type,
              value: eff.value,
              duration: eff.duration,
              targetStat: eff.targetStat,
              chance: eff.chance,
            },
            source: sourceName,
          },
        ],
      };
    }
    if (approachSucceeded) {
      const hpReduction = approachEffects.enemyHpReduction ?? 0;
      if (hpReduction > 0) {
        enemy = {
          ...enemy,
          currentHp: Math.floor(enemy.currentHp * (1 - hpReduction)),
        };
      }
    }
    if (!approachSucceeded && (approachEffects.hpCost ?? 0) > 0) {
      player = {
        ...player,
        currentHp: Math.max(1, player.currentHp - (approachEffects.hpCost ?? 0)),
      };
    }
  }

  const combatState = createCombatState(roomApplied.modifiers, terrainDef ?? undefined, null, {
    roomCombatEvasion,
    fallDamageOnMiss,
    roomConditionNames: roomApplied.activeNames,
    enemyFirstHitMultiplier: enemyFirstHitMult,
  });
  combatState.skipFirstSkillCost = combatStartResult.skipFirstSkillCost;
  combatState.firstHitMultiplier = firstHitMult;

  const frontier = resetCombatFrontier({
    skills: player.skills,
    modes: combatState.activeModes ?? [],
    marks: combatState.marks ?? [],
  });
  player = { ...player, skills: frontier.skills };
  combatState.activeModes = frontier.modes;
  combatState.marks = frontier.marks;

  const boot = bootstrapPlayerSkillConfig(player, Math.random);
  player = boot.player;

  const playablePool = buildDeck(player.skills);
  let maxAp = playerStats.derived.actionPointsPerTurn;
  maxAp = applyRoomMovementCostToMaxAp(maxAp, terrainDef ?? null);
  maxAp = applyMovementPenaltyToMaxAp(maxAp, null);
  combatState.maxAp = maxAp;
  combatState.posture = openingPosture;
  combatState.playablePool = playablePool;
  combatState.modeUpkeepPriority = normalizeSkillConfig(player.skillConfig).modeUpkeepPriority;
  combatState.currentRange = currentRange;

  let enemyMaxAp = getEnemyFullStats(enemy).derived.actionPointsPerTurn;
  enemyMaxAp = applyRoomMovementCostToMaxAp(enemyMaxAp, terrainDef ?? null);
  combatState.enemyMaxAp = enemyMaxAp;
  combatState.enemyCurrentAp = enemyMaxAp;

  const whoFirst = determineTurnOrder(playerStats, enemyStats, {
    isFirstTurn: true,
    playerGoesFirst: roomApplied.modifiers.playerGoesFirst,
    playerInitiativeBonus: roomApplied.modifiers.playerInitiativeBonus,
    terrain: terrainDef,
  });
  const playerGoesFirst = whoFirst === 'player';
  combatState.openingInitHolder = whoFirst;

  if (playerGoesFirst) {
    const opening = drawHand(
      playablePool,
      {
        posture: openingPosture,
        turnIndex: combatState.turnIndex,
        mainAttackId: normalizeSkillConfig(player.skillConfig).mainAttackId,
      },
      LaunchProperties.HAND_SIZE,
      Math.random,
    );
    combatState.currentAp = maxAp;
    combatState.hand = opening.hand;
  } else {
    combatState.currentAp = 0;
    combatState.hand = [];
  }

  return runHeadlessCombat({
    player: { ...player },
    enemy: { ...enemy },
    combatState,
    playerGoesFirst,
    skipOpeningUpkeep: playerGoesFirst,
    maxTurns: config.maxTurnsPerBattle,
    battleId,
    approach,
    approachSucceeded,
    firstHitMultiplier: firstHitMult,
  });
}

/**
 * Run a single 1v1 battle simulation.
 *
 * Builds a fresh, full-HP player from the build config and a freshly-scaled
 * archetype enemy, then delegates to `resolveBattle`. Keeping this a thin
 * wrapper means the 1v1 sim and the carry-over LocationSimulator share one
 * battle engine, and the RNG order is byte-identical to the pre-refactor flow
 * (create player → create enemy → resolve).
 */
export function simulateBattle(
  playerConfig: PlayerBuildConfig,
  enemyArchetype: EnemyArchetype,
  config: SimulationConfig = DEFAULT_CONFIG,
  battleId: number = 0,
  approach: ApproachType | null = null,
  terrain?: TerrainType
): BattleResult {
  const player = createSimPlayer(playerConfig);
  const usedApproach = approach ?? config.approach ?? null;
  if (usedApproach) {
    player.preferredApproach = usedApproach;
  }
  const enemy = generateSimEnemy(enemyArchetype, config.floorNumber, config.difficulty);
  return resolveBattle(
    player,
    enemy,
    config,
    battleId,
    usedApproach,
    terrain,
    undefined,
    config.visitHeat ?? 0,
  ).result;
}

/**
 * Run multiple battles and return all results
 */
export function runBattles(
  playerConfig: PlayerBuildConfig,
  enemyArchetype: EnemyArchetype,
  config: SimulationConfig = DEFAULT_CONFIG,
  approach: ApproachType | null = null
): BattleResult[] {
  const results: BattleResult[] = [];

  const usedApproach = approach ?? config.approach ?? null;
  for (let i = 0; i < config.battlesPerConfig; i++) {
    const result = simulateBattle(playerConfig, enemyArchetype, config, i, usedApproach);
    results.push(result);
  }

  return results;
}
