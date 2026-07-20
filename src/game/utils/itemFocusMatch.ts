/**
 * T-091/T-092: pure helpers for region equipmentFocus display cues.
 * Matches item.stats keys against lootTheme.equipmentFocus (case-insensitive).
 */

import type { Item } from '../types';

/** True if any non-zero item.stats key is in the focus list. */
export function itemMatchesEquipmentFocus(
  item: Item,
  focus: string[] | null | undefined,
): boolean {
  if (!focus || focus.length === 0) return false;
  const set = new Set(focus.map((s) => s.toLowerCase()));
  return Object.entries(item.stats || {}).some(
    ([key, val]) => typeof val === 'number' && val !== 0 && set.has(key.toLowerCase()),
  );
}

/** True if this stat key is a region Focus stat. */
export function isFocusStat(
  statKey: string,
  focus: string[] | null | undefined,
): boolean {
  if (!focus || focus.length === 0) return false;
  return focus.some((s) => s.toLowerCase() === statKey.toLowerCase());
}
