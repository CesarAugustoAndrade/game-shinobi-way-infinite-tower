import React, { useEffect, useRef } from 'react';
import { Swords, Sparkles, Coins, TrendingUp, Package } from 'lucide-react';
import type { Item } from '../../game/types';
import { resolveItemArt } from '../../game/constants/artRegistry';
import ArtIcon from '../shared/ArtIcon';
import { getRarityTextBorderColor } from '../../utils/colorHelpers';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './RewardModal.css';

interface RewardModalProps {
  expGain: number;
  ryoGain: number;
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    statGains: Record<string, number>;
  };
  /** T-035: preview of items that will open in LOOT (or empty). */
  lootPreviews?: Item[];
  /** When true, Continue leads to loot claim (copy only). */
  continuesToLoot?: boolean;
  /** T-087: combat intel gain (effective / fog-scaled). */
  intelGain?: number;
  /** Raw intel before fog when different from effective. */
  baseIntelGain?: number;
  /** Fog note when visibility reduced the gain. */
  fogNote?: string;
  /** T-089: wealth / region Ryo × note under gold. */
  ryoNote?: string;
  onClose: () => void;
}

const STAT_DISPLAY_NAMES: Record<string, string> = {
  willpower: 'Willpower',
  chakra: 'Chakra',
  strength: 'Strength',
  spirit: 'Spirit',
  intelligence: 'Intelligence',
  calmness: 'Calmness',
  speed: 'Speed',
  accuracy: 'Accuracy',
  dexterity: 'Dexterity',
};

const RewardModal: React.FC<RewardModalProps> = ({
  expGain,
  ryoGain,
  levelUp,
  lootPreviews = [],
  continuesToLoot = false,
  intelGain,
  baseIntelGain,
  fogNote,
  ryoNote,
  onClose,
}) => {
  const previewItems = lootPreviews.slice(0, 6);
  const rootRef = useRef<HTMLDivElement>(null);
  useFocusTrap(rootRef);

  // Keyboard: SPACE / ENTER / Escape continue (Escape parity Rest/Intel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      className="reward-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Combat victory rewards"
    >
      <div className="reward-modal__container">
        {/* Header */}
        <div className="reward-modal__header">
          <div className="reward-modal__header-icons">
            <Swords className="reward-modal__header-icon" size={24} />
            <h2 className="reward-modal__title">Victory</h2>
            <Swords className="reward-modal__header-icon" size={24} />
          </div>
          <p className="reward-modal__subtitle">Enemy Defeated</p>
        </div>

        {/* Rewards Section */}
        <div className="reward-modal__body">
          {/* XP and Ryo */}
          <div className="reward-modal__rewards-grid">
            <div className="reward-modal__reward-box reward-modal__reward-box--xp">
              <div className="reward-modal__reward-label">
                <TrendingUp className="reward-modal__reward-icon--xp" size={16} />
                <span className="reward-modal__reward-label-text--xp">Experience</span>
              </div>
              <p className="reward-modal__reward-amount--xp">+{expGain}</p>
            </div>
            <div className="reward-modal__reward-box reward-modal__reward-box--ryo">
              <div className="reward-modal__reward-label">
                <Coins className="reward-modal__reward-icon--ryo" size={16} />
                <span className="reward-modal__reward-label-text--ryo">Gold</span>
              </div>
              <p className="reward-modal__reward-amount--ryo">+{ryoGain}</p>
              {ryoNote && (
                <p className="reward-modal__reward-note">{ryoNote}</p>
              )}
            </div>
          </div>

          {/* T-087: combat intel (fog-honest when reduced) */}
          {typeof intelGain === 'number' && intelGain > 0 && (
            <div className="reward-modal__intel">
              <div className="reward-modal__intel-row">
                <span className="reward-modal__intel-label">Intel</span>
                {typeof baseIntelGain === 'number' && baseIntelGain !== intelGain ? (
                  <span className="reward-modal__intel-value">
                    <span className="reward-modal__intel-base">+{baseIntelGain}%</span>
                    <span className="reward-modal__intel-arrow">→</span>
                    <span>+{intelGain}%</span>
                  </span>
                ) : (
                  <span className="reward-modal__intel-value">+{intelGain}%</span>
                )}
              </div>
              {fogNote && (
                <p className="reward-modal__intel-fog">{fogNote}</p>
              )}
            </div>
          )}

          {/* Level Up Section */}
          {levelUp && (
            <div className="reward-modal__level-up">
              <div className="reward-modal__level-up-header">
                <Sparkles className="reward-modal__level-up-icon" size={20} />
                <span className="reward-modal__level-up-title">Level Up</span>
                <Sparkles className="reward-modal__level-up-icon" size={20} />
              </div>

              <div className="reward-modal__level-numbers">
                <span className="reward-modal__level-old">Level </span>
                <span className="reward-modal__level-old">{levelUp.oldLevel}</span>
                <span className="reward-modal__level-arrow">→</span>
                <span className="reward-modal__level-new">{levelUp.newLevel}</span>
              </div>

              <p className="reward-modal__stat-gains-label">Stats Gained</p>
              <div className="reward-modal__stat-gains">
                {Object.entries(levelUp.statGains)
                  .filter(([, gain]) => gain > 0)
                  .map(([stat, gain]) => (
                    <div key={stat} className="reward-modal__stat-item">
                      <span className="reward-modal__stat-item-name">
                        {STAT_DISPLAY_NAMES[stat] || stat}
                      </span>
                      <span className="reward-modal__stat-item-gain">+{gain}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* T-035: loot preview (components / artifacts before LOOT scene) */}
          {previewItems.length > 0 && (
            <div className="reward-modal__loot-preview">
              <div className="reward-modal__loot-preview-header">
                <Package size={16} className="reward-modal__loot-preview-icon" />
                <span>Spoils Found</span>
              </div>
              <div className="reward-modal__loot-grid">
                {previewItems.map((item) => (
                  <div key={item.id} className="reward-modal__loot-tile" title={item.name}>
                    <ArtIcon art={resolveItemArt(item)} size="md" className="reward-modal__loot-art" />
                    <span className={`reward-modal__loot-name ${getRarityTextBorderColor(item.rarity)}`}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
              {continuesToLoot && (
                <p className="reward-modal__loot-hint">Claim on the next screen</p>
              )}
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="reward-modal__footer">
          <button
            type="button"
            onClick={onClose}
            className="reward-modal__continue-btn"
            autoFocus
          >
            {continuesToLoot ? 'Claim Loot' : 'Continue'}
            <span className="sw-shortcut">Enter</span>
            <span className="sw-shortcut">Space</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardModal;
