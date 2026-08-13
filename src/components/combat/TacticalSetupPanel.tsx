import React from 'react';
import { CombatActor, type Mark } from '../../game/types';
import './CombatModesPanel.css';

interface TacticalSetupPanelProps {
  marks: Mark[];
}

export const TacticalSetupPanel: React.FC<TacticalSetupPanelProps> = ({ marks }) => {
  return (
    <section className="tactical-setup-panel" data-testid="tactical-setup-panel" aria-label="Tactical Setup">
      <h3 className="tactical-setup-panel__title">Tactical Setup</h3>
      {marks.length === 0 ? (
        <p className="tactical-setup-panel__empty">No marks</p>
      ) : (
        <ul className="tactical-setup-panel__list">
          {marks.map((mark) => (
            <li key={`${mark.id}-${mark.owner}-${mark.target}`} className="tactical-setup-panel__row" data-testid="setup-mark-row">
              <span>{mark.id}</span>
              <span data-testid="mark-owner">{mark.owner === CombatActor.PLAYER ? 'own' : 'enemy'}</span>
              <span data-testid="mark-stacks">×{mark.stacks}</span>
              <span data-testid="mark-duration">{mark.duration}t</span>
              {mark.trigger && <span>{mark.trigger}</span>}
              {mark.consume && <span>{mark.consume}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
