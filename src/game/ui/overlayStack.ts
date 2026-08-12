/**
 * Overlay / modal stack helpers for explore chrome.
 * Pure flags first — avoids document.querySelector for known App state modals.
 */

export type OverlayKind =
  | 'reward'
  | 'event-result'
  | 'loc-complete'
  | 'intel-result'
  | 'rest-result'
  | 'approach'
  | 'confirm'
  | 'explore-bag'
  | 'explore-character'
  | 'dialog'; // generic role=dialog

export interface OverlayStackState {
  /** ordered ids currently open (top = last) */
  stack: string[];
}

/** App-owned modal flags that block bag / character / approach HUD + A/I/C keys. */
export interface ExploreChromeBlockFlags {
  showApproachSelector: boolean;
  combatReward: boolean;
  intelResult: boolean;
  restResult: boolean;
  eventOutcome: boolean;
  locationCompleteResult: boolean;
}

/**
 * True when a higher result/approach modal owns the screen.
 * Prefer this over DOM query when App already holds the React state.
 */
export function isBlockingExploreChrome(flags: ExploreChromeBlockFlags): boolean {
  return (
    flags.combatReward ||
    flags.eventOutcome ||
    flags.intelResult ||
    flags.restResult ||
    flags.locationCompleteResult ||
    flags.showApproachSelector
  );
}

/**
 * DOM fallback for modals not yet represented as App flags
 * (e.g. nested confirm, third-party dialog). Prefer flags when available.
 */
export const BLOCKING_MODAL_SELECTOR =
  '[role="dialog"][aria-modal="true"]:not(.explore-overlay), .reward-modal, .event-result, .loc-complete, .intel-result, .rest-result, .approach-modal, .confirm-modal';

export function queryBlockingModal(
  root: ParentNode = typeof document !== 'undefined' ? document : (null as unknown as ParentNode),
): Element | null {
  if (!root || typeof (root as Document).querySelector !== 'function') return null;
  return (root as Document).querySelector(BLOCKING_MODAL_SELECTOR);
}
