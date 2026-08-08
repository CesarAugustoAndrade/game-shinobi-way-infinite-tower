/**
 * Inventory / merchant / disassemble runtime limits (Sprint C).
 * No imports from types/config barrels — avoids circular deps with types re-exports.
 */
import { LaunchProperties } from '../config/featureFlags';

// Synthesis / bag — controlled by LaunchProperties
export const MAX_BAG_SLOTS = LaunchProperties.MAX_BAG_SIZE;
export const DISASSEMBLE_RETURN_RATE = 0.5; // 50% value return when breaking artifacts

// Merchant slot system
export const DEFAULT_MERCHANT_SLOTS = 1;
export const MAX_MERCHANT_SLOTS = 4;

/**
 * Default treasure quality (matches TreasureQuality.BROKEN = 'Broken').
 * Typed via import() type query so we do not runtime-import types.ts (cycle-safe).
 */
export const DEFAULT_TREASURE_QUALITY = 'Broken' as import('./types').TreasureQuality;
