import React, { useEffect, useState } from 'react';
import './CombatSenStrip.css';

export type SenHolder = 'player' | 'enemy';

export interface CombatSenStripProps {
  /** Whose turn it is right now */
  turnState: 'PLAYER' | 'ENEMY_TURN';
  /** Who won the opening initiative roll */
  openingInitHolder?: SenHolder | null;
  /** Still on ambush / first-strike window */
  isFirstTurn?: boolean;
  /** Player first-hit mult when isFirstTurn */
  firstHitMultiplier?: number;
  /** Enemy ambush first-hit mult */
  enemyFirstHitMultiplier?: number;
}

/**
 * SEN tempo strip — shows who holds initiative at open and whose turn it is.
 * Kanji 先 (sen) = first strike / tempo ownership.
 */
const CombatSenStrip: React.FC<CombatSenStripProps> = ({
  turnState,
  openingInitHolder = null,
  isFirstTurn = false,
  firstHitMultiplier = 1,
  enemyFirstHitMultiplier = 1,
}) => {
  const [openingPhase, setOpeningPhase] = useState(Boolean(openingInitHolder));

  useEffect(() => {
    if (!openingInitHolder) {
      setOpeningPhase(false);
      return;
    }
    setOpeningPhase(true);
    const t = setTimeout(() => setOpeningPhase(false), 3200);
    return () => clearTimeout(t);
  }, [openingInitHolder]);

  const active: SenHolder = turnState === 'PLAYER' ? 'player' : 'enemy';
  const openHolder: SenHolder = openingInitHolder ?? active;

  const youAmp =
    isFirstTurn && firstHitMultiplier > 1
      ? `×${firstHitMultiplier.toFixed(firstHitMultiplier % 1 === 0 ? 0 : 1)}`
      : null;
  const themAmp =
    isFirstTurn && enemyFirstHitMultiplier > 1
      ? `×${enemyFirstHitMultiplier.toFixed(enemyFirstHitMultiplier % 1 === 0 ? 0 : 2)}`
      : null;

  const callLine = openingPhase
    ? openHolder === 'player'
      ? 'You seize the tempo'
      : 'Enemy seizes the tempo'
    : active === 'player'
      ? 'Your turn'
      : 'Enemy turn';

  return (
    <div
      className={[
        'combat-sen',
        openingPhase ? 'combat-sen--opening' : '',
        active === 'player' ? 'combat-sen--you' : 'combat-sen--them',
        openHolder === 'player' ? 'combat-sen--open-you' : 'combat-sen--open-them',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-label={
        openingPhase
          ? openHolder === 'player'
            ? 'Initiative: you open'
            : 'Initiative: enemy opens'
          : active === 'player'
            ? 'Your turn'
            : 'Enemy turn'
      }
    >
      <div className={`combat-sen__side combat-sen__side--you ${active === 'player' ? 'is-active' : ''}`}>
        <span className="combat-sen__seal" aria-hidden="true">
          己
        </span>
        <span className="combat-sen__label">YOU</span>
        {youAmp && active === 'player' && (
          <span className="combat-sen__amp" title="First-hit multiplier">
            {youAmp}
          </span>
        )}
      </div>

      <div className="combat-sen__core">
        <span className="combat-sen__kanji" aria-hidden="true">
          先
        </span>
        <span className="combat-sen__mode">{openingPhase ? 'INIT' : 'TURN'}</span>
        <span className="combat-sen__call">{callLine}</span>
      </div>

      <div className={`combat-sen__side combat-sen__side--them ${active === 'enemy' ? 'is-active' : ''}`}>
        {themAmp && active === 'enemy' && (
          <span className="combat-sen__amp combat-sen__amp--enemy" title="Ambush first strike">
            {themAmp}
          </span>
        )}
        <span className="combat-sen__label">THEM</span>
        <span className="combat-sen__seal" aria-hidden="true">
          敵
        </span>
      </div>
    </div>
  );
};

export default CombatSenStrip;
