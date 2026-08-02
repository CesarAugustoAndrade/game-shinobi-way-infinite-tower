import React, { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import {
  GameState, Player, Clan, Skill, Enemy, Item, Rarity, DamageType,
  ApproachType, BranchingRoom, BranchingFloor, PrimaryStat, TrainingActivity, LogEntry,
  EquipmentSlot, MAX_BAG_SLOTS, ScrollDiscoveryActivity,
  GameEvent, EventChoice, EventOutcome,
  TreasureQuality, DEFAULT_MERCHANT_SLOTS, MAX_MERCHANT_SLOTS,
  Region, Location, LocationPath,
  // Card-based location selection types
  IntelPool, LocationDeck, LocationCard, IntelRevealLevel,
  // Treasure system types
  TreasureActivity, TreasureHunt, TreasureType, DiceRollResult,
  CombatModifierType,
  ActionType,
} from './game/types';
import { CLAN_GROWTH } from './game/constants';
import { COMBAT_MODIFIER_EFFECTS } from './game/constants/roomTypes';
import { createPlayer } from './game/entities/Player';
import {
  getPlayerFullStats,
  canLearnSkill
} from './game/systems/StatSystem';
import {
  canAddPlayableSkill,
  getPlayableDeckSize,
} from './game/systems/DeckSystem';
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
} from './game/systems/InfiniteTowerSystem';
import type { RegionConfig } from './game/types';
import { useCombat } from './hooks/useCombat';
import { useCombatExplorationState } from './hooks/useCombatExplorationState';
import { useExploration, ActivitySceneSetters } from './hooks/useExploration';
import { useTreasureHandlers, TreasureHuntRewardData, PendingBagFullItem } from './hooks/useTreasureHandlers';
import { useInventoryHandlers } from './hooks/useInventoryHandlers';
import { useActivityHandlers } from './hooks/useActivityHandlers';
import { useCombatVictory } from './hooks/useCombatVictory';
import { getDamageTypeColor, getRarityTextColorWithEffects as getRarityColor, resolveLaminaPaths } from './utils/colorHelpers';
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

// Center-stage void plate + left-panel chrome
import './App.css';

const getFullCombatBackground = (locationBackground: string): string => {
  const match = locationBackground.match(/\/assets\/location_([^?]+)\.png/);
  const slug = match?.[1] ?? 'coastal_harbor';
  return slug === 'coastal_harbor'
    ? '/assets/combat_background_coastal_harbor_v3.png'
    : `/assets/combat_background_${slug}.png`;
};

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
    /** Room that owns the event activity — used on close to mark completed */
    roomId?: string | null;
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
  /** Bumps when equipment → bag synthesis starts so Bag arms synthesisMode. */
  const [bagSynthesisSession, setBagSynthesisSession] = useState(0);
  /** T-022: explore overlays — bag (I) and character (C) can be open together */
  const [exploreBagOpen, setExploreBagOpen] = useState(false);
  const [exploreCharacterOpen, setExploreCharacterOpen] = useState(false);
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
  /** Blocks same-tick double Continue on RewardModal (Space hold / Enter+click). */
  const rewardCloseLockRef = useRef(false);
  /**
   * Dice / Rest / Intel Continue — UI closedRef is primary; setState consume alone still
   * re-reads lastRendered until commit (double returnToMap / chain / hunt-reward stage).
   * Parent ref belt (parity rewardCloseLockRef / completeExecuteLockRef). Rearm when panel opens.
   */
  const diceContinueLockRef = useRef(false);
  const restContinueLockRef = useRef(false);
  const intelContinueLockRef = useRef(false);
  /**
   * LOOT Learn/Upgrade — setDroppedSkill consume alone re-reads lastRendered until
   * commit, so same-tick double click double-upgraded level/damageMult. Rearm on LOOT open.
   */
  const lootSkillClaimLockRef = useRef(false);
  /**
   * Approach Engage — UI commitLockRef alone still left parent able to double-apply
   * approach costs / startCombat / skip-completeActivity if both paths hit before unmount.
   * Rearm when approach overlay opens.
   */
  const approachEngageLockRef = useRef(false);

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

  // Clamp current HP/Chakra when a gear change lowers the cap. maxHp/maxChakra derive from effective
  // willpower/chakra, which include equipment (and SLOT_1 carries a 1.5x multiplier, so even
  // re-slotting the same items changes them). Every equip/unequip/sell/swap path writes only
  // `equipment`/`bag`, and the existing clamps live on combat/heal/event paths — so after a level-up
  // (which sets currentHp = maxHp with the gear on) unequipping left the HUD reading e.g. "530 / 368".
  // One choke point here covers every mutation path, and only ever clamps downward.
  const maxHpCap = playerStats?.derived.maxHp;
  const maxChakraCap = playerStats?.derived.maxChakra;
  useEffect(() => {
    if (!maxHpCap || !maxChakraCap) return;
    setPlayer(p => {
      if (!p) return p;
      if (p.currentHp <= maxHpCap && p.currentChakra <= maxChakraCap) return p;
      return {
        ...p,
        currentHp: Math.min(p.currentHp, maxHpCap),
        currentChakra: Math.min(p.currentChakra, maxChakraCap),
      };
    });
  }, [maxHpCap, maxChakraCap]);

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

  // Biome parallax láminas for combat stage (CinematicViewscreen) + scene backdrops.
  // Always resolve a painted plate (defaults to Coastal Harbor) so EVENT/LOOT never sit on empty void.
  // Mid/fg may be missing — CinematicViewscreen / SceneBackdrop hide layers on error.
  const combatLamina = useMemo(() => {
    const biome = currentLocation?.biome || region?.biome || 'Coastal Harbor';
    return resolveLaminaPaths(biome);
  }, [currentLocation, region]);
  const combatBackground = combatLamina.background;
  const fullCombatBackground = useMemo(
    () => getFullCombatBackground(combatBackground),
    [combatBackground],
  );

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
    passTurn,
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
      currentIntel,
      combatReward,
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
    resetExplorationUi,
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
    handleBagFullStash,
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
      diceRollResult,
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

  /** Blocks same-tick double clan pick (click + 1–5 / Space hold) → double region bootstrap. */
  const startGameLockRef = useRef(false);
  useEffect(() => {
    if (gameState === GameState.CHAR_SELECT || gameState === GameState.MENU) {
      startGameLockRef.current = false;
    }
  }, [gameState]);

  const startGame = (clan: Clan) => {
    if (startGameLockRef.current) return;
    startGameLockRef.current = true;
    // Full clan loadout (ACTIVE/TOGGLE/PASSIVE) via createPlayer / getClanStartingSkills
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
    setExploreBagOpen(false);
    setExploreCharacterOpen(false);
    setRunMode(mode);
    setInfiniteFloor(0);
    // Drop prior-run modals / activity payloads — leftover combatReward/dice/rest
    // would mount on the new REGION_MAP and soft-lock Continue on a dead run.
    resetExplorationUi();
    rewardCloseLockRef.current = false;
    setCombatReward(null);
    setDiceRollResult(null);
    setRestResult(null);
    setIntelResult(null);
    setEventOutcome(null);
    setCameFromChain(false);
    setIsProcessingLoot(false);
    setMerchantItems([]);
    setMerchantDiscount(0);
    setTrainingData(null);
    setScrollDiscoveryData(null);
    setEliteChallengeData(null);
    setPendingArtifact(null);
    setSelectedComponent(null);
    setCurrentTreasure(null);
    setCurrentTreasureHunt(null);
    setTreasureHuntReward(null);
    setPendingBagFullItem(null);

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
      startGameLockRef.current = false;
      addLog('No campaign regions configured.', 'danger');
      return;
    }
    bootstrapRegionMap(
      config,
      newPlayer,
      `Lineage chosen: ${clan}. Your journey begins in ${config.name}...`,
    );
    // R1 first-run coach: clear next action after clan select (log strip is always visible)
    addLog(
      'The mist opens. Mark a path (1–3) → Enter Location → cut toward Gato’s Compound.',
      'info',
    );
  };

  /** Blocks same-tick double boon apply (Interlude Enter+click before meta nulls). */
  const interludeBoonLockRef = useRef(false);

  // Re-arm when a new interlude is staged
  useEffect(() => {
    if (interludeMeta) interludeBoonLockRef.current = false;
  }, [interludeMeta]);

  /**
   * T-023: apply interlude boon and spawn next campaign region.
   * Returns false only when nothing was staged so Interlude UI can re-arm boonLockRef
   * (UI locks before calling us — silent no-op left confirm dead forever).
   */
  const handleInterludeBoon = useCallback(
    (boon: CampaignBoon): boolean => {
      if (interludeBoonLockRef.current) return false;

      // Read staged meta + player from the RENDERED closure. A value written inside a setState
      // updater is not readable here: React only runs an updater eagerly while the fiber is clean
      // (react-dom eager-state bailout), so on a warmed App fiber it stays null — which used to
      // abort the advance while still nulling interludeMeta, orphaning the interlude and bouncing
      // the player back onto the cleared region map.
      const meta = interludeMeta;
      if (!meta || !player) return false;
      interludeBoonLockRef.current = true;

      // Compute once, outside any updater — StrictMode double-invokes updaters in dev, so applying
      // the boon inside one risks a double-apply.
      const healed = applyCampaignBoon(player, boon);

      // Consume staging — always leave INTERLUDE after UI confirm committed
      setInterludeMeta(null);
      setInterludeBoons([]);
      setPlayer(healed);

      const nextEntry = getCampaignEntry(meta.nextIndex);
      const config = nextEntry?.config;

      if (!config) {
        setGameState(GameState.VICTORY);
        return true;
      }

      setCampaignRegionIndex(meta.nextIndex);

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

      addLog(`Boon chosen: ${boon.title}. Entering ${config.name}…`, 'gain');
      setGameState(GameState.REGION_MAP);
      return true;
    },
    [difficulty, addLog, interludeMeta, player],
  );

  // Auto-skip character selection if feature flag is enabled
  useEffect(() => {
    if (FeatureFlags.SKIP_CHAR_SELECT && gameState === GameState.CHAR_SELECT) {
      startGame(LaunchProperties.DEFAULT_CLAN as Clan);
    }
  }, [gameState]);

  // Soft-lock recovery: never sit on EXPLORE / LOCATION_EXPLORE without a renderable map.
  // GameState.EXPLORE has no App branch (blank shell). LOCATION_EXPLORE needs floor + region.
  // Activity scenes gate UI on payload (trainingData, activeEvent, …) — missing payload = blank stage.
  // COMBAT without enemy and without victory reward is a blank center stage (Combat UI gates on enemy).
  useEffect(() => {
    const exploreFallback =
      region?.currentLocationId && locationFloor
        ? GameState.LOCATION_EXPLORE
        : GameState.REGION_MAP;

    if (gameState === GameState.EXPLORE) {
      setGameState(exploreFallback === GameState.LOCATION_EXPLORE ? exploreFallback : GameState.REGION_MAP);
      return;
    }
    if (gameState === GameState.LOCATION_EXPLORE && (!region || !locationFloor)) {
      setGameState(GameState.REGION_MAP);
      return;
    }
    // Dead player still in COMBAT (desync / mid-delay cancel residual) → GAME_OVER shell
    if (gameState === GameState.COMBAT && player && player.currentHp <= 0 && !combatReward) {
      setEnemy(null);
      setGameState(GameState.GAME_OVER);
      return;
    }
    // Blank COMBAT shell: no foe, no reward modal staging, not mid-approach.
    // Do NOT fire when combatReward is set — victory nulls enemy ~100ms before explore transition.
    if (
      gameState === GameState.COMBAT &&
      !enemy &&
      !combatReward &&
      !showApproachSelector
    ) {
      setGameState(exploreFallback);
      return;
    }
    // Orphan approach flag: selector condition failed → no modal, keys/map feel stuck
    if (showApproachSelector) {
      if (!selectedBranchingRoom) {
        setShowApproachSelector(false);
      } else {
        // Room present but no engageable foe (completed elite/combat, missing combat, no guardian).
        // Must honour .completed — combat.enemy still exists after victory and would keep
        // the approach modal alive / allow re-engaging a cleared room.
        const elite = selectedBranchingRoom.activities.eliteChallenge;
        const combat = selectedBranchingRoom.activities.combat;
        const hasFoe =
          Boolean(enemy) ||
          Boolean(elite && !elite.completed && elite.enemy) ||
          Boolean(combat && !combat.completed && combat.enemy);
        if (!hasFoe) {
          setShowApproachSelector(false);
          setEnemy(null);
        }
      }
    }
    // MERCHANT always mounts but returns null without player — blank shop shell
    if (gameState === GameState.MERCHANT && !player) {
      setGameState(exploreFallback);
      return;
    }
    // COMBAT with enemy but no deck/AP state — cannot play cards (useSkill gates on combatState)
    if (
      gameState === GameState.COMBAT &&
      enemy &&
      !combatState &&
      !combatReward &&
      !showApproachSelector
    ) {
      setEnemy(null);
      setGameState(exploreFallback);
      return;
    }
    // Activity scenes that render nothing without their payload
    if (gameState === GameState.EVENT && !activeEvent && !eventOutcome) {
      setGameState(exploreFallback);
      return;
    }
    if (gameState === GameState.TRAINING && !trainingData) {
      setGameState(exploreFallback);
      return;
    }
    if (gameState === GameState.SCROLL_DISCOVERY && !scrollDiscoveryData) {
      setGameState(exploreFallback);
      return;
    }
    if (gameState === GameState.ELITE_CHALLENGE && !eliteChallengeData) {
      setGameState(exploreFallback);
      return;
    }
    if (gameState === GameState.TREASURE && !currentTreasure) {
      setGameState(exploreFallback);
      return;
    }
    if (gameState === GameState.TREASURE_HUNT_REWARD && !treasureHuntReward) {
      setGameState(exploreFallback);
      return;
    }
    // INTERLUDE only mounts when meta is set — orphan shell is blank main layout
    if (gameState === GameState.INTERLUDE && !interludeMeta) {
      setInterludeBoons([]);
      setGameState(GameState.REGION_MAP);
      return;
    }
    // Empty LOOT pile with no skill drop — blank leave-only shell (desync belt).
    // Must use returnToMap (not bare setGameState): floor-complete meta + multi-activity
    // chain only run there. Bare exploreFallback left exit rooms stuck without
    // LocationCompleteModal / next activity. returnToMap is one-shot while
    // activityChainTimerRef is armed (no double-chain loop).
    if (
      gameState === GameState.LOOT &&
      droppedItems.length === 0 &&
      !droppedSkill &&
      !isProcessingLoot
    ) {
      returnToMap();
    }
  }, [
    gameState,
    region,
    locationFloor,
    enemy,
    combatReward,
    combatState,
    showApproachSelector,
    selectedBranchingRoom,
    activeEvent,
    eventOutcome,
    trainingData,
    scrollDiscoveryData,
    eliteChallengeData,
    currentTreasure,
    treasureHuntReward,
    interludeMeta,
    droppedItems.length,
    droppedSkill,
    isProcessingLoot,
    player,
    returnToMap,
  ]);

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
      // Fight consumed mapPieceAvailable to block dice mid-approach — re-arm on cancel
      setCurrentTreasure(prev =>
        prev && !prev.collected ? { ...prev, mapPieceAvailable: true } : prev,
      );
      setGameState(GameState.TREASURE);
      addLog('You step back from the Treasure Guardian.', 'info');
      return;
    }

    // Elite / regular combat: return to map without starting the fight.
    // Ensure explore state (never leave COMBAT/blank shell if approach was opened mid-desync).
    setSelectedBranchingRoom(null);
    if (
      gameState !== GameState.LOCATION_EXPLORE &&
      gameState !== GameState.REGION_MAP
    ) {
      setGameState(
        region?.currentLocationId && locationFloor
          ? GameState.LOCATION_EXPLORE
          : GameState.REGION_MAP,
      );
    }
    addLog('You leave the room without fighting.', 'info');
  };

  // New approach overlay → allow Engage again (cancel / re-open after failed engage)
  useEffect(() => {
    if (showApproachSelector) {
      approachEngageLockRef.current = false;
    }
  }, [showApproachSelector]);

  // Handle approach selection for BRANCHING exploration combat (also works for region mode)
  const handleBranchingApproachSelect = (approach: ApproachType) => {
    // Allow either branchingFloor OR region mode.
    // Must always dismiss the approach overlay on failure: ApproachSelector sets
    // commitLockRef before calling us — silent return leaves "Engaging…" forever.
    // Parent ref belt: UI commitLock alone can still double-fire costs/startCombat
    // if two Engage paths land before unmount (Enter+click / remount residue).
    if (approachEngageLockRef.current) {
      // Prior engage already committed — dismiss so UI is not stuck "Engaging…"
      // (parity failed-gate dismiss; remount residue / re-open before re-arm).
      setShowApproachSelector(false);
      return;
    }
    if (!player || !playerStats || !selectedBranchingRoom || (!branchingFloor && !region)) {
      setShowApproachSelector(false);
      setEnemy(null);
      addLog('The moment passes — nothing left to engage.', 'info');
      return;
    }

    // Check for elite challenge first, then regular combat
    // IMPORTANT: If enemy is already set (e.g., Treasure Guardian), use that instead.
    // Never re-engage a completed combat/elite activity (enemy object remains on the room).
    const eliteChallenge = selectedBranchingRoom.activities.eliteChallenge;
    const combat = selectedBranchingRoom.activities.combat;
    const isEliteChallenge = Boolean(eliteChallenge && !eliteChallenge.completed);
    const liveCombat = combat && !combat.completed ? combat : undefined;
    const targetEnemy =
      enemy ||
      (isEliteChallenge ? eliteChallenge!.enemy : liveCombat?.enemy);
    const isTreasureGuardian = targetEnemy?.name === 'Treasure Guardian';

    if (!targetEnemy) {
      setShowApproachSelector(false);
      setEnemy(null);
      addLog('The enemy has already fled.', 'info');
      return;
    }

    // Lock after validation — failed gates leave overlay free for another Engage
    approachEngageLockRef.current = true;
    logModalClose('ApproachSelector', `selected: ${approach}`);

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
    // T-102/T-108: room combat modifiers (combat or elite-only rooms)
    const roomMods =
      selectedBranchingRoom.activities.combat?.modifiers
      ?? selectedBranchingRoom.activities.eliteChallenge?.modifiers;
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
    dragEquipToBag, swapEquipment, exitLootOnce, rearmLootExit,
  } = inventoryHandlers;

  // One-shot LOOT exit re-arms each time the LOOT scene opens (new pile).
  // useLayoutEffect: must clear before paint so Leave/Learn are not blocked by a
  // leftover lock from the previous LOOT visit (useEffect would soft-stick one frame).
  useLayoutEffect(() => {
    if (gameState === GameState.LOOT) {
      rearmLootExit();
      lootSkillClaimLockRef.current = false;
    }
  }, [gameState, rearmLootExit]);

  const activityHandlers = useActivityHandlers(
    {
      player, playerStats, currentDangerLevel, currentBaseDifficulty, difficulty,
      region, currentLocation, locationFloor, branchingFloor, selectedBranchingRoom,
      merchantItems, merchantDiscount, trainingData, scrollDiscoveryData, eliteChallengeData,
      isProcessingLoot, currentIntel, enemy, activeEvent,
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

  // Unlock reward Continue when a new victory reward is presented
  useEffect(() => {
    if (combatReward) {
      rewardCloseLockRef.current = false;
    }
  }, [combatReward]);

  // New dice / rest / intel panel → allow one Continue again
  useEffect(() => {
    if (diceRollResult) diceContinueLockRef.current = false;
  }, [diceRollResult]);
  useEffect(() => {
    if (restResult) restContinueLockRef.current = false;
  }, [restResult]);
  useEffect(() => {
    if (intelResult) intelContinueLockRef.current = false;
  }, [intelResult]);

  const handleIntelResultClose = useCallback(() => {
    if (intelContinueLockRef.current) return;
    // Read the rendered result — a flag written inside the updater below is NOT readable here
    // (React defers updaters once the fiber is dirty), which cleared the panel but skipped
    // returnToMap, stalling the activity chain / floor completion.
    if (!intelResult) return;
    intelContinueLockRef.current = true;
    setIntelResult(null);
    // Activity already completeActivity'd — chain next room activity or finish floor
    returnToMap();
  }, [returnToMap, intelResult]);

  const handleRestResultClose = useCallback(() => {
    if (restContinueLockRef.current) return;
    // Rendered value, not a flag from inside the updater (see handleIntelResultClose).
    if (!restResult) return;
    restContinueLockRef.current = true;
    setRestResult(null);
    // Rest already completeActivity'd + setFloor — returnToMap for chain / floor complete
    returnToMap();
  }, [returnToMap, restResult]);

  const handleDiceContinueOnce = useCallback(() => {
    if (diceContinueLockRef.current) return;
    diceContinueLockRef.current = true;
    handleDiceResultContinue();
  }, [handleDiceResultContinue]);

  // Close reward modal - check for pending artifact from elite challenge,
  // or component drops from normal combat victories.
  const handleRewardClose = () => {
    // Ref first — Space hold / Enter+click same-tick double Continue
    // (setState consume alone re-reads lastRendered until commit)
    if (rewardCloseLockRef.current) return;
    if (!combatReward) return;
    // Capture loot intent before nulling reward (droppedItems alone can lag / desync)
    const continuesToLoot = Boolean(combatReward.continuesToLoot);
    const lootPreviews = combatReward.lootPreviews ?? [];
    rewardCloseLockRef.current = true;
    setCombatReward(null);

    logRewardModal('close');
    const artifact = pendingArtifact;
    const hasCombatDrops = droppedItems.length > 0;
    // Prefer live pile; fall back to victory previews so Continue never skips claim
    const pendingLoot =
      hasCombatDrops ? droppedItems : continuesToLoot && lootPreviews.length > 0 ? lootPreviews : [];
    // Treasure Guardian victory stages diceRollResult + combatReward together.
    // Dice owns the post-reward map return — do not returnToMap here or floor-complete
    // / activity chain runs twice (reward Continue then dice Continue).
    const hasPendingDice = Boolean(diceRollResult);
    logModalClose(
      'RewardModal',
      artifact
        ? 'showing loot'
        : pendingLoot.length > 0
          ? 'showing combat loot'
          : hasPendingDice
            ? 'dice result next'
            : 'staying on map'
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
    } else if (pendingLoot.length > 0) {
      logFlowCheckpoint('Combat loot found - showing LOOT screen', {
        items: pendingLoot.map(i => i.name),
      });
      // Restage pile if state was empty but victory still owed a claim
      if (!hasCombatDrops) {
        setDroppedItems(pendingLoot);
        setDroppedSkill(null);
      }
      logStateChange('LOCATION_EXPLORE', 'LOOT', 'combat drop');
      setGameState(GameState.LOOT);
    } else if (hasPendingDice) {
      logFlowCheckpoint('Combat reward closed - dice result modal owns map return');
    } else {
      // No loot modal: returnToMap chains next activity or runs location-complete meta path
      // (markComplete + updateDeck + redraw cards + locationsCleared++)
      logFlowCheckpoint('No pending artifact or combat drops - returnToMap');
      returnToMap();
    }
  };

  const learnSkill = (skill: Skill, slotIndex?: number) => {
    if (!player || !playerStats || isProcessingLoot) return;
    // Ref first — setDroppedSkill consume re-reads lastRendered until commit
    if (lootSkillClaimLockRef.current) return;
    // Already claimed this skill drop
    if (!droppedSkill || droppedSkill.id !== skill.id) return;

    const checkResult = canLearnSkill(
      skill,
      playerStats.effectivePrimary,
      player.level,
      player.clan,
    );
    if (!checkResult.canLearn) {
      addLog(`Cannot learn ${skill.name}: ${checkResult.reason}`, 'danger');
      return;
    }

    // Deck full (20 playable): must pick a card to forget (slotIndex) before learning a new playable skill
    const alreadyKnown = player.skills.some(s => s.id === skill.id);
    const isPlayable = skill.actionType !== ActionType.PASSIVE;
    if (
      !alreadyKnown &&
      isPlayable &&
      slotIndex === undefined &&
      !canAddPlayableSkill(player.skills)
    ) {
      addLog(`Deck full (${getPlayableDeckSize(player.skills)}/20). Forget a technique to learn ${skill.name}.`, 'danger');
      return;
    }

    // Lock before consume (same-tick double Upgrade cannot re-enter)
    lootSkillClaimLockRef.current = true;

    // Consume drop (blocks double-learn / double-upgrade on rapid click). The claim was already
    // decided synchronously above from the rendered `droppedSkill` + lootSkillClaimLockRef — a flag
    // written inside this updater is NOT readable here (React defers updaters once the fiber is
    // dirty), which previously destroyed the drop without ever learning it.
    setDroppedSkill(prev => (prev && prev.id === skill.id ? null : prev));

    type LearnKind = 'upgrade' | 'replace' | 'learn' | 'fail';

    // Outcome computed from the RENDERED player, before the write. A value written inside the
    // updater is not readable after it (React defers updaters once the fiber is dirty), so this
    // always reported 'fail': it restored the drop while the queued updater still learned the
    // skill, letting the same scroll be learned/upgraded over and over.
    const priorSkills = player.skills;
    const existingIndex = priorSkills.findIndex(s => s.id === skill.id);
    const playableSkill = skill.actionType !== ActionType.PASSIVE;
    const box: { kind: LearnKind; detail?: string; level?: number } =
      existingIndex !== -1
        ? {
            kind: 'upgrade',
            detail: priorSkills[existingIndex].name,
            level: (priorSkills[existingIndex].level || 1) + 1,
          }
        : slotIndex !== undefined && priorSkills[slotIndex]
          ? { kind: 'replace', detail: priorSkills[slotIndex].name }
          : !playableSkill || canAddPlayableSkill(priorSkills)
            ? { kind: 'learn' }
            : { kind: 'fail' };

    setPlayer(prev => {
      if (!prev) return null;
      const newSkills = [...prev.skills];
      const idx = newSkills.findIndex(s => s.id === skill.id);

      if (idx !== -1) {
        const existing = newSkills[idx];
        const currentLevel = existing.level || 1;
        const growth = skill.damageMult * 0.2;
        newSkills[idx] = {
          ...existing,
          level: currentLevel + 1,
          damageMult: existing.damageMult + growth,
        };
        return { ...prev, skills: newSkills };
      }
      if (slotIndex !== undefined && newSkills[slotIndex]) {
        const replaced = newSkills[slotIndex];
        // When playable deck is full, only allow replacing a playable slot (not a passive)
        if (
          skill.actionType !== ActionType.PASSIVE &&
          !canAddPlayableSkill(newSkills) &&
          replaced.actionType === ActionType.PASSIVE
        ) {
          return prev;
        }
        newSkills[slotIndex] = { ...skill, level: 1 };
        return { ...prev, skills: newSkills };
      }
      if (skill.actionType === ActionType.PASSIVE || canAddPlayableSkill(newSkills)) {
        newSkills.push({ ...skill, level: 1 });
        return { ...prev, skills: newSkills };
      }
      return prev;
    });

    // Recompute replace fail if box said replace but player was not updated (passive overwrite blocked)
    if (box.kind === 'upgrade') {
      addLog(`Upgraded ${box.detail} to Level ${box.level}!`, 'gain');
    } else if (box.kind === 'replace') {
      addLog(`Forgot ${box.detail} to learn ${skill.name}.`, 'loot');
    } else if (box.kind === 'learn') {
      addLog(`Learned ${skill.name}.`, 'loot');
    } else {
      // Restore drop if apply failed (rare capacity race)
      setDroppedSkill(skill);
      lootSkillClaimLockRef.current = false;
      return;
    }

    // Stay on LOOT if items remain; only leave when pile is empty.
    // Share exit mutex with Leave All / finish claim (no double returnToMap).
    const pileEmpty = droppedItems.length === 0;
    if (pileEmpty) {
      exitLootOnce();
    }
  };

  // --- Layout flags + hooks MUST run before any early return (Rules of Hooks) ---
  // Explore chrome (HUD + bag I + character C) is global for every in-shell scene with a run.
  // Full-screen exits (MENU / CHAR_SELECT / GUIDE / GAME_OVER / INTERLUDE / VICTORY) return early
  // and never render this shell.
  const isCombat = gameState === GameState.COMBAT;
  const isExplorationMap =
    gameState === GameState.REGION_MAP || gameState === GameState.LOCATION_EXPLORE;
  // In-shell mission states that should sit on the dark void underlay (not explore map)
  const isMissionScene =
    isCombat ||
    gameState === GameState.EVENT ||
    gameState === GameState.TRAINING ||
    gameState === GameState.ELITE_CHALLENGE ||
    gameState === GameState.LOOT ||
    gameState === GameState.MERCHANT ||
    gameState === GameState.SCROLL_DISCOVERY ||
    gameState === GameState.TREASURE ||
    gameState === GameState.TREASURE_HUNT_REWARD;
  // Keep as && chain (not Boolean()) so TS can narrow player/playerStats at use sites with re-checks
  const showExploreChrome = !!player && !!playerStats;
  // No dual sidebars when explore HUD owns bag/character (all shell scenes with a player)
  const hideSidebars = showExploreChrome || isCombat || isExplorationMap;
  const centerStageClass = [
    // Exploration maps stretch full stage; mission scenes full-bleed under HUD; else centered.
    'flex-1 flex flex-col relative overflow-y-auto center-stage',
    isExplorationMap
      ? 'center-stage--explore items-stretch justify-stretch min-h-0 p-0'
      : isMissionScene
        ? 'center-stage--event items-stretch justify-stretch min-h-0 p-0'
        : showExploreChrome
          ? 'center-stage--event items-stretch justify-stretch min-h-0 p-0'
          : 'items-center justify-center',
    isMissionScene ? 'center-stage--mission' : '',
    !isExplorationMap && !isMissionScene && !showExploreChrome ? 'p-6' : '',
    showExploreChrome && !isExplorationMap && !isMissionScene ? 'p-4' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Close explore overlays when leaving a run shell (no player / full-screen exit)
  useEffect(() => {
    if (!showExploreChrome) {
      setExploreBagOpen(false);
      setExploreCharacterOpen(false);
    }
  }, [showExploreChrome]);

  // Close bag/character when a higher result/approach modal owns the screen
  // (prevents stuck-under-modal overlay + I/C keyboard trap feel)
  useEffect(() => {
    const blocking =
      Boolean(combatReward) ||
      Boolean(eventOutcome) ||
      Boolean(intelResult) ||
      Boolean(restResult) ||
      Boolean(locationCompleteResult) ||
      Boolean(diceRollResult) ||
      showApproachSelector;
    if (blocking) {
      setExploreBagOpen(false);
      setExploreCharacterOpen(false);
    }
  }, [
    combatReward,
    eventOutcome,
    intelResult,
    restResult,
    locationCompleteResult,
    diceRollResult,
    showApproachSelector,
  ]);

  // I / C / Esc — bag & character independent (both can stay open)
  // Combat: C is hand slot 3 — only open character via HUD button, not C key.
  // Do not open bag/character under result/approach modals.
  useEffect(() => {
    if (!showExploreChrome) return;
    const onKey = (event: KeyboardEvent) => {
      const t = event.target as HTMLElement | null;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t?.isContentEditable
      ) {
        return;
      }
      const blockingModal = document.querySelector(
        '[role="dialog"][aria-modal="true"]:not(.explore-overlay), .reward-modal, .event-result, .loc-complete, .dice-modal, .intel-result, .rest-result, .approach-modal, .confirm-modal',
      );
      const key = event.key.toLowerCase();
      if (key === 'i') {
        if (blockingModal) return;
        event.preventDefault();
        setExploreBagOpen((prev) => !prev);
      } else if (key === 'c') {
        // Combat hand uses C for the 3rd skill card
        if (isCombat) return;
        if (blockingModal) return;
        event.preventDefault();
        setExploreCharacterOpen((prev) => !prev);
      } else if (event.key === 'Escape' && (exploreBagOpen || exploreCharacterOpen)) {
        // Progressive close: bag first, then character (overlays may also handle Esc)
        event.preventDefault();
        if (exploreBagOpen) setExploreBagOpen(false);
        else setExploreCharacterOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showExploreChrome, isCombat, exploreBagOpen, exploreCharacterOpen]);

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
    return (
      <CharacterSelect
        onSelectClan={startGame}
        runMode={pendingRunMode}
        onBack={() => {
          // Esc / Mission Brief: drop pending Infinite so Gate does not keep a silent mode
          setPendingRunMode('campaign');
          setGameState(GameState.MENU);
        }}
      />
    );
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
          // Current ascent height (floor+1) — never 0 on first-floor death
          runMode === 'infinite' ? infiniteHeightFromFloor(infiniteFloor) : undefined
        }
        player={player}
        background={combatBackground}
        onRetry={() => {
          setPendingRunMode('campaign');
          setRunMode('campaign');
          setInfiniteFloor(0);
          setGameState(GameState.MENU);
          setPlayer(null);
          setEnemy(null);
          setCombatState(null);
          setApproachResult(null);
          setShowApproachSelector(false);
          // Same residue clear as startGame — death mid-modal must not carry over
          resetExplorationUi();
          rewardCloseLockRef.current = false;
          setCombatReward(null);
          setDiceRollResult(null);
          setRestResult(null);
          setIntelResult(null);
          setEventOutcome(null);
          setActiveEvent(null);
          setCameFromChain(false);
          setIsProcessingLoot(false);
          setMerchantItems([]);
          setTrainingData(null);
          setScrollDiscoveryData(null);
          setEliteChallengeData(null);
          setPendingArtifact(null);
          setCurrentTreasure(null);
          setCurrentTreasureHunt(null);
          setTreasureHuntReward(null);
          setPendingBagFullItem(null);
          setDroppedItems([]);
          setDroppedSkill(null);
          setRegion(null);
          setLocationFloor(null);
          setBranchingFloor(null);
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
          setPendingRunMode('campaign');
          setRunMode('campaign');
          setInfiniteFloor(0);
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
          setInfiniteFloor(0);
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
    onStartSynthesisEquipped: (slot: EquipmentSlot, item: Item) => {
      if (startSynthesisEquipped(slot, item)) {
        setBagSynthesisSession((n) => n + 1);
      }
    },
    onReorderBag: reorderBag,
    onDragBagToEquip: dragBagToEquip,
    onDragEquipToBag: dragEquipToBag,
    onSwapEquipment: swapEquipment,
    treasureHunt: locationFloor?.treasureHunt || currentTreasureHunt,
    // T-096: bag Focus honesty while equipping
    lootTheme: region?.lootTheme,
    synthesisSession: bagSynthesisSession,
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
        {showExploreChrome && player && playerStats && (() => {
          const exploreModalBlocksHud =
            Boolean(combatReward) ||
            Boolean(eventOutcome) ||
            Boolean(intelResult) ||
            Boolean(restResult) ||
            Boolean(locationCompleteResult) ||
            Boolean(diceRollResult) ||
            showApproachSelector;
          return (
          <ExplorationHUD
            player={player}
            maxHp={playerStats.derived.maxHp}
            maxChakra={playerStats.derived.maxChakra}
            onOpenBag={() => {
              if (exploreModalBlocksHud) return;
              setExploreBagOpen((p) => !p);
            }}
            onOpenCharacter={() => {
              if (exploreModalBlocksHud) return;
              setExploreCharacterOpen((p) => !p);
            }}
            bagOpen={exploreBagOpen}
            characterOpen={exploreCharacterOpen}
            lootTheme={region?.lootTheme}
            locationLabel={
              gameState === GameState.LOCATION_EXPLORE || isMissionScene
                ? (currentLocation?.name ?? region?.name ?? null)
                : (region?.name ?? null)
            }
            dangerLevel={
              currentLocation &&
              (gameState === GameState.LOCATION_EXPLORE || isMissionScene)
                ? currentLocation.dangerLevel
                : null
            }
          />
          );
        })()}
        <div className={centerStageClass}>
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
                onPassTurn={passTurn}
                getDamageTypeColor={getDamageTypeColor}
                getRarityColor={getRarityColor}
                autoCombatEnabled={autoCombatEnabled}
                onToggleAutoCombat={() => setAutoCombatEnabled(prev => !prev)}
                autoPassTimeRemaining={autoPassTimeRemaining}
                background={fullCombatBackground}
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
              background={combatBackground}
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
              roomConditionNames={(() => {
                // T-111: elite room fight conditions (T-108 modifiers)
                const mods =
                  eliteChallengeData.room.activities.eliteChallenge?.modifiers
                  ?? eliteChallengeData.room.activities.combat?.modifiers
                  ?? [];
                return mods
                  .filter((m) => m !== CombatModifierType.NONE)
                  .map((m) => COMBAT_MODIFIER_EFFECTS[m]?.name)
                  .filter(Boolean) as string[];
              })()}
              roomConditionHints={(() => {
                const mods =
                  eliteChallengeData.room.activities.eliteChallenge?.modifiers
                  ?? eliteChallengeData.room.activities.combat?.modifiers
                  ?? [];
                return mods
                  .filter((m) => m !== CombatModifierType.NONE)
                  .map((m) => COMBAT_MODIFIER_EFFECTS[m]?.description)
                  .filter(Boolean) as string[];
              })()}
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
                onLeaveAll={exitLootOnce}
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
              equipmentFocus={region?.lootTheme?.equipmentFocus}
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
              lootTheme={region?.lootTheme}
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
                onBagFullStash={handleBagFullStash}
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
            <div className="w-full h-full min-h-0 flex flex-col flex-1">
              <RegionMap
                region={region}
                player={player}
                playerStats={playerStats}
                drawnCards={drawnCards}
                selectedIndex={selectedCardIndex}
                onCardSelect={handleCardSelect}
                onEnterLocation={handleEnterSelectedLocation}
              />
              {/* Victory reward fallback when resolveExploreReturnState lands on REGION_MAP
                  (no locationFloor) — same Continue path as location explore. */}
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
            </div>
          )}

          {/* Location Explorer - Uses LocationMap for location rooms */}
          {gameState === GameState.LOCATION_EXPLORE && region && locationFloor && player && playerStats && (() => {
            // Soft-lock guard: never blank the map when floor is live but currentLocationId
            // drifted (stale region pointer). Fall back to floor biome / generic site name.
            const currentLocation = getCurrentLocation(region);
            const locationName =
              currentLocation?.name
              ?? locationFloor.biome
              ?? 'Current site';
            return (
              <div className="w-full h-full min-h-0 flex flex-col flex-1">
                <LocationMap
                  branchingFloor={locationFloor}
                  player={player}
                  playerStats={playerStats}
                  currentIntel={currentIntel}
                  locationName={locationName}
                  onRoomSelect={handleLocationRoomSelect}
                  onRoomEnter={handleLocationRoomEnter}
                  onLeaveLocation={handleLeaveLocation}
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
          onClose={handleIntelResultClose}
        />
      )}

      {/* T-050 / R1-004 / R1-REST-FIX: Rest heal result */}
      {restResult && (
        <RestResultModal
          result={restResult}
          onClose={handleRestResultClose}
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

      {/* T-022: bag (right) + character sheet (left) — both can be open together */}
      {showExploreChrome && exploreBagOpen && player && (
        <InventoryOverlay
          {...inventoryOverlayProps}
          onClose={() => setExploreBagOpen(false)}
          side="right"
          showBackdrop={!exploreCharacterOpen}
          trapFocus={!exploreCharacterOpen}
        />
      )}
      {showExploreChrome && exploreCharacterOpen && player && playerStats && (
        <CharacterSheetOverlay
          player={player}
          playerStats={playerStats}
          onClose={() => setExploreCharacterOpen(false)}
          lootTheme={region?.lootTheme}
          side="left"
          showBackdrop={!exploreBagOpen}
          trapFocus={!exploreBagOpen}
        />
      )}

      {/* Approach Selector Modal */}
      {showApproachSelector && selectedBranchingRoom && (selectedBranchingRoom.activities.combat || selectedBranchingRoom.activities.eliteChallenge || enemy) && player && playerStats && (() => {
        // Get enemy from state first (e.g., Treasure Guardian), then live (incomplete) elite/combat only
        const eliteChallenge = selectedBranchingRoom.activities.eliteChallenge;
        const combat = selectedBranchingRoom.activities.combat;
        const targetEnemy =
          enemy ||
          (eliteChallenge && !eliteChallenge.completed
            ? eliteChallenge.enemy
            : combat && !combat.completed
              ? combat.enemy
              : undefined);
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
              // T-104/T-108: combat or elite-only room modifiers
              const mods =
                selectedBranchingRoom.activities.combat?.modifiers
                ?? selectedBranchingRoom.activities.eliteChallenge?.modifiers
                ?? [];
              return mods
                .filter((m) => m !== CombatModifierType.NONE)
                .map((m) => COMBAT_MODIFIER_EFFECTS[m]?.name)
                .filter(Boolean) as string[];
            })()}
            roomConditionHints={(() => {
              const mods =
                selectedBranchingRoom.activities.combat?.modifiers
                ?? selectedBranchingRoom.activities.eliteChallenge?.modifiers
                ?? [];
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

      {/* Dice Roll Result Modal — hide under combat reward so Space cannot dismiss both
          (Treasure Guardian: reward then dice; dice owns map return). */}
      {diceRollResult && !combatReward && (
        <DiceRollResultModal
          result={diceRollResult}
          onContinue={handleDiceContinueOnce}
        />
      )}
    </div>
    </GameProvider>
  );
};

export default App;
