import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Dices, AlertTriangle, Package, Map, Heart } from 'lucide-react';
import { DiceRollResult } from '../../game/types';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './DiceRollResultModal.css';

interface DiceRollResultModalProps {
  result: DiceRollResult;
  onContinue: () => void;
}

const DiceRollResultModal: React.FC<DiceRollResultModalProps> = ({ result, onContinue }) => {
  const [isRolling, setIsRolling] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Space hold / Enter+click same-tick double Continue → double returnToMap /
  // TREASURE_HUNT_REWARD stage. Parity RestResultModal / EventResultModal.
  const closedRef = useRef(false);
  useFocusTrap(rootRef);

  const dismiss = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onContinue();
  }, [onContinue]);

  // Dice roll animation — clear both timers on unmount (nested was leaked)
  useEffect(() => {
    let resultTimer: ReturnType<typeof setTimeout> | null = null;
    const rollTimer = setTimeout(() => {
      setIsRolling(false);
      resultTimer = setTimeout(() => setShowResult(true), 200);
    }, 1200);

    return () => {
      clearTimeout(rollTimer);
      if (resultTimer != null) clearTimeout(resultTimer);
    };
  }, []);

  // Keyboard: SPACE / ENTER / Escape continue (only after result shown)
  useEffect(() => {
    if (!showResult) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        dismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [dismiss, showResult]);

  const ResultIcon =
    result.type === 'trap' ? AlertTriangle :
    result.type === 'piece' ? Map :
    Package;

  // Map progress bar for piece results
  const renderMapProgress = () => {
    if (result.type !== 'piece' || !result.piecesCollected || !result.piecesRequired) return null;

    const segments = [];
    for (let i = 0; i < result.piecesRequired; i++) {
      segments.push(
        <div
          key={i}
          className={`dice-modal__progress-seg ${i < result.piecesCollected ? 'dice-modal__progress-seg--filled' : ''}`}
        />
      );
    }

    return (
      <div className="dice-modal__progress">
        <div className="dice-modal__progress-segments">{segments}</div>
        <p className="dice-modal__progress-label">
          {result.piecesCollected}/{result.piecesRequired} pieces collected
        </p>
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      className="dice-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Dice roll result"
    >
      <div className={`dice-modal__panel dice-modal__panel--${result.type}`}>

        {/* Header */}
        <div className="dice-modal__header">
          <Dices
            size={22}
            className={isRolling ? 'dice-modal__dice-icon--rolling' : 'dice-modal__dice-icon--done'}
          />
          <h2 className="dice-modal__header-title">Dice Roll</h2>
          <Dices
            size={22}
            className={isRolling ? 'dice-modal__dice-icon--rolling' : 'dice-modal__dice-icon--done'}
          />
        </div>

        {/* Body */}
        <div className="dice-modal__body">
          {isRolling ? (
            <div className="dice-modal__rolling">
              <div className="dice-modal__rolling-cube">
                <Dices size={40} className="dice-modal__rolling-cube-icon" />
              </div>
              <p className="dice-modal__rolling-label">Rolling...</p>
            </div>
          ) : (
            showResult && (
              <div className="dice-modal__result">
                {/* Result icon */}
                <div className={`dice-modal__result-icon dice-modal__result-icon--${result.type}`}>
                  <ResultIcon size={40} />
                </div>

                {/* Result title */}
                <h3 className={`dice-modal__result-title dice-modal__result-title--${result.type}`}>
                  {result.type === 'trap' ? 'TRAP' : result.type === 'piece' ? 'MAP PIECE' : 'EMPTY'}
                </h3>

                {/* Result body */}
                <div className="dice-modal__result-body">
                  {result.type === 'trap' && (
                    <>
                      <p className="dice-modal__result-text">Steel and wire — the cache was bait.</p>
                      <div className="dice-modal__hp-badge">
                        <Heart size={18} />
                        <span>-{result.damage} HP</span>
                      </div>
                    </>
                  )}

                  {result.type === 'nothing' && (
                    <>
                      <p className="dice-modal__result-text">The chest holds dust and salt air.</p>
                      <p className="dice-modal__result-text dice-modal__result-text--small">No map piece.</p>
                    </>
                  )}

                  {result.type === 'piece' && (
                    <>
                      <p className="dice-modal__result-text">A fragment of the map. Incomplete. Useful.</p>
                      {renderMapProgress()}
                    </>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer: continue button (only after result) */}
        {showResult && (
          <div className="dice-modal__footer">
            <button
              type="button"
              onClick={dismiss}
              className={`dice-modal__continue-btn dice-modal__continue-btn--${result.type}`}
              autoFocus
            >
              Continue
            </button>
            <p className="dice-modal__shortcut-hint">
              Press <span className="sw-shortcut">Space</span> / <span className="sw-shortcut">Enter</span>
              {' · '}
              <span className="sw-shortcut">Esc</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceRollResultModal;
