import React from 'react';
import { Target } from 'lucide-react';
import { CombatActor, type Mark } from '../../game/types';
import { markPanelDisplayName } from '../../game/systems/combatSkillViewModel';
import Tooltip from '../shared/Tooltip';
import { TacticalPanelIcon } from './TacticalPanelIcon';
import { CombatHudIcon } from './CombatHudIcon';
import { combatMarkEmoji, combatMarkIconSrc, compactMarkBlurb } from './combatHudIcons';
import './CombatModesPanel.css';
import './CombatHudIcons.css';

interface TacticalSetupPanelProps {
  marks: Mark[];
}

export const TacticalSetupPanel: React.FC<TacticalSetupPanelProps> = ({ marks }) => {
  return (
    <section className="tactical-setup-panel" data-testid="tactical-setup-panel" aria-label="Tactical Setup">
      <TacticalPanelIcon
        title="Tactical Setup"
        titleClassName="tactical-setup-panel__title"
        icon={<Target size={12} strokeWidth={2.4} />}
      />
      {marks.length === 0 ? (
        <p className="tactical-setup-panel__empty">No marks</p>
      ) : (
        <ul className="tactical-setup-panel__list">
          {marks.map((mark) => {
            // Side label is by target (where the mark sits), not owner/source.
            const onEnemy = mark.target === CombatActor.ENEMY;
            const name = markPanelDisplayName(mark.id);
            const ownerLabel = onEnemy ? 'enemy' : 'own';
            const effect = compactMarkBlurb(mark.id);
            return (
              <li
                key={`${mark.id}-${mark.owner}-${mark.target}`}
                className="tactical-setup-panel__row"
                data-testid="setup-mark-row"
                data-mark-id={mark.id}
                data-mark-owner={onEnemy ? 'enemy' : 'own'}
              >
                <Tooltip
                  content={
                    <div className="tactical-panel-tip">
                      <div className="tactical-panel-tip__name">{name}</div>
                      <p className="tactical-panel-tip__body">
                        {effect} ×{mark.stacks} · {mark.duration}t · {ownerLabel}
                        {mark.trigger ? ` · ${mark.trigger}` : ''}
                        {mark.consume ? ` · ${mark.consume}` : ''}
                      </p>
                    </div>
                  }
                  position="right"
                  className="combat-hud-tip"
                >
                  <span
                    className={`combat-hud-icon-btn ${onEnemy ? 'combat-hud-icon-btn--enemy' : ''}`}
                    tabIndex={0}
                  >
                    <CombatHudIcon
                      src={combatMarkIconSrc(mark.id)}
                      emoji={combatMarkEmoji(mark.id)}
                      label={name}
                    />
                  </span>
                </Tooltip>
                <span className="tactical-setup-panel__name">{name}</span>
                <span
                  data-testid="mark-owner"
                  className={onEnemy ? 'setup-mark-owner--enemy' : undefined}
                >
                  {ownerLabel}
                </span>
                <span className="tactical-setup-panel__meta" data-testid="mark-stacks">
                  ×{mark.stacks}
                </span>
                <span className="tactical-setup-panel__meta" data-testid="mark-duration">
                  {mark.duration}t
                </span>
                {mark.trigger && <span className="tactical-setup-panel__meta">{mark.trigger}</span>}
                {mark.consume && <span className="tactical-setup-panel__meta">{mark.consume}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
