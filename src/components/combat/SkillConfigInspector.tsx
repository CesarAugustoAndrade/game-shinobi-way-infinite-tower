import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';
import type { SkillConfig } from '../../game/types';
import type { PreviewSource } from '../../game/systems/combatSkillViewModel';
import { getSkillArt } from '../../game/constants/artRegistry';
import Tooltip from '../shared/Tooltip';
import { TacticalPanelIcon } from './TacticalPanelIcon';
import { CombatHudIcon } from './CombatHudIcon';
import { combatModeEmoji, combatModeIconSrc } from './combatHudIcons';
import './CombatModesPanel.css';
import './CombatHudIcons.css';

interface SkillConfigInspectorProps {
  config: SkillConfig;
  combatLocked?: boolean;
  /** Human Main Attack label; falls back to raw id. */
  mainAttackLabel?: string | null;
  weightTerms?: PreviewSource[];
  weightTotal?: number;
  defaultOpen?: boolean;
}

export const SkillConfigInspector: React.FC<SkillConfigInspectorProps> = ({
  config,
  combatLocked = false,
  mainAttackLabel,
  weightTerms = [],
  weightTotal,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const mainId = config.mainAttackId;
  const mainText = mainAttackLabel?.trim() || mainId || '—';
  const priorityText = config.modeUpkeepPriority.join(' → ') || '—';
  const canShowWeight = weightTerms.length > 0 || weightTotal != null;
  const mainArt = mainId ? getSkillArt(mainId) : null;

  return (
    <section className="skill-config-inspector" data-testid="skill-config-inspector" aria-label="Skill Config">
      <TacticalPanelIcon
        title="Skill Config"
        titleClassName="skill-config-inspector__title"
        icon={<Settings2 size={12} strokeWidth={2.4} />}
      />
      <div className="skill-config-inspector__body">
        <p data-testid="skill-config-main" data-main-id={mainId ?? undefined}>
          Main: {mainText}
          {combatLocked ? ' (locked in combat)' : ''}
        </p>
        <p data-testid="skill-config-priority">Upkeep: {priorityText}</p>
        <div className="combat-status-strip" aria-hidden="true">
          {mainArt && mainId && (
            <Tooltip
              content={
                <div className="tactical-panel-tip">
                  <div className="tactical-panel-tip__name">Main</div>
                  <p className="tactical-panel-tip__body">{mainText}{combatLocked ? ' · locked' : ''}</p>
                </div>
              }
              position="right"
              className="combat-hud-tip"
            >
              <span className="combat-hud-icon-btn combat-hud-icon-btn--on" tabIndex={0}>
                <CombatHudIcon
                  src={mainArt.src ?? ''}
                  emoji={mainArt.emoji}
                  label={mainText}
                />
              </span>
            </Tooltip>
          )}
          {config.modeUpkeepPriority.map((modeId) => (
            <Tooltip
              key={modeId}
              content={
                <div className="tactical-panel-tip">
                  <div className="tactical-panel-tip__name">Upkeep</div>
                  <p className="tactical-panel-tip__body">{modeId}</p>
                </div>
              }
              position="right"
              className="combat-hud-tip"
            >
              <span className="combat-hud-icon-btn" tabIndex={0}>
                <CombatHudIcon
                  src={combatModeIconSrc(modeId)}
                  emoji={combatModeEmoji(modeId)}
                  label={modeId}
                />
              </span>
            </Tooltip>
          ))}
        </div>
        {canShowWeight && (
          <button
            type="button"
            className="skill-config-inspector__weight-btn"
            data-testid="weight-toggle"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Hide weight' : 'Weight breakdown'}
          </button>
        )}
      </div>
      {open && canShowWeight && (
        <ul className="skill-config-inspector__weight" data-testid="weight-breakdown">
          {weightTerms.map((term) => (
            <li key={term.name}>
              {term.name}: {term.bonus}
            </li>
          ))}
          {weightTotal != null && <li>total: {weightTotal}</li>}
        </ul>
      )}
    </section>
  );
};
