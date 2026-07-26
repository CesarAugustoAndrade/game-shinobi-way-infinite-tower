/**
 * Full-screen bag overlay for cinematic exploration (T-022).
 * Reuses RightSidebarPanel (dnd-kit intact). ESC / backdrop / X close.
 */

import React, { useEffect, useRef } from 'react';
import RightSidebarPanel, { type RightSidebarPanelProps } from './RightSidebarPanel';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './exploreOverlays.css';

interface InventoryOverlayProps extends RightSidebarPanelProps {
  onClose: () => void;
}

const InventoryOverlay: React.FC<InventoryOverlayProps> = ({ onClose, ...panelProps }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useFocusTrap(rootRef);

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
      className="explore-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Bag and equipment"
    >
      <button
        type="button"
        className="explore-overlay__backdrop"
        aria-label="Close bag"
        onClick={onClose}
        tabIndex={-1}
      />
      <div className="explore-overlay__panel explore-overlay__panel--bag">
        <header className="explore-overlay__header">
          <h2 className="explore-overlay__title">🎒 Bag · Equipment</h2>
          <span className="explore-overlay__hint">
            <kbd>I</kbd> toggle · <kbd>Esc</kbd> close
          </span>
          <button type="button" className="explore-overlay__close" onClick={onClose} aria-label="Close" autoFocus>
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
