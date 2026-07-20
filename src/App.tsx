import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  GameState, Player, Clan, Skill, Enemy, Item, Rarity, DamageType,
  ApproachType, BranchingRoom, BranchingFloor, PrimaryStat, TrainingActivity, TrainingIntensity, LogEntry,
  EquipmentSlot, MAX_BAG_SLOTS, ScrollDiscoveryActivity,
  GameEvent, EventChoice, EventOutcome,
  TreasureQuality, DEFAULT_MERCHANT_SLOTS, MAX_MERCHANT_SLOTS,
  Region, Location, LocationPath,
  // Card-based location selection types
  IntelPool, LocationDeck, LocationCard, IntelRevealLevel,
  // Treasure system types
  TreasureActivity, TreasureHunt, TreasureType, DiceRollResult,
  CombatModifierType,
} from './game/types';
import { CLAN_GROWTH } from './game/constants';
import { COMBAT_MODIFIER_EFFECTS } from './game/constants/roomTypes';
import { createPlayer } from './game/entities/Player';
import {
  getPlayerFullStats,
  canLearnSkill
} from './game/systems/StatSystem';
import { applyLevelUp } from './game/systems/LevelSystem';
import { generateEnemy } from './game/systems/EnemySystem';

import {
  executeApproach,
  applyApproachCosts,
  applyEnemyHpReduction
} from './game/systems/ApproachSystem';
import { TERRAIN_DEFINITIONS } from './game/constants/terrain';
import {
  formatLocationTerrainEffectLines,
  formatRoomTerrainEffectLines,
  getLocationTerrainMods,
  locationStealthBonusPoints,
} from './game/systems/LocationTerrainSystem';
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
  getCurrentLocation,
  // Card-based location selection functions
  initializeLocationDeck,
  drawLocationCards,
  createInitialIntelPool,
  evaluateIntel,
} from './game/systems/RegionSystem';
import {
  dangerToFloor,
  calculateMerchantRerollCost,
  applyWealthToRyo,
  getMerchantDiscount,
} from './game/systems/ScalingSystem';
import {
  REGION_ORDER,
  getCampaignEntry,
  getNextPlayableRegionIndex,
  getPlayableRegionCount,
} from './game/constants/regions';
import {
  generateInterludeBoons,
  applyCampaignBoon,
  fullHealPlayer,
  type CampaignBoon,
} from './game/systems/CampaignSystem';
import {
  generateInfiniteRegionConfig,
  unlockInfiniteMode,
  isInfiniteModeUnlocked,
  infiniteHeightFromFloor,
  computeTowerScore,
} from './game/systems/InfiniteTowerSystem';
import type { RegionConfig } from './game/types';
import { useCombat } from './hooks/useCombat';
import { useCombatExplorationState } from './hooks/useCombatExplorationState';
import { useExploration, ActivitySceneSetters } from './hooks/useExploration';
import { useTreasureHandlers, TreasureHuntRewardData, PendingBagFullItem } from './hooks/useTreasureHandlers';
import { useInventoryHandlers } from './hooks/useInventoryHandlers';
import { useActivityHandlers } from './hooks/useActivityHandlers';
import { useCombatVictory } from './hooks/useCombatVictory';
import { getDamageTypeColor, getRarityTextColorWithEffects as getRarityColor, getBiomeSlug } from './utils/colorHelpers';
import { GameProvider, GameContextValue } from './contexts/GameContext';
import { LIMITS, MERCHANT } from './game/config';
import { MainMenu, CharacterSelect, GameOver, GameGuide, Interlude, Victory } from './scenes/menu';
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
import ExplorationHUD from './components/layout/ExplorationHUD';
import InventoryOverlay from './components/layout/InventoryOverlay';
import CharacterSheetOverlay from './components/layout/CharacterSheetOverlay';
// Combat components
import ApproachSelector from './components/combat/ApproachSelector';
// Exploration components
import LocationMap from './components/exploration/LocationMap';
import RegionMap from './components/exploration/RegionMap';
// PathChoiceModal removed - cards now replace path selection modal
// Character components

// Modal components
import RewardModal from './components/modals/RewardModal';
import EventResultModal from './components/modals/EventResultModal';
import IntelResultModal from './components/modals/IntelResultModal';
import RestResultModal from './components/modals/RestResultModal';
import LocationCompleteModal from './components/modals/LocationCompleteModal';
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
  /** T-049/T-086: info gathering result panel */
  const [intelResult, setIntelResult] = useState<{
    flavorText: string;
    intelGain: number;
    intelBefore: number;
    intelAfter: number;
    baseIntelGain?: number;
    fogNote?: string | null;
  } | null>(null);
  /** T-050: rest heal result panel */
  const [restResult, setRestResult] = useState<{
    hpHeal: number;
    chakraHeal: number;
    healPercent: number;
    chakraRestorePercent: number;
    hpBefore: number;
    hpAfter: number;
    chakraBefore: number;
    chakraAfter: number;
    maxHp: number;
    maxChakra: number;
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
  /** T-022: cinematic exploration overlays — bag (I) / character sheet (C) */
  const [exploreOverlay, setExploreOverlay] = useState<'none' | 'bag' | 'character'>('none');
  /** T-023: campaign index into REGION_ORDER + interlude boons */
  const [campaignRegionIndex, setCampaignRegionIndex] = useState(0);
  const [regionsCompleted, setRegionsCompleted] = useState(0);
  const [interludeBoons, setInterludeBoons] = useState<CampaignBoon[]>([]);
  const [interludeMeta, setInterludeMeta] = useState<{
    title: string;
    body: string;
    regionName: string;
    nextRegionName: string;
    nextIndex: number;
    /** T-095: next region's lootTheme for Focus honesty at boon pick */
    nextLootTheme?: import('./game/types').RegionLootTheme | null;
  } | null>(null);
  /** T-027: campaign vs infinite ascent */
  const [runMode, setRunMode] = useState<'campaign' | 'infinite'>('campaign');
  const [infiniteFloor, setInfiniteFloor] = useState(0);
  const [pendingRunMode, setPendingRunMode] = useState<'campaign' | 'infinite'>('campaign');
  const [infiniteUnlocked, setInfiniteUnlocked] = useState(() => isInfiniteModeUnlocked());
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
    /** T-035: items previewed on victory (elite artifact / combat drops) */
    lootPreviews?: Item[];
    continuesToLoot?: boolean;
    /** T-087: combat intel (fog-scaled) */
    intelGain?: number;
    baseIntelGain?: number;
    fogNote?: string;
    /** T-089: wealth / region gold note under ryo */
    ryoNote?: string;
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
    const oldLevel = p.level;
    const updatedPlayer = applyLevelUp(p);

    if (updatedPlayer.level > oldLevel) {
      const levelsGained = updatedPlayer.level - oldLevel;
      const growth = CLAN_GROWTH[p.clan];
      const totalStatGains: Record<string, number> = {};
      Object.entries(growth).forEach(([stat, gain]) => {
        if (gain) {
          totalStatGains[stat] = gain * levelsGained;
        }
      });

      addLog(`LEVEL UP! You reached Level ${updatedPlayer.level}. Stats increased & Fully Healed!`, 'gain');

      return {
        player: updatedPlayer,
        levelUpInfo: {
          oldLevel,
          newLevel: updatedPlayer.level,
          statGains: totalStatGains,
        },
      };
    }

    return { player: updatedPlayer };
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

  // Biome background path for the combat stage (CinematicViewscreen).
  // Uses the same slug convention as LocationCardDisplay to reuse existing assets.
  const combatBackground = useMemo((): string | undefined => {
    const biome = currentLocation?.biome || region?.biome;
    if (!biome) return undefined;
    return `/assets/location_${getBiomeSlug(biome)}.png`;
  }, [currentLocation, region]);

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
    setIntelResult,
    setRestResult,
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
    locationCompleteResult,
    confirmLocationComplete,
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
    onRegionBossDefeated: (clearedRegion) => {
      setRegionsCompleted((n) => n + 1);

      // T-027: infinite ascent — never ends on boss; climb next floor
      if (runMode === 'infinite' && player) {
        const nextFloor = infiniteFloor + 1;
        const height = infiniteHeightFromFloor(nextFloor);
        setInfiniteFloor(nextFloor);
        const config = generateInfiniteRegionConfig(nextFloor, difficulty);
        const healed = fullHealPlayer(player);
        setPlayer(healed);
        const nextRegion = generateRegion(config, config.baseDifficulty, healed);
        setRegion(nextRegion);
        setBranchingFloor(null);
        setLocationFloor(null);
        setSelectedBranchingRoom(null);
        setSelectedLocation(null);
        const initialDeck = initializeLocationDeck(nextRegion);
        const initialIntelPool = createInitialIntelPool();
        const INITIAL_INTEL = 50;
        const { cardCount, revealedCount } = evaluateIntel(INITIAL_INTEL);
        const initialCards = drawLocationCards(
          nextRegion,
          initialDeck,
          initialIntelPool,
          cardCount,
          revealedCount,
        );
        setLocationDeck(initialDeck);
        setIntelPool(initialIntelPool);
        setDrawnCards(initialCards);
        setSelectedCardIndex(null);
        setCurrentIntel(INITIAL_INTEL);
        addLog(
          `${clearedRegion.name} falls. The tower rises — Ascent ${height}. Difficulty ${config.baseDifficulty}.`,
          'gain',
        );
        setGameState(GameState.REGION_MAP);
        return;
      }

      // T-023: campaign — interlude if next region exists, else victory
      const nextIdx = getNextPlayableRegionIndex(campaignRegionIndex);
      const currentEntry = getCampaignEntry(campaignRegionIndex);

      if (nextIdx == null || !REGION_ORDER[nextIdx]?.config) {
        setPlayer((p) => (p ? fullHealPlayer(p) : p));
        unlockInfiniteMode();
        setInfiniteUnlocked(true);
        setGameState(GameState.VICTORY);
        addLog('Campaign complete! Infinite Ascent unlocked.', 'gain');
        return;
      }

      const nextEntry = REGION_ORDER[nextIdx];
      const boons = player ? generateInterludeBoons(player) : [];
      setInterludeBoons(boons);
      setInterludeMeta({
        title: currentEntry?.interlude.title ?? 'Interlude',
        body: currentEntry?.interlude.body ?? 'The road continues…',
        regionName: clearedRegion.name,
        nextRegionName: nextEntry.name,
        nextIndex: nextIdx,
        nextLootTheme: nextEntry.config?.lootTheme ?? null,
      });
      setGameState(GameState.INTERLUDE);
    },
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



  const bootstrapRegionMap = (config: RegionConfig, newPlayer: Player, logLine: string) => {
    addLog(logLine, 'info');
    const startRegion = generateRegion(config, config.baseDifficulty, newPlayer);
    setRegion(startRegion);
    setBranchingFloor(null);
    setLocationFloor(null);
    setSelectedBranchingRoom(null);
    setSelectedLocation(null);

    const initialDeck = initializeLocationDeck(startRegion);
    const initialIntelPool = createInitialIntelPool();
    const INITIAL_INTEL = 50;
    const { cardCount, revealedCount } = evaluateIntel(INITIAL_INTEL);
    logInitialCardDraw(INITIAL_INTEL, cardCount, revealedCount);
    const initialCards = drawLocationCards(
      startRegion,
      initialDeck,
      initialIntelPool,
      cardCount,
      revealedCount,
    );
    setLocationDeck(initialDeck);
    setIntelPool(initialIntelPool);
    setDrawnCards(initialCards);
    setSelectedCardIndex(null);
    setCurrentIntel(INITIAL_INTEL);
    setGameState(GameState.REGION_MAP);
  };

  const startGame = (clan: Clan) => {
    // Full clan loadout (MAIN/SIDE/TOGGLE/PASSIVE) via createPlayer / getClanStartingSkills
    const newPlayer = createPlayer(clan);
    const mode = pendingRunMode;

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
    setCampaignRegionIndex(0);
    setRegionsCompleted(0);
    setInterludeBoons([]);
    setInterludeMeta(null);
    setExploreOverlay('none');
    setRunMode(mode);
    setInfiniteFloor(0);

    if (mode === 'infinite') {
      const config = generateInfiniteRegionConfig(0, difficulty);
      bootstrapRegionMap(
        config,
        newPlayer,
        `Lineage chosen: ${clan}. Infinite Ascent begins — floor 1 (${config.name}).`,
      );
      return;
    }

    // T-023: first playable entry in REGION_ORDER (Land of Waves)
    const entry = getCampaignEntry(0);
    const config = entry?.config;
    if (!config) {
      addLog('No campaign regions configured.', 'danger');
      return;
    }
    bootstrapRegionMap(
      config,
      newPlayer,
      `Lineage chosen: ${clan}. Your journey begins in ${config.name}...`,
    );
  };

  /** T-023: apply interlude boon and spawn next campaign region. */
  const handleInterludeBoon = useCallback(
    (boon: CampaignBoon) => {
      if (!interludeMeta || !player) return;
      const nextEntry = getCampaignEntry(interludeMeta.nextIndex);
      const config = nextEntry?.config;
      if (!config) {
        setPlayer((p) => (p ? applyCampaignBoon(p, boon) : p));
        setGameState(GameState.VICTORY);
        return;
      }

      const healed = applyCampaignBoon(player, boon);
      setPlayer(healed);
      setCampaignRegionIndex(interludeMeta.nextIndex);

      const nextRegion = generateRegion(config, difficulty, healed);
      setRegion(nextRegion);
      setBranchingFloor(null);
      setLocationFloor(null);
      setSelectedBranchingRoom(null);
      setSelectedLocation(null);

      const initialDeck = initializeLocationDeck(nextRegion);
      const initialIntelPool = createInitialIntelPool();
      const INITIAL_INTEL = 50;
      const { cardCount, revealedCount } = evaluateIntel(INITIAL_INTEL);
      const initialCards = drawLocationCards(
        nextRegion,
        initialDeck,
        initialIntelPool,
        cardCount,
        revealedCount,
      );
      setLocationDeck(initialDeck);
      setIntelPool(initialIntelPool);
      setDrawnCards(initialCards);
      setSelectedCardIndex(null);
      setCurrentIntel(INITIAL_INTEL);
      setInterludeBoons([]);
      setInterludeMeta(null);

      addLog(`Boon chosen: ${boon.title}. Entering ${config.name}…`, 'gain');
      setGameState(GameState.REGION_MAP);
    },
    [interludeMeta, player, difficulty, addLog],
  );

  // Auto-skip character selection if feature flag is enabled
  useEffect(() => {
    if (FeatureFlags.SKIP_CHAR_SELECT && gameState === GameState.CHAR_SELECT) {
      startGame(LaunchProperties.DEFAULT_CLAN as Clan);
    }
  }, [gameState]);

  // Exit room / cancel approach — restore prior context (guardian → TREASURE, elite/map → explore)
  const handleApproachCancel = () => {
    logModalClose('ApproachSelector', 'exit room');
    setShowApproachSelector(false);

    const isTreasureGuardian =
      enemy?.name === 'Treasure Guardian' || currentTreasure !== null;

    // Always drop combat-prep side channels so cancel never leaves a half-started fight
    setEnemy(null);
    setPendingArtifact(null);

    if (isTreasureGuardian && currentTreasure) {
      // Restore treasure screen (never blank TREASURE: requires currentTreasure)
      // Keep selectedBranchingRoom for subsequent treasure actions
      setGameState(GameState.TREASURE);
      addLog('You step back from the Treasure Guardian.', 'info');
      return;
    }

    // Elite / regular combat: return to map without starting the fight
    setSelectedBranchingRoom(null);
    addLog('You leave the room without fighting.', 'info');
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
    // T-063: location terrainEffects stealth_bonus stacks with room stealth
    const locMods = getLocationTerrainMods(currentLocation?.terrainEffects);
    const locationStealthPts = locationStealthBonusPoints(locMods);
    const result = executeApproach(
      approach,
      player,
      playerStats,
      targetEnemy,
      terrain,
      locationStealthPts,
    );

    setApproachResult(result);
    logExplorationCheckpoint('Approach result', { approach, success: result.success, skipCombat: result.skipCombat });
    addLog(result.description, result.success ? 'gain' : 'danger');

    // Apply costs (chakra/HP — failure still charges and may add HP backfire)
    const playerAfterCosts = applyApproachCosts(player, result);
    setPlayer(playerAfterCosts);
    if (!result.success && result.hpCost > 0) {
      addLog(`Approach backfire: −${result.hpCost} HP!`, 'danger');
    }

    if (result.skipCombat) {
      // Successfully bypassed combat — complete LIVE locationFloor (not only legacy branchingFloor)
      logExplorationCheckpoint('Combat bypassed via approach');
      addLog('You slip past undetected!', 'gain');
      setShowApproachSelector(false);

      const activityType = isTreasureGuardian
        ? 'treasure'
        : isEliteChallenge
          ? 'eliteChallenge'
          : 'combat';

      let updatedLocationFloor: BranchingFloor | undefined;

      if (locationFloor && selectedBranchingRoom) {
        updatedLocationFloor = completeActivity(
          locationFloor,
          selectedBranchingRoom.id,
          activityType,
        );
        setLocationFloor(updatedLocationFloor);
      }

      if (branchingFloor && selectedBranchingRoom) {
        setBranchingFloor(
          completeActivity(branchingFloor, selectedBranchingRoom.id, activityType),
        );
      }

      if (isTreasureGuardian) {
        setCurrentTreasure(null);
        setCurrentTreasureHunt(null);
        setEnemy(null);
        addLog('You slipped past the Treasure Guardian but missed the map piece...', 'info');
      } else if (isEliteChallenge) {
        setPendingArtifact(null);
        addLog('You bypassed the guardian but left the artifact behind...', 'info');
      }

      // Pass completed floor so we never re-open combat from a stale closure
      returnToMapActivityComplete(updatedLocationFloor);
      return;
    }

    // Combat actually starts: drop treasure UI state for guardian fights
    if (isTreasureGuardian) {
      setCurrentTreasure(null);
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
    // Guardian: drop treasure UI state only once combat actually starts (not on approach open/cancel)
    if (isTreasureGuardian) {
      setCurrentTreasure(null);
    }
    // T-102: room combat modifiers from combat activity
    const roomMods = selectedBranchingRoom.activities.combat?.modifiers;
    startCombat(combatEnemy, result, playerAfterCosts, terrain, locMods, roomMods);
  };

  // Branching exploration handlers moved to useExploration hook

  // Event choice/outcome handlers moved to useActivityHandlers hook

  // --- Hooks for Inventory & Activities ---
  const inventoryHandlers = useInventoryHandlers(
    {
      player,
      currentDangerLevel,
      currentBaseDifficulty,
      difficulty,
      isProcessingLoot,
      droppedItems,
      droppedSkill,
    },
    { setPlayer, setIsProcessingLoot, setSelectedComponent, setDroppedItems },
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
      setEventOutcome, setIsProcessingLoot, setCameFromChain, setRegion
    },
    {
      addLog,
      checkLevelUp,
      handleCombatVictory,
      returnToMap,
      returnToMapActivityComplete,
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

  // Close reward modal - check for pending artifact from elite challenge,
  // or component drops from normal combat victories.
  const handleRewardClose = () => {
    // Consume reward first — blocks double Continue (double LOOT open / double returnToMap)
    let hadReward = false;
    setCombatReward(prev => {
      if (!prev) return null;
      hadReward = true;
      return null;
    });
    if (!hadReward) return;

    logRewardModal('close');
    const artifact = pendingArtifact;
    const hasCombatDrops = droppedItems.length > 0;
    logModalClose(
      'RewardModal',
      artifact ? 'showing loot' : hasCombatDrops ? 'showing combat loot' : 'staying on map'
    );

    // If there's a pending artifact from elite challenge, show loot screen
    if (artifact) {
      logFlowCheckpoint('Pending artifact found - showing LOOT screen', { artifact: artifact.name });
      logStateChange('LOCATION_EXPLORE', 'LOOT', 'elite challenge artifact');
      setDroppedItems([artifact]);
      setDroppedSkill(null);
      setPendingArtifact(null);
      addLog('The artifact guardian has fallen! Claim your prize.', 'loot');
      setGameState(GameState.LOOT);
    } else if (hasCombatDrops) {
      logFlowCheckpoint('Combat loot found - showing LOOT screen', {
        items: droppedItems.map(i => i.name),
      });
      logStateChange('LOCATION_EXPLORE', 'LOOT', 'combat drop');
      setGameState(GameState.LOOT);
    } else {
      // No loot modal: returnToMap chains next activity or runs location-complete meta path
      // (markComplete + updateDeck + redraw cards + locationsCleared++)
      logFlowCheckpoint('No pending artifact or combat drops - returnToMap');
      returnToMap();
    }
  };

  const learnSkill = (skill: Skill, slotIndex?: number) => {
    if (!player || !playerStats) return;
    // Already claimed this skill drop
    if (!droppedSkill || droppedSkill.id !== skill.id) return;

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
    // Stay on LOOT if items remain; only leave when pile is empty
    if (droppedItems.length === 0) {
      returnToMap();
    }
  };

  // --- Layout flags + hooks MUST run before any early return (Rules of Hooks) ---
  // Hide sidebars: combat (full stage) + exploration maps (T-022 cinematic full-bleed)
  const isCombat = gameState === GameState.COMBAT;
  const isExplorationMap =
    gameState === GameState.REGION_MAP || gameState === GameState.LOCATION_EXPLORE;
  const hideSidebars = isCombat || isExplorationMap;
  // Keep as && chain (not Boolean()) so TS can narrow player/playerStats at use sites with re-checks
  const showExploreChrome = isExplorationMap && !!player && !!playerStats;

  // Close explore overlays when leaving map screens
  useEffect(() => {
    if (!isExplorationMap) setExploreOverlay('none');
  }, [isExplorationMap]);

  // I / C / Esc for exploration overlays (T-022)
  useEffect(() => {
    if (!isExplorationMap) return;
    const onKey = (event: KeyboardEvent) => {
      const t = event.target as HTMLElement | null;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t?.isContentEditable
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'i') {
        event.preventDefault();
        setExploreOverlay((prev) => (prev === 'bag' ? 'none' : 'bag'));
      } else if (key === 'c') {
        event.preventDefault();
        setExploreOverlay((prev) => (prev === 'character' ? 'none' : 'character'));
      } else if (event.key === 'Escape' && exploreOverlay !== 'none') {
        event.preventDefault();
        setExploreOverlay('none');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isExplorationMap, exploreOverlay]);

  // --- Full-screen scenes (no game shell) — only after all hooks ---
  if (gameState === GameState.MENU) {
    return (
      <MainMenu
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onEnter={() => {
          setPendingRunMode('campaign');
          setGameState(GameState.CHAR_SELECT);
        }}
        onInfiniteEnter={
          infiniteUnlocked
            ? () => {
                setPendingRunMode('infinite');
                setGameState(GameState.CHAR_SELECT);
              }
            : undefined
        }
        infiniteUnlocked={infiniteUnlocked}
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
        clan={player?.clan}
        ryo={player?.ryo}
        locationsCleared={player?.locationsCleared}
        towerHeight={
          runMode === 'infinite' ? computeTowerScore(regionsCompleted) : undefined
        }
        player={player}
        background={combatBackground}
        onRetry={() => {
          setGameState(GameState.MENU);
          setPlayer(null);
          setEnemy(null);
          setInfiniteUnlocked(isInfiniteModeUnlocked());
        }}
      />
    );
  }

  if (gameState === GameState.INTERLUDE && player && interludeMeta) {
    return (
      <Interlude
        regionName={interludeMeta.regionName}
        title={interludeMeta.title}
        body={interludeMeta.body}
        nextRegionName={interludeMeta.nextRegionName}
        boons={interludeBoons}
        runSummary={{
          level: player.level,
          ryo: player.ryo,
          locationsCleared: player.locationsCleared,
          regionsCompleted,
        }}
        player={player}
        nextLootTheme={interludeMeta.nextLootTheme}
        onChooseBoon={handleInterludeBoon}
        background={combatBackground}
      />
    );
  }

  if (gameState === GameState.VICTORY && player) {
    const entry = getCampaignEntry(campaignRegionIndex);
    return (
      <Victory
        clan={player.clan}
        level={player.level}
        ryo={player.ryo}
        locationsCleared={player.locationsCleared}
        regionsCompleted={Math.max(regionsCompleted, 1)}
        lastRegionName={region?.name ?? entry?.name ?? 'Unknown'}
        provisional={getPlayableRegionCount() < REGION_ORDER.length}
        infiniteUnlocked={infiniteUnlocked || isInfiniteModeUnlocked()}
        player={player}
        background={combatBackground}
        onMenu={() => {
          setGameState(GameState.MENU);
          setPlayer(null);
          setEnemy(null);
          setRegion(null);
          setInfiniteUnlocked(isInfiniteModeUnlocked());
        }}
        onStartInfinite={() => {
          unlockInfiniteMode();
          setInfiniteUnlocked(true);
          setPendingRunMode('infinite');
          setPlayer(null);
          setEnemy(null);
          setRegion(null);
          setGameState(GameState.CHAR_SELECT);
        }}
      />
    );
  }

  const inventoryOverlayProps = {
    selectedComponent,
    onSelectComponent: setSelectedComponent,
    onSellComponent: sellComponent,
    onSynthesize: handleSynthesize,
    onEquipFromBag: equipFromBag,
    onSellEquipped: sellEquipped,
    onUnequipToBag: unequipToBag,
    onDisassembleEquipped: handleDisassembleEquipped,
    onStartSynthesisEquipped: startSynthesisEquipped,
    onReorderBag: reorderBag,
    onDragBagToEquip: dragBagToEquip,
    onDragEquipToBag: dragEquipToBag,
    onSwapEquipment: swapEquipment,
    treasureHunt: locationFloor?.treasureHunt || currentTreasureHunt,
    // T-096: bag Focus honesty while equipping
    lootTheme: region?.lootTheme,
  };

  return (
    <GameProvider value={gameContextValue}>
    <div className="h-screen bg-black text-gray-300 flex overflow-hidden font-sans">
      {/* Left Panel — hidden in combat + cinematic exploration (T-022) */}
      {!hideSidebars && (
        <div className="hidden lg:flex w-[280px] flex-col border-r border-zinc-900 bg-zinc-950 p-4">
          <LeftSidebarPanel />
        </div>
      )}

      {/* Center Panel */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        {/* T-022: minimal HUD on exploration maps */}
        {showExploreChrome && player && playerStats && (
          <ExplorationHUD
            player={player}
            maxHp={playerStats.derived.maxHp}
            maxChakra={playerStats.derived.maxChakra}
            onOpenBag={() => setExploreOverlay((p) => (p === 'bag' ? 'none' : 'bag'))}
            onOpenCharacter={() => setExploreOverlay((p) => (p === 'character' ? 'none' : 'character'))}
            bagOpen={exploreOverlay === 'bag'}
            characterOpen={exploreOverlay === 'character'}
            lootTheme={region?.lootTheme}
          />
        )}
        <div className={`flex-1 flex flex-col items-center justify-center relative overflow-y-auto parchment-panel ${isExplorationMap ? 'p-2 sm:p-4' : 'p-6'}`}>
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
                baseMaxAp={playerStats?.derived.actionPointsPerTurn}
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
                background={combatBackground}
                logs={logs}
                approachResult={approachResult}
                locationTerrainLines={(() => {
                  // T-079: room combat mods + location effects on open banner
                  const roomLines = selectedBranchingRoom
                    ? formatRoomTerrainEffectLines(
                        TERRAIN_DEFINITIONS[selectedBranchingRoom.terrain],
                      )
                    : [];
                  const locLines = formatLocationTerrainEffectLines(
                    currentLocation?.terrainEffects,
                  );
                  return [...roomLines, ...locLines].slice(0, 4);
                })()}
                isFirstTurn={combatState?.isFirstTurn ?? false}
                firstHitMultiplier={combatState?.firstHitMultiplier ?? 1}
                locationTerrainMods={combatState?.locationTerrainMods ?? null}
                skipFirstSkillCost={combatState?.skipFirstSkillCost ?? false}
                roomTerrain={combatState?.terrain ?? null}
                roomConditionNames={combatState?.roomConditionNames ?? null}
              />
            </ErrorBoundary>
          )}

          {gameState === GameState.EVENT && activeEvent && (
            <Event
              activeEvent={activeEvent}
              onChoice={handleEventChoice}
              player={player}
              playerStats={playerStats}
              cameFromChain={cameFromChain}
              locationTerrainMods={getLocationTerrainMods(currentLocation?.terrainEffects)}
            />
          )}

          {gameState === GameState.ELITE_CHALLENGE && eliteChallengeData && player && playerStats && (
            <EliteChallenge
              enemy={eliteChallengeData.enemy}
              artifact={eliteChallengeData.artifact}
              player={player}
              playerStats={playerStats}
              onFight={handleEliteFight}
              onEscape={handleEliteEscape}
              background={combatBackground}
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
                background={combatBackground}
                lootTheme={region?.lootTheme}
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
                background={combatBackground}
                lootTheme={region?.lootTheme}
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
              background={combatBackground}
            />
          )}

          {gameState === GameState.SCROLL_DISCOVERY && scrollDiscoveryData && player && playerStats && (
            <ScrollDiscovery
              scrollDiscovery={scrollDiscoveryData}
              player={player}
              playerStats={playerStats}
              onLearnScroll={handleLearnScroll}
              onSkip={handleScrollDiscoverySkip}
              background={combatBackground}
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
                background={combatBackground}
                lootTheme={region?.lootTheme}
                diceRollPending={diceRollResult !== null}
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
                background={combatBackground}
                lootTheme={region?.lootTheme}
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
              {/* T-022: PlayerHUD replaced by ExplorationHUD (top strip) */}
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
                {/* Combat Victory Reward Modal */}
                {combatReward && (
                  <RewardModal
                    expGain={combatReward.expGain}
                    ryoGain={combatReward.ryoGain}
                    levelUp={combatReward.levelUp}
                    lootPreviews={combatReward.lootPreviews}
                    continuesToLoot={combatReward.continuesToLoot}
                    intelGain={combatReward.intelGain}
                    baseIntelGain={combatReward.baseIntelGain}
                    fogNote={combatReward.fogNote}
                    ryoNote={combatReward.ryoNote}
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

      {/* T-049: Info gathering result (location + branching explore) */}
      {intelResult && (
        <IntelResultModal
          result={intelResult}
          onClose={() => setIntelResult(null)}
        />
      )}

      {/* T-050: Rest heal result */}
      {restResult && (
        <RestResultModal
          result={restResult}
          onClose={() => setRestResult(null)}
        />
      )}

      {/* T-060: Location complete payoff before region map */}
      {locationCompleteResult && (
        <LocationCompleteModal
          result={locationCompleteResult}
          onContinue={confirmLocationComplete}
        />
      )}

      {/* Right Panel — hidden in combat + cinematic exploration (T-022) */}
      {!hideSidebars && (
        <div className="hidden lg:flex w-[280px] flex-col border-l border-zinc-900 bg-zinc-950 p-4">
          <RightSidebarPanel {...inventoryOverlayProps} />
        </div>
      )}

      {/* T-022: exploration overlays (bag / character sheet) */}
      {showExploreChrome && exploreOverlay === 'bag' && player && (
        <InventoryOverlay
          {...inventoryOverlayProps}
          onClose={() => setExploreOverlay('none')}
        />
      )}
      {showExploreChrome && exploreOverlay === 'character' && player && playerStats && (
        <CharacterSheetOverlay
          player={player}
          playerStats={playerStats}
          onClose={() => setExploreOverlay('none')}
          lootTheme={region?.lootTheme}
        />
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
            locationStealthBonusPts={locationStealthBonusPoints(
              getLocationTerrainMods(currentLocation?.terrainEffects),
            )}
            locationEvasionBonus={
              getLocationTerrainMods(currentLocation?.terrainEffects).evasionBonus
            }
            roomConditionNames={(() => {
              // T-104: pre-fight honesty for room combat modifiers (T-102/103)
              const mods = selectedBranchingRoom.activities.combat?.modifiers ?? [];
              return mods
                .filter((m) => m !== CombatModifierType.NONE)
                .map((m) => COMBAT_MODIFIER_EFFECTS[m]?.name)
                .filter(Boolean) as string[];
            })()}
            roomConditionHints={(() => {
              const mods = selectedBranchingRoom.activities.combat?.modifiers ?? [];
              return mods
                .filter((m) => m !== CombatModifierType.NONE)
                .map((m) => COMBAT_MODIFIER_EFFECTS[m]?.description)
                .filter(Boolean) as string[];
            })()}
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
