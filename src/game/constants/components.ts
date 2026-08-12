/**
 * Component Definitions for the Ninja Tool Synthesis System
 *
 * Components are basic crafting materials that can be combined to create artifacts.
 * Each component provides a primary stat bonus and has unique thematic flavor.
 */

import { ComponentId, PrimaryAttributes } from '../types';

export interface ComponentDefinition {
  name: string;
  icon: string;
  primaryStat: keyof PrimaryAttributes;
  baseValue: number;
  description: string;
}

/**
 * All component definitions with their stats and flavor text
 */
export const COMPONENT_DEFINITIONS: Record<ComponentId, ComponentDefinition> = {
  [ComponentId.NINJA_STEEL]: {
    name: 'Ninja Steel',
    icon: '⚔️',
    primaryStat: 'strength',
    baseValue: 1,
    description: 'Chakra-conductive metal forged in the Land of Iron.',
  },
  [ComponentId.SPIRIT_TAG]: {
    name: 'Spirit Tag',
    icon: '📜',
    primaryStat: 'spirit',
    baseValue: 1,
    description: 'Blessed ofuda paper channeling spiritual energy.',
  },
  [ComponentId.CHAKRA_PILL]: {
    name: 'Chakra Pill',
    icon: '💊',
    primaryStat: 'chakra',
    baseValue: 1,
    description: 'Military ration pill that boosts chakra reserves.',
  },
  [ComponentId.IRON_SAND]: {
    name: 'Iron Sand',
    icon: '🛡️',
    primaryStat: 'willpower',
    baseValue: 1,
    description: "Magnetic sand from the Third Kazekage's technique.",
  },
  [ComponentId.ANBU_MASK]: {
    name: 'ANBU Mask',
    icon: '🎭',
    primaryStat: 'calmness',
    baseValue: 1,
    description: 'Porcelain mask that suppresses emotional response.',
  },
  [ComponentId.TRAINING_WEIGHTS]: {
    name: 'Training Weights',
    icon: '🏋️',
    primaryStat: 'dexterity',
    baseValue: 1,
    description: 'Heavy ankle weights favored by taijutsu specialists.',
  },
  [ComponentId.SWIFT_SANDALS]: {
    name: 'Swift Sandals',
    icon: '👟',
    primaryStat: 'speed',
    baseValue: 1,
    description: 'Lightweight shinobi footwear with chakra-grip soles.',
  },
  [ComponentId.TACTICAL_SCROLL]: {
    name: 'Tactical Scroll',
    icon: '🧠',
    primaryStat: 'intelligence',
    baseValue: 1,
    description: 'Strategic analysis scrolls from Konoha Intelligence.',
  },
  [ComponentId.HASHIRAMA_CELL]: {
    name: 'Hashirama Cell',
    icon: '🧬',
    primaryStat: 'willpower',
    baseValue: 1,
    description: 'Living cells of the First Hokage. Grants forbidden power.',
  },
};

/**
 * Drop weights for component generation
 * Hashirama Cell = 0 (special event only, never drops from normal enemies)
 */
export const COMPONENT_DROP_WEIGHTS: Record<ComponentId, number> = {
  [ComponentId.NINJA_STEEL]: 15,
  [ComponentId.SPIRIT_TAG]: 15,
  [ComponentId.CHAKRA_PILL]: 15,
  [ComponentId.IRON_SAND]: 12,
  [ComponentId.ANBU_MASK]: 12,
  [ComponentId.TRAINING_WEIGHTS]: 12,
  [ComponentId.SWIFT_SANDALS]: 12,
  [ComponentId.TACTICAL_SCROLL]: 12,
  [ComponentId.HASHIRAMA_CELL]: 0, // SPECIAL EVENT ONLY - never drops normally
};

/**
 * Get the total weight of all droppable components (excludes Hashirama Cell)
 */
export const getTotalDropWeight = (): number => {
  return Object.values(COMPONENT_DROP_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
};

/**
 * Get a component definition by ID
 */
export const getComponentDefinition = (id: ComponentId): ComponentDefinition => {
  return COMPONENT_DEFINITIONS[id];
};
