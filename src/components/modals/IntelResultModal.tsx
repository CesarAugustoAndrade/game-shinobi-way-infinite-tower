/**
 * T-049: Feedback after Info Gathering activity (intel peak before next room).
 */

import React, { useEffect, useCallback } from 'react';
import { getActivityArt } from '../../game/constants/artRegistry';
import ArtIcon from '../shared/ArtIcon';
import './IntelResultModal.css';

export interface IntelResultData {
  flavorText: string;
  /** Effective gain applied to the bar (after fog). */
  intelGain: number;
  intelBefore: number;
  intelAfter: number;
  /**
   * T-086: raw activity gain before visibility_penalty (when different from effective).
   */
  baseIntelGain?: number;
  /** Optional short fog note e.g. "Fog −20% visibility" */
  fogNote?: string | null;
}

interface IntelResultModalProps {
  result: IntelResultData;
  onClose: () => void;
}

const IntelResultModal: React.FC<IntelResultModalProps> = ({ result, onClose }) => {
  const activityArt = getActivityArt('infoGathering');

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [handleKey]);

  const afterPct = Math.min(100, result.intelAfter);

  return (
    <div className="intel-result" role="dialog" aria-modal="true" aria-label="Intel gathered">
      <div className="intel-result__panel">
        <div className="intel-result__header">
          <ArtIcon art={activityArt} size="lg" className="intel-result__art" title="Intel Gathering" />
          <h2 className="intel-result__title">Intel Gathered</h2>
        </div>
        <p className="intel-result__flavor">{result.flavorText}</p>
        <div className="intel-result__gain">
          {typeof result.baseIntelGain === 'number'
            && result.baseIntelGain !== result.intelGain ? (
            <>
              <span className="intel-result__gain-base">+{result.baseIntelGain}%</span>
              <span className="intel-result__gain-arrow">→</span>
              <span className="intel-result__gain-effective">+{result.intelGain}% intel</span>
            </>
          ) : (
            <>+{result.intelGain}% intel</>
          )}
        </div>
        {result.fogNote && (
          <p className="intel-result__fog" role="status">{result.fogNote}</p>
        )}
        <div className="intel-result__bar-block">
          <div className="intel-result__bar-labels">
            <span>{result.intelBefore}%</span>
            <span>→</span>
            <span className="intel-result__bar-after">{afterPct}%</span>
          </div>
          <div className="intel-result__bar-track">
            <div
              className="intel-result__bar-fill"
              style={{ width: `${afterPct}%` }}
            />
          </div>
        </div>
        <button type="button" className="intel-result__continue" onClick={onClose}>
          Continue
          <span className="sw-shortcut">Enter</span>
        </button>
      </div>
    </div>
  );
};

export default IntelResultModal;
