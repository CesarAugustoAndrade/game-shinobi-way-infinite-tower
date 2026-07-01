import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  GameState, Player, Clan, Skill, Enemy, Item, Rarity, DamageType,
  ApproachType, BranchingRoom, PrimaryStat, TrainingActivity, TrainingIntensity, LogEntry,
  EquipmentSlot, MAX_BAG_SLOTS, ScrollDiscoveryActivity,
  GameEvent, EventChoice, EventOutcome,
  TreasureQuality, DEFAULT_MERCHANT_SLOTS, MAX_MERCHANT_SLOTS,
  Region, Location, LocationPath,
  // Card-based location selection types
  IntelPool, LocationDeck, LocationCard, IntelRevealLevel,
  // Treasure system types
  TreasureActivity, TreasureHunt, TreasureType, DiceRollResult
} from './game/types';
import { CLAN_STATS, CLAN_START_SKILL, CLAN_GROWTH, SKILLS } from './game/constants';
import {
  calculateDerivedStats,
  getPlayerFullStats,
  canLearnSkill
} from './game/systems/StatSystem';
import { generateEnemy } from './game/systems/EnemySystem';

import {
  executeApproach,
  applyApproachCosts,
  applyEnemyHpReduction
} from './game/systems/ApproachSystem';
import { TERRAIN_DEFINITIONS } from './game/constants/terrain';
import {
  moveToRoom,
  getCurrentActivity,
  completeActivity,
  getCurrentRoom,
  addMapPiece,
  getTreasureHuntReward,
} from './game/systems/LocationSystem';
import {
  generateRegion,
  enterLocation,
  enterLocationFromCard,
  getCurrentLocation,
  choosePath,
  getRandomPath,
  isRegionComplete,
  locationToBranchingFloor,
  markLocationComplete,
  exitLocation,
  calculateLocationXP,
  calculateLocationRyo,
  // Card-based location selection functions
  initializeLocationDeck,
  drawLocationCards,
  createInitialIntelPool,
  addIntel,
  updateDeckAfterCompletion,
  // Wealth and intel system functions
  INTEL_GAIN,
  evaluateIntel,
} from './game/systems/RegionSystem';
import {
  dangerToFloor,
  calculateMerchantRerollCost,
  applyWealthToRyo,
  getMerchantDiscount,
} from './game/systems/ScalingSystem';
import { LAND_OF_WAVES_CONFIG } from './game/constants/regions';
import { useCombat } from './hooks/useCombat';
import { useCombatExplorationState } from './hooks/useCombatExplorationState';
import { useExploration, ActivitySceneSetters } from './hooks/useExploration';
import { useTreasureHandlers, TreasureHuntRewardData, PendingBagFullItem } from './hooks/useTreasureHandlers';
import { useInventoryHandlers } from './hooks/useInventoryHandlers';
import { useActivityHandlers } from './hooks/useActivityHandlers';
import { useCombatVictory } from './hooks/useCombatVictory';
import { getDamageTypeColor, getRarityTextColorWithEffects as getRarityColor } from './utils/colorHelpers';
import { GameProvider, GameContextValue } from './contexts/GameContext';
import { LIMITS, MERCHANT } from './game/config';
import { MainMenu, CharacterSelect, GameOver, GameGuide } from './scenes/menu';
import { Combat, EliteChallenge } from './scenes/combat';
import { Loot, TreasureChoice, TreasureHuntReward as TreasureHuntRewardScene, ScrollDiscovery } from './scenes/rewards';
import { Merchant, Training, Event } from './scenes/activities';
import DiceRollResultModal from './components/modals/DiceRollResultModal';
import { simulateGameCombat, CombatSimulationResult } from './game/systems/CombatSimulationService';
// Shared components
import ErrorBoundary from './components/shared/ErrorBoundary';
// Layout components
import LeftSidebarPanel from './components/layout/LeftSidebarPanel';
import RightSidebarPanel from './components/layout/RightSidebarPanel';
// Combat components
import ApproachSelector from './components/combat/ApproachSelector';
// Exploration components
import LocationMap from './components/exploration/LocationMap';
import RegionMap from './components/exploration/RegionMap';
// PathChoiceModal removed - cards now replace path selection modal
// Character components
import PlayerHUD from './components/character/PlayerHUD';
// Modal components
import RewardModal from './components/modals/RewardModal';
import EventResultModal from './components/modals/EventResultModal';
import { OutcomeChange } from './components/modals/eventOutcomeChanges';
import { logVictory, logRewardModal, logFlowCheckpoint } from './game/utils/combatDebug';
import {
  logRoomEnter, logRoomExit, logRoomSelect,
  logActivityStart, logActivityComplete,
  logModalOpen, logModalClose,
  logStateChange, logExplorationCheckpoint,
  // Region debug functions
  logLocationSelect, logLocationEnter, logLocationLeave,
  logIntelMissionStart, logIntelMissionVictory, logIntelMissionSkip,
  logPathChoice, logPathRandom, logInitialCardDraw,
  logIntelGain, logIntelReset
} from './game/utils/explorationDebug';
import { FeatureFlags, LaunchProperties } from './config/featureFlags';

// Import the parchment background styles
import './App.css';

const App: React.FC = () => {
  // --- Core State ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [droppedItems, setDroppedItems] = useState<Item[]>([]);
  const [droppedSkill, setDroppedSkill] = useState<Skill | null>(null);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [eventOutcome, setEventOutcome] = useState<{
    message: string;
    outcome: EventOutcome;
    logType: 'gain' | 'danger' | 'info' | 'loot';
    changes: OutcomeChange[];
    nextEventId?: string;
  } | null>(null);
  // T-011: true when the active event was reached by chaining from a prior
  // outcome (drives the "chain" ribbon at the top of the Event scene).
  const [cameFromChain, setCameFromChain] = useState(false);
  const [difficulty, setDifficulty] = useState<number>(40);
  const [isProcessingLoot, setIsProcessingLoot] = useState(false);
  const [merchantItems, setMerchantItems] = useState<Item[]>([]);
  const [merchantDiscount, setMerchantDiscount] = useState<number>(0);
  const [trainingData, setTrainingData] = useState<TrainingActivity | null>(null);
  const [scrollDiscoveryData, setScrollDiscoveryData] = useState<ScrollDiscoveryActivity | null>(null);
  const [pendingArtifact, setPendingArtifact] = useState<Item | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Item | null>(null);
  const [eliteChallengeData, setEliteChallengeData] = useState<{
    enemy: Enemy;
    artifact: Item;
    room: BranchingRoom;
  } | null>(null);
  // Treasure system state
  const [currentTreasure, setCurrentTreasure] = useState<TreasureActivity | null>(null);
  const [currentTreasureHunt, setCurrentTreasureHunt] = useState<TreasureHunt | null>(null);
  const [treasureHuntReward, setTreasureHuntReward] = useState<TreasureHuntRewardData | null>(null);
  const [diceRollResult, setDiceRollResult] = useState<DiceRollResult | null>(null);
  const [pendingBagFullItem, setPendingBagFullItem] = useState<PendingBagFullItem | null>(null);
  const [combatReward, setCombatReward] = useState<{
    expGain: number;
    ryoGain: number;
    levelUp?: { oldLevel: number; newLevel: number; statGains: Record<string, number> };
  } | null>(null);
  const logIdCounter = useRef<number>(0);
  const returnToMapRef = useRef<() => void>(() => {});

  // --- Shared Combat/Exploration State ---
  // This hook owns state needed by both useCombat and useExploration
  // Including: combat state, branching floor, region exploration, and card-based location selection
  const sharedExplorationState = useCombatExplorationState();

  // Destructure for local use in App.tsx (read-only access mostly)
  const {
    combatState, setCombatState,
    approachResult, setApproachResult,
    branchingFloor, setBranchingFloor,
    selectedBranchingRoom, setSelectedBranchingRoom,
    showApproachSelector, setShowApproachSelector,
    region, setRegion,
    selectedLocation, setSelectedLocation,
    locationFloor, setLocationFloor,
    locationDeck, setLocationDeck,
    intelPool, setIntelPool,
    drawnCards, setDrawnCards,
    selectedCardIndex, setSelectedCardIndex,
    currentIntel, setCurrentIntel,
  } = sharedExplorationState;

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info', details?: string) => {
    setLogs(prev => {
      logIdCounter.current += 1;
      const newEntry: LogEntry = { id: logIdCounter.current, text, type, details };
      const newLogs = [...prev, newEntry];
      if (newLogs.length > LIMITS.MAX_LOG_ENTRIES) newLogs.shift();
      return newLogs;
    });
  }, []);

  const playerStats = useMemo(() => {
    if (!player) return null;
    return getPlayerFullStats(player);
  }, [player]);

  interface LevelUpResult {
    player: Player;
    levelUpInfo?: {
      oldLevel: number;
      newLevel: number;
      statGains: Record<string, number>;
    };
  }

  const checkLevelUp = (p: Player): LevelUpResult => {
    let currentPlayer = { ...p };
    const oldLevel = currentPlayer.level;
    const totalStatGains: Record<string, number> = {};

    while (currentPlayer.exp >= currentPlayer.maxExp) {
      currentPlayer.exp -= currentPlayer.maxExp;
      currentPlayer.level += 1;
      currentPlayer.maxExp = currentPlayer.level * 100;
      const growth = CLAN_GROWTH[currentPlayer.clan];
      const s = currentPlayer.primaryStats;

      // Accumulate stat gains
      Object.entries(growth).forEach(([stat, gain]) => {
        if (gain) {
          totalStatGains[stat] = (totalStatGains[stat] || 0) + gain;
        }
      });

      currentPlayer.primaryStats = {
        willpower: s.willpower + (growth.willpower || 0),
        chakra: s.chakra + (growth.chakra || 0),
        strength: s.strength + (growth.strength || 0),
        spirit: s.spirit + (growth.spirit || 0),
        intelligence: s.intelligence + (growth.intelligence || 0),
        calmness: s.calmness + (growth.calmness || 0),
        speed: s.speed + (growth.speed || 0),
        accuracy: s.accuracy + (growth.accuracy || 0),
        dexterity: s.dexterity + (growth.dexterity || 0)
      };
    }

    if (currentPlayer.level > oldLevel) {
      const newStats = getPlayerFullStats(currentPlayer);
      currentPlayer.currentHp = newStats.derived.maxHp;
      currentPlayer.currentChakra = newStats.derived.maxChakra;
      addLog(`LEVEL UP! You reached Level ${currentPlayer.level}. Stats increased & Fully Healed!`, 'gain');

      return {
        player: currentPlayer,
        levelUpInfo: {
          oldLevel,
          newLevel: currentPlayer.level,
          statGains: totalStatGains
        }
      };
    }

    return { player: currentPlayer };
  };

  // Compute current location and danger level from region state
  const currentLocation = useMemo(() => {
    if (!region) return null;
    return getCurrentLocation(region) ?? null;
  }, [region]);

  const currentDangerLevel = useMemo(() => {
    return currentLocation?.dangerLevel ?? 1;
  }, [currentLocation]);

  const currentBaseDifficulty = useMemo(() => {
    return region?.baseDifficulty ?? difficulty;
  }, [region, difficulty]);

  // Create game context value for child components
  const gameContextValue = useMemo((): GameContextValue => ({
    player,
    playerStats,
    region,
    currentLocation,
    dangerLevel: currentDangerLevel,
    difficulty,
    logs,
    addLog,
  }), [player, playerStats, region, currentLocation, currentDangerLevel, difficulty, logs, addLog]);

  // Ref to hold the combat victory handler to break circular dependency
  const handleCombatVictoryRef = useRef<(enemy: Enemy, combatState: any) => void>(() => {});

  // Combat hook - manages enemy, turns, and combat logic
  const {
    enemy,
    enemyStats,
    turnState,
    combatRef,
    setEnemy,
    setTurnState,
    useSkill,
    startCombat,
    autoCombatEnabled,
    setAutoCombatEnabled,
    autoPassTimeRemaining,
    currentAp,
    maxAp,
    hand,
    posture,
    changePosture,
  } = useCombat({
    player,
    playerStats,
    addLog,
    setPlayer,
    setGameState,
    onVictory: (enemy, combatState) => handleCombatVictoryRef.current(enemy, combatState),
    // Pass shared state from useCombatExplorationState
    combatState,
    setCombatState,
    approachResult,
    setApproachResult,
  });

  // --- Hook for Combat Victory & Auto Combats ---
  const {
    handleCombatVictory,
    handleAutoCombat,
    handleAutoEliteCombat
  } = useCombatVictory(
    {
      player,
      playerStats,
      currentDangerLevel,
      currentBaseDifficulty,
      difficulty,
      region,
      currentLocation,
      branchingFloor,
      locationFloor,
      selectedBranchingRoom,
      pendingArtifact,
      currentTreasure,
      currentTreasureHunt,
      currentIntel
    },
    {
      setPlayer,
      setBranchingFloor,
      setLocationFloor,
      setRegion,
      setCurrentIntel,
      setDiceRollResult,
      setTreasureHuntReward,
      setCurrentTreasureHunt,
      setCurrentTreasure,
      setCombatReward,
      setGameState,
      setEnemy,
      setPendingArtifact,
      setDroppedItems,
      setDroppedSkill
    },
    {
      addLog,
      checkLevelUp,
      returnToMap: () => returnToMapRef.current()
    }
  );

  // Sync the victory handler ref
  useEffect(() => {
    handleCombatVictoryRef.current = handleCombatVictory;
  }, [handleCombatVictory]);

  // Activity scene setters for useExploration hook
  const activitySetters: ActivitySceneSetters = {
    setMerchantItems,
    setMerchantDiscount,
    setTrainingData,
    setScrollDiscoveryData,
    setEliteChallengeData,
    setDroppedItems,
    setDroppedSkill,
    setActiveEvent,
    setCameFromChain,
    // Treasure system
    setCurrentTreasure,
    setCurrentTreasureHunt,
  };

  // Exploration hook - manages navigation and activity handling
  // Uses sharedExplorationState directly (no duplication)
  const {
    handleCardSelect,
    handleEnterSelectedLocation,
    handleLocationRoomSelect,
    handleLocationRoomEnter,
    handleBranchingRoomSelect,
    handleBranchingRoomEnter,
    handlePathChoice,
    handleLeaveLocation,
    returnToMap,
    returnToMapActivityComplete,
  } = useExploration(sharedExplorationState, {
    player,
    playerStats,
    setPlayer,
    setGameState,
    gameState,
    addLog,
    currentLocation,
    activitySetters,
    setEnemy,
    onAutoCombat: handleAutoCombat,
    onAutoEliteCombat: handleAutoEliteCombat,
  });

  // Sync returnToMap function to ref to prevent circular dependencies
  useEffect(() => {
    returnToMapRef.current = returnToMap;
  }, [returnToMap]);

  // Treasure system handlers
  const {
    handleTreasureReveal,
    handleTreasureSelectItem,
    handleTreasureFightGuardian,
    handleTreasureRollDice,
    handleTreasureStartHunt,
    handleTreasureDeclineHunt,
    handleTreasureHuntRewardClaim,
    handleDiceResultContinue,
    handleBagFullSell,
    handleBagFullLeave,
  } = useTreasureHandlers(
    {
      currentTreasure,
      currentTreasureHunt,
      player,
      playerStats,
      selectedBranchingRoom,
      locationFloor,
      branchingFloor,
      currentDangerLevel,
      difficulty,
      region,
      currentLocation,
      treasureHuntReward,
      pendingBagFullItem,
    },
    {
      setPlayer,
      setCurrentTreasure,
      setCurrentTreasureHunt,
      setLocationFloor,
      setBranchingFloor,
      setDroppedItems,
      setDroppedSkill,
      setTreasureHuntReward,
      setSelectedBranchingRoom,
      setGameState,
      setEnemy,
      setTurnState,
      setShowApproachSelector,
      setPendingArtifact,
      setDiceRollResult,
      setPendingBagFullItem,
    },
    {
      addLog,
      returnToMap,
      returnToMapActivityComplete,
      onAutoTreasureGuardianVictory: (guardian: Enemy) => {
        // Call victory handler for treasure guardian auto-combat
        handleCombatVictory(guardian, null);
      },
    }
  );



  const startGame = (clan: Clan) => {
    const baseStats = CLAN_STATS[clan];
    const startSkill = CLAN_START_SKILL[clan];
    const derived = calculateDerivedStats(baseStats, {});

    const newPlayer: Player = {
      clan,
      level: 1,
      exp: 0,
      maxExp: 100,
      primaryStats: { ...baseStats },
      currentHp: derived.maxHp,
      currentChakra: derived.maxChakra,
      element: clan === Clan.UCHIHA ? 'Fire' : clan === Clan.UZUMAKI ? 'Wind' : 'Physical' as any,
      ryo: LaunchProperties.STARTING_RYO,
      equipment: {
        [EquipmentSlot.SLOT_1]: null,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
      skills: [SKILLS.BASIC_ATTACK, SKILLS.SHURIKEN, { ...startSkill, level: 1 }],
      activeBuffs: [],
      bag: Array(MAX_BAG_SLOTS).fill(null),
      treasureQuality: TreasureQuality.BROKEN,
      merchantSlots: DEFAULT_MERCHANT_SLOTS,
      locationsCleared: 0,
      eventFlags: {},
    };

    setPlayer(newPlayer);
    setLogs([]);
    setEnemy(null);
    setDroppedItems([]);
    setDroppedSkill(null);
    setActiveEvent(null);
    setTurnState('PLAYER');
    setShowApproachSelector(false);
    setCombatState(null);
    setApproachResult(null);
    addLog(`Lineage chosen: ${clan}. Your journey begins in the Land of Waves...`, 'info');

    // Initialize region exploration (Land of Waves)
    const wavesRegion = generateRegion(LAND_OF_WAVES_CONFIG, difficulty, newPlayer);
    setRegion(wavesRegion);
    setBranchingFloor(null);
    setLocationFloor(null);
    setSelectedBranchingRoom(null);

    // Initialize card-based location selection
    const initialDeck = initializeLocationDeck(wavesRegion);
    const initialIntelPool = createInitialIntelPool();

    // First location starts at 50% intel - use evaluateIntel to determine card count/reveal
    const INITIAL_INTEL = 50;
    const { cardCount, revealedCount } = evaluateIntel(INITIAL_INTEL);
    logInitialCardDraw(INITIAL_INTEL, cardCount, revealedCount);

    const initialCards = drawLocationCards(wavesRegion, initialDeck, initialIntelPool, cardCount, revealedCount);
    setLocationDeck(initialDeck);
    setIntelPool(initialIntelPool);
    setDrawnCards(initialCards);
    setSelectedCardIndex(null);

    setGameState(GameState.REGION_MAP);
  };

  // Auto-skip character selection if feature flag is enabled
  useEffect(() => {
    if (FeatureFlags.SKIP_CHAR_SELECT && gameState === GameState.CHAR_SELECT) {
      startGame(LaunchProperties.DEFAULT_CLAN as Clan);
    }
  }, [gameState]);

  // Cancel approach selection
  const handleApproachCancel = () => {
    logModalClose('ApproachSelector', 'cancelled');
    setShowApproachSelector(false);
    setSelectedBranchingRoom(null);
  };

  // Handle approach selection for BRANCHING exploration combat (also works for region mode)
  const handleBranchingApproachSelect = (approach: ApproachType) => {
    // Allow either branchingFloor OR region mode
    if (!player || !playerStats || !selectedBranchingRoom || (!branchingFloor && !region)) return;
    logModalClose('ApproachSelector', `selected: ${approach}`);

    // Check for elite challenge first, then regular combat
    // IMPORTANT: If enemy is already set (e.g., Treasure Guardian), use that instead
    const eliteChallenge = selectedBranchingRoom.activities.eliteChallenge;
    const combat = selectedBranchingRoom.activities.combat;
    const isEliteChallenge = eliteChallenge && !eliteChallenge.completed;
    const targetEnemy = enemy || (isEliteChallenge ? eliteChallenge.enemy : combat?.enemy);
    const isTreasureGuardian = targetEnemy?.name === 'Treasure Guardian';

    if (!targetEnemy) return;

    const terrain = TERRAIN_DEFINITIONS[selectedBranchingRoom.terrain];
    const result = executeApproach(
      approach,
      player,
      playerStats,
      targetEnemy,
      terrain
    );

    setApproachResult(result);
    logExplorationCheckpoint('Approach result', { approach, success: result.success, skipCombat: result.skipCombat });
    addLog(result.description, result.success ? 'gain' : 'info');

    // Apply costs
    const playerAfterCosts = applyApproachCosts(player, result);
    setPlayer(playerAfterCosts);

    if (result.skipCombat) {
      // Successfully bypassed combat - mark as completed
      logExplorationCheckpoint('Combat bypassed via approach');
      addLog('You slip past undetected!', 'gain');
      setShowApproachSelector(false);

      // Handle Treasure Guardian bypass - mark treasure activity as complete
      if (isTreasureGuardian) {
        setLocationFloor(prevFloor => {
          if (!prevFloor || !selectedBranchingRoom) return prevFloor;
          return completeActivity(prevFloor, selectedBranchingRoom.id, 'treasure');
        });
        setBranchingFloor(prevFloor => {
          if (!prevFloor || !selectedBranchingRoom) return prevFloor;
          return completeActivity(prevFloor, selectedBranchingRoom.id, 'treasure');
        });
        // Clear treasure state
        setCurrentTreasure(null);
        setCurrentTreasureHunt(null);
        setEnemy(null);
        addLog('You slipped past the Treasure Guardian but missed the map piece...', 'info');
      } else {
        // Mark the appropriate activity as completed (combat or eliteChallenge)
        setBranchingFloor(prevFloor => {
          if (!prevFloor || !selectedBranchingRoom) return prevFloor;
          const activityType = isEliteChallenge ? 'eliteChallenge' : 'combat';
          return completeActivity(prevFloor, selectedBranchingRoom.id, activityType);
        });

        // Clear pending artifact if bypassing elite challenge
        if (isEliteChallenge) {
          setPendingArtifact(null);
          addLog('You bypassed the guardian but left the artifact behind...', 'info');
        }
      }

      // Return to map
      returnToMap();
      return;
    }

    // Set up enemy with any HP reduction from approach
    let combatEnemy = targetEnemy;
    if (result.enemyHpReduction > 0) {
      combatEnemy = applyEnemyHpReduction(combatEnemy, result);
      addLog(`Your approach dealt ${Math.floor(targetEnemy.currentHp * result.enemyHpReduction)} damage!`, 'combat');
    }

    // Hand off to the single combat-start entry point. startCombat applies the
    // approach effects + on-combat-start passives and — critically — seeds the
    // T-004 deck from the player's real skills, draws the opening hand, fills the
    // AP budget, and skips the turn-1 upkeep so the opening hand survives the
    // first render. The previous inline setup created combat state with an empty
    // deck/hand (it never called buildDeck/drawHand), so combat opened with 0
    // cards once the upkeep redrew from the empty pile.
    logStateChange('EXPLORE', 'COMBAT', 'approach selected - entering combat');
    setShowApproachSelector(false);
    startCombat(combatEnemy, result, playerAfterCosts, terrain);
  };

  // Branching exploration handlers moved to useExploration hook

  // Event choice/outcome handlers moved to useActivityHandlers hook

  // --- Hooks for Inventory & Activities ---
  const inventoryHandlers = useInventoryHandlers(
    { player, currentDangerLevel, currentBaseDifficulty, difficulty, isProcessingLoot },
    { setPlayer, setIsProcessingLoot, setSelectedComponent },
    { addLog, returnToMap }
  );

  const {
    equipItem, sellItem, storeToBag, sellComponent, equipFromBag, handleSynthesize,
    handleUpgradeComponent, handleUpgradeArtifact, sellEquipped, unequipToBag,
    startSynthesisEquipped, handleDisassembleEquipped, reorderBag, dragBagToEquip,
    dragEquipToBag, swapEquipment
  } = inventoryHandlers;

  const activityHandlers = useActivityHandlers(
    {
      player, playerStats, currentDangerLevel, currentBaseDifficulty, difficulty,
      region, currentLocation, locationFloor, branchingFloor, selectedBranchingRoom,
      merchantDiscount, trainingData, scrollDiscoveryData, eliteChallengeData,
      isProcessingLoot, currentIntel, enemy
    },
    {
      setPlayer, setGameState, setMerchantItems, setMerchantDiscount, setTrainingData,
      setScrollDiscoveryData, setEliteChallengeData, setBranchingFloor, setLocationFloor,
      setSelectedBranchingRoom, setDroppedItems, setDroppedSkill, setActiveEvent,
      setPendingArtifact, setShowApproachSelector, setCurrentIntel,
      setEventOutcome, setIsProcessingLoot, setCameFromChain
    },
    {
      addLog,
      checkLevelUp,
      handleCombatVictory,
      returnToMap,
      eventOutcome,
      startCombat
    }
  );

  const {
    buyItem, leaveMerchant, handleMerchantReroll, handleBuyMerchantSlot,
    handleUpgradeTreasureQuality, handleTrainingComplete, handleTrainingSkip,
    handleLearnScroll, handleScrollDiscoverySkip, handleEliteFight, handleEliteEscape,
    handleEventChoice, handleEventOutcomeClose
  } = activityHandlers;

  // Close reward modal - check for pending artifact from elite challenge
  const handleRewardClose = () => {
    logRewardModal('close');
    logModalClose('RewardModal', pendingArtifact ? 'showing loot' : 'staying on map');
    setCombatReward(null);

    // If there's a pending artifact from elite challenge, show loot screen
    if (pendingArtifact) {
      logFlowCheckpoint('Pending artifact found - showing LOOT screen', { artifact: pendingArtifact.name });
      logStateChange('EXPLORE', 'LOOT', 'elite challenge artifact');
      setDroppedItems([pendingArtifact]);
      setDroppedSkill(null);
      setPendingArtifact(null);
      addLog('The artifact guardian has fallen! Claim your prize.', 'loot');
      setGameState(GameState.LOOT);
    } else {
      logFlowCheckpoint('No pending artifact - staying on BRANCHING_EXPLORE');
    }
  };

  const learnSkill = (skill: Skill, slotIndex?: number) => {
    if (!player || !playerStats) return;

    const checkResult = canLearnSkill(skill, playerStats.effectivePrimary.intelligence, player.level, player.clan);
    if (!checkResult.canLearn) {
      addLog(`Cannot learn ${skill.name}: ${checkResult.reason}`, 'danger');
      return;
    }

    let newSkills = [...player.skills];
    const existingIndex = newSkills.findIndex(s => s.id === skill.id);

    if (existingIndex !== -1) {
      const existing = newSkills[existingIndex];
      const currentLevel = existing.level || 1;
      const growth = skill.damageMult * 0.2;
      newSkills[existingIndex] = { ...existing, level: currentLevel + 1, damageMult: existing.damageMult + growth };
      addLog(`Upgraded ${existing.name} to Level ${currentLevel + 1}!`, 'gain');
    } else {
      if (slotIndex !== undefined) {
        addLog(`Forgot ${newSkills[slotIndex].name} to learn ${skill.name}.`, 'loot');
        newSkills[slotIndex] = { ...skill, level: 1 };
      } else if (newSkills.length < 4) {
        newSkills.push({ ...skill, level: 1 });
        addLog(`Learned ${skill.name}.`, 'loot');
      } else {
        return;
      }
    }
    setPlayer({ ...player, skills: newSkills });
    setDroppedSkill(null);
    returnToMap();
  };


  if (gameState === GameState.MENU) {
    return (
      <MainMenu
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onEnter={() => setGameState(GameState.CHAR_SELECT)}
        onGuide={() => setGameState(GameState.GUIDE)}
      />
    );
  }

  if (gameState === GameState.GUIDE) {
    return <GameGuide onBack={() => setGameState(GameState.MENU)} />;
  }


  if (gameState === GameState.CHAR_SELECT) {
    return <CharacterSelect onSelectClan={startGame} />;
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <GameOver
        locationName={currentLocation?.name ?? 'Unknown Location'}
        dangerLevel={currentDangerLevel}
        regionName={region?.name ?? 'Unknown Region'}
        playerLevel={player?.level}
        onRetry={() => {
          setGameState(GameState.MENU);
          setPlayer(null);
          setEnemy(null);
        }}
      />
    );
  }

  // Hide sidebar during combat for full-width immersive experience
  const isCombat = gameState === GameState.COMBAT;

  return (
    <GameProvider value={gameContextValue}>
    <div className="h-screen bg-black text-gray-300 flex overflow-hidden font-sans">
      {/* Left Panel - Hidden during combat */}
      {!isCombat && (
        <div className="hidden lg:flex w-[280px] flex-col border-r border-zinc-900 bg-zinc-950 p-4">
          <LeftSidebarPanel />
        </div>
      )}

      {/* Center Panel */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-y-auto parchment-panel">
          {gameState === GameState.COMBAT && player && enemy && playerStats && enemyStats && (
            <ErrorBoundary sceneName="Combat">
              <Combat
                ref={combatRef}
                player={player}
                playerStats={playerStats}
                enemy={enemy}
                enemyStats={enemyStats}
                turnState={turnState}
                hand={hand}
                currentAp={currentAp}
                maxAp={maxAp}
                posture={posture}
                onChangePosture={changePosture}
                onUseSkill={useSkill}
                onPassTurn={() => {
                  addLog("You focus on defense and wait.", 'info');
                  setTurnState('ENEMY_TURN');
                }}
                getDamageTypeColor={getDamageTypeColor}
                getRarityColor={getRarityColor}
                autoCombatEnabled={autoCombatEnabled}
                onToggleAutoCombat={() => setAutoCombatEnabled(prev => !prev)}
                autoPassTimeRemaining={autoPassTimeRemaining}
              />
            </ErrorBoundary>
          )}

          {gameState === GameState.EVENT && activeEvent && (
            <Event activeEvent={activeEvent} onChoice={handleEventChoice} player={player} playerStats={playerStats} cameFromChain={cameFromChain} />
          )}

          {gameState === GameState.ELITE_CHALLENGE && eliteChallengeData && player && playerStats && (
            <EliteChallenge
              enemy={eliteChallengeData.enemy}
              artifact={eliteChallengeData.artifact}
              player={player}
              playerStats={playerStats}
              onFight={handleEliteFight}
              onEscape={handleEliteEscape}
            />
          )}

          {gameState === GameState.LOOT && (
            <ErrorBoundary sceneName="Loot">
              <Loot
                droppedItems={droppedItems}
                droppedSkill={droppedSkill}
                player={player}
                playerStats={playerStats}
                onEquipItem={equipItem}
                onSellItem={sellItem}
                onStoreToBag={storeToBag}
                onLearnSkill={learnSkill}
                onLeaveAll={returnToMap}
                getRarityColor={getRarityColor}
                getDamageTypeColor={getDamageTypeColor}
                isProcessing={isProcessingLoot}
              />
            </ErrorBoundary>
          )}

          {gameState === GameState.MERCHANT && (
            <ErrorBoundary sceneName="Merchant">
              <Merchant
                merchantItems={merchantItems}
                discountPercent={merchantDiscount}
                player={player}
                dangerLevel={currentDangerLevel}
                baseDifficulty={currentBaseDifficulty}
                onBuyItem={buyItem}
                onLeave={leaveMerchant}
                onReroll={handleMerchantReroll}
                onBuySlot={handleBuyMerchantSlot}
                onUpgradeQuality={handleUpgradeTreasureQuality}
                isProcessing={isProcessingLoot}
              />
            </ErrorBoundary>
          )}

          {gameState === GameState.TRAINING && trainingData && player && playerStats && (
            <Training
              training={trainingData}
              player={player}
              playerStats={playerStats}
              onTrain={handleTrainingComplete}
              onSkip={handleTrainingSkip}
            />
          )}

          {gameState === GameState.SCROLL_DISCOVERY && scrollDiscoveryData && player && playerStats && (
            <ScrollDiscovery
              scrollDiscovery={scrollDiscoveryData}
              player={player}
              playerStats={playerStats}
              onLearnScroll={handleLearnScroll}
              onSkip={handleScrollDiscoverySkip}
            />
          )}

          {/* Treasure Choice Scene */}
          {gameState === GameState.TREASURE && currentTreasure && player && (
            <ErrorBoundary sceneName="TreasureChoice">
              <TreasureChoice
                treasure={currentTreasure}
                treasureHunt={currentTreasureHunt}
                player={player}
                huntDeclined={locationFloor?.huntDeclined ?? branchingFloor?.huntDeclined ?? false}
                onReveal={handleTreasureReveal}
                onSelectItem={handleTreasureSelectItem}
                onFightGuardian={handleTreasureFightGuardian}
                onRollDice={handleTreasureRollDice}
                onStartHunt={handleTreasureStartHunt}
                onDeclineHunt={handleTreasureDeclineHunt}
                pendingBagFullItem={pendingBagFullItem}
                onBagFullSell={handleBagFullSell}
                onBagFullLeave={handleBagFullLeave}
                getRarityColor={getRarityColor}
              />
            </ErrorBoundary>
          )}

          {/* Treasure Hunt Reward Scene */}
          {gameState === GameState.TREASURE_HUNT_REWARD && treasureHuntReward && (
            <ErrorBoundary sceneName="TreasureHuntReward">
              <TreasureHuntRewardScene
                reward={treasureHuntReward}
                onClaim={handleTreasureHuntRewardClaim}
                getRarityColor={getRarityColor}
                getDamageTypeColor={getDamageTypeColor}
              />
            </ErrorBoundary>
          )}

          {/* Region Map - Card-based location selection */}
          {gameState === GameState.REGION_MAP && region && player && playerStats && (
            <div className="w-full h-full flex flex-col">
              <RegionMap
                region={region}
                player={player}
                playerStats={playerStats}
                drawnCards={drawnCards}
                selectedIndex={selectedCardIndex}
                onCardSelect={handleCardSelect}
                onEnterLocation={handleEnterSelectedLocation}
              />
              <PlayerHUD
                player={player}
                playerStats={playerStats}
                biome={region.biome || 'Misty Shores'}
              />
            </div>
          )}

          {/* Location Explorer - Uses LocationMap for location rooms */}
          {gameState === GameState.LOCATION_EXPLORE && region && locationFloor && player && playerStats && (() => {
            const currentLocation = getCurrentLocation(region);
            if (!currentLocation) return null;
            return (
              <div className="w-full h-full flex flex-col">
                <LocationMap
                  branchingFloor={locationFloor}
                  player={player}
                  playerStats={playerStats}
                  currentIntel={currentIntel}
                  onRoomSelect={handleLocationRoomSelect}
                  onRoomEnter={handleLocationRoomEnter}
                />
                <PlayerHUD
                  player={player}
                  playerStats={playerStats}
                  biome={currentLocation.name}
                />
                {/* Combat Victory Reward Modal */}
                {combatReward && (
                  <RewardModal
                    expGain={combatReward.expGain}
                    ryoGain={combatReward.ryoGain}
                    levelUp={combatReward.levelUp}
                    onClose={handleRewardClose}
                  />
                )}

                {/* Event Outcome Modal */}
                {eventOutcome && (
                  <EventResultModal
                    outcome={eventOutcome}
                    onClose={handleEventOutcomeClose}
                  />
                )}
              </div>
            );
          })()}

          {/* Path Choice - DEPRECATED: Cards now replace path selection modal
              The card-based location selection system in RegionMap replaces the
              need for a separate path choice modal. Cards are drawn after completing
              a location and intel is accumulated to reveal more info about destinations.
          */}
        </div>
      </div>

      {/* Right Panel - Hidden during combat */}
      {!isCombat && (
        <div className="hidden lg:flex w-[280px] flex-col border-l border-zinc-900 bg-zinc-950 p-4">
          <RightSidebarPanel
            selectedComponent={selectedComponent}
            onSelectComponent={setSelectedComponent}
            onSellComponent={sellComponent}
            onSynthesize={handleSynthesize}
            onEquipFromBag={equipFromBag}
            onSellEquipped={sellEquipped}
            onUnequipToBag={unequipToBag}
            onDisassembleEquipped={handleDisassembleEquipped}
            onStartSynthesisEquipped={startSynthesisEquipped}
            onReorderBag={reorderBag}
            onDragBagToEquip={dragBagToEquip}
            onDragEquipToBag={dragEquipToBag}
            onSwapEquipment={swapEquipment}
            treasureHunt={locationFloor?.treasureHunt || currentTreasureHunt}
          />
        </div>
      )}

      {/* Approach Selector Modal */}
      {showApproachSelector && selectedBranchingRoom && (selectedBranchingRoom.activities.combat || selectedBranchingRoom.activities.eliteChallenge || enemy) && player && playerStats && (() => {
        // Get enemy from state first (e.g., Treasure Guardian), then from elite challenge or combat
        const eliteChallenge = selectedBranchingRoom.activities.eliteChallenge;
        const combat = selectedBranchingRoom.activities.combat;
        const targetEnemy = enemy || ((eliteChallenge && !eliteChallenge.completed) ? eliteChallenge.enemy : combat?.enemy);
        if (!targetEnemy) return null;

        return (
          <ApproachSelector
            node={{
              id: selectedBranchingRoom.id,
              type: targetEnemy.tier === 'Guardian' ? 'BOSS' :
                    targetEnemy.tier === 'Jonin' ? 'ELITE' : 'COMBAT',
              terrain: selectedBranchingRoom.terrain,
              enemy: targetEnemy,
            }}
            terrain={TERRAIN_DEFINITIONS[selectedBranchingRoom.terrain]}
            player={player}
            playerStats={playerStats}
            onSelectApproach={handleBranchingApproachSelect}
            onCancel={handleApproachCancel}
          />
        );
      })()}

      {/* Dice Roll Result Modal */}
      {diceRollResult && (
        <DiceRollResultModal
          result={diceRollResult}
          onContinue={handleDiceResultContinue}
        />
      )}
    </div>
    </GameProvider>
  );
};

export default App;
