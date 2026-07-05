import React, { useEffect } from 'react';
import { Swords, Sparkles, Coins, TrendingUp } from 'lucide-react';
import './RewardModal.css';

interface RewardModalProps {
  expGain: number;
  ryoGain: number;
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    statGains: Record<string, number>;
  };
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
  onClose,
}) => {
  // Keyboard shortcut: SPACE/ENTER to continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    // Use capture phase to intercept before other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  return (
    <div className="reward-modal">
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
            </div>
          </div>

          {/* Level Up Section */}
          {levelUp && (
            <div className="reward-modal__level-up">
              <div className="reward-modal__level-up-header">
                <Sparkles className="reward-modal__level-up-icon" size={20} />
                <span className="reward-modal__level-up-title">Level Up!</span>
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
        </div>

        {/* Continue Button */}
        <div className="reward-modal__footer">
          <button
            type="button"
            onClick={onClose}
            className="reward-modal__continue-btn"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardModal;
