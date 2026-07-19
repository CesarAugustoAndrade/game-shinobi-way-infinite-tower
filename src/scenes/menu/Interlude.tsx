/**
 * Post-boss interlude (T-023): narrative + full heal + boon 1-of-3.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CampaignBoon } from '../../game/systems/CampaignSystem';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import './Interlude.css';

interface InterludeProps {
  regionName: string;
  title: string;
  body: string;
  nextRegionName: string;
  boons: CampaignBoon[];
  runSummary: {
    level: number;
    ryo: number;
    locationsCleared: number;
    regionsCompleted: number;
  };
  onChooseBoon: (boon: CampaignBoon) => void;
  background?: string;
}

const Interlude: React.FC<InterludeProps> = ({
  regionName,
  title,
  body,
  nextRegionName,
  boons,
  runSummary,
  onChooseBoon,
  background,
}) => {
  const [selected, setSelected] = useState<number | null>(null);

  const confirm = useCallback(() => {
    if (selected == null) return;
    const boon = boons[selected];
    if (boon) onChooseBoon(boon);
  }, [selected, boons, onChooseBoon]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '3') {
        e.preventDefault();
        const i = parseInt(e.key, 10) - 1;
        if (boons[i]) setSelected(i);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [boons, confirm]);

  return (
    <div className="interlude">
      <SceneBackdrop background={background} dim={0.35}>
        <div className="interlude__panel">
          <p className="interlude__eyebrow">Region Cleared · {regionName}</p>
          <h1 className="interlude__title">{title}</h1>
          <p className="interlude__body">{body}</p>

          <div className="interlude__summary">
            <span>Lv.{runSummary.level}</span>
            <span>💰 {runSummary.ryo}</span>
            <span>📍 {runSummary.locationsCleared}</span>
            <span>🏛 {runSummary.regionsCompleted} region(s)</span>
          </div>

          <p className="interlude__heal">✦ Full heal applied on continue</p>
          <h2 className="interlude__boon-heading">Choose a boon (1 of 3)</h2>

          <div className="interlude__boons">
            {boons.map((boon, i) => (
              <button
                key={boon.id}
                type="button"
                className={`interlude__boon ${selected === i ? 'interlude__boon--selected' : ''}`}
                onClick={() => setSelected(i)}
              >
                <span className="interlude__boon-idx">{i + 1}</span>
                <span className="interlude__boon-kind">{boon.kind}</span>
                <span className="interlude__boon-title">{boon.title}</span>
                <span className="interlude__boon-desc">{boon.description}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="interlude__continue"
            disabled={selected == null}
            onClick={confirm}
          >
            Continue to {nextRegionName}
            <span className="interlude__key">Enter</span>
          </button>
        </div>
      </SceneBackdrop>
    </div>
  );
};

export default Interlude;
