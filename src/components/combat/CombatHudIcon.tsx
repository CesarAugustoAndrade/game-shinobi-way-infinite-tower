import React, { useEffect, useState } from 'react';
import './CombatHudIcons.css';

interface CombatHudIconProps {
  src: string;
  emoji: string;
  label: string;
  className?: string;
}

/** Square HUD glyph. Image first; emoji if the plate 404s. */
export const CombatHudIcon: React.FC<CombatHudIconProps> = ({
  src,
  emoji,
  label,
  className = '',
}) => {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (!failed && src) {
    return (
      <img
        src={src}
        alt=""
        title={label}
        aria-hidden="true"
        className={`combat-hud-icon ${className}`.trim()}
        draggable={false}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`combat-hud-icon combat-hud-icon--emoji ${className}`.trim()} aria-hidden="true">
      {emoji}
    </span>
  );
};
