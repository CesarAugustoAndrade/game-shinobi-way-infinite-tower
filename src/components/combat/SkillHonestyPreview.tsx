import React from 'react';
import type { HonestyPreview } from '../../game/systems/combatSkillViewModel';

interface SkillHonestyPreviewProps {
  preview: HonestyPreview;
}

export const SkillHonestyPreview: React.FC<SkillHonestyPreviewProps> = ({ preview }) => {
  return (
    <div className="skill-honesty-preview" data-testid="skill-honesty-preview">
      <span data-testid="preview-base">base {preview.base}</span>
      {preview.enhanced != null && (
        <span data-testid="preview-enhanced">
          enhanced {preview.enhanced}
          {preview.sources.map((source) => (
            <span key={source.name}> {source.name}</span>
          ))}
        </span>
      )}
    </div>
  );
};
