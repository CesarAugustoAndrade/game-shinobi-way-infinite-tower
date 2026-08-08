/**
 * Equipment Focus system removed — functions return false to disable focus highlights.
 */

import type { Item } from '../types';

/** True if any non-zero item.stats key is in the focus list. Always false (system removed). */
export function itemMatchesEquipmentFocus(
  _item: Item,
  _focus: string[] | null | undefined,
): boolean {
  return false;
}

/** True if this stat key is a region Focus stat. Always false (system removed). */
export function isFocusStat(
  _statKey: string,
  _focus: string[] | null | undefined,
): boolean {
  return false;
}
