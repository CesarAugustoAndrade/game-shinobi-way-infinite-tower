import React from 'react';
import { CombatRange, RangeMoveDirection } from '../../game/types';
import { VOLUNTARY_MOVE_AP_COST } from '../../game/systems/RangeSystem';
import { getActionArt } from '../../game/constants/artRegistry';
import Tooltip from '../shared/Tooltip';
import { ChevronsRight, ChevronsLeft, ShieldAlert } from 'lucide-react';
import './RangeControlPanel.css';

interface RangeControlPanelProps {
  currentRange: CombatRange;
  turnState: string;
  playerMoveUsedThisTurn: boolean;
  currentAp: number;
  onMoveInRange?: (dir: RangeMoveDirection) => void;
}

const formatCombatRange = (r: CombatRange): string => {
  switch (r) {
    case CombatRange.CLOSE: return 'CLOSE RANGE';
    case CombatRange.MEDIUM: return 'MEDIUM RANGE';
    case CombatRange.LONG: return 'LONG RANGE';
    default: return r;
  }
};

const RANGES: { key: CombatRange; label: string; short: string }[] = [
  { key: CombatRange.LONG, label: 'Long', short: '🏹 Ranged' },
  { key: CombatRange.MEDIUM, label: 'Medium', short: '🎯 Mid' },
  { key: CombatRange.CLOSE, label: 'Close', short: '⚔️ Melee' },
];

export const RangeControlPanel: React.FC<RangeControlPanelProps> = ({
  currentRange,
  turnState,
  playerMoveUsedThisTurn,
  currentAp,
  onMoveInRange,
}) => {
  const isPlayerTurn = turnState === 'PLAYER';
  const apCost = VOLUNTARY_MOVE_AP_COST ?? 1;
  const hasAp = currentAp >= apCost;
  const moveAvailable = isPlayerTurn && !playerMoveUsedThisTurn && hasAp;

  const closeDisabled = !moveAvailable || currentRange === CombatRange.CLOSE;
  const backDisabled = !moveAvailable || currentRange === CombatRange.LONG;

  const closeArt = getActionArt('close_in');
  const backArt = getActionArt('back_off');

  return (
    <div className="range-panel">
      {/* Visual Spectrum Distance Meter */}
      <div className="range-panel__meter" aria-label={`Current Range: ${formatCombatRange(currentRange)}`}>
        <div className="range-panel__meter-track">
          {RANGES.map((r, idx) => {
            const isActive = currentRange === r.key;
            return (
              <React.Fragment key={r.key}>
                <div className={`range-panel__node ${isActive ? 'range-panel__node--active' : ''}`}>
                  <span className="range-panel__node-dot" />
                  <span className="range-panel__node-label">{r.label}</span>
                </div>
                {idx < RANGES.length - 1 && (
                  <div className={`range-panel__segment ${
                    (currentRange === CombatRange.MEDIUM && idx === 0) ||
                    (currentRange === CombatRange.CLOSE)
                      ? 'range-panel__segment--reached'
                      : ''
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Interactive Visual Action Cards */}
      <div className="range-panel__actions">
        {/* BACK OFF ACTION CARD */}
        <Tooltip
          position="top"
          content={
            <div className="combat-tooltip">
              <div className="combat-tooltip__title">Back Off (Retreat)</div>
              <div className="combat-tooltip__description">
                Leap backward to create space between you and the foe.
              </div>
              <div className="combat-tooltip__mechanics">
                <div>- Cost: {apCost} AP (once per turn)</div>
                <div>- Moves: {formatCombatRange(currentRange)} ➔ {currentRange === CombatRange.CLOSE ? 'MEDIUM RANGE' : 'LONG RANGE'}</div>
                {currentRange === CombatRange.LONG && <div className="combat-tooltip__warn">Already at Long Range</div>}
                {playerMoveUsedThisTurn && <div className="combat-tooltip__warn">Already moved this turn</div>}
                {!hasAp && <div className="combat-tooltip__warn">Not enough AP</div>}
              </div>
            </div>
          }
        >
          <button
            type="button"
            className={`range-panel__card range-panel__card--back ${backDisabled ? 'range-panel__card--disabled' : ''}`}
            disabled={backDisabled}
            onClick={() => onMoveInRange?.(RangeMoveDirection.RETREAT)}
          >
            <div className="range-panel__card-bg">
              {backArt.src && <img src={backArt.src} alt="" draggable={false} />}
            </div>
            <div className="range-panel__card-overlay" />
            
            <div className="range-panel__card-content">
              <div className="range-panel__card-header">
                <ChevronsLeft className="range-panel__card-arrow" />
                <span className="range-panel__card-ap">{apCost} AP</span>
              </div>
              <div className="range-panel__card-title">Back off</div>
            </div>
          </button>
        </Tooltip>

        {/* CLOSE IN ACTION CARD */}
        <Tooltip
          position="top"
          content={
            <div className="combat-tooltip">
              <div className="combat-tooltip__title">Close In (Advance)</div>
              <div className="combat-tooltip__description">
                Flash-step forward to close distance with the enemy.
              </div>
              <div className="combat-tooltip__mechanics">
                <div>- Cost: {apCost} AP (once per turn)</div>
                <div>- Moves: {formatCombatRange(currentRange)} ➔ {currentRange === CombatRange.LONG ? 'MEDIUM RANGE' : 'CLOSE RANGE'}</div>
                {currentRange === CombatRange.CLOSE && <div className="combat-tooltip__warn">Already at Close Range</div>}
                {playerMoveUsedThisTurn && <div className="combat-tooltip__warn">Already moved this turn</div>}
                {!hasAp && <div className="combat-tooltip__warn">Not enough AP</div>}
              </div>
            </div>
          }
        >
          <button
            type="button"
            className={`range-panel__card range-panel__card--close ${closeDisabled ? 'range-panel__card--disabled' : ''}`}
            disabled={closeDisabled}
            onClick={() => onMoveInRange?.(RangeMoveDirection.APPROACH)}
          >
            <div className="range-panel__card-bg">
              {closeArt.src && <img src={closeArt.src} alt="" draggable={false} />}
            </div>
            <div className="range-panel__card-overlay" />
            
            <div className="range-panel__card-content">
              <div className="range-panel__card-header">
                <span className="range-panel__card-ap">{apCost} AP</span>
                <ChevronsRight className="range-panel__card-arrow" />
              </div>
              <div className="range-panel__card-title">Close in</div>
            </div>
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
