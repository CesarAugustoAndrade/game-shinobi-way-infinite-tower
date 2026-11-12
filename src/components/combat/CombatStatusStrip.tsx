import React from 'react';
import { CombatActor, type Buff, type Mark } from '../../game/types';
import { markPanelDisplayName } from '../../game/systems/combatSkillViewModel';
import { getBuffDescription } from '../../game/utils/tooltipFormatters';
import Tooltip from '../shared/Tooltip';
import { CombatHudIcon } from './CombatHudIcon';
import {
  combatMarkEmoji,
  combatMarkIconSrc,
  combatStatusEmoji,
  combatStatusIconSrc,
  compactMarkBlurb,
} from './combatHudIcons';

interface CombatStatusStripProps {
  buffs: Buff[];
  marks?: Mark[];
  side: 'player' | 'enemy';
  /** Rail plate (left column) vs under the enemy HP bar. */
  placement?: 'rail' | 'under-hp';
}

function CompactTip({ name, body }: { name: string; body: string }) {
  return (
    <div className="tactical-panel-tip">
      <div className="tactical-panel-tip__name">{name}</div>
      <p className="tactical-panel-tip__body">{body}</p>
    </div>
  );
}

export const CombatStatusStrip: React.FC<CombatStatusStripProps> = ({
  buffs,
  marks = [],
  side,
  placement = 'rail',
}) => {
  const liveBuffs = buffs.filter((buff) => buff?.effect);
  if (liveBuffs.length === 0 && marks.length === 0) return null;

  const label = side === 'player' ? 'Your status' : 'Enemy status';
  const placeClass =
    placement === 'under-hp' ? 'combat-status-strip--under-hp' : 'combat-status-strip--rail';

  return (
    <ul
      className={`combat-status-strip ${placeClass}`}
      data-testid={`combat-status-strip-${side}`}
      aria-label={label}
    >
      {liveBuffs.map((buff, index) => {
        const type = buff.effect.type;
        const duration = buff.duration;
        const body =
          duration === -1
            ? getBuffDescription(buff)
            : `${getBuffDescription(buff)} ${duration}t.`;
        return (
          <li key={buff.id || `${type}-${index}`} className="combat-status-strip__row">
            <Tooltip
              content={<CompactTip name={buff.name} body={body} />}
              position={placement === 'under-hp' ? 'bottom' : 'right'}
              className="combat-hud-tip"
            >
              <span className="combat-hud-icon-btn" tabIndex={0}>
                <CombatHudIcon
                  src={combatStatusIconSrc(type)}
                  emoji={combatStatusEmoji(type)}
                  label={buff.name}
                />
                {duration > 0 && (
                  <span className="combat-hud-icon__badge">{duration}t</span>
                )}
              </span>
            </Tooltip>
          </li>
        );
      })}
      {marks.map((mark) => {
        const name = markPanelDisplayName(mark.id);
        const onEnemy = mark.target === CombatActor.ENEMY;
        const body = `${compactMarkBlurb(mark.id)} ×${mark.stacks} · ${mark.duration}t.`;
        return (
          <li
            key={`${mark.id}-${mark.owner}-${mark.target}`}
            className="combat-status-strip__row"
          >
            <Tooltip
              content={<CompactTip name={name} body={body} />}
              position={placement === 'under-hp' ? 'bottom' : 'right'}
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
                <span className="combat-hud-icon__badge">×{mark.stacks}</span>
              </span>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
};
