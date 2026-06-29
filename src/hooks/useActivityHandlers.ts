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
import { generateEnemy } from '../game/systems/EnemySystem';
import { generateLoot } from '../game/systems/LootSystem';
import { simulateGameCombat } from '../game/systems/CombatSimulationService';
import { canLearnSkill } from '../game/systems/StatSystem';
import { ApproachResult } from '../game/systems/ApproachSystem';
import { TERRAIN_DEFINITIONS } from '../game/constants/terrain';
import { MERCHANT } from '../game/config';
import { FeatureFlags, LaunchProperties } from '../config/featureFlags';
import { logActivityComplete, logStateChange, logExplorationCheckpoint, logModalOpen, logModalClose, logIntelGain } from '../game/utils/explorationDebug';
import { INTEL_GAIN } from '../game/systems/RegionSystem';

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
}

export interface ActivityDeps {
  addLog: (text: string, type?: LogEntry['type']) => void;
  checkLevelUp: (p: Player) => any;
  handleCombatVictory: (defeatedEnemy: Enemy, combatStateAtVictory: any) => void;
  returnToMap: () => void;
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
    terrain: any
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
    setEventOutcome, setIsProcessingLoot
  } = setters;

  const { addLog, checkLevelUp, handleCombatVictory, returnToMap, eventOutcome, startCombat } = deps;

  const buyItem = useCallback((item: Item) => {
    if (!player || isProcessingLoot) return;

    const price = Math.floor(item.value * (1 - merchantDiscount / 100));
    if (player.ryo < price) {
      addLog(`Not enough Ryō! Need ${price}.`, 'danger');
      return;
    }

    // Add item to bag instead of auto-equipping
    const afterBuy = { ...player, ryo: player.ryo - price };
    const result = { ...afterBuy };
    const emptyIndex = result.bag.findIndex(s => s === null);
    if (emptyIndex === -1) {
      addLog('Bag is full! Equip or sell items to make room.', 'danger');
      return;
    }
    result.bag = [...result.bag];
    result.bag[emptyIndex] = item;

    setIsProcessingLoot(true);
    setPlayer(result);
    addLog(`Bought ${item.name} for ${price} Ryō. Added to bag.`, 'loot');
    setMerchantItems(prev => prev.filter(i => i.id !== item.id));
    setTimeout(() => setIsProcessingLoot(false), 100);
  }, [player, isProcessingLoot, merchantDiscount, addLog, setPlayer, setMerchantItems, setIsProcessingLoot]);

  const leaveMerchant = useCallback(() => {
    if (branchingFloor && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'merchant');
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'merchant');
      setBranchingFloor(updatedFloor);
    }

    if (locationFloor && region && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'merchant');
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'merchant');
      setLocationFloor(updatedFloor);
    }

    logStateChange('MERCHANT', 'EXPLORE', 'left merchant');
    setMerchantItems([]);
    setMerchantDiscount(0);
    setSelectedBranchingRoom(null);

    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
    addLog('The merchant waves goodbye.', 'info');
  }, [branchingFloor, selectedBranchingRoom, locationFloor, region, setBranchingFloor, setLocationFloor, setMerchantItems, setMerchantDiscount, setSelectedBranchingRoom, setGameState, addLog]);

  const handleMerchantReroll = useCallback(() => {
    if (!player) return;
    const cost = calculateMerchantRerollCost(currentDangerLevel, currentBaseDifficulty, MERCHANT.REROLL_BASE_COST, MERCHANT.REROLL_FLOOR_SCALING);
    if (player.ryo < cost) {
      addLog(`Not enough Ryō to reroll! Need ${cost}.`, 'danger');
      return;
    }
    setPlayer(p => p ? { ...p, ryo: p.ryo - cost } : null);
    const newItems: Item[] = [];
    const itemCount = player.merchantSlots;
    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
    for (let i = 0; i < itemCount; i++) {
      newItems.push(generateLoot(effectiveFloor, difficulty));
    }
    setMerchantItems(newItems);
    addLog(`Paid ${cost} Ryō to refresh the merchant's inventory.`, 'info');
  }, [player, currentDangerLevel, currentBaseDifficulty, difficulty, setPlayer, setMerchantItems, addLog]);

  const handleBuyMerchantSlot = useCallback(() => {
    if (!player || player.merchantSlots >= MERCHANT.SLOT_COSTS.length) return;
    const cost = MERCHANT.SLOT_COSTS[player.merchantSlots];
    if (player.ryo < cost) {
      addLog(`Not enough Ryō! Need ${cost} to unlock another slot.`, 'danger');
      return;
    }
    setPlayer(p => {
      if (!p) return null;
      return { ...p, ryo: p.ryo - cost, merchantSlots: p.merchantSlots + 1 };
    });
    addLog(`Paid ${cost} Ryō. Merchants will now show ${player.merchantSlots + 1} items!`, 'gain');
  }, [player, setPlayer, addLog]);

  const handleUpgradeTreasureQuality = useCallback(() => {
    if (!player || player.treasureQuality === TreasureQuality.RARE) return;
    const cost = player.treasureQuality === TreasureQuality.BROKEN
      ? MERCHANT.QUALITY_UPGRADE_COSTS.COMMON
      : MERCHANT.QUALITY_UPGRADE_COSTS.RARE;
    if (player.ryo < cost) {
      addLog(`Not enough Ryō! Need ${cost} to upgrade treasure quality.`, 'danger');
      return;
    }
    const newQuality = player.treasureQuality === TreasureQuality.BROKEN
      ? TreasureQuality.COMMON
      : TreasureQuality.RARE;
    setPlayer(p => {
      if (!p) return null;
      return { ...p, ryo: p.ryo - cost, treasureQuality: newQuality };
    });
    addLog(`Paid ${cost} Ryō. Treasure quality upgraded to ${newQuality}!`, 'gain');
  }, [player, setPlayer, addLog]);

  const handleTrainingComplete = useCallback((stat: PrimaryStat, intensity: TrainingIntensity) => {
    if (!trainingData || !player || !selectedBranchingRoom) return;
    if (!branchingFloor && !region) return;

    const option = trainingData.options.find((o: any) => o.stat === stat);
    if (!option) return;

    const { cost, gain } = option.intensities[intensity];
    const statKey = stat.toLowerCase() as keyof typeof player.primaryStats;

    setPlayer(p => {
      if (!p) return null;
      return {
        ...p,
        currentHp: p.currentHp - cost.hp,
        currentChakra: p.currentChakra - cost.chakra,
        primaryStats: {
          ...p.primaryStats,
          [statKey]: p.primaryStats[statKey] + gain
        }
      };
    });

    const intensityLabel = intensity.charAt(0).toUpperCase() + intensity.slice(1);
    addLog(`${intensityLabel} training complete! ${stat} +${gain}`, 'gain');

    logActivityComplete(selectedBranchingRoom.id, 'training');
    logStateChange('TRAINING', 'EXPLORE', 'training complete');

    if (branchingFloor) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'training');
      setBranchingFloor(updatedFloor);
    }

    if (locationFloor && region) {
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'training');
      setLocationFloor(updatedFloor);
    }

    setTrainingData(null);
    setSelectedBranchingRoom(null);

    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
  }, [trainingData, player, selectedBranchingRoom, branchingFloor, region, locationFloor, setPlayer, setBranchingFloor, setLocationFloor, setTrainingData, setSelectedBranchingRoom, setGameState, addLog]);

  const handleTrainingSkip = useCallback(() => {
    if (branchingFloor && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'training');
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'training');
      setBranchingFloor(updatedFloor);
    }

    if (locationFloor && region && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'training');
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'training');
      setLocationFloor(updatedFloor);
    }

    logStateChange('TRAINING', 'EXPLORE', 'training skipped');
    setTrainingData(null);
    setSelectedBranchingRoom(null);

    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
    addLog('You decide to skip training for now.', 'info');
  }, [branchingFloor, selectedBranchingRoom, locationFloor, region, setBranchingFloor, setLocationFloor, setTrainingData, setSelectedBranchingRoom, setGameState, addLog]);

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

    let updatedPlayer = { ...player, currentChakra: player.currentChakra - chakraCost };
    const existingIndex = updatedPlayer.skills.findIndex(s => s.id === skill.id);

    if (existingIndex !== -1) {
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
    } else if (slotIndex !== undefined) {
      const forgotten = updatedPlayer.skills[slotIndex];
      updatedPlayer.skills = [...updatedPlayer.skills];
      updatedPlayer.skills[slotIndex] = { ...skill, level: 1 };
      addLog(`Forgot ${forgotten.name} to learn ${skill.name}!`, 'loot');
    } else if (updatedPlayer.skills.length < 4) {
      updatedPlayer.skills = [...updatedPlayer.skills, { ...skill, level: 1 }];
      addLog(`Learned ${skill.name}!`, 'gain');
    } else {
      return;
    }

    setPlayer(updatedPlayer);

    logActivityComplete(selectedBranchingRoom.id, 'scrollDiscovery');
    logStateChange('SCROLL_DISCOVERY', 'EXPLORE', 'scroll learned');

    if (branchingFloor) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setBranchingFloor(updatedFloor);
    }

    if (locationFloor && region) {
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setLocationFloor(updatedFloor);
    }

    setScrollDiscoveryData(null);
    setSelectedBranchingRoom(null);

    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
  }, [scrollDiscoveryData, player, selectedBranchingRoom, playerStats, branchingFloor, region, locationFloor, setPlayer, setBranchingFloor, setLocationFloor, setScrollDiscoveryData, setSelectedBranchingRoom, setGameState, addLog]);

  const handleScrollDiscoverySkip = useCallback(() => {
    if (branchingFloor && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'scrollDiscovery');
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setBranchingFloor(updatedFloor);
    }

    if (locationFloor && region && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'scrollDiscovery');
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setLocationFloor(updatedFloor);
    }

    logStateChange('SCROLL_DISCOVERY', 'EXPLORE', 'scroll skipped');
    setScrollDiscoveryData(null);
    setSelectedBranchingRoom(null);

    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
    addLog('You leave the scrolls behind.', 'info');
  }, [branchingFloor, selectedBranchingRoom, locationFloor, region, setBranchingFloor, setLocationFloor, setScrollDiscoveryData, setSelectedBranchingRoom, setGameState, addLog]);

  const handleEliteFight = useCallback(() => {
    if (!eliteChallengeData) return;
    logExplorationCheckpoint('Elite Fight chosen', { enemy: eliteChallengeData.enemy.name, artifact: eliteChallengeData.artifact.name });
    logModalOpen('ApproachSelector', { source: 'eliteChallenge', enemy: eliteChallengeData.enemy.name });
    setPendingArtifact(eliteChallengeData.artifact);
    setSelectedBranchingRoom(eliteChallengeData.room);
    setShowApproachSelector(true);
    setEliteChallengeData(null);
    setGameState(GameState.EXPLORE);
  }, [eliteChallengeData, setPendingArtifact, setSelectedBranchingRoom, setShowApproachSelector, setEliteChallengeData, setGameState]);

  const handleEliteEscape = useCallback(() => {
    if (!eliteChallengeData || !player || !playerStats) return;
    if (!branchingFloor && !locationFloor) return;

    const result = attemptEliteEscape(player, playerStats, eliteChallengeData.enemy);
    logExplorationCheckpoint('Elite Escape attempt', { success: result.success, roll: result.roll, chance: result.chance });

    if (result.success) {
      logActivityComplete(eliteChallengeData.room.id, 'eliteChallenge');

      if (branchingFloor) {
        const updatedFloor = completeActivity(branchingFloor, eliteChallengeData.room.id, 'eliteChallenge');
        setBranchingFloor(updatedFloor);
        addLog(result.message, 'info');
        setEliteChallengeData(null);
        setGameState(GameState.EXPLORE);
        return;
      }

      if (locationFloor && region) {
        const updatedFloor = completeActivity(locationFloor, eliteChallengeData.room.id, 'eliteChallenge');
        setLocationFloor(updatedFloor);
        addLog(result.message, 'info');
        setEliteChallengeData(null);
        setGameState(GameState.LOCATION_EXPLORE);
        return;
      }

      addLog(result.message, 'info');
      setEliteChallengeData(null);
      if (locationFloor && region && region.currentLocationId) {
        setGameState(GameState.LOCATION_EXPLORE);
      } else {
        setGameState(GameState.EXPLORE);
      }
    } else {
      logExplorationCheckpoint('Elite Escape failed - must fight');
      logModalOpen('ApproachSelector', { source: 'eliteEscapeFailed', enemy: eliteChallengeData.enemy.name });
      addLog(result.message, 'danger');
      setPendingArtifact(eliteChallengeData.artifact);
      setSelectedBranchingRoom(eliteChallengeData.room);
      setShowApproachSelector(true);
      setEliteChallengeData(null);
      if (locationFloor && region && region.currentLocationId) {
        setGameState(GameState.LOCATION_EXPLORE);
      } else {
        setGameState(GameState.EXPLORE);
      }
    }
  }, [eliteChallengeData, player, playerStats, branchingFloor, locationFloor, region, setBranchingFloor, setLocationFloor, setEliteChallengeData, setGameState, addLog, setPendingArtifact, setSelectedBranchingRoom, setShowApproachSelector]);

  const handleEventChoice = useCallback((choice: EventChoice) => {
    if (!player || !playerStats) return;

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
    }

    const logType = result.outcome?.effects.logType || (
      result.outcome?.effects.hpChange &&
      (typeof result.outcome.effects.hpChange === 'number' ? result.outcome.effects.hpChange < 0 : result.outcome.effects.hpChange.percent < 0)
        ? 'danger' : 'gain'
    );

    addLog(result.message || 'Choice resolved.', logType);

    if (result.triggerCombat && result.outcome?.effects.triggerCombat) {
      const combatConfig = result.outcome.effects.triggerCombat;
      const combatDangerLevel = combatConfig.floor
        ? Math.min(7, Math.max(1, Math.ceil(combatConfig.floor / 3)))
        : currentDangerLevel;
      const combatEnemy = generateEnemy(
        combatDangerLevel,
        player?.locationsCleared ?? 0,
        combatConfig.archetype as 'NORMAL' | 'ELITE' | 'BOSS' || 'NORMAL',
        combatConfig.difficulty || difficulty,
        region?.arc ?? 'WAVES_ARC'
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
        const combatTerrain = currentRoom ? TERRAIN_DEFINITIONS[currentRoom.terrain] : undefined;
        setActiveEvent(null);
        startCombat(combatEnemy, neutralResult, postEventPlayer, combatTerrain);
      } else {
        addLog(`Engaging ${combatEnemy.name} from event...`, 'info');
        const simResult = simulateGameCombat(player, playerStats, combatEnemy, undefined, currentRoom?.terrain);

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

    if (result.outcome) {
      setEventOutcome({
        message: result.message || 'Choice resolved.',
        outcome: result.outcome,
        logType: logType as 'gain' | 'danger' | 'info' | 'loot'
      });
    }

    setActiveEvent(null);
    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
  }, [player, playerStats, currentDangerLevel, difficulty, region, locationFloor, branchingFloor, setPlayer, setLocationFloor, setBranchingFloor, setActiveEvent, setGameState, setEventOutcome, addLog, checkLevelUp, handleCombatVictory, startCombat]);

  const handleEventOutcomeClose = useCallback(() => {
    logModalClose('EventOutcomeModal');
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

        const eventIntelGain = eventOutcome?.outcome?.effects?.intelGain ?? INTEL_GAIN.EVENT_DEFAULT;
        setCurrentIntel(prev => Math.min(100, prev + eventIntelGain));
        logIntelGain('Event', eventIntelGain, Math.min(100, currentIntel + eventIntelGain));
      }
    }

    setEventOutcome(null);
  }, [branchingFloor, locationFloor, region, eventOutcome, currentIntel, setBranchingFloor, setLocationFloor, setCurrentIntel, setEventOutcome]);

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
