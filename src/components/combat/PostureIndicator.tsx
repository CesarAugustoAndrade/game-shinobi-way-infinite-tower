import React from 'react';
import { Posture } from '../../game/types';
import { describePosture } from '../../game/systems/PostureSystem';
import { LaunchProperties } from '../../config/featureFlags';
import Tooltip from '../shared/Tooltip';
import { Swords, Scale, Shield } from 'lucide-react';
import './PostureIndicator.css';

/** Fixed display order for the three stances. */
const POSTURE_ORDER: Posture[] = [
  Posture.AGGRESSIVE,
  Posture.BALANCED,
  Posture.DEFENSIVE,
];

/** Identity icon per stance (pixel-arcade segmented control). */
const POSTURE_ICON: Record<Posture, React.ReactNode> = {
  [Posture.AGGRESSIVE]: <Swords />,
  [Posture.BALANCED]: <Scale />,
  [Posture.DEFENSIVE]: <Shield />,
};

interface PostureIndicatorProps {
  /** The active combat posture. */
  posture: Posture;
  /** Action Points left this turn (a switch costs POSTURE_SWITCH_AP_COST). */
  currentAp: number;
  /** Whether it is the player's turn (the control is inert otherwise). */
  isPlayerTurn: boolean;
  /** Switch the active posture (costs AP). */
  onChangePosture: (next: Posture) => void;
}

/**
 * Segmented stance control for the AP combat economy (T-004).
 *
 * Highlights the active posture and lets the player switch (which the parent
 * charges 1 AP). Each option carries a tooltip describing its draw bias and the
 * reciprocal damage trade-off, so the choice stays legible. Pure presentation —
 * all state lives with the caller via `onChangePosture`.
 */
export const PostureIndicator: React.FC<PostureIndicatorProps> = ({
  posture,
  currentAp,
  isPlayerTurn,
  onChangePosture,
}) => {
  const affordable = currentAp >= LaunchProperties.POSTURE_SWITCH_AP_COST;

  return (
    <div className="posture-indicator">
      <span className="posture-indicator__title">Stance</span>
      <div className="posture-indicator__options" role="group" aria-label="Combat stance">
        {POSTURE_ORDER.map((p) => {
          const profile = describePosture(p);
          const isActive = p === posture;
          const disabled = !isPlayerTurn || (!isActive && !affordable);

          return (
            <Tooltip
              key={p}
              position="top"
              content={
                <div className="combat-tooltip">
                  <div className="combat-tooltip__title">{profile.label} Stance</div>
                  <div className="combat-tooltip__description">{profile.drawBias}.</div>
                  <div className="combat-tooltip__mechanics">
                    <div>- Damage dealt: {Math.round(profile.damageMod * 100)}%</div>
                    <div>- Damage taken: {Math.round(profile.defenseMod * 100)}%</div>
                    {!isActive && (
                      <div>- Switch cost: {LaunchProperties.POSTURE_SWITCH_AP_COST} AP</div>
                    )}
                  </div>
                </div>
              }
            >
              <button
                type="button"
                className={`posture-indicator__btn ${isActive ? 'posture-indicator__btn--active' : ''}`}
                onClick={() => { if (!isActive) onChangePosture(p); }}
                disabled={disabled}
                aria-pressed={isActive}
              >
                <span className="posture-indicator__icon">{POSTURE_ICON[p]}</span>
                <span className="posture-indicator__label">{profile.label}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
