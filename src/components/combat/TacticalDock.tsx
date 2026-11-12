import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './TacticalDock.css';

export interface TacticalDockProps {
  /** Called once for the clipped face and once for the expand window. */
  render: () => React.ReactNode;
}

/**
 * Fixed-height tactical plate. What does not fit is clipped.
 * Expand opens a second render tree in a floating window.
 */
export const TacticalDock: React.FC<TacticalDockProps> = ({ render }) => {
  const [open, setOpen] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  useFocusTrap(windowRef, open);

  useEffect(() => {
    if (!open) return undefined;

    // Capture so Escape closes this window before other window listeners.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open]);

  return (
    <div className="tactical-dock">
      <div className="tactical-dock__clip">{render()}</div>
      <button
        type="button"
        className="tactical-dock__expand"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Expand
      </button>
      {open &&
        createPortal(
          <div
            className="tactical-dock__overlay"
            onClick={() => setOpen(false)}
          >
            <div
              ref={windowRef}
              className="tactical-dock__window"
              role="dialog"
              aria-modal="true"
              aria-label="Tactical"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="tactical-dock__header">
                <span className="tactical-dock__title">Tactical</span>
                <button
                  type="button"
                  className="tactical-dock__close"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </header>
              <div className="tactical-dock__body">{render()}</div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
