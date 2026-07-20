import React from 'react';
import { Player, PrimaryAttributes } from '../../game/types';
import {
  Swords, Brain, Flame, Droplet, Target, Wind, Sparkles, User, Heart, Eye
} from 'lucide-react';
import { isFocusStat } from '../../game/utils/itemFocusMatch';
import Tooltip from '../shared/Tooltip';
import './character.css';

interface PrimaryStatsPanelProps {
  player: Player;
  effectivePrimary: PrimaryAttributes;
  /**
   * T-101: region equipmentFocus — mark matching primary stats with ★.
   */
  equipmentFocus?: string[] | null;
}

const PrimaryStatsPanel: React.FC<PrimaryStatsPanelProps> = ({
  player,
  effectivePrimary,
  equipmentFocus = null,
}) => {
  const renderPrimaryStat = (
    icon: React.ReactNode,
    label: string,
    key: keyof PrimaryAttributes,
    subLabel: string,
    description: string,
    iconClass: string
  ) => {
    const base = player.primaryStats[key];
    const effective = effectivePrimary[key];
    const diff = effective - base;
    const isFocus = isFocusStat(String(key), equipmentFocus) || isFocusStat(label, equipmentFocus);

    const tooltipContent = (
      <div className="primary-stats__tooltip">
        <div className="primary-stats__tooltip-title">{subLabel}</div>
        <div className="primary-stats__tooltip-desc">{description}</div>
        <div className="primary-stats__tooltip-breakdown">
          <div className="primary-stats__tooltip-row">
            <span>Base</span>
            <span className="primary-stats__stat-value--neutral">{base}</span>
          </div>
          <div className="primary-stats__tooltip-row">
            <span>Bonus</span>
            <span className={diff > 0 ? "primary-stats__stat-value--positive" : diff < 0 ? "primary-stats__stat-value--negative" : ""}>
              {diff >= 0 ? '+' : ''}{diff}
            </span>
          </div>
          <div className="primary-stats__tooltip-row primary-stats__tooltip-row--total">
            <span>Total</span>
            <span className="primary-stats__stat-value--neutral">{effective}</span>
          </div>
        </div>
      </div>
    );

    return (
      <Tooltip content={tooltipContent} position="right">
        <div className={`primary-stats__stat ${isFocus ? 'primary-stats__stat--focus' : ''}`}>
          <div className="primary-stats__stat-left">
            <span className={`primary-stats__stat-icon ${iconClass}`}>{icon}</span>
            <div className="primary-stats__stat-label">
              {label}
              {isFocus && (
                <span className="primary-stats__focus-mark" title="Region Focus stat"> ★</span>
              )}
            </div>
          </div>
          <div className="primary-stats__stat-right">
            <span className={`primary-stats__stat-value ${
              diff > 0 ? 'primary-stats__stat-value--positive' :
              diff < 0 ? 'primary-stats__stat-value--negative' :
              'primary-stats__stat-value--neutral'
            }`}>
              {effective}
            </span>
            {diff !== 0 && (
              <span className="primary-stats__stat-diff">
                ({diff >= 0 ? '+' : ''}{diff})
              </span>
            )}
          </div>
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="primary-stats">
      {/* Header: Clan & Element */}
      <div className="primary-stats__header">
        <div className="primary-stats__avatar">
          <User size={16} className="primary-stats__avatar-icon" />
        </div>
        <div className="primary-stats__info">
          <div className="primary-stats__clan">{player.clan} Clan</div>
          <div className="primary-stats__element">Affinity: {player.element}</div>
        </div>
      </div>

      {/* THE BODY — Willpower, Chakra, Strength */}
      <div className="primary-stats__category">
        <h3 className="primary-stats__category-title primary-stats__category-title--body">
          <Swords size={10} /> The Body
        </h3>
        <div className="primary-stats__list">
          {renderPrimaryStat(<Heart size={12} />, "Willpower", "willpower", "Willpower", "Grit & survival instinct. Governs Max HP, Guts chance (survive fatal blow), and HP regeneration.", "primary-stats__stat-icon--willpower")}
          {renderPrimaryStat(<Droplet size={12} />, "Chakra", "chakra", "Chakra", "Raw energy capacity. Determines Max Chakra pool size.", "primary-stats__stat-icon--chakra")}
          {renderPrimaryStat(<Swords size={12} />, "Strength", "strength", "Strength", "Physical conditioning. Governs Taijutsu damage and Physical Defense.", "primary-stats__stat-icon--strength")}
        </div>
      </div>

      {/* THE MIND — Spirit, Intelligence, Calmness */}
      <div className="primary-stats__category">
        <h3 className="primary-stats__category-title primary-stats__category-title--mind">
          <Brain size={10} /> The Mind
        </h3>
        <div className="primary-stats__list">
          {renderPrimaryStat(<Flame size={12} />, "Spirit", "spirit", "Spirit", "Nature affinity. Governs Elemental Ninjutsu damage and Elemental Defense.", "primary-stats__stat-icon--spirit")}
          {renderPrimaryStat(<Brain size={12} />, "Intelligence", "intelligence", "Intelligence", "Tactical acumen. Required to learn complex Jutsus. Governs Chakra regeneration.", "primary-stats__stat-icon--intelligence")}
          {renderPrimaryStat(<Eye size={12} />, "Calmness", "calmness", "Calmness", "Mental fortitude. Governs Genjutsu damage/defense and Status Resistance.", "primary-stats__stat-icon--calmness")}
        </div>
      </div>

      {/* THE TECHNIQUE — Speed, Accuracy, Dexterity */}
      <div className="primary-stats__category">
        <h3 className="primary-stats__category-title primary-stats__category-title--technique">
          <Sparkles size={10} /> The Technique
        </h3>
        <div className="primary-stats__list">
          {renderPrimaryStat(<Wind size={12} />, "Speed", "speed", "Speed", "Reflexes & flow. Governs Initiative, Melee Hit chance, Evasion, and bonus AP.", "primary-stats__stat-icon--speed")}
          {renderPrimaryStat(<Target size={12} />, "Accuracy", "accuracy", "Accuracy", "Marksmanship. Governs Ranged Hit chance and Ranged Critical Damage bonus.", "primary-stats__stat-icon--accuracy")}
          {renderPrimaryStat(<Sparkles size={12} />, "Dexterity", "dexterity", "Dexterity", "Lethal precision. Governs Critical Hit chance for all attack types.", "primary-stats__stat-icon--dexterity")}
        </div>
      </div>
    </div>
  );
};

export default PrimaryStatsPanel;
