/**
 * TreasureHuntSystem — pure treasure-map hunt helpers
 *
 * Map pieces, hunt lifecycle, and completion rewards.
 * Zero React/DOM.
 */

import {
  BranchingFloor,
  Item,
  Player,
  TreasureHunt,
  TreasureQuality,
} from '../types';
import { LaunchProperties } from '../../config/featureFlags';
import {
  generateComponentByQuality,
  generateRandomArtifact,
  generateSkillForFloor,
} from './LootSystem';

/**
 * Get required map pieces for treasure hunt based on danger level.
 */
export function getRequiredMapPieces(dangerLevel: number): number {
  const pieces = LaunchProperties.TREASURE_MAP_PIECES;
  if (dangerLevel <= 2) return pieces.lowDanger;
  if (dangerLevel <= 4) return pieces.midDanger;
  return pieces.highDanger;
}

/**
 * Initialize a treasure hunt for a location.
 * Called when first treasure room is encountered and player chooses to start hunt.
 */
export function initializeTreasureHunt(
  floor: BranchingFloor
): BranchingFloor {
  const treasureHunt: TreasureHunt = {
    isActive: true,
    requiredPieces: getRequiredMapPieces(floor.dangerLevel),
    collectedPieces: 0,
  };

  return {
    ...floor,
    treasureHunt,
  };
}

/**
 * Add a map piece to the treasure hunt.
 * Returns updated floor and whether the map is now complete.
 */
export function addMapPiece(
  floor: BranchingFloor
): { floor: BranchingFloor; isComplete: boolean } {
  if (!floor.treasureHunt) {
    return { floor, isComplete: false };
  }

  const newPieces = floor.treasureHunt.collectedPieces + 1;
  const isComplete = newPieces >= floor.treasureHunt.requiredPieces;

  return {
    floor: {
      ...floor,
      treasureHunt: {
        ...floor.treasureHunt,
        collectedPieces: newPieces,
        isActive: !isComplete, // Deactivate when complete
      },
    },
    isComplete,
  };
}

/**
 * Get treasure hunt completion reward based on pieces collected and wealth level.
 */
export function getTreasureHuntReward(
  pieces: number,
  wealthLevel: number,
  floor: number,
  difficulty: number,
  /** T-072: location/region loot bias for component rewards */
  lootTable?: string,
  lootTheme?: import('../types').RegionLootTheme,
  clan?: Player['clan'],
): { items: Item[]; skills: import('../types').Skill[]; ryo: number } {
  const items: Item[] = [];
  const skills: import('../types').Skill[] = [];
  let ryo = 0;
  const genComp = (q: TreasureQuality) =>
    generateComponentByQuality(floor, difficulty, q, lootTable, lootTheme);
  const genSkill = () => generateSkillForFloor(floor, lootTheme, clan);

  // Reward matrix based on pieces and wealth
  if (pieces === 2) {
    if (wealthLevel <= 2) {
      items.push(genComp(TreasureQuality.COMMON));
      ryo = 100;
    } else if (wealthLevel <= 4) {
      items.push(genComp(TreasureQuality.RARE));
      ryo = 150;
    } else if (wealthLevel <= 6) {
      // T-114: themed skill rewards (same as scroll discovery)
      skills.push(genSkill());
    } else {
      items.push(generateRandomArtifact(floor, difficulty));
    }
  } else if (pieces === 3) {
    if (wealthLevel <= 2) {
      items.push(genComp(TreasureQuality.RARE));
      ryo = 150;
    } else if (wealthLevel <= 4) {
      skills.push(genSkill());
      ryo = 200;
    } else if (wealthLevel <= 6) {
      items.push(generateRandomArtifact(floor, difficulty));
    } else {
      items.push(generateRandomArtifact(floor, difficulty));
      skills.push(genSkill());
    }
  } else if (pieces >= 4) {
    if (wealthLevel <= 2) {
      skills.push(genSkill());
      ryo = 200;
    } else if (wealthLevel <= 4) {
      items.push(generateRandomArtifact(floor, difficulty));
    } else if (wealthLevel <= 6) {
      items.push(generateRandomArtifact(floor, difficulty));
      ryo = 300;
    } else {
      items.push(generateRandomArtifact(floor, difficulty));
      skills.push(genSkill());
      ryo = 500;
    }
  }

  return { items, skills, ryo };
}
