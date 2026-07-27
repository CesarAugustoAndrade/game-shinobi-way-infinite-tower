import { useCallback, useEffect, useRef } from 'react';
import {
  GameState, Player, BranchingRoom, BranchingFloor, CharacterStats,
  Location, Region, Item, Skill, LogEntry,
  TreasureActivity, TreasureHunt, TreasureType, Enemy, DiceRollResult,
} from '../game/types';
import {
  completeActivity,
  getCurrentRoom,
  initializeTreasureHunt,
  addMapPiece,
  calculateTrapDamage,
  getTreasureHuntReward,
} from '../game/systems/LocationSystem';
import { addToBag, getSellPrice } from '../game/systems/LootSystem';
import { generateEnemy } from '../game/systems/EnemySystem';
import { TurnState } from './useCombat';
import { LaunchProperties, FeatureFlags } from '../config/featureFlags';
import { simulateGameCombat } from '../game/systems/CombatSimulationService';
import { getLocationTerrainMods } from '../game/systems/LocationTerrainSystem';

/**
 * State dependencies for treasure handlers
 */
export interface TreasureHandlerState {
  currentTreasure: TreasureActivity | null;
  currentTreasureHunt: TreasureHunt | null;
  player: Player | null;
  playerStats: CharacterStats | null;
  selectedBranchingRoom: BranchingRoom | null;
  locationFloor: BranchingFloor | null;
  branchingFloor: BranchingFloor | null;
  currentDangerLevel: number;
  difficulty: number;
  region: Region | null;
  currentLocation: Location | null;
  treasureHuntReward: TreasureHuntRewardData | null;
  /** Live dice panel — the synchronous source for the one-dismiss Continue guard. */
  diceRollResult: DiceRollResult | null;
  pendingBagFullItem: PendingBagFullItem | null;
}

/**
 * Setters for treasure handler operations
 */
export interface TreasureHandlerSetters {
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setCurrentTreasure: React.Dispatch<React.SetStateAction<TreasureActivity | null>>;
  setCurrentTreasureHunt: React.Dispatch<React.SetStateAction<TreasureHunt | null>>;
  setLocationFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setBranchingFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setDroppedItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setDroppedSkill: React.Dispatch<React.SetStateAction<Skill | null>>;
  setTreasureHuntReward: React.Dispatch<React.SetStateAction<TreasureHuntRewardData | null>>;
  setSelectedBranchingRoom: React.Dispatch<React.SetStateAction<BranchingRoom | null>>;
  setGameState: (state: GameState) => void;
  setEnemy: (enemy: Enemy | null) => void;
  setTurnState: React.Dispatch<React.SetStateAction<TurnState>>;
  setShowApproachSelector: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingArtifact: React.Dispatch<React.SetStateAction<Item | null>>;
  setDiceRollResult: React.Dispatch<React.SetStateAction<DiceRollResult | null>>;
  setPendingBagFullItem: React.Dispatch<React.SetStateAction<PendingBagFullItem | null>>;
}

/**
 * Dependencies for treasure handlers
 */
export interface TreasureHandlerDeps {
  addLog: (text: string, type?: LogEntry['type']) => void;
  returnToMap: () => void;
  returnToMapActivityComplete: (updatedFloor?: BranchingFloor) => void;
  // Auto-combat callback for treasure guardian when ENABLE_MANUAL_COMBAT is false
  onAutoTreasureGuardianVictory?: (guardian: Enemy) => void;
}

/**
 * Treasure hunt reward data structure
 */
export interface TreasureHuntRewardData {
  items: Item[];
  skills: Skill[];
  ryo: number;
  piecesCollected: number;
  wealthLevel: number;
}

/**
 * Pending item when bag is full during treasure selection
 */
export interface PendingBagFullItem {
  item: Item;
  index: number;
}

/**
 * Return type for useTreasureHandlers hook
 */
export interface UseTreasureHandlersReturn {
  handleTreasureReveal: () => void;
  handleTreasureSelectItem: (index: number) => void;
  handleTreasureFightGuardian: () => void;
  handleTreasureRollDice: () => void;
  handleTreasureStartHunt: () => void;
  handleTreasureDeclineHunt: () => void;
  handleTreasureHuntRewardClaim: () => void;
  handleDiceResultContinue: () => void;
  handleBagFullSell: () => void;
  handleBagFullLeave: () => void;
  /** Stash pending bag-full relic after player frees a bag slot. */
  handleBagFullStash: () => void;
}

/**
 * Hook that manages all treasure system handlers.
 * Extracts treasure-related logic from App.tsx for better separation of concerns.
 */
export function useTreasureHandlers(
  state: TreasureHandlerState,
  setters: TreasureHandlerSetters,
  deps: TreasureHandlerDeps
): UseTreasureHandlersReturn {
  const {
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
  } = state;

  const {
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
  } = setters;

  const { addLog, returnToMap, returnToMapActivityComplete, onAutoTreasureGuardianVictory } = deps;

  /**
   * Sync mutex — eager useState updaters alone can double-fire on same-frame clicks
   * (double relic, double ryo, fight+dice). Reset when a fresh uncollected chest opens.
   */
  const treasureActionLockRef = useRef(false);
  /**
   * Hunt reward claim — UI claimLockRef alone still left parent able to early-return
   * on !player without consuming reward (stuck Claim with lock true). Ref + consume first.
   */
  const huntRewardClaimLockRef = useRef(false);
  /**
   * Hunt start/decline prompt — setLocationFloor isActive/huntDeclined alone re-reads
   * lastRendered until commit; same-tick Y+Y re-init hunt (reset pieces) or Y+N both apply.
   * Shared lock; re-arm when a hunt-prompt treasure is staged.
   */
  const huntPromptLockRef = useRef(false);

  useEffect(() => {
    if (currentTreasure && !currentTreasure.collected) {
      treasureActionLockRef.current = false;
    }
  }, [currentTreasure]);

  // New hunt reward panel → allow Claim again
  useEffect(() => {
    if (treasureHuntReward) {
      huntRewardClaimLockRef.current = false;
    }
  }, [treasureHuntReward]);

  // Fresh hunt prompt (no active hunt, not declined) → allow Y/N again
  useEffect(() => {
    if (
      currentTreasure &&
      !currentTreasureHunt &&
      !(locationFloor?.huntDeclined || branchingFloor?.huntDeclined)
    ) {
      huntPromptLockRef.current = false;
    }
  }, [currentTreasure, currentTreasureHunt, locationFloor?.huntDeclined, branchingFloor?.huntDeclined]);

  /**
   * Helper: Complete treasure activity and return to map.
   * Extracts common logic from handleTreasureSelectItem, handleBagFullSell, handleBagFullLeave.
   * Room id falls back to floor currentRoom (parity merchant leave / training skip) so a
   * lost selectedBranchingRoom pointer cannot soft-lock TREASURE after a successful claim.
   */
  const completeTreasureAndReturn = useCallback(() => {
    const roomId =
      selectedBranchingRoom?.id ??
      (locationFloor ? getCurrentRoom(locationFloor)?.id : undefined) ??
      (branchingFloor ? getCurrentRoom(branchingFloor)?.id : undefined) ??
      null;

    let finalFloor: BranchingFloor | undefined;
    if (locationFloor && roomId) {
      finalFloor = completeActivity(locationFloor, roomId, 'treasure');
      setLocationFloor(finalFloor);
    }
    if (branchingFloor && roomId) {
      const updatedFloor = completeActivity(branchingFloor, roomId, 'treasure');
      setBranchingFloor(updatedFloor);
    }
    setCurrentTreasure(null);
    setCurrentTreasureHunt(null);
    setPendingBagFullItem(null);
    returnToMapActivityComplete(finalFloor);
  }, [locationFloor, branchingFloor, selectedBranchingRoom,
      setLocationFloor, setBranchingFloor, setCurrentTreasure,
      setCurrentTreasureHunt, setPendingBagFullItem, returnToMapActivityComplete]);

  // Reveal treasure choices (pay chakra) — one reveal only (no multi-click chakra drain)
  const handleTreasureReveal = useCallback(() => {
    if (!currentTreasure || !player) return;
    // Ref first — free-at-end + stale isRevealed closure allowed same-tick double charge
    if (currentTreasure.isRevealed || treasureActionLockRef.current) return;

    const cost = currentTreasure.revealCost;
    if (player.currentChakra < cost) {
      addLog('Not enough chakra to reveal the treasure!', 'danger');
      return;
    }

    treasureActionLockRef.current = true;

    // Claim + charge together. Both decisions were already made synchronously above from the
    // rendered currentTreasure/player plus treasureActionLockRef — a flag written inside either
    // updater is NOT readable here (React defers updaters once the fiber is dirty), which
    // previously bailed out after revealing and left the chest revealed for free.
    setCurrentTreasure(prev => (prev && !prev.isRevealed ? { ...prev, isRevealed: true } : prev));
    setPlayer(p => (p && p.currentChakra >= cost ? { ...p, currentChakra: p.currentChakra - cost } : p));

    addLog(`Spent ${cost} chakra to reveal the treasure contents.`, 'info');
    // Free so claim can proceed; isRevealed claim blocks a second reveal path
    treasureActionLockRef.current = false;
  }, [currentTreasure, player, addLog, setPlayer, setCurrentTreasure]);

  // Select an item from treasure choices — one claim only (no multi-loot / multi-ryo)
  const handleTreasureSelectItem = useCallback((index: number) => {
    // Room pointer not required to claim — completeTreasureAndReturn resolves room id
    if (!currentTreasure || !player) return;
    // Ref first — setState collected alone re-reads lastRendered (double relic / double ryo)
    if (currentTreasure.collected || treasureActionLockRef.current) return;
    if (index < 0 || index >= currentTreasure.choices.length) return;

    const selectedItem = currentTreasure.choices[index].item;
    const ryoBonus = currentTreasure.ryoBonus;

    // Soft bag pre-check without claiming — bag-full panel stays re-openable (no lock)
    const hasBagSpace = player.bag.some(slot => slot === null);
    if (!hasBagSpace) {
      if (pendingBagFullItem) return; // already waiting on a claim decision
      setPendingBagFullItem({ item: selectedItem, index });
      return;
    }

    // Lock before collected claim (parity fight/dice — not after bag pre-check)
    treasureActionLockRef.current = true;

    // Claim this chest (blocks double-select exploit). The claim was already decided
    // synchronously above from the rendered currentTreasure.collected + treasureActionLockRef —
    // a flag written inside this updater is NOT readable here (React defers updaters once the
    // fiber is dirty), which previously marked the chest collected and granted nothing.
    setCurrentTreasure(prev =>
      prev && !prev.collected ? { ...prev, collected: true, selectedIndex: index } : prev,
    );

    // Functional ryo + bag add on latest player (avoids overwriting concurrent ryo/bag).
    // Do not grant ryo until bag write succeeds — bag-full race must reopen bag-full panel
    // (not complete the room and delete the relic).
    // Outcome computed from the RENDERED player, before the write — a value written inside the
    // updater is not readable after it (React defers updaters once the fiber is dirty), so this
    // always took the failure path: it un-claimed the chest while the queued updater still added
    // the relic and ryo, letting the same chest be looted repeatedly.
    type ClaimOut = 'ok' | 'full' | 'noprev';
    const granted = player.bag.some((slot) => slot === null)
      ? addToBag(ryoBonus > 0 ? { ...player, ryo: player.ryo + ryoBonus } : player, selectedItem)
      : null;
    const box: { o: ClaimOut } = { o: granted ? 'ok' : 'full' };
    if (granted) setPlayer(prev => (prev ? granted : prev));

    if (box.o === 'ok') {
      if (ryoBonus > 0) {
        addLog(`Found ${ryoBonus} Ryo alongside the treasure!`, 'loot');
      }
      addLog(`${selectedItem.name} added to your bag!`, 'loot');
      // Complete activity and return to map (lock held — room is done)
      completeTreasureAndReturn();
      return;
    }

    // Race: bag filled after pre-check (or player vanished) — un-claim chest, free lock
    setCurrentTreasure((prev) =>
      prev && prev.collected
        ? { ...prev, collected: false, selectedIndex: null }
        : prev,
    );
    treasureActionLockRef.current = false;

    if (box.o === 'full') {
      setPendingBagFullItem({ item: selectedItem, index });
      addLog('Bag is full — free a pocket or sell the find.', 'danger');
      return;
    }
    // noprev: chest re-opened so player is not stuck on a collected empty vault
  }, [currentTreasure, player, pendingBagFullItem, addLog,
      setPlayer, setPendingBagFullItem, setCurrentTreasure, completeTreasureAndReturn]);

  // Fight guardian for guaranteed map piece (treasure hunter)
  const handleTreasureFightGuardian = useCallback(() => {
    if (!currentTreasure || !currentTreasureHunt || !player || !playerStats || !locationFloor) return;
    // Ref first — setState mapPieceAvailable alone re-reads lastRendered (fight+dice / fight×2)
    if (treasureActionLockRef.current) return;
    treasureActionLockRef.current = true;

    // Prefer selected room; re-bind floor current so lost pointer does not soft-lock Fight
    const fightRoom =
      selectedBranchingRoom ?? getCurrentRoom(locationFloor) ?? null;
    if (!fightRoom) {
      treasureActionLockRef.current = false;
      return;
    }
    if (!selectedBranchingRoom) {
      setSelectedBranchingRoom(fightRoom);
    }

    // Consume map-piece opportunity (blocks dice while approach is open / double fight).
    // Restored on Approach cancel in App.handleApproachCancel. Decided from the rendered
    // currentTreasure — a flag written inside the updater is NOT readable here (React defers
    // updaters once the fiber is dirty), which aborted the guardian fight after taking the lock.
    if (!currentTreasure?.mapPieceAvailable) {
      treasureActionLockRef.current = false;
      addLog('This map piece opportunity is already spent.', 'info');
      return;
    }
    setCurrentTreasure(prev => (prev?.mapPieceAvailable ? { ...prev, mapPieceAvailable: false } : prev));

    // Generate a guardian enemy based on danger level
    // T-057: location-themed guardian base (name overridden below)
    const guardian = generateEnemy(
      currentDangerLevel,
      player.locationsCleared,
      'ELITE',
      difficulty,
      region?.arc ?? 'WAVES_ARC',
      undefined,
      locationFloor?.enemyPool,
      // T-073: region elemental theme bias
      region?.lootTheme?.primaryElement ?? locationFloor?.preferredElement,
    );
    guardian.name = 'Treasure Guardian';
    // Prefer painted guardian sprite + cutout (pool may already, force for identity)
    if (!guardian.image?.startsWith('/assets/enemy_')) {
      guardian.image = '/assets/enemy_monk.png';
    }

    // Clear any pending artifact - this is a map piece fight
    setPendingArtifact(null);

    // Check if manual combat is enabled
    if (FeatureFlags.ENABLE_MANUAL_COMBAT) {
      setEnemy(guardian);
      setTurnState('PLAYER');
      setShowApproachSelector(true);
      // Keep currentTreasure so Approach cancel can restore TREASURE (no soft-lock blank screen).
      // currentTreasure is cleared when combat actually starts (handleBranchingApproachSelect).
      // Keep currentTreasureHunt for after combat.
      // Unlock so cancel path can re-arm; mapPieceAvailable stays false until cancel restores it.
      treasureActionLockRef.current = false;

      addLog('A guardian appears to protect the treasure map piece!', 'danger');
    } else {
      // Auto-simulate treasure guardian combat
      // T-107: location terrain + room combat modifiers (parity with T-106 auto combat)
      addLog(`Engaging Treasure Guardian...`, 'danger');
      const locMods = getLocationTerrainMods(currentLocation?.terrainEffects);
      const simResult = simulateGameCombat(
        player,
        playerStats,
        guardian,
        undefined,
        fightRoom.terrain,
        locMods,
        fightRoom.activities.combat?.modifiers,
      );

      // Update player HP and chakra
      setPlayer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentHp: Math.max(1, simResult.playerHpRemaining),
          currentChakra: simResult.playerChakraRemaining,
        };
      });

      setCurrentTreasure(null);

      if (simResult.won) {
        addLog(`Victory! Defeated Treasure Guardian in ${simResult.turnsElapsed} turns.`, 'gain');
        // Set enemy for victory handler to process
        setEnemy(guardian);
        // Call victory callback if provided
        if (onAutoTreasureGuardianVictory) {
          onAutoTreasureGuardianVictory(guardian);
        }
      } else {
        addLog(`Defeated by Treasure Guardian...`, 'danger');
        setGameState(GameState.GAME_OVER);
      }
    }
  }, [currentTreasure, currentTreasureHunt, player, playerStats, selectedBranchingRoom, locationFloor,
      currentDangerLevel, difficulty, region, currentLocation, addLog, setPendingArtifact, setEnemy,
      setTurnState, setShowApproachSelector, setCurrentTreasure, setPlayer, setGameState,
      setSelectedBranchingRoom, onAutoTreasureGuardianVictory]);

  // Roll dice for map piece (treasure hunter)
  // One roll per room: trap / nothing / piece by TREASURE_DICE_ODDS.
  // Multi-click exploit: lock then consume mapPieceAvailable (not setState alone).
  // Also blocked after Fight consumes the same flag (approach open or combat).
  const handleTreasureRollDice = useCallback(() => {
    if (!currentTreasure || !currentTreasureHunt || !player || !playerStats || !locationFloor) return;
    // Ref first — setState mapPieceAvailable alone re-reads lastRendered (dice×2 / fight+dice)
    if (treasureActionLockRef.current) return;
    treasureActionLockRef.current = true;

    const diceRoomId =
      selectedBranchingRoom?.id ?? getCurrentRoom(locationFloor)?.id ?? null;
    if (!diceRoomId) {
      treasureActionLockRef.current = false;
      return;
    }

    // Consume the map-piece opportunity (blocks re-rolls / fight after dice). Rendered value,
    // not a flag from inside the updater (see handleTreasureFightGuardian).
    if (!currentTreasure?.mapPieceAvailable) {
      treasureActionLockRef.current = false;
      addLog('You already committed this chamber (dice or guardian).', 'info');
      return;
    }
    setCurrentTreasure(prev => (prev?.mapPieceAvailable ? { ...prev, mapPieceAvailable: false } : prev));

    // Probabilities: trap% / nothing% / piece% (sum need not be 100 — we normalize)
    const { trap, nothing, piece } = LaunchProperties.TREASURE_DICE_ODDS;
    const total = Math.max(1, trap + nothing + piece);
    const roll = Math.random() * total;

    // Track which floor to use for completing the activity
    let floorForCompletion = locationFloor;

    if (roll < trap) {
      // Trap!
      const trapDamage = calculateTrapDamage(currentDangerLevel, playerStats.derived.maxHp);
      setPlayer(p => p ? { ...p, currentHp: Math.max(1, p.currentHp - trapDamage) } : null);
      setDiceRollResult({ type: 'trap', damage: trapDamage });
      addLog(`Trap triggered! You take ${trapDamage} damage.`, 'danger');
    } else if (roll < trap + nothing) {
      // Nothing
      setDiceRollResult({ type: 'nothing' });
      addLog('The chest was empty... no map piece found.', 'info');
    } else {
      // Map piece! (remaining share of odds = piece)
      const { floor: updatedFloorWithPiece, isComplete } = addMapPiece(locationFloor);
      // Prefer floor hunt; fall back to session hunt so the result modal always opens
      // (mapPieceAvailable already consumed — no modal = softlock).
      const newHunt = updatedFloorWithPiece.treasureHunt ?? currentTreasureHunt;
      const piecesCollected =
        updatedFloorWithPiece.treasureHunt?.collectedPieces
        ?? (currentTreasureHunt ? currentTreasureHunt.collectedPieces + 1 : 1);
      const piecesRequired =
        newHunt?.requiredPieces ?? currentTreasureHunt?.requiredPieces ?? 1;

      // Use the updated floor for completion
      floorForCompletion = updatedFloorWithPiece;
      if (updatedFloorWithPiece.treasureHunt) {
        setCurrentTreasureHunt(updatedFloorWithPiece.treasureHunt);
      }

      // Always stage dismissable result (trap/nothing paths always set; piece must match)
      setDiceRollResult({
        type: 'piece',
        piecesCollected,
        piecesRequired,
      });
      addLog(`Found a map piece! (${piecesCollected}/${piecesRequired})`, 'loot');

      // Check if map is complete - will transition to reward after modal dismissed
      if (isComplete && newHunt) {
        // Generate reward and store it, but don't transition yet
        const wealthLevel = currentLocation?.wealthLevel ?? 4;
        const reward = getTreasureHuntReward(
          piecesCollected,
          wealthLevel,
          currentDangerLevel,
          difficulty,
          // T-072: location loot + region theme bias for hunt completion rewards
          state.currentLocation?.lootTable ?? locationFloor?.lootTable,
          region?.lootTheme ?? locationFloor?.lootTheme,
        );
        setTreasureHuntReward({
          items: reward.items,
          skills: reward.skills,
          ryo: reward.ryo,
          piecesCollected,
          wealthLevel,
        });
        // Complete treasure activity and clear hunt
        const updatedFloor = completeActivity(updatedFloorWithPiece, diceRoomId, 'treasure');
        setLocationFloor({ ...updatedFloor, treasureHunt: null, treasureProbabilityBoost: 0 });
        return;
      }
    }

    // Complete treasure activity (modal will handle return to map)
    const updatedFloor = completeActivity(floorForCompletion, diceRoomId, 'treasure');
    setLocationFloor(updatedFloor);
  }, [currentTreasure, currentTreasureHunt, player, playerStats, selectedBranchingRoom,
      locationFloor, currentDangerLevel, difficulty, currentLocation, region, addLog,
      setPlayer, setLocationFloor, setCurrentTreasure, setCurrentTreasureHunt, setTreasureHuntReward,
      setDiceRollResult]);

  // Continue after dice roll result modal — one dismiss only
  const handleDiceResultContinue = useCallback(() => {
    // Rendered value, not a flag from inside the updater (React defers updaters once the fiber
    // is dirty), which cleared the panel but skipped the map return / hunt-reward stage.
    if (!diceRollResult) return;
    setDiceRollResult(null);

    setCurrentTreasure(null);
    setCurrentTreasureHunt(null);
    setSelectedBranchingRoom(null);

    if (treasureHuntReward) {
      setGameState(GameState.TREASURE_HUNT_REWARD);
    } else {
      returnToMap();
    }
  }, [treasureHuntReward, diceRollResult, returnToMap, setDiceRollResult, setCurrentTreasure,
      setCurrentTreasureHunt, setSelectedBranchingRoom, setGameState]);

  // Start treasure hunt — once per location (re-init would reset collected pieces)
  const handleTreasureStartHunt = useCallback(() => {
    if (!locationFloor || !currentLocation) return;
    if (locationFloor.treasureHunt?.isActive) return;
    // Ref first — setState isActive alone re-reads lastRendered (double init / piece reset)
    if (huntPromptLockRef.current) return;
    huntPromptLockRef.current = true;

    // Initialize from the RENDERED floor so the hunt is readable here — a value written inside the
    // updater is not (React defers updaters once the fiber is dirty), which returned early while
    // the queued updater still started the hunt: the floor had a hunt the UI never saw.
    const started = initializeTreasureHunt(locationFloor);
    const hunt = started.treasureHunt;
    if (!hunt) {
      huntPromptLockRef.current = false;
      return;
    }
    setLocationFloor(prev => (prev && !prev.treasureHunt?.isActive ? started : prev));

    setCurrentTreasureHunt(hunt);
    addLog(
      `Treasure hunt initiated! Collect ${hunt.requiredPieces} map pieces to unlock the grand treasure.`,
      'gain',
    );
  }, [locationFloor, currentLocation, addLog, setLocationFloor, setCurrentTreasureHunt]);

  // Decline treasure hunt (all treasures become locked chests)
  const handleTreasureDeclineHunt = useCallback(() => {
    if (!locationFloor) return;
    if (locationFloor.huntDeclined) return;
    // Shared lock with start — same-tick Y+N must not both apply
    if (huntPromptLockRef.current) return;
    huntPromptLockRef.current = true;

    // huntDeclined was already checked above against the rendered locationFloor; a flag written
    // inside the updater is NOT readable here (deferred once the fiber is dirty), which left the
    // chamber un-sealed after taking the shared Y/N lock.
    setLocationFloor(prev => (prev && !prev.huntDeclined ? { ...prev, huntDeclined: true } : prev));

    if (branchingFloor) {
      setBranchingFloor(prev => (prev ? { ...prev, huntDeclined: true } : prev));
    }

    // Convert the current chamber into a sealed vault (keep generated choices).
    // Without this, UI only fakes LOCKED_CHEST via huntDeclined while type stays hunter.
    setCurrentTreasure(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        type: TreasureType.LOCKED_CHEST,
        isHuntRoom: false,
        mapPieceAvailable: false,
      };
    });

    addLog('You declined the treasure hunt. All treasure rooms will now be regular chests.', 'info');
  }, [locationFloor, branchingFloor, addLog, setLocationFloor, setBranchingFloor, setCurrentTreasure]);

  // Claim treasure hunt reward — one claim only (no double ryo/loot)
  const handleTreasureHuntRewardClaim = useCallback(() => {
    // Ref first — setTreasureHuntReward consume re-reads lastRendered until commit
    if (huntRewardClaimLockRef.current) return;
    huntRewardClaimLockRef.current = true;

    // Consume reward FIRST so UI claim lock + parent always leave TREASURE_HUNT_REWARD
    // (never early-return on !player with reward still staged and Claim dead).
    // Read the RENDERED reward — a value written inside the updater is not readable after it
    // (React defers updaters once the fiber is dirty), so this returned early while the queued
    // updater still cleared the reward: the whole treasure-map payout was lost.
    if (!treasureHuntReward) {
      huntRewardClaimLockRef.current = false;
      return;
    }
    const reward = treasureHuntReward;
    setTreasureHuntReward(null);
    if (reward.ryo > 0) {
      const ryoGain = reward.ryo;
      setPlayer(p => (p ? { ...p, ryo: p.ryo + ryoGain } : null));
      // Logged from the rendered player — a flag written inside the updater is NOT readable
      // here (deferred once the fiber is dirty), so the gain was silently unreported.
      if (player) {
        addLog(`Gained ${ryoGain} Ryo from the treasure map!`, 'loot');
      }
    }

    if (reward.items.length > 0 || reward.skills.length > 0) {
      setDroppedItems(reward.items);
      setDroppedSkill(reward.skills[0] ?? null);
      setGameState(GameState.LOOT);
    } else {
      returnToMap();
    }
  }, [addLog, returnToMap, setPlayer, setDroppedItems,
      setDroppedSkill, setTreasureHuntReward, setGameState]);

  // Sell pending item when bag is full — one resolution only
  const handleBagFullSell = useCallback(() => {
    if (!pendingBagFullItem || !currentTreasure || !player) return;
    if (currentTreasure.collected || treasureActionLockRef.current) return;

    const sellValue = getSellPrice(pendingBagFullItem.item);
    const pending = pendingBagFullItem;
    const ryoBonus = currentTreasure.ryoBonus;

    treasureActionLockRef.current = true;

    // Claim chest before payout (blocks double sell). `collected` was already checked above
    // against the rendered currentTreasure; a flag written inside either updater below is NOT
    // readable here (React defers updaters once the fiber is dirty), which sealed the chest and
    // paid nothing.
    setCurrentTreasure(prev =>
      prev && !prev.collected ? { ...prev, collected: true, selectedIndex: pending.index } : prev,
    );

    let totalRyo = sellValue;
    if (ryoBonus > 0) totalRyo += ryoBonus;
    setPlayer(p => (p ? { ...p, ryo: p.ryo + totalRyo } : null));

    setPendingBagFullItem(null);
    addLog(`Sold ${pending.item.name} for ${sellValue} Ryo.`, 'loot');
    if (ryoBonus > 0) {
      addLog(`Found ${ryoBonus} Ryo alongside the treasure!`, 'loot');
    }

    completeTreasureAndReturn();
  }, [pendingBagFullItem, currentTreasure, player,
      addLog, setPlayer, setPendingBagFullItem, setCurrentTreasure, completeTreasureAndReturn]);

  // Leave pending item behind when bag is full — one resolution only
  const handleBagFullLeave = useCallback(() => {
    if (!pendingBagFullItem || !currentTreasure || !player) return;
    if (currentTreasure.collected || treasureActionLockRef.current) return;

    const pending = pendingBagFullItem;
    const ryoBonus = currentTreasure.ryoBonus;

    treasureActionLockRef.current = true;

    // Rendered `collected` guard above decides the claim; a flag from inside the updater is not
    // readable here (see handleBagFullSell).
    setCurrentTreasure(prev =>
      prev && !prev.collected ? { ...prev, collected: true, selectedIndex: pending.index } : prev,
    );

    setPendingBagFullItem(null);
    addLog(`Left ${pending.item.name} behind.`, 'info');

    if (ryoBonus > 0) {
      setPlayer(p => p ? { ...p, ryo: p.ryo + ryoBonus } : null);
      addLog(`Found ${ryoBonus} Ryo alongside the treasure!`, 'loot');
    }

    completeTreasureAndReturn();
  }, [pendingBagFullItem, currentTreasure, player,
      addLog, setPlayer, setPendingBagFullItem, setCurrentTreasure, completeTreasureAndReturn]);

  /**
   * After bag-full: player frees a slot (sidebar sell/equip) then stashes the relic.
   * Claim chest first (blocks double-stash), then functional bag write.
   * On bag-full race: un-claim + restore pending (do not seal room / delete relic).
   */
  const handleBagFullStash = useCallback(() => {
    if (!pendingBagFullItem || !currentTreasure || !player) return;
    if (currentTreasure.collected || treasureActionLockRef.current) return;

    // Soft pre-check so we don't close the chest while still full
    if (!player.bag.some(slot => slot === null)) {
      addLog('Bag is still full — free a pocket first.', 'danger');
      return;
    }

    const pending = pendingBagFullItem;
    const ryoBonus = currentTreasure.ryoBonus;

    treasureActionLockRef.current = true;

    // Rendered `collected` guard above decides the claim; a flag from inside the updater is not
    // readable here (see handleBagFullSell).
    setCurrentTreasure(prev =>
      prev && !prev.collected ? { ...prev, collected: true, selectedIndex: pending.index } : prev,
    );

    // Clear pending only after successful stash — race full must restore it
    // Outcome from the RENDERED player (see handleTreasureSelectItem) — re-checked on the latest
    // bag inside the write so a sidebar refill cannot overfill.
    type StashOut = 'ok' | 'full' | 'noprev';
    const stashed = player.bag.some((slot) => slot === null)
      ? addToBag(ryoBonus > 0 ? { ...player, ryo: player.ryo + ryoBonus } : player, pending.item)
      : null;
    const box: { o: StashOut } = { o: stashed ? 'ok' : 'full' };
    if (stashed) setPlayer(prev => (prev ? stashed : prev));

    if (box.o === 'ok') {
      setPendingBagFullItem(null);
      if (ryoBonus > 0) {
        addLog(`Found ${ryoBonus} Ryo alongside the treasure!`, 'loot');
      }
      addLog(`${pending.item.name} added to your bag!`, 'loot');
      completeTreasureAndReturn();
      return;
    }

    // Race / noprev: un-claim chest, restore bag-full panel, free lock
    setCurrentTreasure((prev) =>
      prev && prev.collected
        ? { ...prev, collected: false, selectedIndex: null }
        : prev,
    );
    setPendingBagFullItem(pending);
    treasureActionLockRef.current = false;
    if (box.o === 'full') {
      addLog('Bag filled again — free a pocket first.', 'danger');
    }
  }, [pendingBagFullItem, currentTreasure, player,
      addLog, setPlayer, setPendingBagFullItem, setCurrentTreasure, completeTreasureAndReturn]);

  return {
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
  };
}
