/**
 * Story flag → combat/loot run modifiers (pure data).
 * Consumed by EventSystem.getEventFlagRunModifiers.
 *
 * damageBonus stacks additively; ryoMultiplier multiplies.
 * anyOfFlags: any flag > 0 activates the rule once (OR).
 */

export interface EventFlagModifierDef {
  flagId: string;
  /** If true, any of these flags counts (OR). Default just flagId. */
  anyOfFlags?: string[];
  damageBonus?: number; // additive
  ryoMultiplier?: number; // multiplicative, default 1 when absent
  label: string; // HUD chip text
}

export const EVENT_FLAG_RUN_MODIFIERS: EventFlagModifierDef[] = [
  { flagId: 'envoy_freed', ryoMultiplier: 1.1, label: 'Envoy bond +10% Ryō' },
  { flagId: 'envoy_debt_settled', damageBonus: 0.05, label: 'Debt settled +5% DMG' },
  { flagId: 'subject_harvested', damageBonus: 0.08, label: 'Harvested power +8% DMG' },
  { flagId: 'subject_freed', ryoMultiplier: 1.05, label: 'Mercy karma +5% Ryō' },
  // One rule: sunken_ship OR hidden_cove → single +5% Ryō (preserve original OR)
  {
    flagId: 'sunken_ship_discovered',
    anyOfFlags: ['sunken_ship_discovered', 'hidden_cove_discovered'],
    ryoMultiplier: 1.05,
    label: 'Secret intel +5% Ryō',
  },
];
