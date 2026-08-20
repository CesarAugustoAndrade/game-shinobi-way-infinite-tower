import React from 'react';
import type { PendingDiscover } from '../../game/systems/ResolveSkillSystem';
import { roleBadgeLabel } from '../../game/systems/combatSkillViewModel';
import './DiscoverPicker.css';

interface DiscoverPickerProps {
  pending: PendingDiscover;
  onChoose: (skillId: string) => void;
}

export const DiscoverPicker: React.FC<DiscoverPickerProps> = ({ pending, onChoose }) => {
  return (
    <section
      className="discover-picker"
      data-testid="discover-picker"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discover-picker-title"
    >
      <h3 id="discover-picker-title" className="discover-picker__title">
        Discover
      </h3>
      <p className="discover-picker__hint">Choose one technique for your hand.</p>
      <ul className="discover-picker__list">
        {pending.candidates.map((entry) => {
          const cooldownCue =
            entry.disabled || entry.reasons.includes('cooldown') ? 'On cooldown — enters hand disabled' : null;
          return (
            <li key={entry.skill.id} className="discover-picker__row">
              <button
                type="button"
                className="discover-picker__btn"
                data-testid="discover-candidate"
                data-skill-id={entry.skill.id}
                onClick={() => onChoose(entry.skill.id)}
              >
                <span className="discover-picker__name">{entry.skill.name}</span>
                <span className="discover-picker__role">{roleBadgeLabel(entry.skill)}</span>
                {cooldownCue && <span className="discover-picker__cd">{cooldownCue}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
