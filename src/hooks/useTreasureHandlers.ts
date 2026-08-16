import { useCallback, useEffect, useRef } from 'react';
import {
  GameState, Player, BranchingRoom, BranchingFloor, CharacterStats,
  Location, Region, Item, Skill, LogEntry,
  TreasureActivity, TreasureHunt,
} from '../game/types';
import {
  getCurrentRoom,
  initializeTreasureHunt,
  addMapPiece,
  getTreasureHuntReward,
  applyFloorHeatDelta,
} from '../game/systems/LocationSystem';
import { addToBag, getSellPrice } from '../game/systems/LootSystem';
import { applyLearnSkill } from '../game/systems/SkillConfigLive';
import {
  resolveVisitContext,
  completeActivityOnVisit,
  visitToFloorPatch,
  resolvePostActivityGameState,
} from '../game/session';

/**
 * State dependencies for treasure handlers
 */
export interface TreasureHandlerState {
  currentTreasure: TreasureActivity | null;
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
  setPendingBagFullItem: React.Dispatch<React.SetStateAction<PendingBagFullItem | null>>;
}

/**
 * Dependencies for treasure handlers
 */
export interface TreasureHandlerDeps {
  addLog: (text: string, type?: LogEntry['type']) => void;
  returnToMap: () => void;
  returnToMapActivityComplete: (updatedFloor?: BranchingFloor) => void;
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
  /** Open vault (pay openCost chakra) → vault pick phase */
  handleOpenVault: () => void;
  /** Leave/walk away from vault without opening */
  handleLeaveVault: () => void;
  /** Reveal one sealed vault face (pay revealCost) */
  handleRevealVaultFace: (index: number) => void;
  /** Claim one revealed vault option */
  handlePickVaultOption: (index: number) => void;
  /** Pick a random vault option for free (0 CP cost) */
  handlePickRandom: () => void;
  /** Free map piece (no combat); forgoes vault loot */
  handleTakeMapPiece: () => void;
  handleTreasureHuntRewardClaim: () => void;
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
    setPendingBagFullItem,
  } = setters;

  const { addLog, returnToMap, returnToMapActivityComplete } = deps;

  /**
   * Sync mutex — eager useState updaters alone can double-fire on same-frame clicks.
   * Reset when a fresh uncollected chest opens.
   */
  const treasureActionLockRef = useRef(false);
  /**
   * Hunt reward claim — UI claimLockRef alone still left parent able to early-return
   * on !player without consuming reward (stuck Claim with lock true). Ref + consume first.
   */
  const huntRewardClaimLockRef = useRef(false);
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

  /**
   * Helper: Complete treasure activity and return to map.
   * Extracts common logic from vault selection, bag-full sell, and bag-full leave.
   * Room id falls back to visit currentRoom (parity merchant leave / training skip) so a
   * lost selectedBranchingRoom pointer cannot soft-lock TREASURE after a successful claim.
   * Single active visit via VisitContext (location preferred over branching).
   */
  const completeTreasureAndReturn = useCallback(() => {
    const visit = resolveVisitContext({ locationFloor, branchingFloor });
    const roomId =
      selectedBranchingRoom?.id ??
      (visit ? getCurrentRoom(visit.floor)?.id : undefined) ??
      null;

    // F3: optional treasure raises visit heat (authored heatDelta or default valuable +10)
    const treasureHeat =
      currentTreasure?.heatDelta ??
      (currentTreasure ? 10 : 0);

    if (visit && roomId) {
      let next = completeActivityOnVisit(visit, roomId, 'treasure');
      if (treasureHeat) {
        const prevHunterArmed = next.floor.hunterArmed;
        next = { ...next, floor: applyFloorHeatDelta(next.floor, treasureHeat) };
        // Heat / hunter logs only on location visit (product path)
        if (next.kind === 'location') {
          addLog(`Heat +${treasureHeat} from claiming treasure (now ${next.floor.heat}).`, 'danger');
          if (next.floor.hunterArmed && !prevHunterArmed) {
            addLog('HEAT critical — a Hunter is now stalking this location!', 'danger');
          }
        }
      }
      const patch = visitToFloorPatch(next);
      if (patch.locationFloor) setLocationFloor(patch.locationFloor);
      if (patch.branchingFloor) setBranchingFloor(patch.branchingFloor);

      setCurrentTreasure(null);
      setCurrentTreasureHunt(null);
      setPendingBagFullItem(null);

      if (next.kind === 'location') {
        returnToMapActivityComplete(next.floor);
      } else {
        setGameState(resolvePostActivityGameState(region, next));
      }
      return;
    }

    setCurrentTreasure(null);
    setCurrentTreasureHunt(null);
    setPendingBagFullItem(null);
    returnToMapActivityComplete();
  }, [locationFloor, branchingFloor, selectedBranchingRoom, currentTreasure, region,
      setLocationFloor, setBranchingFloor, setCurrentTreasure,
      setCurrentTreasureHunt, setPendingBagFullItem, setGameState,
      returnToMapActivityComplete, addLog]);

  // Leave vault — walk away without claiming
  const handleLeaveVault = useCallback(() => {
    if (treasureActionLockRef.current) return;
    treasureActionLockRef.current = true;
    addLog('Left the sealed vault.', 'info');
    treasureActionLockRef.current = false;
    completeTreasureAndReturn();
  }, [addLog, completeTreasureAndReturn]);

  // Open vault — pay openCost, enter pick phase (faces still sealed)
  const handleOpenVault = useCallback(() => {
    if (!currentTreasure || !player) return;
    if (currentTreasure.phase === 'vault' || currentTreasure.isRevealed) return;
    if (currentTreasure.collected || treasureActionLockRef.current) return;

    const cost = currentTreasure.openCost ?? currentTreasure.revealCost ?? 0;
    if (player.currentChakra < cost) {
      addLog('Not enough chakra to open the vault!', 'danger');
      return;
    }

    treasureActionLockRef.current = true;
    setCurrentTreasure((prev) =>
      prev && prev.phase !== 'vault'
        ? { ...prev, phase: 'vault', isRevealed: true }
        : prev,
    );
    if (cost > 0) {
      setPlayer((p) =>
        p && p.currentChakra >= cost
          ? { ...p, currentChakra: p.currentChakra - cost }
          : p,
      );
      addLog(`Spent ${cost} chakra to break the vault seals.`, 'info');
    } else {
      addLog('The vault door yields…', 'loot');
    }
    treasureActionLockRef.current = false;
  }, [currentTreasure, player, addLog, setPlayer, setCurrentTreasure]);

  // Reveal one sealed face
  const handleRevealVaultFace = useCallback((index: number) => {
    if (!currentTreasure || !player) return;
    if (currentTreasure.phase !== 'vault' && !currentTreasure.isRevealed) return;
    if (treasureActionLockRef.current) return;

    const opts = currentTreasure.vaultOptions;
    if (!opts || index < 0 || index >= opts.length) return;
    if (opts[index].revealed) return;

    const cost = currentTreasure.revealCost ?? 0;
    if (player.currentChakra < cost) {
      addLog('Not enough chakra to unseal that relic!', 'danger');
      return;
    }

    treasureActionLockRef.current = true;
    setCurrentTreasure((prev) => {
      if (!prev?.vaultOptions) return prev;
      const next = prev.vaultOptions.map((o, i) =>
        i === index ? { ...o, revealed: true } : o,
      );
      return { ...prev, vaultOptions: next };
    });
    if (cost > 0) {
      setPlayer((p) =>
        p && p.currentChakra >= cost
          ? { ...p, currentChakra: p.currentChakra - cost }
          : p,
      );
      addLog(`Spent ${cost} chakra to unseal a vault face.`, 'info');
    }
    treasureActionLockRef.current = false;
  }, [currentTreasure, player, addLog, setPlayer, setCurrentTreasure]);

  // Free map piece path — starts hunt if needed, no combat
  const handleTakeMapPiece = useCallback(() => {
    if (!currentTreasure || !player || !locationFloor) return;
    if (!currentTreasure.mapPieceAvailable || currentTreasure.collected) return;
    if (treasureActionLockRef.current) return;
    treasureActionLockRef.current = true;

    setCurrentTreasure((prev) =>
      prev
        ? { ...prev, mapPieceAvailable: false, collected: true }
        : prev,
    );

    let floor = locationFloor;
    if (!floor.treasureHunt?.isActive) {
      floor = initializeTreasureHunt(floor);
      addLog(
        `You take a map fragment — hunt begins! Need ${floor.treasureHunt?.requiredPieces ?? '?'} pieces.`,
        'gain',
      );
    }

    const { floor: withPiece, isComplete } = addMapPiece(floor);
    setLocationFloor(withPiece);
    setCurrentTreasureHunt(withPiece.treasureHunt);

    if (branchingFloor) {
      let bf = branchingFloor;
      if (!bf.treasureHunt?.isActive) bf = initializeTreasureHunt(bf);
      const { floor: bfPiece } = addMapPiece(bf);
      setBranchingFloor(bfPiece);
    }

    addLog('Map piece secured.', 'loot');

    if (isComplete && withPiece.treasureHunt) {
      const reward = getTreasureHuntReward(
        withPiece.treasureHunt.collectedPieces,
        currentLocation?.wealthLevel ?? 4,
        currentDangerLevel,
        difficulty,
        currentLocation?.lootTable,
        region?.lootTheme,
        player.clan,
      );
      setTreasureHuntReward({
        items: reward.items,
        skills: reward.skills,
        ryo: reward.ryo,
        piecesCollected: withPiece.treasureHunt.collectedPieces,
        wealthLevel: currentLocation?.wealthLevel ?? 4,
      });
      setCurrentTreasure(null);
      setGameState(GameState.TREASURE_HUNT_REWARD);
      treasureActionLockRef.current = false;
      return;
    }

    completeTreasureAndReturn();
  }, [
    currentTreasure, player, locationFloor, branchingFloor, currentLocation,
    currentDangerLevel, difficulty, region, addLog, setLocationFloor, setBranchingFloor,
    setCurrentTreasureHunt, setTreasureHuntReward, setCurrentTreasure, setGameState,
    completeTreasureAndReturn,
  ]);

  // Claim one revealed vault option (item / hp / ryo / scroll)
  const handlePickVaultOption = useCallback((index: number, options?: { isFreePick?: boolean }) => {
    if (!currentTreasure || !player) return;
    if (currentTreasure.collected || treasureActionLockRef.current) return;

    const opts = currentTreasure.vaultOptions;
    // Fallback: legacy item choices
    if (!opts || opts.length === 0) {
      if (index < 0 || index >= currentTreasure.choices.length) return;
      // Treat as item pick via choices
    } else {
      if (index < 0 || index >= opts.length) return;
      const face = opts[index];
      if (!face.revealed && !options?.isFreePick) {
        addLog('Unseal that face before claiming it.', 'info');
        return;
      }

      // Non-item rewards: apply immediately (no bag)
      if (face.kind === 'hp' && face.hpAmount) {
        treasureActionLockRef.current = true;
        setCurrentTreasure((prev) =>
          prev && !prev.collected
            ? {
                ...prev,
                collected: true,
                selectedIndex: index,
                vaultOptions: prev.vaultOptions?.map((o, i) =>
                  i === index ? { ...o, revealed: true } : o,
                ),
              }
            : prev,
        );
        const maxHp = playerStats?.derived.maxHp ?? player.currentHp + face.hpAmount;
        const heal = Math.min(face.hpAmount, Math.max(0, maxHp - player.currentHp));
        setPlayer((p) =>
          p
            ? {
                ...p,
                currentHp: Math.min(maxHp, p.currentHp + face.hpAmount!),
              }
            : p,
        );
        addLog(heal > 0 ? `Restored ${heal} HP from the vault.` : 'Already at full HP.', 'gain');
        completeTreasureAndReturn();
        return;
      }

      if (face.kind === 'ryo' && face.ryoAmount) {
        treasureActionLockRef.current = true;
        setCurrentTreasure((prev) =>
          prev && !prev.collected
            ? {
                ...prev,
                collected: true,
                selectedIndex: index,
                vaultOptions: prev.vaultOptions?.map((o, i) =>
                  i === index ? { ...o, revealed: true } : o,
                ),
              }
            : prev,
        );
        const amt = face.ryoAmount;
        setPlayer((p) => (p ? { ...p, ryo: p.ryo + amt } : p));
        addLog(`Claimed ${amt} Ryo from the vault.`, 'loot');
        completeTreasureAndReturn();
        return;
      }

      if (face.kind === 'scroll' && face.skill) {
        treasureActionLockRef.current = true;
        setCurrentTreasure((prev) =>
          prev && !prev.collected
            ? {
                ...prev,
                collected: true,
                selectedIndex: index,
                vaultOptions: prev.vaultOptions?.map((o, i) =>
                  i === index ? { ...o, revealed: true } : o,
                ),
              }
            : prev,
        );
        const skill = face.skill;
        const already = player.skills.some((s) => s.id === skill.id);
        if (already) {
          addLog(`You already know ${skill.name} — the scroll fades.`, 'info');
        } else {
          setPlayer((p) => {
            if (!p) return p;
            const learned = applyLearnSkill(
              p,
              { ...skill, level: skill.level || 1 },
              GameState.TREASURE,
            );
            return learned.refused ? p : learned.player;
          });
          addLog(`Learned ${skill.name} from the vault scroll!`, 'gain');
        }
        completeTreasureAndReturn();
        return;
      }

      // item
      if (face.kind !== 'item' || !face.item) return;
    }

    const selectedItem =
      opts && opts[index]?.item
        ? opts[index].item!
        : currentTreasure.choices[index]?.item;
    if (!selectedItem) return;

    const ryoBonus = currentTreasure.ryoBonus;

    const hasBagSpace = player.bag.some((slot) => slot === null);
    if (!hasBagSpace) {
      if (pendingBagFullItem) return;
      if (options?.isFreePick) {
        setCurrentTreasure((prev) =>
          prev
            ? {
                ...prev,
                vaultOptions: prev.vaultOptions?.map((o, i) =>
                  i === index ? { ...o, revealed: true } : o,
                ),
              }
            : prev,
        );
      }
      setPendingBagFullItem({ item: selectedItem, index });
      return;
    }

    treasureActionLockRef.current = true;
    setCurrentTreasure((prev) =>
      prev && !prev.collected
        ? {
            ...prev,
            collected: true,
            selectedIndex: index,
            vaultOptions: prev.vaultOptions?.map((o, i) =>
              i === index ? { ...o, revealed: true } : o,
            ),
          }
        : prev,
    );

    const granted = player.bag.some((slot) => slot === null)
      ? addToBag(ryoBonus > 0 ? { ...player, ryo: player.ryo + ryoBonus } : player, selectedItem)
      : null;

    if (granted) {
      setPlayer(() => granted);
      if (ryoBonus > 0) {
        addLog(`Found ${ryoBonus} Ryo alongside the treasure!`, 'loot');
      }
      addLog(`${selectedItem.name} added to your bag!`, 'loot');
      completeTreasureAndReturn();
      return;
    }

    setCurrentTreasure((prev) =>
      prev && prev.collected
        ? { ...prev, collected: false, selectedIndex: null }
        : prev,
    );
    treasureActionLockRef.current = false;
    setPendingBagFullItem({ item: selectedItem, index });
    addLog('Bag is full — free a pocket or sell the find.', 'danger');
  }, [
    currentTreasure, player, playerStats, pendingBagFullItem, addLog,
    setPlayer, setPendingBagFullItem, setCurrentTreasure, completeTreasureAndReturn,
  ]);

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
    // Outcome from the RENDERED player — re-checked on the latest
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
  }, [pendingBagFullItem, currentTreasure, player, addLog, setPlayer, setPendingBagFullItem, setCurrentTreasure, completeTreasureAndReturn]);
  // Pick a random vault option (free unseal if sealed, 0 CP cost)
  const handlePickRandom = useCallback(() => {
    if (!currentTreasure || !player || treasureActionLockRef.current) return;
    const opts = currentTreasure.vaultOptions;
    const count = opts?.length || currentTreasure.choices?.length || 0;
    if (count === 0) return;

    const randomIndex = Math.floor(Math.random() * count);

    if (opts && opts[randomIndex] && !opts[randomIndex].revealed) {
      setCurrentTreasure((prev) => {
        if (!prev?.vaultOptions) return prev;
        const next = prev.vaultOptions.map((o, i) =>
          i === randomIndex ? { ...o, revealed: true } : o,
        );
        return { ...prev, vaultOptions: next };
      });
      addLog(`Chosen at random! Free unseal on face ${randomIndex + 1}.`, 'gain');
    } else {
      addLog(`Chosen at random! Claiming face ${randomIndex + 1}.`, 'gain');
    }

    handlePickVaultOption(randomIndex);
  }, [currentTreasure, player, addLog, setCurrentTreasure, handlePickVaultOption]);

  return {
    handleOpenVault,
    handleLeaveVault,
    handleRevealVaultFace,
    handlePickVaultOption,
    handlePickRandom,
    handleTakeMapPiece,
    handleTreasureHuntRewardClaim,
    handleBagFullSell,
    handleBagFullLeave,
    handleBagFullStash,
  };
}
