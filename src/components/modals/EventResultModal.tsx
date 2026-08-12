import React from 'react';
import { Scroll, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';
import { EventOutcome } from '../../game/types';
import { OutcomeChange } from './eventOutcomeChanges';
import ModalShell, { useModalShellClose } from './ModalShell';
import './EventResultModal.css';

interface EventResultModalProps {
  outcome: {
    message: string;
    outcome: EventOutcome;
    logType: 'gain' | 'danger' | 'info' | 'loot';
    /** Pre-computed, display-ready deltas for the "WHAT CHANGED" panel. */
    changes: OutcomeChange[];
    /** Present when this outcome chains into another event (T-008 chainTo). */
    nextEventId?: string;
  };
  onClose: () => void;
}

function EventContinueButton({ isChain }: { isChain: boolean }) {
  const dismiss = useModalShellClose();
  return (
    <>
      <button
        type="button"
        className={`event-result__continue ${isChain ? 'event-result__continue--chain' : ''}`}
        onClick={dismiss}
        autoFocus
      >
        {isChain ? 'Continue the Ledger ▸' : 'Keep Exploring ▸'}
      </button>
      <p className="event-result__hint">
        <span className="sw-shortcut">Space</span> / <span className="sw-shortcut">Enter</span>
        {' · '}
        <span className="sw-shortcut">Esc</span>
      </p>
    </>
  );
}

/**
 * EventResultModal (T-011) — pixel-arcade outcome panel.
 *
 * Shows the narrative result of an event choice, a legible "WHAT CHANGED"
 * breakdown of the real deltas, and a chain-aware continue button. When the
 * outcome links to a follow-up event the panel flags the chain and its primary
 * button advances the story instead of returning to exploration.
 */
const EventResultModal: React.FC<EventResultModalProps> = ({ outcome, onClose }) => {
  const { message, logType, changes, nextEventId } = outcome;
  const isChain = Boolean(nextEventId);

  const HeaderIcon =
    logType === 'gain' ? CheckCircle : logType === 'danger' ? AlertTriangle : logType === 'loot' ? Sparkles : Scroll;

  return (
    <ModalShell
      ariaLabel="Event result"
      className="event-result"
      containerClassName={`event-result__panel event-result__panel--${logType}`}
      onClose={onClose}
      footer={<EventContinueButton isChain={isChain} />}
    >
      {/* Chain ribbon — the story is not over yet. */}
      {isChain && (
        <div className="event-result__chain" role="status">
          <span className="event-result__chain-glyph" aria-hidden="true">›</span>
          <span>Ledger continues</span>
        </div>
      )}

      {/* Header */}
      <header className="event-result__header">
        <span className={`event-result__header-icon event-result__header-icon--${logType}`}>
          <HeaderIcon size={18} strokeWidth={2.5} />
        </span>
        <h2 className="event-result__title">Outcome</h2>
      </header>

      {/* Narrative outcome */}
      <p className="event-result__message">{message}</p>

      {/* WHAT CHANGED */}
      <div className="event-result__divider">▸ What Changed</div>

      {changes.length > 0 ? (
        <ul className="event-result__changes">
          {changes.map((change) => (
            <li key={change.key} className={`event-result__change event-result__change--${change.tone}`}>
              <span className="event-result__change-icon" aria-hidden="true">
                {change.icon}
              </span>
              <span className="event-result__change-label">{change.label}</span>
              <span className="event-result__change-value">{change.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={`event-result__no-change ${
            logType === 'danger'
              ? 'event-result__no-change--weight'
              : logType === 'gain'
                ? 'event-result__no-change--gain'
                : ''
          }`}
        >
          {logType === 'danger'
            ? 'No stats changed — the choice still sits in the ledger.'
            : logType === 'gain'
              ? 'No inventory change — only the path is clearer.'
              : 'No mechanical change — you move on.'}
        </div>
      )}
    </ModalShell>
  );
};

export default EventResultModal;
