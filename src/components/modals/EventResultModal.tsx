import React, { useEffect } from 'react';
import { Scroll, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';
import { EventOutcome } from '../../game/types';
import { OutcomeChange } from './eventOutcomeChanges';
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

  // SPACE / ENTER to continue.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const HeaderIcon =
    logType === 'gain' ? CheckCircle : logType === 'danger' ? AlertTriangle : logType === 'loot' ? Sparkles : Scroll;

  return (
    <div className="event-result" role="dialog" aria-modal="true" aria-label="Event result">
      <div className={`event-result__panel event-result__panel--${logType}`}>
        {/* Chain ribbon — the story is not over yet. */}
        {isChain && (
          <div className="event-result__chain">
            <span className="event-result__chain-glyph">⛓</span>
            <span>The chain continues</span>
          </div>
        )}

        {/* Header */}
        <header className="event-result__header">
          <span className={`event-result__header-icon event-result__header-icon--${logType}`}>
            <HeaderIcon size={18} strokeWidth={2.5} />
          </span>
          <h2 className="event-result__title">Result</h2>
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
          <div className="event-result__no-change">No change — the moment passes.</div>
        )}

        {/* Continue */}
        <button
          type="button"
          className={`event-result__continue ${isChain ? 'event-result__continue--chain' : ''}`}
          onClick={onClose}
          autoFocus
        >
          {isChain ? 'Continue the Story ▸' : 'Keep Exploring ▸'}
        </button>
        <p className="event-result__hint">
          <span className="sw-shortcut">Space</span> / <span className="sw-shortcut">Enter</span>
        </p>
      </div>
    </div>
  );
};

export default EventResultModal;
