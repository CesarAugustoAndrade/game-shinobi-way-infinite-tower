import { useCallback, useRef, useEffect } from 'react';
import {
  Player, Item, Skill, GameState, BranchingRoom, BranchingFloor,
  CharacterStats, PrimaryStat, TrainingCostType, GameEvent, EventChoice,
  Enemy, Region, LogEntry, TreasureQuality, ApproachType, ActionType,
  TerrainType,
} from '../game/types';
import {
  completeActivity, getCurrentRoom
} from '../game/systems/LocationSystem';
import {
  dangerToFloor,
  calculateMerchantRerollCost
} from '../game/systems/ScalingSystem';
import { attemptEliteEscape } from '../game/systems/EliteChallengeSystem';
import { resolveEventChoice } from '../game/systems/EventSystem';
import { EVENTS } from '../game/constants';
import { generateEnemy } from '../game/systems/EnemySystem';
import { generateMerchantItem } from '../game/systems/LootSystem';
import { simulateGameCombat } from '../game/systems/CombatSimulationService';
import { canLearnSkill } from '../game/systems/StatSystem';
import { canAddPlayableSkill } from '../game/systems/DeckSystem';
import {
  ApproachResult,
  executeApproach,
  applyApproachCosts,
  applyEnemyHpReduction,
} from '../game/systems/ApproachSystem';
import { resolvePreferredApproach } from '../game/constants/approaches';
import { TERRAIN_DEFINITIONS } from '../game/constants/terrain';
import { MERCHANT } from '../game/config';
import type { EnemyArchetype } from '../game/systems/EnemySystem';
import { FeatureFlags, LaunchProperties } from '../config/featureFlags';
import { logActivityComplete, logStateChange, logExplorationCheckpoint, logModalOpen, logModalClose, logIntelGain } from '../game/utils/explorationDebug';
import { INTEL_GAIN, discoverSecretsFromEventFlags } from '../game/systems/RegionSystem';
import { buildOutcomeChanges, OutcomeChange } from '../components/modals/eventOutcomeChanges';
import {
  applyVisibilityToIntelGain,
  getLocationTerrainMods,
  locationStealthBonusPoints,
} from '../game/systems/LocationTerrainSystem';

export interface ActivityState {
  player: Player | null;
  playerStats: CharacterStats | null;
  currentDangerLevel: number;
  currentBaseDifficulty: number;
  difficulty: number;
  region: Region | null;
  currentLocation: any;
  locationFloor: BranchingFloor | null;
  branchingFloor: BranchingFloor | null;
  selectedBranchingRoom: BranchingRoom | null;
  /** Live shop stock — the synchronous source for the buy-once claim (see buyItem). */
  merchantItems: Item[];
  merchantDiscount: number;
  trainingData: any;
  scrollDiscoveryData: any;
  eliteChallengeData: any;
  isProcessingLoot: boolean;
  currentIntel: number;
  enemy: Enemy | null;
  /** Live event definition — used to re-arm choice mutex when a new event opens. */
  activeEvent: GameEvent | null;
}

export interface ActivitySetters {
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setGameState: (state: GameState) => void;
  setMerchantItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setMerchantDiscount: React.Dispatch<React.SetStateAction<number>>;
  setTrainingData: React.Dispatch<React.SetStateAction<any>>;
  setScrollDiscoveryData: React.Dispatch<React.SetStateAction<any>>;
  setEliteChallengeData: React.Dispatch<React.SetStateAction<any>>;
  setBranchingFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setLocationFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setSelectedBranchingRoom: React.Dispatch<React.SetStateAction<BranchingRoom | null>>;
  setDroppedItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setDroppedSkill: React.Dispatch<React.SetStateAction<Skill | null>>;
  setActiveEvent: React.Dispatch<React.SetStateAction<GameEvent | null>>;
  setPendingArtifact: React.Dispatch<React.SetStateAction<Item | null>>;
  setShowApproachSelector: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentIntel: React.Dispatch<React.SetStateAction<number>>;
  setEventOutcome: React.Dispatch<React.SetStateAction<any>>;
  setIsProcessingLoot: React.Dispatch<React.SetStateAction<boolean>>;
  /** T-011: flags the Event scene that the current event was reached via a chain. */
  setCameFromChain: React.Dispatch<React.SetStateAction<boolean>>;
  /** T-030: unlock secret locations when eventFlags change */
  setRegion: React.Dispatch<React.SetStateAction<Region | null>>;
}

/** Optional engage callback for elite/treasure paths (preferred approach auto-apply) */
export type EngageCombatFn = (
  room: BranchingRoom,
  explicitEnemy?: Enemy | null,
) => void;

export interface ActivityDeps {
  addLog: (text: string, type?: LogEntry['type']) => void;
  checkLevelUp: (p: Player) => any;
  handleCombatVictory: (defeatedEnemy: Enemy, combatStateAtVictory: any) => void;
  returnToMap: () => void;
  /** Prefer this after completeActivity so floor-complete meta path sees a fresh floor/intel. */
  returnToMapActivityComplete: (
    updatedFloor?: BranchingFloor,
    options?: { floor?: BranchingFloor | null; intel?: number }
  ) => void;
  eventOutcome: any;
  /**
   * Single combat-start entry point (from useCombat). Seeds the T-004 deck,
   * draws the opening hand, fills the AP budget and skips the turn-1 upkeep.
   * Event-triggered combat routes through this so it opens with a real hand/AP
   * instead of an empty deck.
   */
  startCombat: (
    newEnemy: Enemy,
    result: ApproachResult,
    playerAfterCosts: Player,
    terrain: any,
    locationTerrainMods?: import('../game/systems/LocationTerrainSystem').LocationTerrainMods | null,
    roomCombatModifiers?: import('../game/types').CombatModifierType[] | null,
  ) => void;
  /** Preferred approach → combat (elite fight / escape fail) */
  onEngageCombat?: EngageCombatFn;
}

export function useActivityHandlers(
  state: ActivityState,
  setters: ActivitySetters,
  deps: ActivityDeps
) {
  const {
    player, playerStats, currentDangerLevel, currentBaseDifficulty, difficulty,
    region, currentLocation, locationFloor, branchingFloor, selectedBranchingRoom,
    merchantItems, merchantDiscount, trainingData, scrollDiscoveryData, eliteChallengeData,
    isProcessingLoot, currentIntel, enemy, activeEvent,
  } = state;

  const {
    setPlayer, setGameState, setMerchantItems, setMerchantDiscount, setTrainingData,
    setScrollDiscoveryData, setEliteChallengeData, setBranchingFloor, setLocationFloor,
    setSelectedBranchingRoom, setDroppedItems, setDroppedSkill, setActiveEvent,
    setPendingArtifact, setShowApproachSelector, setCurrentIntel,
    setEventOutcome, setIsProcessingLoot, setCameFromChain, setRegion
  } = setters;

  const {
    addLog, checkLevelUp, handleCombatVictory, returnToMap, returnToMapActivityComplete,
    eventOutcome, startCombat, onEngageCombat,
  } = deps;

  /** Sync mutex — isProcessingLoot state alone lags one frame behind double-clicks. */
  const merchantLockRef = useRef(false);
  /**
   * Epoch bumps on leave / each new lock so a stale setTimeout unlock from a prior
   * buy/reroll cannot clear the mutex mid-flight on a re-entered shop (W9 residual).
   */
  const merchantLockEpochRef = useRef(0);
  /**
   * Leave shop double-submit (button + Esc, or double-click).
   * selectedBranchingRoom from closure is not a hard mutex until React commits —
   * double leave could completeActivity + returnToMapActivityComplete twice
   * (re-chain / double location-complete meta).
   */
  const merchantLeaveLockRef = useRef(false);
  /**
   * Elite Fight/Escape same-tick double-submit (click + F/E, or double-click).
   * State consume alone is not enough: useState updaters re-read lastRenderedState
   * until React commits, so two events in one frame both see the challenge.
   */
  const eliteResolveLockRef = useRef(false);
  /**
   * Training complete/skip share one session lock — setTrainingData consume alone
   * re-reads lastRendered until commit (Esc + click Skip, or Skip ×2) double
   * completeActivity / returnToMapActivityComplete.
   */
  const trainingSessionLockRef = useRef(false);
  /**
   * Scroll learn/skip share one session lock (same class as training).
   * Browse keys Space/Enter/Esc all call skip without a UI ref.
   */
  const scrollSessionLockRef = useRef(false);

  // New elite prompt → allow Fight/Escape again
  useEffect(() => {
    if (eliteChallengeData) {
      eliteResolveLockRef.current = false;
    }
  }, [eliteChallengeData]);

  // New merchant room (or re-enter) → allow Leave again
  useEffect(() => {
    if (selectedBranchingRoom?.id) {
      merchantLeaveLockRef.current = false;
    }
  }, [selectedBranchingRoom?.id]);

  // New training / scroll session → re-arm complete+skip
  useEffect(() => {
    if (trainingData) {
      trainingSessionLockRef.current = false;
    }
  }, [trainingData]);

  useEffect(() => {
    if (scrollDiscoveryData) {
      scrollSessionLockRef.current = false;
    }
  }, [scrollDiscoveryData]);

  /**
   * Buy merchant item into bag.
   * T-055: returns paid price on success so UI can show purchase juice (null on fail).
   * Pattern: lock → claim stock once (by id) → charge bag → never re-apply same listing.
   * Functional setPlayer + ref mutex avoid double-click races that overwrite bag slots.
   */
  const buyItem = useCallback((item: Item): number | null => {
    if (!player || isProcessingLoot || merchantLockRef.current) return null;

    // Match Merchant UI: ITEM_PRICE_MULTIPLIER × (1 - discount%)
    const price = Math.floor(
      item.value * MERCHANT.ITEM_PRICE_MULTIPLIER * (1 - merchantDiscount / 100)
    );
    if (player.ryo < price) {
      addLog(`Purse runs short — need ${price} Ryō.`, 'danger');
      return null;
    }
    if (!player.bag.some((s) => s === null)) {
      addLog('Bag is full! Equip or sell items to make room.', 'danger');
      return null;
    }

    merchantLockRef.current = true;
    const buyEpoch = ++merchantLockEpochRef.current;
    setIsProcessingLoot(true);

    const unlock = () => {
      if (merchantLockEpochRef.current !== buyEpoch) return;
      merchantLockRef.current = false;
      setIsProcessingLoot(false);
    };

    // Claim stock FIRST — one listing, one purchase (stale card / double path cannot re-buy).
    // The check reads the rendered `merchantItems`, NOT a flag set inside the updater below:
    // React only runs an updater eagerly while the fiber is clean, and setIsProcessingLoot above
    // always dirties it, so such a flag would still be false here and abort every purchase.
    // merchantLockRef (taken above) is what blocks a same-tick second click.
    if (!merchantItems.some((i) => i.id === item.id)) {
      unlock();
      return null;
    }
    setMerchantItems((prev) => prev.filter((i) => i.id !== item.id));

    type BuyOutcome = 'ok' | 'ryo' | 'full';

    // Outcome is decided from the RENDERED player, before the write. A value written inside the
    // updater is not readable after it (React defers updaters once the fiber is dirty), so this
    // branch always took the failure path: it restored the listing while the queued updater still
    // charged the player and filled the bag — letting one listing be bought over and over.
    const outcome: BuyOutcome =
      player.ryo < price ? 'ryo' : player.bag.every((s) => s !== null) ? 'full' : 'ok';

    if (outcome !== 'ok') {
      // Restore listing so a failed pay/bag race does not soft-delete stock
      setMerchantItems((prev) =>
        prev.some((i) => i.id === item.id) ? prev : [...prev, item],
      );
      unlock();
      if (outcome === 'ryo') {
        addLog(`Purse runs short — need ${price} Ryō.`, 'danger');
      } else {
        addLog('Bag is full! Equip or sell items to make room.', 'danger');
      }
      return null;
    }

    // Re-validate against the latest player so a concurrent spend cannot overdraw.
    setPlayer((prev) => {
      if (!prev || prev.ryo < price) return prev;
      const emptyIndex = prev.bag.findIndex((s) => s === null);
      if (emptyIndex === -1) return prev;
      const newBag = [...prev.bag];
      newBag[emptyIndex] = item;
      return { ...prev, ryo: prev.ryo - price, bag: newBag };
    });

    addLog(`Bought ${item.name} for ${price} Ryō. Added to bag.`, 'loot');
    setTimeout(unlock, 100);
    return price;
  }, [player, isProcessingLoot, merchantItems, merchantDiscount, addLog, setPlayer, setMerchantItems, setIsProcessingLoot]);

  const leaveMerchant = useCallback(() => {
    // Ref mutex first — room closure alone can double-fire before commit
    if (merchantLeaveLockRef.current) return;
    const room = selectedBranchingRoom;
    merchantLeaveLockRef.current = true;

    // Drop service lock + bump epoch so mid-buy timeout cannot re-unlock after leave
    // (or clear a lock taken by a fast re-enter shop buy).
    merchantLockEpochRef.current += 1;
    merchantLockRef.current = false;
    setIsProcessingLoot(false);

    // Soft recovery: room pointer lost (stale cancel / chain race) — still leave the shop
    // so MERCHANT never soft-locks with Leave no-op. Prefer completeActivity on current
    // room so multi-activity chain / floor-complete still run.
    if (!room) {
      setMerchantItems([]);
      setMerchantDiscount(0);
      addLog('The merchant has packed up.', 'info');
      const recoveryRoomId =
        (locationFloor ? getCurrentRoom(locationFloor)?.id : undefined) ??
        (branchingFloor ? getCurrentRoom(branchingFloor)?.id : undefined);
      if (locationFloor && region?.currentLocationId && recoveryRoomId) {
        logActivityComplete(recoveryRoomId, 'merchant');
        const updated = completeActivity(locationFloor, recoveryRoomId, 'merchant');
        setLocationFloor(updated);
        returnToMapActivityComplete(updated);
      } else if (locationFloor && region?.currentLocationId) {
        setGameState(GameState.LOCATION_EXPLORE);
      } else {
        setGameState(GameState.REGION_MAP);
      }
      return;
    }

    // Consume room pointer so leave cannot double-complete the activity
    setSelectedBranchingRoom(null);

    if (branchingFloor) {
      logActivityComplete(room.id, 'merchant');
      const updatedFloor = completeActivity(branchingFloor, room.id, 'merchant');
      setBranchingFloor(updatedFloor);
    }

    let updatedLocationFloor: BranchingFloor | undefined;
    if (locationFloor && region) {
      logActivityComplete(room.id, 'merchant');
      updatedLocationFloor = completeActivity(locationFloor, room.id, 'merchant');
      setLocationFloor(updatedLocationFloor);
    }

    logStateChange('MERCHANT', 'LOCATION_EXPLORE|REGION_MAP', 'left merchant');
    setMerchantItems([]);
    setMerchantDiscount(0);
    addLog('The merchant waves goodbye.', 'info');

    if (updatedLocationFloor && region?.currentLocationId) {
      returnToMapActivityComplete(updatedLocationFloor);
    } else if (locationFloor && region?.currentLocationId) {
      // Mid-location without a successful complete — stay on site map (never REGION_MAP)
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.REGION_MAP);
    }
  }, [branchingFloor, selectedBranchingRoom, locationFloor, region, setBranchingFloor, setLocationFloor, setMerchantItems, setMerchantDiscount, setSelectedBranchingRoom, setGameState, setIsProcessingLoot, addLog, returnToMapActivityComplete]);

  const handleMerchantReroll = useCallback(() => {
    if (!player || isProcessingLoot || merchantLockRef.current) return;
    const cost = calculateMerchantRerollCost(currentDangerLevel, currentBaseDifficulty, MERCHANT.REROLL_BASE_COST, MERCHANT.REROLL_FLOOR_SCALING);
    if (player.ryo < cost) {
      addLog(`Not enough Ryō to reroll! Need ${cost}.`, 'danger');
      return;
    }

    // Gate concurrent rerolls / buys / slot / quality (same mutex as buyItem)
    merchantLockRef.current = true;
    const rerollEpoch = ++merchantLockEpochRef.current;
    setIsProcessingLoot(true);

    // Affordability was already checked above against the rendered player. A flag written inside
    // the updater below is NOT readable here — React defers updaters once the fiber is dirty, and
    // setIsProcessingLoot above guarantees that — which used to abort every reroll after taking
    // the lock. merchantLockRef still gates a concurrent reroll/buy.
    const treasureQuality = player.treasureQuality;
    const itemCount = player.merchantSlots;
    setPlayer(p => (p && p.ryo >= cost ? { ...p, ryo: p.ryo - cost } : p));

    const newItems: Item[] = [];
    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
    for (let i = 0; i < itemCount; i++) {
      // T-070: pass location lootTable + region lootTheme for stock bias
      newItems.push(
        generateMerchantItem(
          effectiveFloor,
          difficulty,
          treasureQuality,
          currentLocation?.lootTable,
          region?.lootTheme,
        ),
      );
    }
    setMerchantItems(newItems);
    addLog(`Paid ${cost} Ryō to refresh the merchant's inventory.`, 'info');
    setTimeout(() => {
      if (merchantLockEpochRef.current !== rerollEpoch) return;
      merchantLockRef.current = false;
      setIsProcessingLoot(false);
    }, 150);
  }, [player, isProcessingLoot, currentDangerLevel, currentBaseDifficulty, difficulty, currentLocation, region, setPlayer, setMerchantItems, setIsProcessingLoot, addLog]);

  const handleBuyMerchantSlot = useCallback(() => {
    if (!player || isProcessingLoot || merchantLockRef.current) return;
    if (player.merchantSlots >= MERCHANT.SLOT_COSTS.length) return;
    const cost = MERCHANT.SLOT_COSTS[player.merchantSlots];
    if (player.ryo < cost) {
      addLog(`Not enough Ryō! Need ${cost} to unlock another slot.`, 'danger');
      return;
    }

    merchantLockRef.current = true;
    const slotEpoch = ++merchantLockEpochRef.current;
    setIsProcessingLoot(true);
    // Slot cap + affordability were already checked above against the rendered player. A flag
    // written inside the updater below is NOT readable here (deferred once the fiber is dirty —
    // setIsProcessingLoot above guarantees it), which aborted every slot purchase.
    const newSlots = player.merchantSlots + 1;
    setPlayer(p => {
      if (!p || p.merchantSlots >= MERCHANT.SLOT_COSTS.length) return p;
      const slotCost = MERCHANT.SLOT_COSTS[p.merchantSlots];
      if (p.ryo < slotCost) return p;
      return { ...p, ryo: p.ryo - slotCost, merchantSlots: p.merchantSlots + 1 };
    });
    addLog(`Paid ${cost} Ryō. Merchants will now show ${newSlots} items!`, 'gain');
    setTimeout(() => {
      if (merchantLockEpochRef.current !== slotEpoch) return;
      merchantLockRef.current = false;
      setIsProcessingLoot(false);
    }, 150);
  }, [player, isProcessingLoot, setPlayer, setIsProcessingLoot, addLog]);

  const handleUpgradeTreasureQuality = useCallback(() => {
    if (!player || isProcessingLoot || merchantLockRef.current) return;
    if (player.treasureQuality === TreasureQuality.RARE) return;
    const cost = player.treasureQuality === TreasureQuality.BROKEN
      ? MERCHANT.QUALITY_UPGRADE_COSTS.COMMON
      : MERCHANT.QUALITY_UPGRADE_COSTS.RARE;
    if (player.ryo < cost) {
      addLog(`Not enough Ryō! Need ${cost} to upgrade treasure quality.`, 'danger');
      return;
    }

    merchantLockRef.current = true;
    const qualityEpoch = ++merchantLockEpochRef.current;
    setIsProcessingLoot(true);
    let upgraded: TreasureQuality | null = null;
    setPlayer(p => {
      if (!p || p.treasureQuality === TreasureQuality.RARE) return p;
      const upgradeCost = p.treasureQuality === TreasureQuality.BROKEN
        ? MERCHANT.QUALITY_UPGRADE_COSTS.COMMON
        : MERCHANT.QUALITY_UPGRADE_COSTS.RARE;
      if (p.ryo < upgradeCost) return p;
      const nextQuality = p.treasureQuality === TreasureQuality.BROKEN
        ? TreasureQuality.COMMON
        : TreasureQuality.RARE;
      upgraded = nextQuality;
      return { ...p, ryo: p.ryo - upgradeCost, treasureQuality: nextQuality };
    });
    if (!upgraded) {
      if (merchantLockEpochRef.current === qualityEpoch) {
        merchantLockRef.current = false;
        setIsProcessingLoot(false);
      }
      return;
    }
    addLog(`Paid ${cost} Ryō. Treasure quality upgraded to ${upgraded}!`, 'gain');
    setTimeout(() => {
      if (merchantLockEpochRef.current !== qualityEpoch) return;
      merchantLockRef.current = false;
      setIsProcessingLoot(false);
    }, 150);
  }, [player, isProcessingLoot, setPlayer, setIsProcessingLoot, addLog]);

  const handleTrainingComplete = useCallback((stat: PrimaryStat, costType: TrainingCostType) => {
    // Ref first — UI resultContinueLock already true when Continue fires; any early-return
    // without consuming session leaves TRAINING stuck (result cleared, train re-entry blocked).
    if (trainingSessionLockRef.current) return;
    if (!trainingData) return;

    // Snapshot regimen before consume (stat/cost may not match if data raced)
    const session = trainingData;
    const offer = session.options.find(
      (o: { stat: PrimaryStat; costType: TrainingCostType }) =>
        o.stat === stat && o.costType === costType,
    );

    // Prefer selected room; fall back to floor current (lost pointer must not soft-lock TRAINING)
    const roomId =
      selectedBranchingRoom?.id ??
      (locationFloor ? getCurrentRoom(locationFloor)?.id : undefined) ??
      (branchingFloor ? getCurrentRoom(branchingFloor)?.id : undefined);

    trainingSessionLockRef.current = true;

    // Consume session first — always leave TRAINING after UI Continue committed
    // (never gate leave on option/floor presence — UI lock already fired). The session was
    // already snapshotted from the rendered trainingData above; a flag written inside this
    // updater is NOT readable here (React defers updaters once the fiber is dirty).
    setTrainingData(() => null);

    if (offer) {
      const { cost, gain, costType: paidType } = offer;
      const statKey = String(stat).toLowerCase() as keyof Player['primaryStats'];

      const canAffordRendered = !!player && (
        paidType === 'hp'
          ? player.currentHp > cost
          : paidType === 'chakra'
            ? player.currentChakra >= cost
            : player.ryo >= cost
      );

      setPlayer(p => {
        if (!p) return null;
        if (paidType === 'hp') {
          if (p.currentHp <= cost) return p;
          return {
            ...p,
            currentHp: Math.max(1, p.currentHp - cost),
            primaryStats: {
              ...p.primaryStats,
              [statKey]: p.primaryStats[statKey] + gain,
            },
          };
        }
        if (paidType === 'chakra') {
          if (p.currentChakra < cost) return p;
          return {
            ...p,
            currentChakra: Math.max(0, p.currentChakra - cost),
            primaryStats: {
              ...p.primaryStats,
              [statKey]: p.primaryStats[statKey] + gain,
            },
          };
        }
        // ryo
        if (p.ryo < cost) return p;
        return {
          ...p,
          ryo: p.ryo - cost,
          primaryStats: {
            ...p.primaryStats,
            [statKey]: p.primaryStats[statKey] + gain,
          },
        };
      });

      if (canAffordRendered) {
        const paidLabel =
          paidType === 'hp' ? `${cost} HP` : paidType === 'chakra' ? `${cost} CP` : `${cost} ryo`;
        addLog(`Training complete! ${stat} +${gain} — paid ${paidLabel}.`, 'gain');
      } else {
        addLog('Training faltered — not enough resources for that regimen.', 'danger');
      }
    } else {
      addLog('Training regimen no longer available.', 'danger');
    }

    if (roomId) {
      logActivityComplete(roomId, 'training');
    }
    logStateChange('TRAINING', 'LOCATION_EXPLORE|REGION_MAP', 'training complete');

    if (branchingFloor && roomId) {
      const updatedFloor = completeActivity(branchingFloor, roomId, 'training');
      setBranchingFloor(updatedFloor);
    }

    let updatedLocationFloor: BranchingFloor | undefined;
    if (locationFloor && region && roomId) {
      updatedLocationFloor = completeActivity(locationFloor, roomId, 'training');
      setLocationFloor(updatedLocationFloor);
    }

    if (updatedLocationFloor && region?.currentLocationId) {
      returnToMapActivityComplete(updatedLocationFloor);
    } else if (locationFloor && region?.currentLocationId) {
      setSelectedBranchingRoom(null);
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setSelectedBranchingRoom(null);
      setGameState(GameState.REGION_MAP);
    }
  }, [player, trainingData, selectedBranchingRoom, branchingFloor, region, locationFloor, setPlayer, setBranchingFloor, setLocationFloor, setTrainingData, setSelectedBranchingRoom, setGameState, addLog, returnToMapActivityComplete]);

  const handleTrainingSkip = useCallback(() => {
    // Ref first — Esc + click Skip same tick both saw trainingData
    if (trainingSessionLockRef.current) return;
    trainingSessionLockRef.current = true;

    // Consume session so skip cannot double-complete the room. Decided from the rendered
    // trainingData — a flag written inside the updater is NOT readable here (React defers
    // updaters once the fiber is dirty), which skipped room completion and stalled the floor.
    if (!trainingData) {
      trainingSessionLockRef.current = false;
      return;
    }
    setTrainingData(() => null);

    // Prefer selected room; fall back to floor current (desync / chain race)
    const roomId =
      selectedBranchingRoom?.id ??
      (locationFloor ? getCurrentRoom(locationFloor)?.id : undefined) ??
      (branchingFloor ? getCurrentRoom(branchingFloor)?.id : undefined);

    if (branchingFloor && roomId) {
      logActivityComplete(roomId, 'training');
      const updatedFloor = completeActivity(branchingFloor, roomId, 'training');
      setBranchingFloor(updatedFloor);
    }

    let updatedLocationFloor: BranchingFloor | undefined;
    if (locationFloor && region && roomId) {
      logActivityComplete(roomId, 'training');
      updatedLocationFloor = completeActivity(locationFloor, roomId, 'training');
      setLocationFloor(updatedLocationFloor);
    }

    logStateChange('TRAINING', 'LOCATION_EXPLORE|REGION_MAP', 'training skipped');
    addLog('You decide to skip training for now.', 'info');

    if (updatedLocationFloor && region?.currentLocationId) {
      returnToMapActivityComplete(updatedLocationFloor);
    } else if (locationFloor && region?.currentLocationId) {
      // Mid-location: never dump to REGION_MAP (orphans live floor / seals progress UI)
      setSelectedBranchingRoom(null);
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setSelectedBranchingRoom(null);
      setGameState(GameState.REGION_MAP);
    }
  }, [branchingFloor, selectedBranchingRoom, locationFloor, region, setBranchingFloor, setLocationFloor, setTrainingData, setSelectedBranchingRoom, setGameState, addLog, returnToMapActivityComplete]);

  const finishScrollRoom = useCallback((roomId: string | undefined, isClan: boolean) => {
    if (roomId) {
      logActivityComplete(roomId, 'scrollDiscovery');
    }
    logStateChange('SCROLL_DISCOVERY', 'LOCATION_EXPLORE|REGION_MAP', 'scroll done');

    if (branchingFloor && roomId) {
      let updatedFloor = completeActivity(branchingFloor, roomId, 'scrollDiscovery');
      if (isClan) updatedFloor = { ...updatedFloor, clanRiteUsed: true };
      setBranchingFloor(updatedFloor);
    }

    let updatedLocationFloor: BranchingFloor | undefined;
    if (locationFloor && region && roomId) {
      updatedLocationFloor = completeActivity(locationFloor, roomId, 'scrollDiscovery');
      if (isClan) updatedLocationFloor = { ...updatedLocationFloor, clanRiteUsed: true };
      setLocationFloor(updatedLocationFloor);
    } else if (locationFloor && isClan) {
      setLocationFloor({ ...locationFloor, clanRiteUsed: true });
    }

    if (updatedLocationFloor && region?.currentLocationId) {
      returnToMapActivityComplete(updatedLocationFloor);
    } else if (locationFloor && region?.currentLocationId) {
      setSelectedBranchingRoom(null);
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setSelectedBranchingRoom(null);
      setGameState(GameState.REGION_MAP);
    }
  }, [branchingFloor, locationFloor, region, setBranchingFloor, setLocationFloor, setSelectedBranchingRoom, setGameState, returnToMapActivityComplete]);

  /** Vendor buy (ryo) or clan skill pick (free + clanLevel++) */
  const handleLearnScroll = useCallback((skill: Skill, slotIndex?: number) => {
    if (scrollSessionLockRef.current) return;
    if (!scrollDiscoveryData) return;

    const mode = scrollDiscoveryData.mode ?? 'vendor';
    const isClan = mode === 'clan';
    const ryoPrice = isClan
      ? 0
      : (scrollDiscoveryData.prices?.[skill.id] ?? scrollDiscoveryData.cost?.ryo ?? 0);

    const roomId =
      selectedBranchingRoom?.id ??
      (locationFloor ? getCurrentRoom(locationFloor)?.id : undefined) ??
      (branchingFloor ? getCurrentRoom(branchingFloor)?.id : undefined);

    scrollSessionLockRef.current = true;
    setScrollDiscoveryData(() => null);

    type LearnOut = 'upgrade' | 'replace' | 'learn' | 'fail' | 'clan';
    const box: { o: LearnOut; detail?: string; level?: number } = { o: 'fail' };

    setPlayer((p) => {
      if (!p) return null;
      if (!isClan && p.ryo < ryoPrice) return p;

      if (playerStats) {
        const checkResult = canLearnSkill(
          skill,
          playerStats.effectivePrimary,
          p.level,
          p.clan,
        );
        if (!checkResult.canLearn) return p;
      }

      let nextSkills = [...p.skills];
      const existingIndex = nextSkills.findIndex((s) => s.id === skill.id);

      if (existingIndex !== -1) {
        const existing = nextSkills[existingIndex];
        const currentLevel = existing.level || 1;
        const growth = skill.damageMult * 0.2;
        nextSkills = [...nextSkills];
        nextSkills[existingIndex] = {
          ...existing,
          level: currentLevel + 1,
          damageMult: existing.damageMult + growth,
        };
        box.o = isClan ? 'clan' : 'upgrade';
        box.detail = existing.name;
        box.level = currentLevel + 1;
      } else if (slotIndex !== undefined && nextSkills[slotIndex]) {
        const replaced = nextSkills[slotIndex];
        if (
          skill.actionType !== ActionType.PASSIVE &&
          !canAddPlayableSkill(nextSkills) &&
          replaced.actionType === ActionType.PASSIVE
        ) {
          return p;
        }
        box.o = 'replace';
        box.detail = replaced.name;
        nextSkills = [...nextSkills];
        nextSkills[slotIndex] = { ...skill, level: 1 };
      } else if (
        skill.actionType === ActionType.PASSIVE ||
        canAddPlayableSkill(nextSkills)
      ) {
        nextSkills = [...nextSkills, { ...skill, level: 1 }];
        box.o = isClan ? 'clan' : 'learn';
      } else {
        return p;
      }

      return {
        ...p,
        ryo: isClan ? p.ryo : p.ryo - ryoPrice,
        skills: nextSkills,
        clanLevel: isClan
          ? Math.min(5, (p.clanLevel ?? 0) + 1)
          : (p.clanLevel ?? 0),
      };
    });

    if (box.o === 'upgrade') {
      addLog(`Bought upgrade: ${skill.name} → Lv ${box.level} (−${ryoPrice} Ryo).`, 'gain');
    } else if (box.o === 'replace') {
      addLog(`Forgot ${box.detail} to learn ${skill.name} (−${ryoPrice} Ryo).`, 'loot');
    } else if (box.o === 'learn') {
      addLog(`Bought ${skill.name} for ${ryoPrice} Ryo.`, 'gain');
    } else if (box.o === 'clan') {
      addLog(`Clan rite: learned ${skill.name}. Clan level rose.`, 'gain');
    } else {
      addLog('Could not take that technique — blocked by requirements or deck space.', 'danger');
    }

    finishScrollRoom(roomId, isClan);
  }, [scrollDiscoveryData, playerStats, selectedBranchingRoom, branchingFloor, locationFloor, setPlayer, setScrollDiscoveryData, addLog, finishScrollRoom]);

  /** Vendor: pay ryo to forget a skill (deck hygiene) */
  const handleForgetScrollSkill = useCallback((skillId: string) => {
    if (scrollSessionLockRef.current) return;
    if (!scrollDiscoveryData || (scrollDiscoveryData.mode ?? 'vendor') !== 'vendor') return;
    if (!player) return;

    const cost = scrollDiscoveryData.forgetCostRyo ?? 40;
    const skill = player.skills.find((s) => s.id === skillId);
    if (!skill) return;
    if (player.ryo < cost) {
      addLog('Not enough ryo to forget that technique.', 'danger');
      return;
    }
    // Keep at least one skill
    if (player.skills.length <= 1) {
      addLog('You cannot forget your last technique.', 'danger');
      return;
    }

    scrollSessionLockRef.current = true;
    const roomId =
      selectedBranchingRoom?.id ??
      (locationFloor ? getCurrentRoom(locationFloor)?.id : undefined) ??
      (branchingFloor ? getCurrentRoom(branchingFloor)?.id : undefined);

    setScrollDiscoveryData(() => null);
    setPlayer((p) => {
      if (!p || p.ryo < cost) return p;
      return {
        ...p,
        ryo: p.ryo - cost,
        skills: p.skills.filter((s) => s.id !== skillId),
      };
    });
    addLog(`Forgot ${skill.name} (−${cost} Ryo).`, 'info');
    finishScrollRoom(roomId, false);
  }, [scrollDiscoveryData, player, selectedBranchingRoom, locationFloor, branchingFloor, setPlayer, setScrollDiscoveryData, addLog, finishScrollRoom]);

  const handleScrollDiscoverySkip = useCallback(() => {
    // Ref first — Space/Enter/Esc all call skip; setState consume alone is not enough
    if (scrollSessionLockRef.current) return;
    scrollSessionLockRef.current = true;

    // Rendered value, not a flag from inside the updater (see handleTrainingSkip).
    if (!scrollDiscoveryData) {
      scrollSessionLockRef.current = false;
      return;
    }
    setScrollDiscoveryData(() => null);

    const roomId =
      selectedBranchingRoom?.id ??
      (locationFloor ? getCurrentRoom(locationFloor)?.id : undefined) ??
      (branchingFloor ? getCurrentRoom(branchingFloor)?.id : undefined);

    if (branchingFloor && roomId) {
      logActivityComplete(roomId, 'scrollDiscovery');
      const updatedFloor = completeActivity(branchingFloor, roomId, 'scrollDiscovery');
      setBranchingFloor(updatedFloor);
    }

    let updatedLocationFloor: BranchingFloor | undefined;
    if (locationFloor && region && roomId) {
      logActivityComplete(roomId, 'scrollDiscovery');
      updatedLocationFloor = completeActivity(locationFloor, roomId, 'scrollDiscovery');
      setLocationFloor(updatedLocationFloor);
    }

    logStateChange('SCROLL_DISCOVERY', 'LOCATION_EXPLORE|REGION_MAP', 'scroll skipped');
    addLog('You leave the scrolls behind.', 'info');

    if (updatedLocationFloor && region?.currentLocationId) {
      returnToMapActivityComplete(updatedLocationFloor);
    } else if (locationFloor && region?.currentLocationId) {
      setSelectedBranchingRoom(null);
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setSelectedBranchingRoom(null);
      setGameState(GameState.REGION_MAP);
    }
  }, [branchingFloor, selectedBranchingRoom, locationFloor, region, setBranchingFloor, setLocationFloor, setScrollDiscoveryData, setSelectedBranchingRoom, setGameState, addLog, returnToMapActivityComplete]);

  const handleEliteFight = useCallback(() => {
    // Ref first — same-tick double Fight (button + F) before React re-renders
    if (eliteResolveLockRef.current) return;
    if (!eliteChallengeData) return;
    eliteResolveLockRef.current = true;

    const challenge = eliteChallengeData;
    setEliteChallengeData(null);
    logExplorationCheckpoint('Elite Fight chosen', { enemy: challenge.enemy.name, artifact: challenge.artifact.name });
    setPendingArtifact(challenge.artifact);
    setSelectedBranchingRoom(challenge.room);
    // Map behind combat (never EXPLORE — no UI for that state)
    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.REGION_MAP);
    }
    addLog(`Elite challenge: ${challenge.enemy.name}. Engaging with preferred approach...`, 'info');
    if (onEngageCombat) {
      onEngageCombat(challenge.room, challenge.enemy);
    } else {
      logModalOpen('ApproachSelector', { source: 'eliteChallenge', enemy: challenge.enemy.name });
      setShowApproachSelector(true);
    }
  }, [eliteChallengeData, locationFloor, region, setPendingArtifact, setSelectedBranchingRoom, setShowApproachSelector, setEliteChallengeData, setGameState, addLog, onEngageCombat]);

  const handleEliteEscape = useCallback(() => {
    if (!player || !playerStats) return;
    if (!branchingFloor && !locationFloor) return;
    // Ref first — same-tick double Escape (button + E) double complete / double roll
    if (eliteResolveLockRef.current) return;
    if (!eliteChallengeData) return;
    eliteResolveLockRef.current = true;

    const challenge = eliteChallengeData;
    setEliteChallengeData(null);
    const result = attemptEliteEscape(player, playerStats, challenge.enemy);
    logExplorationCheckpoint('Elite Escape attempt', { success: result.success, roll: result.roll, chance: result.chance });

    if (result.success) {
      logActivityComplete(challenge.room.id, 'eliteChallenge');

      // Prefer locationFloor (region mode): complete activity + pass fresh floor so
      // return path does not re-trigger the elite challenge from a stale snapshot.
      if (locationFloor && region) {
        const updatedFloor = completeActivity(
          locationFloor,
          challenge.room.id,
          'eliteChallenge',
        );
        setLocationFloor(updatedFloor);
        if (branchingFloor) {
          setBranchingFloor(
            completeActivity(branchingFloor, challenge.room.id, 'eliteChallenge'),
          );
        }
        addLog(result.message, 'info');
        returnToMapActivityComplete(updatedFloor);
        return;
      }

      if (branchingFloor) {
        const updatedFloor = completeActivity(
          branchingFloor,
          challenge.room.id,
          'eliteChallenge',
        );
        setBranchingFloor(updatedFloor);
        addLog(result.message, 'info');
        setGameState(GameState.REGION_MAP);
        return;
      }

      addLog(result.message, 'info');
      if (locationFloor && region && region.currentLocationId) {
        setGameState(GameState.LOCATION_EXPLORE);
      } else {
        setGameState(GameState.REGION_MAP);
      }
    } else {
      logExplorationCheckpoint('Elite Escape failed - must fight');
      addLog(result.message, 'danger');
      setPendingArtifact(challenge.artifact);
      setSelectedBranchingRoom(challenge.room);
      if (locationFloor && region && region.currentLocationId) {
        setGameState(GameState.LOCATION_EXPLORE);
      } else {
        setGameState(GameState.REGION_MAP);
      }
      if (onEngageCombat) {
        onEngageCombat(challenge.room, challenge.enemy);
      } else {
        logModalOpen('ApproachSelector', { source: 'eliteEscapeFailed', enemy: challenge.enemy.name });
        setShowApproachSelector(true);
      }
    }
  }, [player, playerStats, eliteChallengeData, branchingFloor, locationFloor, region, setBranchingFloor, setLocationFloor, setEliteChallengeData, setGameState, addLog, setPendingArtifact, setSelectedBranchingRoom, setShowApproachSelector, returnToMapActivityComplete, onEngageCombat]);

  /**
   * Sync mutex for event confirm — UI choiceLocked state lagged one frame so
   * double Enter/click re-ran resolveEventChoice (double HP/ryo/flags/combat).
   * Rearm when a new activeEvent opens (terminal outcome / combat left the lock
   * true forever → second event UI locked with no resolve). Also rearm on failed
   * gate and chain hops.
   */
  const eventChoiceLockRef = useRef(false);
  /**
   * Event outcome Continue — UI closedRef alone still left setState consume able to
   * re-read lastRendered (double intel + completeActivity + returnToMapActivityComplete).
   * Parent ref belt (parity dice/rest/intel continue locks). Rearm when outcome opens.
   */
  const eventOutcomeCloseLockRef = useRef(false);

  useEffect(() => {
    if (activeEvent) {
      eventChoiceLockRef.current = false;
    }
  }, [activeEvent]);

  useEffect(() => {
    if (eventOutcome) {
      eventOutcomeCloseLockRef.current = false;
    }
  }, [eventOutcome]);

  /**
   * Returns true when the choice was applied (event leaves / outcome opens).
   * Returns false on early gate / failed resolve so Event UI can re-arm choiceLockRef
   * (UI locks before calling us — silent false without re-arm = permanent dead choices).
   */
  const handleEventChoice = useCallback((choice: EventChoice): boolean => {
    if (!player || !playerStats) return false;
    // Outcome already open — ignore re-clicks on event choices
    if (eventOutcome) return false;
    if (eventChoiceLockRef.current) return false;
    eventChoiceLockRef.current = true;

    const result = resolveEventChoice(player, choice, playerStats);

    if (!result.success) {
      // Failed gate (cost/req/flags) — allow another pick (parent + UI re-arm via false)
      eventChoiceLockRef.current = false;
      addLog(result.message, 'danger');
      return false;
    }

    // Track the player state that reflects this choice's outcome (HP/chakra/
    // level changes). Event-triggered combat below hands this to startCombat so
    // the fight begins from the post-event player, not the stale snapshot.
    let postEventPlayer = player;
    if (result.player) {
      const leveledPlayer = checkLevelUp(result.player);
      setPlayer(leveledPlayer.player);
      postEventPlayer = leveledPlayer.player;
      // T-030: eventFlags may unlock secret locations on the region map
      if (region && leveledPlayer.player.eventFlags) {
        const { region: nextRegion, newlyDiscovered } = discoverSecretsFromEventFlags(
          region,
          leveledPlayer.player.eventFlags,
        );
        if (newlyDiscovered.length > 0) {
          setRegion(nextRegion);
          for (const name of newlyDiscovered) {
            addLog(`A veiled route surfaces: ${name}.`, 'gain');
          }
        }
      }
    }

    const logType = result.outcome?.effects.logType || (
      result.outcome?.effects.hpChange &&
      (typeof result.outcome.effects.hpChange === 'number' ? result.outcome.effects.hpChange < 0 : result.outcome.effects.hpChange.percent < 0)
        ? 'danger' : 'gain'
    );

    addLog(result.message || 'Choice resolved.', logType);

    // T-011/T-086: describe real changes; intel chip uses fog-scaled gain
    // (matches handleEventOutcomeClose applyVisibilityToIntelGain).
    const locMods = getLocationTerrainMods(currentLocation?.terrainEffects);
    const baseIntelGain =
      result.outcome?.effects?.intelGain ?? INTEL_GAIN.EVENT_DEFAULT;
    const effectiveIntelGain = applyVisibilityToIntelGain(baseIntelGain, locMods);
    const outcomeChanges: OutcomeChange[] = result.outcome
      ? buildOutcomeChanges(player, postEventPlayer, result.outcome, {
          baseIntelGain,
          effectiveIntelGain:
            // Always show default intel when close path will grant it
            result.outcome.effects.intelGain !== undefined
            || baseIntelGain > 0
              ? effectiveIntelGain
              : undefined,
          fogReduced:
            typeof result.outcome.effects.intelGain === 'number'
            || baseIntelGain > 0
              ? effectiveIntelGain !== baseIntelGain
              : false,
        })
      : [];

    if (result.triggerCombat && result.outcome?.effects.triggerCombat) {
      const combatConfig = result.outcome.effects.triggerCombat;
      const combatDangerLevel =
        combatConfig.floor !== undefined && combatConfig.floor !== null
          ? Math.min(7, Math.max(1, Math.ceil(combatConfig.floor / 3)))
          : currentDangerLevel;

      // archetype is a combat build (TANK/ASSASSIN/…), not enemy tier (NORMAL/ELITE/BOSS)
      const VALID_ARCHETYPES: EnemyArchetype[] = [
        'TANK', 'ASSASSIN', 'BALANCED', 'CASTER', 'GENJUTSU',
      ];
      const forcedArchetype = VALID_ARCHETYPES.includes(
        combatConfig.archetype as EnemyArchetype
      )
        ? (combatConfig.archetype as EnemyArchetype)
        : undefined;
      const enemyType = combatConfig.enemyType ?? 'NORMAL';

      // T-057: theme event fights with current location enemy pool when available
      const eventEnemyPool =
        locationFloor?.enemyPool ?? branchingFloor?.enemyPool;
      const baseDiff = region?.baseDifficulty ?? currentBaseDifficulty ?? difficulty;
      const combatDifficulty = baseDiff + (combatConfig.difficulty || 0);
      const combatEnemy = generateEnemy(
        combatDangerLevel,
        player?.locationsCleared ?? 0,
        enemyType,
        combatDifficulty,
        region?.arc ?? 'WAVES_ARC',
        forcedArchetype,
        eventEnemyPool,
        // T-073: region elemental theme (parity room combat T-068)
        region?.lootTheme?.primaryElement,
      );
      if (combatConfig.name) {
        combatEnemy.name = combatConfig.name;
      }

      const currentRoom = locationFloor
        ? getCurrentRoom(locationFloor)
        : branchingFloor
        ? getCurrentRoom(branchingFloor)
        : null;
      // Prefer selected room (set when event opens) so the activity is always consumed
      const combatEventRoomId =
        selectedBranchingRoom?.id ?? currentRoom?.id ?? null;

      if (locationFloor && combatEventRoomId) {
        logActivityComplete(combatEventRoomId, 'event');
        const updatedFloor = completeActivity(locationFloor, combatEventRoomId, 'event');
        setLocationFloor(updatedFloor);
      } else if (branchingFloor && combatEventRoomId) {
        logActivityComplete(combatEventRoomId, 'event');
        const updatedFloor = completeActivity(branchingFloor, combatEventRoomId, 'event');
        setBranchingFloor(updatedFloor);
      }

      // T-063/T-070: location terrain for manual + auto event combat
      const eventLocMods = getLocationTerrainMods(currentLocation?.terrainEffects);
      const combatTerrain = currentRoom ? TERRAIN_DEFINITIONS[currentRoom.terrain] : undefined;

      if (FeatureFlags.ENABLE_MANUAL_COMBAT) {
        // Apply run preferred approach (same as map combat). Fallback frontal if locked out.
        const terrainDef =
          combatTerrain ?? TERRAIN_DEFINITIONS[TerrainType.TRAINING_FIELD];
        const terrainKey = currentRoom?.terrain ?? TerrainType.TRAINING_FIELD;
        const statsFlat = {
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
        const skillIds = postEventPlayer.skills.map((s) => s.id);
        const isEliteOrBoss =
          combatEnemy.tier === 'Jonin' ||
          combatEnemy.tier === 'Guardian' ||
          Boolean(combatEnemy.isBoss);
        const resolved = resolvePreferredApproach(
          postEventPlayer.preferredApproach,
          statsFlat,
          skillIds,
          terrainKey,
          isEliteOrBoss,
        );
        if (resolved.fellBack) {
          addLog(
            resolved.reason ?? 'Preferred approach unavailable — frontal assault.',
            'info',
          );
        }
        const stealthPts = locationStealthBonusPoints(eventLocMods);
        const approachResult = executeApproach(
          resolved.approach,
          postEventPlayer,
          playerStats,
          combatEnemy,
          terrainDef,
          stealthPts,
        );
        if (approachResult.description) {
          addLog(approachResult.description, approachResult.success ? 'gain' : 'danger');
        }
        let playerAfterCosts = applyApproachCosts(postEventPlayer, approachResult);
        setPlayer(playerAfterCosts);
        let fightEnemy = combatEnemy;
        if (approachResult.enemyHpReduction > 0) {
          fightEnemy = applyEnemyHpReduction(combatEnemy, approachResult);
        }
        // Shadow bypass on event combat: still enter fight (event nodes rarely skip)
        // unless skipCombat — treat skip as neutral open if no room to complete.
        if (approachResult.skipCombat) {
          addLog('You slip past the event foe — no fight.', 'gain');
          setActiveEvent(null);
          if (locationFloor) {
            setGameState(GameState.LOCATION_EXPLORE);
          } else {
            setGameState(GameState.REGION_MAP);
          }
          return true;
        }
        setActiveEvent(null);
        startCombat(
          fightEnemy,
          approachResult,
          playerAfterCosts,
          combatTerrain,
          eventLocMods,
          // T-102: event fights use current room combat modifiers if any
          currentRoom?.activities.combat?.modifiers,
        );
      } else {
        // Auto-sim must start from post-event player (HP/ryo/flags already applied).
        // Prior path used pre-choice `player` → wrong starting HP after event damage/heal.
        addLog(`Engaging ${combatEnemy.name} from event...`, 'info');
        const simResult = simulateGameCombat(
          postEventPlayer,
          playerStats,
          combatEnemy,
          undefined,
          currentRoom?.terrain,
          eventLocMods,
          currentRoom?.activities.combat?.modifiers,
        );

        setPlayer(prev => {
          if (!prev) return null;
          return {
            ...prev,
            currentHp: Math.max(1, simResult.playerHpRemaining),
            currentChakra: simResult.playerChakraRemaining,
          };
        });

        setActiveEvent(null);

        if (simResult.won) {
          addLog(`Victory! Defeated ${combatEnemy.name} in ${simResult.turnsElapsed} turns.`, 'gain');
          handleCombatVictory(combatEnemy, null);
        } else {
          addLog(`Defeated by ${combatEnemy.name}...`, 'danger');
          setGameState(GameState.GAME_OVER);
        }
      }
      return true;
    }

    // Resolve which room owns this event (selected room wins — more reliable than currentRoomId alone)
    const eventRoomId =
      selectedBranchingRoom?.id ??
      (locationFloor ? getCurrentRoom(locationFloor)?.id : undefined) ??
      (branchingFloor ? getCurrentRoom(branchingFloor)?.id : undefined) ??
      null;

    // T-008/T-011: chain into the next event. The eventFlags written by this
    // outcome were already persisted via setPlayer(postEventPlayer) above, so
    // the next event (and its choices) see them when gating. In the location
    // explorer the chain routes through the result panel first — the player
    // sees WHAT CHANGED and an explicit "continue the story" step, and the hop
    // to the next event happens on close (handleEventOutcomeClose). The room's
    // event activity is intentionally left incomplete until the final link
    // resolves normally.
    const inLocationMode = Boolean(locationFloor && region && region.currentLocationId);
    if (result.nextEventId) {
      if (inLocationMode && result.outcome) {
        setEventOutcome({
          message: result.message || 'Choice resolved.',
          outcome: result.outcome,
          logType: logType as 'gain' | 'danger' | 'info' | 'loot',
          changes: outcomeChanges,
          nextEventId: result.nextEventId,
          roomId: eventRoomId,
        });
        setActiveEvent(null);
        setGameState(GameState.LOCATION_EXPLORE);
        return true;
      }
      // Legacy branching explorer has no result panel — hop directly.
      const nextEvent = EVENTS.find(e => e.id === result.nextEventId);
      if (nextEvent) {
        // Next link must accept a confirm (UI remounts; parent mutex must rearm)
        eventChoiceLockRef.current = false;
        setCameFromChain(true);
        setActiveEvent(nextEvent);
        setGameState(GameState.EVENT);
        return true;
      }
    }

    // Show result panel, then complete the room event on close (roomId carried in payload)
    if (result.outcome) {
      setEventOutcome({
        message: result.message || 'Choice resolved.',
        outcome: result.outcome,
        logType: logType as 'gain' | 'danger' | 'info' | 'loot',
        changes: outcomeChanges,
        roomId: eventRoomId,
      });
      setActiveEvent(null);
      if (inLocationMode) {
        setGameState(GameState.LOCATION_EXPLORE);
      } else {
        setGameState(GameState.REGION_MAP);
      }
      return true;
    }

    // No outcome panel — mark event consumed immediately so it cannot re-open
    setActiveEvent(null);
    if (eventRoomId && locationFloor && region) {
      logActivityComplete(eventRoomId, 'event');
      const updatedFloor = completeActivity(locationFloor, eventRoomId, 'event');
      setLocationFloor(updatedFloor);
      returnToMapActivityComplete(updatedFloor);
      return true;
    }
    if (eventRoomId && branchingFloor) {
      logActivityComplete(eventRoomId, 'event');
      const updatedFloor = completeActivity(branchingFloor, eventRoomId, 'event');
      setBranchingFloor(updatedFloor);
    }
    if (inLocationMode) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.REGION_MAP);
    }
    return true;
  }, [player, playerStats, currentDangerLevel, currentBaseDifficulty, difficulty, region, locationFloor, branchingFloor, selectedBranchingRoom, currentLocation, eventOutcome, setPlayer, setRegion, setLocationFloor, setBranchingFloor, setActiveEvent, setGameState, setEventOutcome, setCameFromChain, addLog, checkLevelUp, handleCombatVictory, startCombat, returnToMapActivityComplete]);

  const handleEventOutcomeClose = useCallback(() => {
    logModalClose('EventOutcomeModal');

    // Ref first — setState consume alone re-reads lastRendered until commit
    if (eventOutcomeCloseLockRef.current) return;
    eventOutcomeCloseLockRef.current = true;

    // Consume outcome first — blocks double Continue (double intel / double complete)
    const box: {
      outcome: {
        message: string;
        outcome: any;
        logType: string;
        changes: OutcomeChange[];
        nextEventId?: string;
        roomId?: string | null;
      } | null;
    } = { outcome: null };
    setEventOutcome((prev: typeof eventOutcome) => {
      if (!prev) return null;
      box.outcome = prev;
      return null;
    });
    if (!box.outcome) {
      eventOutcomeCloseLockRef.current = false;
      return;
    }

    const closed = box.outcome;

    // T-011: chain continues the story without completing the room / granting intel
    if (closed.nextEventId) {
      const nextEvent = EVENTS.find(e => e.id === closed.nextEventId);
      if (nextEvent) {
        eventChoiceLockRef.current = false;
        setCameFromChain(true);
        setActiveEvent(nextEvent);
        setGameState(GameState.EVENT);
        return;
      }
    }

    // Terminal link: the chain (if any) is over — clear the chain flag.
    setCameFromChain(false);

    // Prefer roomId stamped when the choice resolved (survives currentRoomId drift)
    const roomId =
      closed.roomId ??
      selectedBranchingRoom?.id ??
      (locationFloor ? getCurrentRoom(locationFloor)?.id : undefined) ??
      (branchingFloor ? getCurrentRoom(branchingFloor)?.id : undefined) ??
      null;

    if (locationFloor && roomId) {
      logActivityComplete(roomId, 'event');
      const updatedFloor = completeActivity(locationFloor, roomId, 'event');
      setLocationFloor(updatedFloor);

      // T-068: fog/visibility_penalty scales event intel (parity combat/infoGather)
      const baseEventIntel =
        closed.outcome?.effects?.intelGain ?? INTEL_GAIN.EVENT_DEFAULT;
      const eventIntelGain = applyVisibilityToIntelGain(
        baseEventIntel,
        getLocationTerrainMods(currentLocation?.terrainEffects),
      );
      const nextIntel = Math.min(100, currentIntel + eventIntelGain);
      setCurrentIntel(nextIntel);
      logIntelGain('Event', eventIntelGain, nextIntel);

      // Pass fresh floor + intel so location-complete redraw is not stale
      returnToMapActivityComplete(updatedFloor, { intel: nextIntel });
      return;
    }

    if (branchingFloor && roomId) {
      logActivityComplete(roomId, 'event');
      const updatedFloor = completeActivity(branchingFloor, roomId, 'event');
      setBranchingFloor(updatedFloor);
      setSelectedBranchingRoom(null);
      setGameState(GameState.REGION_MAP);
      return;
    }

    // Fallback: still leave event UI even if room id was lost
    addLog('Event resolved.', 'info');
    setSelectedBranchingRoom(null);
    if (locationFloor && region?.currentLocationId) {
      returnToMapActivityComplete(locationFloor);
    } else {
      setGameState(GameState.REGION_MAP);
    }
  }, [
    branchingFloor, locationFloor, region, currentLocation, currentIntel, selectedBranchingRoom,
    setBranchingFloor, setLocationFloor, setCurrentIntel, setEventOutcome, setSelectedBranchingRoom,
    setCameFromChain, setActiveEvent, setGameState, returnToMapActivityComplete, addLog,
  ]);

  return {
    buyItem,
    leaveMerchant,
    handleMerchantReroll,
    handleBuyMerchantSlot,
    handleUpgradeTreasureQuality,
    handleTrainingComplete,
    handleTrainingSkip,
    handleLearnScroll,
    handleForgetScrollSkill,
    handleScrollDiscoverySkip,
    handleEliteFight,
    handleEliteEscape,
    handleEventChoice,
    handleEventOutcomeClose
  };
}
