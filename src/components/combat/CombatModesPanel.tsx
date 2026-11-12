import React from 'react';
import { Aperture } from 'lucide-react';
import type { ActiveModeRuntime } from '../../game/types';
import Tooltip from '../shared/Tooltip';
import { TacticalPanelIcon } from './TacticalPanelIcon';
import { CombatHudIcon } from './CombatHudIcon';
import { combatModeEmoji, combatModeIconSrc } from './combatHudIcons';
import './CombatModesPanel.css';
import './CombatHudIcons.css';

export interface CombatModePanelEntry extends ActiveModeRuntime {
  maxCharges?: number;
  upkeepLabel?: string;
  /** Human skill name; visible text. Raw id stays on data-mode-id (T-136). */
  displayName?: string;
  /** Compact “what it does now” for hover. */
  effectLabel?: string;
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
      <TacticalPanelIcon
        title="Combat Modes"
        titleClassName="combat-modes-panel__title"
        icon={<Aperture size={12} strokeWidth={2.4} />}
      />
      {modes.length === 0 ? (
        <p className="combat-modes-panel__empty">No Mode ON</p>
      ) : (
        <ul className="combat-modes-panel__list">
          {modes.map((mode, index) => {
            const priority = upkeepPriority.indexOf(mode.id);
            const priNum = priority >= 0 ? priority + 1 : index + 1;
            const name = mode.displayName ?? mode.id;
            const stageBit = mode.stage != null ? ` · stage ${mode.stage}` : '';
            const charges = `${mode.charges}/${mode.maxCharges ?? mode.charges}`;
            const effect = mode.effectLabel?.trim() || 'Mode ON.';
            const hoverBits = [charges, mode.upkeepLabel, `pri ${priNum}`].filter(Boolean).join(' · ');
            return (
              <li
                key={mode.id}
                className="combat-modes-panel__row"
                data-testid="combat-mode-row"
                data-mode-id={mode.id}
              >
                <Tooltip
                  content={
                    <div className="tactical-panel-tip">
                      <div className="tactical-panel-tip__name">{name}</div>
                      <p className="tactical-panel-tip__body">
                        {effect} {hoverBits}
                      </p>
                    </div>
                  }
                  position="right"
                  className="combat-hud-tip"
                >
                  <span className="combat-hud-icon-btn combat-hud-icon-btn--on" tabIndex={0}>
                    <CombatHudIcon
                      src={combatModeIconSrc(mode.id)}
                      emoji={combatModeEmoji(mode.id)}
                      label={name}
                    />
                    <span data-testid="mode-charges" className="combat-hud-icon__badge">
                      {charges}
                    </span>
                  </span>
                </Tooltip>
                <span className="combat-modes-panel__name">
                  {name}
                  {stageBit}
                </span>
                {mode.upkeepLabel && (
                  <span className="combat-modes-panel__upkeep">{mode.upkeepLabel}</span>
                )}
                <span className="combat-modes-panel__pri">pri {priNum}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
