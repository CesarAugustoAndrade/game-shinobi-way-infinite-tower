/**
 * Shared shell for result / confirm dialogs.
 * Owns a11y (dialog role, focus trap) and dismiss guards (closedRef, Esc/Space/Enter).
 * Visual styling stays on each modal via className / containerClassName.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './ModalShell.css';

export interface ModalShellProps {
  open?: boolean; // default true
  title?: string;
  ariaLabel: string;
  className?: string; // root class e.g. 'reward-modal'
  containerClassName?: string;
  onClose: () => void;
  /** close on Space/Enter as well as Escape (default true for result modals) */
  closeOnConfirmKeys?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const ModalShellCloseContext = createContext<(() => void) | null>(null);

/**
 * Guarded dismiss from the nearest ModalShell (closedRef — fire onClose once).
 * Use for Continue / confirm buttons so click + Enter same-tick cannot double-fire.
 */
export function useModalShellClose(): () => void {
  const dismiss = useContext(ModalShellCloseContext);
  if (!dismiss) {
    throw new Error('useModalShellClose must be used within ModalShell');
  }
  return dismiss;
}

const ModalShell: React.FC<ModalShellProps> = ({
  open = true,
  title,
  ariaLabel,
  className,
  containerClassName,
  onClose,
  closeOnConfirmKeys = true,
  children,
  footer,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  // Space hold / Enter+click same-tick double Continue → double returnToMap chain
  const closedRef = useRef(false);
  // Ignore Space/Enter briefly after open so the key that confirmed the prior
  // action (e.g. Event choice) cannot immediately dismiss a freshly mounted modal.
  // Escape is never gated — always dismiss.
  const confirmKeysArmedRef = useRef(false);
  useFocusTrap(rootRef, open);

  const dismiss = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose();
  }, [onClose]);

  // Remount / re-open resets the once-guard and re-arms confirm keys after grace
  useEffect(() => {
    if (!open) {
      confirmKeysArmedRef.current = false;
      return;
    }
    closedRef.current = false;
    confirmKeysArmedRef.current = false;
    const id = window.setTimeout(() => {
      confirmKeysArmedRef.current = true;
    }, 100);
    return () => {
      window.clearTimeout(id);
      confirmKeysArmedRef.current = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const isEscape = e.key === 'Escape';
      const isConfirm =
        closeOnConfirmKeys && (e.code === 'Space' || e.code === 'Enter');
      if (!isEscape && !isConfirm) return;
      // Esc always; confirm keys only after mount grace
      if (isConfirm && !confirmKeysArmedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      dismiss();
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [open, closeOnConfirmKeys, dismiss]);

  if (!open) return null;

  return (
    <ModalShellCloseContext.Provider value={dismiss}>
      <div
        ref={rootRef}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <div className={containerClassName}>
          {title != null && title !== '' && (
            <h2 className="modal-shell__title">{title}</h2>
          )}
          {children}
          {footer}
        </div>
      </div>
    </ModalShellCloseContext.Provider>
  );
};

export default ModalShell;
