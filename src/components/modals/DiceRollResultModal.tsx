import React, { useEffect, useState } from 'react';
import { Dices, AlertTriangle, Package, Map, Heart } from 'lucide-react';
import { DiceRollResult } from '../../game/types';
import './DiceRollResultModal.css';

interface DiceRollResultModalProps {
  result: DiceRollResult;
  onContinue: () => void;
}

const DiceRollResultModal: React.FC<DiceRollResultModalProps> = ({ result, onContinue }) => {
  const [isRolling, setIsRolling] = useState(true);
  const [showResult, setShowResult] = useState(false);

  // Dice roll animation
  useEffect(() => {
    const rollTimer = setTimeout(() => {
      setIsRolling(false);
      setTimeout(() => setShowResult(true), 200);
    }, 1200);

    return () => clearTimeout(rollTimer);
  }, []);

  // Keyboard shortcut: SPACE/ENTER to continue (only after result shown)
  useEffect(() => {
    if (!showResult) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onContinue();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onContinue, showResult]);

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
    <div className="dice-modal" role="dialog" aria-modal="true" aria-label="Dice roll result">
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
                  {result.type === 'trap' ? 'TRAP!' : result.type === 'piece' ? 'MAP PIECE!' : 'EMPTY'}
                </h3>

                {/* Result body */}
                <div className="dice-modal__result-body">
                  {result.type === 'trap' && (
                    <>
                      <p className="dice-modal__result-text">You triggered a trap!</p>
                      <div className="dice-modal__hp-badge">
                        <Heart size={18} />
                        <span>-{result.damage} HP</span>
                      </div>
                    </>
                  )}

                  {result.type === 'nothing' && (
                    <>
                      <p className="dice-modal__result-text">The chest was empty...</p>
                      <p className="dice-modal__result-text dice-modal__result-text--small">No map piece found.</p>
                    </>
                  )}

                  {result.type === 'piece' && (
                    <>
                      <p className="dice-modal__result-text">You found a map piece!</p>
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
              onClick={onContinue}
              className={`dice-modal__continue-btn dice-modal__continue-btn--${result.type}`}
            >
              Continue
            </button>
            <p className="dice-modal__shortcut-hint">
              Press <span className="sw-shortcut">Space</span> or <span className="sw-shortcut">Enter</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceRollResultModal;
