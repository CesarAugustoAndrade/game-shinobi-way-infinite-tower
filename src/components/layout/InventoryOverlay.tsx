/**
 * Full-screen bag overlay for cinematic exploration (T-022).
 * Reuses RightSidebarPanel (dnd-kit intact). ESC / backdrop / X close.
 * Can sit open alongside CharacterSheetOverlay (left + right).
 */

import React, { useEffect, useRef } from 'react';
import RightSidebarPanel, { type RightSidebarPanelProps } from './RightSidebarPanel';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './exploreOverlays.css';

interface InventoryOverlayProps extends RightSidebarPanelProps {
  onClose: () => void;
  /** Dock side — bag defaults right so character can use left. */
  side?: 'left' | 'right';
  /** Dimmed full-screen hit target; false when the other panel owns the dim. */
  showBackdrop?: boolean;
  /** Focus trap only when this is the sole open panel. */
  trapFocus?: boolean;
}

const InventoryOverlay: React.FC<InventoryOverlayProps> = ({
  onClose,
  side = 'right',
  showBackdrop = true,
  trapFocus = true,
  ...panelProps
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useFocusTrap(rootRef, trapFocus);

  // Bubble phase so Bag/Equipment capture can dismiss toast/menu/craft first
  // (Merchant-style Esc layers). stopPropagation still blocks App map Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat) return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      className={[
        'explore-overlay',
        side === 'left' ? 'explore-overlay--start' : 'explore-overlay--end',
        !showBackdrop ? 'explore-overlay--no-backdrop' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-modal={trapFocus ? true : undefined}
      aria-label="Bag and equipment"
    >
      {showBackdrop && (
        <button
          type="button"
          className="explore-overlay__backdrop"
          aria-label="Close bag"
          onClick={onClose}
          tabIndex={-1}
        />
      )}
      <div className="explore-overlay__panel explore-overlay__panel--bag">
        <header className="explore-overlay__header">
          <h2 className="explore-overlay__title">🎒 Bag · Equipment</h2>
          <span className="explore-overlay__hint">
            <kbd>I</kbd> toggle · <kbd>Esc</kbd> close
          </span>
          <button
            type="button"
            className="explore-overlay__close"
            onClick={onClose}
            aria-label="Close"
            autoFocus={trapFocus}
          >
            <X size={18} />
          </button>
        </header>
        <div className="explore-overlay__body">
          <RightSidebarPanel {...panelProps} />
        </div>
      </div>
    </div>
  );
};

export default InventoryOverlay;
