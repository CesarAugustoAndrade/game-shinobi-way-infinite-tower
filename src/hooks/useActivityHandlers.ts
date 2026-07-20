import { useCallback } from 'react';
import {
  Player, Item, Skill, GameState, BranchingRoom, BranchingFloor,
  CharacterStats, PrimaryStat, TrainingIntensity, GameEvent, EventChoice,
  Enemy, Region, LogEntry, TreasureQuality, ApproachType
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
import { ApproachResult } from '../game/systems/ApproachSystem';
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
  merchantDiscount: number;
  trainingData: any;
  scrollDiscoveryData: any;
  eliteChallengeData: any;
  isProcessingLoot: boolean;
  currentIntel: number;
  enemy: Enemy | null;
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
}

export function useActivityHandlers(
  state: ActivityState,
  setters: ActivitySetters,
  deps: ActivityDeps
) {
  const {
    player, playerStats, currentDangerLevel, currentBaseDifficulty, difficulty,
    region, currentLocation, locationFloor, branchingFloor, selectedBranchingRoom,
    merchantDiscount, trainingData, scrollDiscoveryData, eliteChallengeData,
    isProcessingLoot, currentIntel, enemy
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
    eventOutcome, startCombat,
  } = deps;

  /**
   * Buy merchant item into bag.
   * T-055: returns paid price on success so UI can show purchase juice (null on fail).
   */
  const buyItem = useCallback((item: Item): number | null => {
    if (!player || isProcessingLoot) return null;

    // Match Merchant UI: ITEM_PRICE_MULTIPLIER × (1 - discount%)
    const price = Math.floor(
      item.value * MERCHANT.ITEM_PRICE_MULTIPLIER * (1 - merchantDiscount / 100)
    );
    if (player.ryo < price) {
      addLog(`Not enough Ryō! Need ${price}.`, 'danger');
      return null;
    }

    // Add item to bag instead of auto-equipping
    const afterBuy = { ...player, ryo: player.ryo - price };
    const result = { ...afterBuy };
    const emptyIndex = result.bag.findIndex(s => s === null);
    if (emptyIndex === -1) {
      addLog('Bag is full! Equip or sell items to make room.', 'danger');
      return null;
    }
    result.bag = [...result.bag];
    result.bag[emptyIndex] = item;

    setIsProcessingLoot(true);
    setPlayer(result);
    addLog(`Bought ${item.name} for ${price} Ryō. Added to bag.`, 'loot');
    setMerchantItems(prev => prev.filter(i => i.id !== item.id));
    setTimeout(() => setIsProcessingLoot(false), 100);
    return price;
  }, [player, isProcessingLoot, merchantDiscount, addLog, setPlayer, setMerchantItems, setIsProcessingLoot]);

  const leaveMerchant = useCallback(() => {
    // Consume room pointer first so leave cannot double-complete the activity
    const room = selectedBranchingRoom;
    if (!room) return;
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
    } else {
      setGameState(GameState.REGION_MAP);
    }
  }, [branchingFloor, selectedBranchingRoom, locationFloor, region, setBranchingFloor, setLocationFloor, setMerchantItems, setMerchantDiscount, setSelectedBranchingRoom, setGameState, addLog, returnToMapActivityComplete]);

  const handleMerchantReroll = useCallback(() => {
    if (!player || isProcessingLoot) return;
    const cost = calculateMerchantRerollCost(currentDangerLevel, currentBaseDifficulty, MERCHANT.REROLL_BASE_COST, MERCHANT.REROLL_FLOOR_SCALING);
    if (player.ryo < cost) {
      addLog(`Not enough Ryō to reroll! Need ${cost}.`, 'danger');
      return;
    }

    // Gate concurrent rerolls / slot buys (same flag as buyItem)
    setIsProcessingLoot(true);

    let charged = false;
    setPlayer(p => {
      if (!p || p.ryo < cost) return p;
      charged = true;
      return { ...p, ryo: p.ryo - cost };
    });
    if (!charged) {
      setIsProcessingLoot(false);
      return;
    }

    const newItems: Item[] = [];
    const itemCount = player.merchantSlots;
    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
    for (let i = 0; i < itemCount; i++) {
      // T-070: pass location lootTable + region lootTheme for stock bias
      newItems.push(
        generateMerchantItem(
          effectiveFloor,
          difficulty,
          player.treasureQuality,
          currentLocation?.lootTable,
          region?.lootTheme,
        ),
      );
    }
    setMerchantItems(newItems);
    addLog(`Paid ${cost} Ryō to refresh the merchant's inventory.`, 'info');
    setTimeout(() => setIsProcessingLoot(false), 150);
  }, [player, isProcessingLoot, currentDangerLevel, currentBaseDifficulty, difficulty, currentLocation, region, setPlayer, setMerchantItems, setIsProcessingLoot, addLog]);

  const handleBuyMerchantSlot = useCallback(() => {
    if (!player || isProcessingLoot) return;
    if (player.merchantSlots >= MERCHANT.SLOT_COSTS.length) return;
    const cost = MERCHANT.SLOT_COSTS[player.merchantSlots];
    if (player.ryo < cost) {
      addLog(`Not enough Ryō! Need ${cost} to unlock another slot.`, 'danger');
      return;
    }

    setIsProcessingLoot(true);
    let purchased = false;
    let newSlots = player.merchantSlots;
    setPlayer(p => {
      if (!p || p.merchantSlots >= MERCHANT.SLOT_COSTS.length) return p;
      const slotCost = MERCHANT.SLOT_COSTS[p.merchantSlots];
      if (p.ryo < slotCost) return p;
      purchased = true;
      newSlots = p.merchantSlots + 1;
      return { ...p, ryo: p.ryo - slotCost, merchantSlots: newSlots };
    });
    if (!purchased) {
      setIsProcessingLoot(false);
      return;
    }
    addLog(`Paid ${cost} Ryō. Merchants will now show ${newSlots} items!`, 'gain');
    setTimeout(() => setIsProcessingLoot(false), 150);
  }, [player, isProcessingLoot, setPlayer, setIsProcessingLoot, addLog]);

  const handleUpgradeTreasureQuality = useCallback(() => {
    if (!player || isProcessingLoot) return;
    if (player.treasureQuality === TreasureQuality.RARE) return;
    const cost = player.treasureQuality === TreasureQuality.BROKEN
      ? MERCHANT.QUALITY_UPGRADE_COSTS.COMMON
      : MERCHANT.QUALITY_UPGRADE_COSTS.RARE;
    if (player.ryo < cost) {
      addLog(`Not enough Ryō! Need ${cost} to upgrade treasure quality.`, 'danger');
      return;
    }

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
      setIsProcessingLoot(false);
      return;
    }
    addLog(`Paid ${cost} Ryō. Treasure quality upgraded to ${upgraded}!`, 'gain');
    setTimeout(() => setIsProcessingLoot(false), 150);
  }, [player, isProcessingLoot, setPlayer, setIsProcessingLoot, addLog]);

  const handleTrainingComplete = useCallback((stat: PrimaryStat, intensity: TrainingIntensity) => {
    if (!trainingData || !player || !selectedBranchingRoom) return;
    if (!branchingFloor && !region) return;

    const option = trainingData.options.find((o: any) => o.stat === stat);
    if (!option) return;

    const { cost, gain } = option.intensities[intensity];
    const statKey = stat.toLowerCase() as keyof typeof player.primaryStats;

    // Mirror Training UI affordability (must keep >0 HP; chakra fully spendable)
    if (player.currentHp <= cost.hp || player.currentChakra < cost.chakra) {
      addLog('Not enough HP or Chakra for that training intensity.', 'danger');
      return;
    }

    // Consume session after validation — blocks double Continue (multi-stat / multi cost)
    let claimed = false;
    setTrainingData((prev: typeof trainingData) => {
      if (!prev) return null;
      claimed = true;
      return null;
    });
    if (!claimed) return;

    setPlayer(p => {
      if (!p) return null;
      if (p.currentHp <= cost.hp || p.currentChakra < cost.chakra) return p;
      return {
        ...p,
        currentHp: Math.max(1, p.currentHp - cost.hp),
        currentChakra: Math.max(0, p.currentChakra - cost.chakra),
        primaryStats: {
          ...p.primaryStats,
          [statKey]: p.primaryStats[statKey] + gain
        }
      };
    });

    const intensityLabel = intensity.charAt(0).toUpperCase() + intensity.slice(1);
    addLog(`${intensityLabel} training complete! ${stat} +${gain}`, 'gain');

    logActivityComplete(selectedBranchingRoom.id, 'training');
    logStateChange('TRAINING', 'LOCATION_EXPLORE|REGION_MAP', 'training complete');

    if (branchingFloor) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'training');
      setBranchingFloor(updatedFloor);
    }

    let updatedLocationFloor: BranchingFloor | undefined;
    if (locationFloor && region) {
      updatedLocationFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'training');
      setLocationFloor(updatedLocationFloor);
    }

    if (updatedLocationFloor && region?.currentLocationId) {
      returnToMapActivityComplete(updatedLocationFloor);
    } else {
      setSelectedBranchingRoom(null);
      setGameState(GameState.REGION_MAP);
    }
  }, [trainingData, player, selectedBranchingRoom, branchingFloor, region, locationFloor, setPlayer, setBranchingFloor, setLocationFloor, setTrainingData, setSelectedBranchingRoom, setGameState, addLog, returnToMapActivityComplete]);

  const handleTrainingSkip = useCallback(() => {
    // Consume session so skip cannot double-complete the room
    let hadSession = false;
    setTrainingData((prev: typeof trainingData) => {
      if (!prev) return null;
      hadSession = true;
      return null;
    });
    if (!hadSession) return;

    if (branchingFloor && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'training');
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'training');
      setBranchingFloor(updatedFloor);
    }

    let updatedLocationFloor: BranchingFloor | undefined;
    if (locationFloor && region && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'training');
      updatedLocationFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'training');
      setLocationFloor(updatedLocationFloor);
    }

    logStateChange('TRAINING', 'LOCATION_EXPLORE|REGION_MAP', 'training skipped');
    addLog('You decide to skip training for now.', 'info');

    if (updatedLocationFloor && region?.currentLocationId) {
      returnToMapActivityComplete(updatedLocationFloor);
    } else {
      setSelectedBranchingRoom(null);
      setGameState(GameState.REGION_MAP);
    }
  }, [branchingFloor, selectedBranchingRoom, locationFloor, region, setBranchingFloor, setLocationFloor, setTrainingData, setSelectedBranchingRoom, setGameState, addLog, returnToMapActivityComplete]);

  const handleLearnScroll = useCallback((skill: Skill, slotIndex?: number) => {
    if (!scrollDiscoveryData || !player || !selectedBranchingRoom || !playerStats) return;
    if (!branchingFloor && !region) return;

    const chakraCost = scrollDiscoveryData.cost?.chakra || 0;

    if (player.currentChakra < chakraCost) {
      addLog('Not enough chakra to study the scroll!', 'danger');
      return;
    }

    const checkResult = canLearnSkill(
      skill,
      playerStats.effectivePrimary.intelligence,
      player.level,
      player.clan
    );

    if (!checkResult.canLearn) {
      addLog(`Cannot learn ${skill.name}: ${checkResult.reason}`, 'danger');
      return;
    }

    const existingIndex = player.skills.findIndex(s => s.id === skill.id);
    const canUpgrade = existingIndex !== -1;
    const canReplace = slotIndex !== undefined && slotIndex >= 0;
    const canAdd = player.skills.length < 4;
    if (!canUpgrade && !canReplace && !canAdd) {
      addLog('Skill slots full — choose a skill to replace first.', 'danger');
      return;
    }

    // Consume after validation — blocks double Continue (double learn / double chakra)
    let claimed = false;
    setScrollDiscoveryData((prev: typeof scrollDiscoveryData) => {
      if (!prev) return null;
      claimed = true;
      return null;
    });
    if (!claimed) return;

    let updatedPlayer = { ...player, currentChakra: player.currentChakra - chakraCost };

    if (canUpgrade) {
      const existing = updatedPlayer.skills[existingIndex];
      const currentLevel = existing.level || 1;
      const growth = skill.damageMult * 0.2;
      updatedPlayer.skills = [...updatedPlayer.skills];
      updatedPlayer.skills[existingIndex] = {
        ...existing,
        level: currentLevel + 1,
        damageMult: existing.damageMult + growth
      };
      addLog(`Upgraded ${skill.name} to Level ${currentLevel + 1}!`, 'gain');
    } else if (canReplace) {
      const forgotten = updatedPlayer.skills[slotIndex!];
      updatedPlayer.skills = [...updatedPlayer.skills];
      updatedPlayer.skills[slotIndex!] = { ...skill, level: 1 };
      addLog(`Forgot ${forgotten.name} to learn ${skill.name}!`, 'loot');
    } else {
      updatedPlayer.skills = [...updatedPlayer.skills, { ...skill, level: 1 }];
      addLog(`Learned ${skill.name}!`, 'gain');
    }

    setPlayer(updatedPlayer);

    logActivityComplete(selectedBranchingRoom.id, 'scrollDiscovery');
    logStateChange('SCROLL_DISCOVERY', 'LOCATION_EXPLORE|REGION_MAP', 'scroll learned');

    if (branchingFloor) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setBranchingFloor(updatedFloor);
    }

    let updatedLocationFloor: BranchingFloor | undefined;
    if (locationFloor && region) {
      updatedLocationFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setLocationFloor(updatedLocationFloor);
    }

    if (updatedLocationFloor && region?.currentLocationId) {
      returnToMapActivityComplete(updatedLocationFloor);
    } else {
      setSelectedBranchingRoom(null);
      setGameState(GameState.REGION_MAP);
    }
  }, [scrollDiscoveryData, player, selectedBranchingRoom, playerStats, branchingFloor, region, locationFloor, setPlayer, setBranchingFloor, setLocationFloor, setScrollDiscoveryData, setSelectedBranchingRoom, setGameState, addLog, returnToMapActivityComplete]);

  const handleScrollDiscoverySkip = useCallback(() => {
    let hadSession = false;
    setScrollDiscoveryData((prev: typeof scrollDiscoveryData) => {
      if (!prev) return null;
      hadSession = true;
      return null;
    });
    if (!hadSession) return;

    if (branchingFloor && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'scrollDiscovery');
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setBranchingFloor(updatedFloor);
    }

    let updatedLocationFloor: BranchingFloor | undefined;
    if (locationFloor && region && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'scrollDiscovery');
      updatedLocationFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setLocationFloor(updatedLocationFloor);
    }

    logStateChange('SCROLL_DISCOVERY', 'LOCATION_EXPLORE|REGION_MAP', 'scroll skipped');
    addLog('You leave the scrolls behind.', 'info');

    if (updatedLocationFloor && region?.currentLocationId) {
      returnToMapActivityComplete(updatedLocationFloor);
    } else {
      setSelectedBranchingRoom(null);
      setGameState(GameState.REGION_MAP);
    }
  }, [branchingFloor, selectedBranchingRoom, locationFloor, region, setBranchingFloor, setLocationFloor, setScrollDiscoveryData, setSelectedBranchingRoom, setGameState, addLog, returnToMapActivityComplete]);

  const handleEliteFight = useCallback(() => {
    // Consume challenge first — blocks double Fight (double approach / pending artifact)
    const box: { data: typeof eliteChallengeData } = { data: null };
    setEliteChallengeData((prev: typeof eliteChallengeData) => {
      if (!prev) return null;
      box.data = prev;
      return null;
    });
    if (!box.data) return;

    const challenge = box.data;
    logExplorationCheckpoint('Elite Fight chosen', { enemy: challenge.enemy.name, artifact: challenge.artifact.name });
    logModalOpen('ApproachSelector', { source: 'eliteChallenge', enemy: challenge.enemy.name });
    setPendingArtifact(challenge.artifact);
    setSelectedBranchingRoom(challenge.room);
    setShowApproachSelector(true);
    // Map behind ApproachSelector (never EXPLORE — no UI for that state)
    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.REGION_MAP);
    }
  }, [locationFloor, region, setPendingArtifact, setSelectedBranchingRoom, setShowApproachSelector, setEliteChallengeData, setGameState]);

  const handleEliteEscape = useCallback(() => {
    if (!player || !playerStats) return;
    if (!branchingFloor && !locationFloor) return;

    // Consume challenge first — blocks double Escape (double complete / double roll)
    const box: { data: typeof eliteChallengeData } = { data: null };
    setEliteChallengeData((prev: typeof eliteChallengeData) => {
      if (!prev) return null;
      box.data = prev;
      return null;
    });
    if (!box.data) return;

    const challenge = box.data;
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
      logModalOpen('ApproachSelector', { source: 'eliteEscapeFailed', enemy: challenge.enemy.name });
      addLog(result.message, 'danger');
      setPendingArtifact(challenge.artifact);
      setSelectedBranchingRoom(challenge.room);
      setShowApproachSelector(true);
      if (locationFloor && region && region.currentLocationId) {
        setGameState(GameState.LOCATION_EXPLORE);
      } else {
        setGameState(GameState.REGION_MAP);
      }
    }
  }, [player, playerStats, branchingFloor, locationFloor, region, setBranchingFloor, setLocationFloor, setEliteChallengeData, setGameState, addLog, setPendingArtifact, setSelectedBranchingRoom, setShowApproachSelector, returnToMapActivityComplete]);

  const handleEventChoice = useCallback((choice: EventChoice) => {
    if (!player || !playerStats) return;
    // Outcome already open — ignore re-clicks on event choices
    if (eventOutcome) return;

    const result = resolveEventChoice(player, choice, playerStats);

    if (!result.success) {
      addLog(result.message, 'danger');
      return;
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
            addLog(`Secret location revealed: ${name}!`, 'gain');
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
      const combatDangerLevel = combatConfig.floor
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
      const combatEnemy = generateEnemy(
        combatDangerLevel,
        player?.locationsCleared ?? 0,
        enemyType,
        combatConfig.difficulty || difficulty,
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

      if (locationFloor && region) {
        if (currentRoom) {
          logActivityComplete(currentRoom.id, 'event');
          const updatedFloor = completeActivity(locationFloor, currentRoom.id, 'event');
          setLocationFloor(updatedFloor);
        }
      } else if (branchingFloor) {
        if (currentRoom) {
          logActivityComplete(currentRoom.id, 'event');
          const updatedFloor = completeActivity(branchingFloor, currentRoom.id, 'event');
          setBranchingFloor(updatedFloor);
        }
      }

      // T-063/T-070: location terrain for manual + auto event combat
      const eventLocMods = getLocationTerrainMods(currentLocation?.terrainEffects);
      const combatTerrain = currentRoom ? TERRAIN_DEFINITIONS[currentRoom.terrain] : undefined;

      if (FeatureFlags.ENABLE_MANUAL_COMBAT) {
        // Event combat has no pre-fight approach, so hand a neutral FRONTAL_ASSAULT
        // result (no buffs/debuffs, 1.0 multipliers) to the single combat-start
        // entry point. startCombat seeds the T-004 deck from the player's skills,
        // draws the opening hand and fills AP — the previous inline setEnemy/
        // setGameState path left combatState null, so the fight opened with AP 0/0
        // and an empty hand.
        const neutralResult: ApproachResult = {
          approach: ApproachType.FRONTAL_ASSAULT,
          success: true,
          successChance: 100,
          roll: 0,
          skipCombat: false,
          guaranteedFirst: false,
          initiativeBonus: 0,
          firstHitMultiplier: 1.0,
          enemyHpReduction: 0,
          playerBuffs: [],
          enemyDebuffs: [],
          chakraCost: 0,
          hpCost: 0,
          xpMultiplier: 1.0,
          description: '',
        };
        setActiveEvent(null);
        startCombat(
          combatEnemy,
          neutralResult,
          postEventPlayer,
          combatTerrain,
          eventLocMods,
          // T-102: event fights use current room combat modifiers if any
          currentRoom?.activities.combat?.modifiers,
        );
      } else {
        addLog(`Engaging ${combatEnemy.name} from event...`, 'info');
        const simResult = simulateGameCombat(
          player,
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
      return;
    }

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
        });
        setActiveEvent(null);
        setGameState(GameState.LOCATION_EXPLORE);
        return;
      }
      // Legacy branching explorer has no result panel — hop directly.
      const nextEvent = EVENTS.find(e => e.id === result.nextEventId);
      if (nextEvent) {
        setCameFromChain(true);
        setActiveEvent(nextEvent);
        setGameState(GameState.EVENT);
        return;
      }
    }

    if (result.outcome) {
      setEventOutcome({
        message: result.message || 'Choice resolved.',
        outcome: result.outcome,
        logType: logType as 'gain' | 'danger' | 'info' | 'loot',
        changes: outcomeChanges,
      });
    }

    setActiveEvent(null);
    if (inLocationMode) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.REGION_MAP);
    }
  }, [player, playerStats, currentDangerLevel, difficulty, region, locationFloor, branchingFloor, eventOutcome, setPlayer, setRegion, setLocationFloor, setBranchingFloor, setActiveEvent, setGameState, setEventOutcome, setCameFromChain, addLog, checkLevelUp, handleCombatVictory, startCombat]);

  const handleEventOutcomeClose = useCallback(() => {
    logModalClose('EventOutcomeModal');

    // Consume outcome first — blocks double Continue (double intel / double complete)
    let outcome: typeof eventOutcome = null;
    setEventOutcome((prev: typeof eventOutcome) => {
      if (!prev) return null;
      outcome = prev;
      return null;
    });
    if (!outcome) return;

    // T-011: chain continues the story without completing the room / granting intel
    if (outcome.nextEventId) {
      const nextEvent = EVENTS.find(e => e.id === outcome.nextEventId);
      if (nextEvent) {
        setCameFromChain(true);
        setActiveEvent(nextEvent);
        setGameState(GameState.EVENT);
        return;
      }
    }

    // Terminal link: the chain (if any) is over — clear the chain flag.
    setCameFromChain(false);

    if (branchingFloor) {
      const currentRoom = getCurrentRoom(branchingFloor);
      if (currentRoom) {
        logActivityComplete(currentRoom.id, 'event');
        const updatedFloor = completeActivity(branchingFloor, currentRoom.id, 'event');
        setBranchingFloor(updatedFloor);
      }
    }

    if (locationFloor && region) {
      const currentRoom = getCurrentRoom(locationFloor);
      if (currentRoom) {
        logActivityComplete(currentRoom.id, 'event');
        const updatedFloor = completeActivity(locationFloor, currentRoom.id, 'event');
        setLocationFloor(updatedFloor);

        // T-068: fog/visibility_penalty scales event intel (parity combat/infoGather)
        const baseEventIntel =
          outcome.outcome?.effects?.intelGain ?? INTEL_GAIN.EVENT_DEFAULT;
        const eventIntelGain = applyVisibilityToIntelGain(
          baseEventIntel,
          getLocationTerrainMods(currentLocation?.terrainEffects),
        );
        const nextIntel = Math.min(100, currentIntel + eventIntelGain);
        setCurrentIntel(nextIntel);
        logIntelGain('Event', eventIntelGain, nextIntel);

        // Pass fresh floor + intel so location-complete redraw is not stale
        returnToMapActivityComplete(updatedFloor, { intel: nextIntel });
      }
    }
  }, [
    branchingFloor, locationFloor, region, currentLocation, currentIntel,
    setBranchingFloor, setLocationFloor, setCurrentIntel, setEventOutcome,
    setCameFromChain, setActiveEvent, setGameState, returnToMapActivityComplete,
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
    handleScrollDiscoverySkip,
    handleEliteFight,
    handleEliteEscape,
    handleEventChoice,
    handleEventOutcomeClose
  };
}
