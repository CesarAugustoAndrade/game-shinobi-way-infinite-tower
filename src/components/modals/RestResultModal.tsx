/**
 * T-050: Feedback after Rest activity (heal payoff before next room).
 */

import React from 'react';
import { getActivityArt } from '../../game/constants/artRegistry';
import ArtIcon from '../shared/ArtIcon';
import ModalShell, { useModalShellClose } from './ModalShell';
import './RestResultModal.css';

export interface RestResultData {
  hpHeal: number;
  chakraHeal: number;
  healPercent: number;
  chakraRestorePercent: number;
  hpBefore: number;
  hpAfter: number;
  chakraBefore: number;
  chakraAfter: number;
  maxHp: number;
  maxChakra: number;
}

interface RestResultModalProps {
  result: RestResultData;
  onClose: () => void;
}

function RestContinueButton() {
  const dismiss = useModalShellClose();
  return (
    <button type="button" className="rest-result__continue" onClick={dismiss} autoFocus>
      Continue exploring
      <span className="sw-shortcut">Enter</span>
    </button>
  );
}

const RestResultModal: React.FC<RestResultModalProps> = ({ result, onClose }) => {
  const activityArt = getActivityArt('rest');
  const hpPct = result.maxHp > 0 ? Math.min(100, (result.hpAfter / result.maxHp) * 100) : 0;
  const cpPct = result.maxChakra > 0 ? Math.min(100, (result.chakraAfter / result.maxChakra) * 100) : 0;

  return (
    <ModalShell
      ariaLabel="Rest complete"
      className="rest-result"
      containerClassName="rest-result__panel"
      onClose={onClose}
      footer={<RestContinueButton />}
    >
      <div className="rest-result__header">
        <ArtIcon art={activityArt} size="lg" className="rest-result__art" title="Rest" />
        <h2 className="rest-result__title">Rest Complete</h2>
      </div>
      <p className="rest-result__flavor">Breath steadies. Steel cools. The path waits.</p>

      <div className="rest-result__gains">
        <span className="rest-result__gain rest-result__gain--hp">
          +{result.hpHeal} HP ({result.healPercent}%)
        </span>
        <span className="rest-result__gain rest-result__gain--cp">
          +{result.chakraHeal} CP ({result.chakraRestorePercent}%)
        </span>
      </div>

      <div className="rest-result__bars">
        <div className="rest-result__bar-row">
          <span className="rest-result__bar-label">HP</span>
          <div className="rest-result__bar-track">
            <div className="rest-result__bar-fill rest-result__bar-fill--hp" style={{ width: `${hpPct}%` }} />
          </div>
          <span className="rest-result__bar-val">
            {result.hpBefore} → {result.hpAfter}/{result.maxHp}
          </span>
        </div>
        <div className="rest-result__bar-row">
          <span className="rest-result__bar-label">CP</span>
          <div className="rest-result__bar-track">
            <div className="rest-result__bar-fill rest-result__bar-fill--cp" style={{ width: `${cpPct}%` }} />
          </div>
          <span className="rest-result__bar-val">
            {result.chakraBefore} → {result.chakraAfter}/{result.maxChakra}
          </span>
        </div>
      </div>
    </ModalShell>
  );
};

export default RestResultModal;
