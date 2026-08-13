import React from 'react';
import type { ActiveModeRuntime } from '../../game/types';
import './CombatModesPanel.css';

export interface CombatModePanelEntry extends ActiveModeRuntime {
  maxCharges?: number;
  upkeepLabel?: string;
}

interface CombatModesPanelProps {
  modes: CombatModePanelEntry[];
  upkeepPriority?: readonly string[];
}

export const CombatModesPanel: React.FC<CombatModesPanelProps> = ({
  modes,
  upkeepPriority = [],
}) => {
  return (
    <section className="combat-modes-panel" data-testid="combat-modes-panel" aria-label="Combat Modes">
      <h3 className="combat-modes-panel__title">Combat Modes</h3>
      {modes.length === 0 ? (
        <p className="combat-modes-panel__empty">No Mode ON</p>
      ) : (
        <ul className="combat-modes-panel__list">
          {modes.map((mode, index) => {
            const priority = upkeepPriority.indexOf(mode.id);
            return (
              <li key={mode.id} className="combat-modes-panel__row" data-testid="combat-mode-row">
                <span className="combat-modes-panel__name">
                  {mode.id}
                  {mode.stage != null ? ` · stage ${mode.stage}` : ''}
                </span>
                <span data-testid="mode-charges">
                  {mode.charges}/{mode.maxCharges ?? mode.charges}
                </span>
                {mode.upkeepLabel && <span className="combat-modes-panel__upkeep">{mode.upkeepLabel}</span>}
                <span className="combat-modes-panel__pri">
                  pri {priority >= 0 ? priority + 1 : index + 1}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
