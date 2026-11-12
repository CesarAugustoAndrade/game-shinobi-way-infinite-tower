import React from 'react';

interface TacticalPanelIconProps {
  title: string;
  icon: React.ReactNode;
  titleClassName: string;
}

/** Icon + label header for the left tactical column. No hover essay. */
export const TacticalPanelIcon: React.FC<TacticalPanelIconProps> = ({
  title,
  icon,
  titleClassName,
}) => {
  return (
    <h3 className={titleClassName}>
      <span className="tactical-panel-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="tactical-panel-icon__label">{title}</span>
    </h3>
  );
};
