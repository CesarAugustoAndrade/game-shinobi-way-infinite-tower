import React, { useState } from 'react';
import type { SkillConfig } from '../../game/types';
import type { PreviewSource } from '../../game/systems/combatSkillViewModel';
import './CombatModesPanel.css';

interface SkillConfigInspectorProps {
  config: SkillConfig;
  combatLocked?: boolean;
  weightTerms?: PreviewSource[];
  weightTotal?: number;
  defaultOpen?: boolean;
}

export const SkillConfigInspector: React.FC<SkillConfigInspectorProps> = ({
  config,
  combatLocked = false,
  weightTerms = [],
  weightTotal,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="skill-config-inspector" data-testid="skill-config-inspector" aria-label="Skill Config">
      <h3 className="skill-config-inspector__title">Skill Config</h3>
      <p data-testid="skill-config-main">
        Main Attack: {config.mainAttackId ?? '—'}
        {combatLocked ? ' (locked in combat)' : ''}
      </p>
      <p data-testid="skill-config-priority">
        Mode upkeep: {config.modeUpkeepPriority.join(' → ') || '—'}
      </p>
      <button type="button" data-testid="weight-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide weight' : 'Weight breakdown'}
      </button>
      {open && (
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
