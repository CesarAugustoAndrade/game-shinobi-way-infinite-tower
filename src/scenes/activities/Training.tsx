import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  TrainingActivity,
  TrainingCostType,
  TrainingOffer,
  PrimaryStat,
  Player,
  DerivedStats,
} from '../../game/types';
import {
  Heart,
  Droplet,
  Sword,
  Flame,
  Brain,
  Eye,
  Wind,
  Target,
  Sparkles,
  Swords,
  Coins,
  type LucideIcon,
} from 'lucide-react';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import { isFocusStat } from '../../game/utils/itemFocusMatch';
import './Training.css';

interface TrainingProps {
  training: TrainingActivity;
  player: Player;
  playerStats: { derived: DerivedStats };
  onTrain: (stat: PrimaryStat, costType: TrainingCostType) => void;
  onSkip: () => void;
  /** Biome background image — fills the scene via SceneBackdrop. */
  background?: string;
  /**
   * T-112: region equipmentFocus — mark matching training stats for build planning.
   */
  equipmentFocus?: string[] | null;
}

type StatCategory = 'body' | 'mind' | 'technique';

interface StatInfo {
  category: StatCategory;
  categoryLabel: string;
  icon: LucideIcon;
  description: string;
  benefits: string[];
}

const STAT_INFO: Record<PrimaryStat, StatInfo> = {
  [PrimaryStat.WILLPOWER]: {
    category: 'body',
    categoryLabel: 'THE BODY',
    icon: Heart,
    description: 'Your vital force and will to survive.',
    benefits: ['Max HP', 'Guts %', 'HP Regen'],
  },
  [PrimaryStat.CHAKRA]: {
    category: 'body',
    categoryLabel: 'THE BODY',
    icon: Droplet,
    description: 'Your spiritual energy reservoir.',
    benefits: ['Max Chakra'],
  },
  [PrimaryStat.STRENGTH]: {
    category: 'body',
    categoryLabel: 'THE BODY',
    icon: Sword,
    description: 'Raw physical power.',
    benefits: ['Physical ATK', 'Physical DEF'],
  },
  [PrimaryStat.SPIRIT]: {
    category: 'mind',
    categoryLabel: 'THE MIND',
    icon: Flame,
    description: 'Elemental affinity and inner flame.',
    benefits: ['Elemental ATK', 'Elemental DEF'],
  },
  [PrimaryStat.INTELLIGENCE]: {
    category: 'mind',
    categoryLabel: 'THE MIND',
    icon: Brain,
    description: 'Mental acuity for complex jutsu.',
    benefits: ['Jutsu Req', 'Chakra Regen'],
  },
  [PrimaryStat.CALMNESS]: {
    category: 'mind',
    categoryLabel: 'THE MIND',
    icon: Eye,
    description: 'Fortitude against illusions.',
    benefits: ['Mental DEF', 'Status Resist'],
  },
  [PrimaryStat.SPEED]: {
    category: 'technique',
    categoryLabel: 'THE TECHNIQUE',
    icon: Wind,
    description: 'Swiftness in combat.',
    benefits: ['Initiative', 'Evasion', 'Melee Hit'],
  },
  [PrimaryStat.ACCURACY]: {
    category: 'technique',
    categoryLabel: 'THE TECHNIQUE',
    icon: Target,
    description: 'Precision for ranged attacks.',
    benefits: ['Ranged Hit', 'Ranged Crit DMG'],
  },
  [PrimaryStat.DEXTERITY]: {
    category: 'technique',
    categoryLabel: 'THE TECHNIQUE',
    icon: Sparkles,
    description: 'Finesse for critical strikes.',
    benefits: ['Crit Chance'],
  },
};

const STAT_DISPLAY_NAMES: Record<PrimaryStat, string> = {
  [PrimaryStat.WILLPOWER]: 'Willpower',
  [PrimaryStat.CHAKRA]: 'Chakra',
  [PrimaryStat.STRENGTH]: 'Strength',
  [PrimaryStat.SPIRIT]: 'Spirit',
  [PrimaryStat.INTELLIGENCE]: 'Intelligence',
  [PrimaryStat.CALMNESS]: 'Calmness',
  [PrimaryStat.SPEED]: 'Speed',
  [PrimaryStat.ACCURACY]: 'Accuracy',
  [PrimaryStat.DEXTERITY]: 'Dexterity',
};

const COST_LABELS: Record<TrainingCostType, string> = {
  hp: 'HP',
  chakra: 'CP',
  ryo: 'Ryo',
};

function formatPaidCost(costType: TrainingCostType, cost: number): string {
  if (costType === 'hp') return `${cost} HP`;
  if (costType === 'chakra') return `${cost} CP`;
  return `${cost} ryo`;
}

/* ===========================================
   Offer Card
   =========================================== */

interface OfferCardProps {
  offer: TrainingOffer;
  index: number;
  currentValue: number;
  isSelected: boolean;
  isDimmed: boolean;
  affordable: boolean;
  isFocus: boolean;
  onSelect: () => void;
  onConfirm: () => void;
}

const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  index,
  currentValue,
  isSelected,
  isDimmed,
  affordable,
  isFocus,
  onSelect,
  onConfirm,
}) => {
  const info = STAT_INFO[offer.stat];
  const Icon = info.icon;
  const displayName = STAT_DISPLAY_NAMES[offer.stat];
  const CostIcon =
    offer.costType === 'hp' ? Heart : offer.costType === 'chakra' ? Droplet : Coins;

  const handleClick = useCallback(() => {
    if (!affordable || isDimmed) return;
    if (isSelected) onConfirm();
    else onSelect();
  }, [affordable, isDimmed, isSelected, onConfirm, onSelect]);

  return (
    <div
      className={[
        'train-offer',
        `train-offer--${offer.costType}`,
        `train-offer--cat-${info.category}`,
        isSelected ? 'train-offer--selected' : '',
        isDimmed ? 'train-offer--dimmed' : '',
        !affordable ? 'train-offer--disabled' : '',
        isFocus ? 'train-offer--focus' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      role="button"
      aria-pressed={isSelected}
      aria-disabled={!affordable}
      tabIndex={!affordable || isDimmed ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && affordable && !isDimmed && !isSelected) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="train-offer__header">
        <div className="train-offer__header-left">
          <span className="train-offer__index">{['A', 'S', 'D', 'Z', 'X', 'C'][index] ?? (index + 1)}</span>
          <span className="train-offer__category">{info.categoryLabel}</span>
          {isFocus && (
            <span className="train-offer__focus-badge" title="Matches region Focus">
              Focus
            </span>
          )}
        </div>
        <span className={`train-offer__stat-val train-offer__stat-val--${info.category}`}>
          {currentValue}
        </span>
      </div>

      <div className="train-offer__title">
        <div className={`train-offer__icon train-offer__icon--${info.category}`}>
          <Icon size={18} aria-hidden />
        </div>
        <span className="train-offer__name">
          {displayName}
          {isFocus && <span className="train-offer__focus-mark"> ★</span>}
        </span>
        <span className="train-offer__gain" title="Stat gain">
          +{offer.gain}
        </span>
      </div>

      <p className="train-offer__desc">{info.description}</p>

      <div className="train-offer__benefits">
        {info.benefits.map((b) => (
          <span key={b} className="train-offer__benefit">
            {b}
          </span>
        ))}
      </div>

      <div className={`train-offer__cost train-offer__cost--${offer.costType}`}>
        <CostIcon size={14} aria-hidden />
        <span className="train-offer__cost-label">
          {COST_LABELS[offer.costType]} Toll
        </span>
        <span className="train-offer__cost-amount">{offer.cost}</span>
      </div>

      {!affordable && (
        <div className="train-offer__gate">Not enough {COST_LABELS[offer.costType]}</div>
      )}

      {isSelected && affordable && (
        <span className="train-offer__confirm-tag" aria-hidden="true">
          Confirm ▸
        </span>
      )}
    </div>
  );
};

/* ===========================================
   Result view
   =========================================== */

interface TrainingResultView {
  offer: TrainingOffer;
  before: number;
  after: number;
}

/* ===========================================
   Main Training Component
   =========================================== */

const Training: React.FC<TrainingProps> = ({
  training,
  player,
  onTrain,
  onSkip,
  background,
  equipmentFocus = null,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<TrainingResultView | null>(null);
  const resultContinueLockRef = useRef(false);

  const getStatValue = useCallback(
    (stat: PrimaryStat): number => {
      const statKey = stat.toLowerCase() as keyof typeof player.primaryStats;
      return player.primaryStats[statKey] || 0;
    },
    [player.primaryStats],
  );

  const canAffordOffer = useCallback(
    (offer: TrainingOffer): boolean => {
      if (offer.costType === 'hp') return player.currentHp > offer.cost;
      if (offer.costType === 'chakra') return player.currentChakra >= offer.cost;
      return player.ryo >= offer.cost;
    },
    [player.currentHp, player.currentChakra, player.ryo],
  );

  const handleSelect = useCallback((index: number) => {
    const offer = training.options[index];
    if (!offer || !canAffordOffer(offer)) return;
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, [training.options, canAffordOffer]);

  const handleConfirm = useCallback((index: number) => {
    if (resultContinueLockRef.current || result) return;
    const offer = training.options[index];
    if (!offer || !canAffordOffer(offer)) return;
    const before = getStatValue(offer.stat);
    setResult({
      offer,
      before,
      after: before + offer.gain,
    });
  }, [training.options, canAffordOffer, getStatValue, result]);

  const handleResultContinue = useCallback(() => {
    if (!result || resultContinueLockRef.current) return;
    resultContinueLockRef.current = true;
    const { offer } = result;
    setResult(null);
    onTrain(offer.stat, offer.costType);
  }, [result, onTrain]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) return;
      // Bag / character overlay owns Esc (do not skip training under it)
      if (document.querySelector('.explore-overlay')) return;

      if (result) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          handleResultContinue();
        }
        return;
      }

      const optionKeys = ['A', 'S', 'D', 'Z', 'X', 'C'];
      const upperKey = e.key.toUpperCase();
      let index = -1;
      if (e.key >= '1' && e.key <= '6') {
        index = parseInt(e.key, 10) - 1;
      } else if (optionKeys.includes(upperKey)) {
        index = optionKeys.indexOf(upperKey);
      }

      if (index >= 0 && index < training.options.length) {
        e.preventDefault();
        handleSelect(index);
      }

      if (e.key === 'Enter' && selectedIndex !== null) {
        e.preventDefault();
        handleConfirm(selectedIndex);
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedIndex !== null) {
          setSelectedIndex(null);
        } else {
          onSkip();
        }
      }
    },
    [
      result,
      handleResultContinue,
      training.options.length,
      handleSelect,
      selectedIndex,
      handleConfirm,
      onSkip,
    ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (result) {
    const { offer, before, after } = result;
    return (
      <SceneBackdrop background={background} dim={0.28}>
        <div className="training training--result">
          <div className="training__result" role="status">
            <h2 className="training__result-title">Session Sealed</h2>
            <p className="training__result-intensity">
              {COST_LABELS[offer.costType]} regimen
            </p>
            <div className="training__result-stat">
              <span className="training__result-stat-name">
                {STAT_DISPLAY_NAMES[offer.stat]}
              </span>
              <span className="training__result-stat-delta">
                {before} → <strong>{after}</strong>
                <span className="training__result-gain"> (+{offer.gain})</span>
              </span>
            </div>
            <div className="training__result-cost">
              <span>Paid {formatPaidCost(offer.costType, offer.cost)}</span>
            </div>
            <button
              type="button"
              className="training__result-continue"
              onClick={handleResultContinue}
            >
              Continue
              <span className="sw-shortcut">Enter</span>
              <span className="sw-shortcut">Esc</span>
            </button>
          </div>
        </div>
      </SceneBackdrop>
    );
  }

  return (
    <SceneBackdrop background={background} dim={0.28}>
      <div className="training" role="region" aria-label="Training Grounds">
        <header className="training__dojo">
          <div className="training__dojo-frame">
            <Swords size={40} className="training__dojo-icon" />
          </div>
          <div className="training__dojo-nameplate">
            <span className="training__dojo-role">Training Grounds</span>
          </div>
          <p className="training__dojo-quote">
            Blood, chakra, or coin — pick the toll. One regimen. One mark.
          </p>
          {equipmentFocus && equipmentFocus.length > 0 && (
            <div className="training__focus-strip" aria-label="Region Focus stats">
              <span className="training__focus-label">Region Focus</span>
              {equipmentFocus.map((s) => (
                <span key={s} className="training__focus-chip">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="training__path-bar">
          <div className="training__divider">▸ Choose One Regimen</div>
          <div className="training__hints">
            <span className="training__hint">
              <span className="sw-shortcut">A</span>-
              <span className="sw-shortcut">D</span> Select
            </span>
            <span className="training__hint">
              <span className="sw-shortcut">Enter</span> Confirm
            </span>
            <span className="training__hint">
              <span className="sw-shortcut">Esc</span> Skip / Deselect
            </span>
            <span className="training__hint">
              <span className="sw-shortcut">I</span> Bag
            </span>
            <span className="training__hint">
              <span className="sw-shortcut">C</span> Character
            </span>
          </div>
        </div>

        <div className="training__offers" role="list">
          {training.options.map((offer, idx) => (
            <OfferCard
              key={`${offer.stat}-${offer.costType}`}
              offer={offer}
              index={idx}
              currentValue={getStatValue(offer.stat)}
              isSelected={selectedIndex === idx}
              isDimmed={selectedIndex !== null && selectedIndex !== idx}
              affordable={canAffordOffer(offer)}
              isFocus={isFocusStat(offer.stat, equipmentFocus)}
              onSelect={() => handleSelect(idx)}
              onConfirm={() => handleConfirm(idx)}
            />
          ))}
        </div>

        <div className="training__footer">
          <button type="button" className="training__skip" onClick={onSkip}>
            Leave without training
            <span className="sw-shortcut">Esc</span>
          </button>
        </div>
      </div>
    </SceneBackdrop>
  );
};

export default Training;
