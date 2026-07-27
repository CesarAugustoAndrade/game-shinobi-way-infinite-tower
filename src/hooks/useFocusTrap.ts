/**
 * Minimal focus trap for modal dialogs (aria-modal).
 * - Focuses first focusable (or container) on mount
 * - Cycles Tab / Shift+Tab inside the container
 * - Restores prior focus on unmount
 */

import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
  );
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active = true,
  /**
   * Optional element to focus on mount instead of the first focusable in DOM order.
   * Use when the first focusable is a destructive escape hatch (e.g. the approach modal's
   * "Exit Room" header button), so the Space/Enter the player was just taught does not
   * trigger it the instant the dialog opens.
   */
  initialFocusRef?: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!active) return;
    const root = containerRef.current;
    if (!root) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusables = getFocusable(root);
    const preferred = initialFocusRef?.current;
    const initial =
      preferred && root.contains(preferred) ? preferred : (focusables[0] ?? root);
    // Defer so autoFocus / layout settle first
    const t = window.setTimeout(() => {
      if (!root.contains(document.activeElement)) {
        initial.focus({ preventScroll: true });
      }
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = getFocusable(root);
      if (nodes.length === 0) {
        e.preventDefault();
        root.focus({ preventScroll: true });
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!current || current === first || !root.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else if (!current || current === last || !root.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(t);
      root.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [containerRef, active, initialFocusRef]);
}
