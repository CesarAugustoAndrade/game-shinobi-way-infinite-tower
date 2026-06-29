import React from 'react';
import {
  Player,
  Enemy,
  Skill,
  DamageType,
  CharacterStats,
  ActionType,
} from '../../game/types';
import Tooltip from '../shared/Tooltip';
import { SkillCard } from './SkillCard';
import { getApCost } from '../../game/constants/combatCards';
import { calculateDamage } from '../../game/systems/StatSystem';
import { getElementEffectiveness } from '../../game/constants';
import {
  formatScalingStat,
  getStatColor,
  getElementColor,
  getEffectColor,
  getEffectIcon,
  formatEffectDescription,
  getAttackMethodDescription,
  getDamagePropertyDescription,
  getDamageTypeDescription,
} from '../../game/utils/tooltipFormatters';
import './Hand.css';

/** Keyboard shortcuts for the (up to 4) hand slots. Shared with Combat.tsx. */
export const HAND_SHORTCUTS = ['Z', 'X', 'C', 'V'] as const;

interface HandProps {
  /** Cards drawn this turn, already resolved to their live skill objects. */
  cards: Skill[];
  player: Player;
  playerStats: CharacterStats;
  enemy: Enemy;
  enemyStats: CharacterStats;
  /** Whether it is the player's turn (cards are inert during the enemy turn). */
  isPlayerTurn: boolean;
  /** Single source of truth for playability (resources + AP + cooldown + stun). */
  canUseSkill: (skill: Skill) => boolean;
  onUseSkill: (skill: Skill) => void;
  getDamageTypeColor: (dt: DamageType) => string;
}

/**
 * The player's hand of up to four cards for the AP combat economy (T-004).
 *
 * Pure presentation: it renders one {@link SkillCard} per drawn card with its
 * Z/X/C/V shortcut and AP cost, and visually dims cards that cannot be afforded
 * (the parent's `canUseSkill` already folds AP into its verdict). All gameplay
 * decisions stay with the caller — this component only displays them.
 */
export const Hand: React.FC<HandProps> = ({
  cards,
  player,
  playerStats,
  enemy,
  enemyStats,
  isPlayerTurn,
  canUseSkill,
  onUseSkill,
  getDamageTypeColor,
}) => {
  const renderCard = (skill: Skill, index: number) => {
    const apCost = getApCost(skill);
    const usable = canUseSkill(skill) && isPlayerTurn;

    const prediction = calculateDamage(
      playerStats.effectivePrimary,
      playerStats.derived,
      enemyStats.effectivePrimary,
      enemyStats.derived,
      skill,
      player.element,
      enemy.element
    );

    const effectiveness = getElementEffectiveness(skill.element, enemy.element);
    const isSuperEffective = effectiveness > 1.0;
    const shortcutKey = HAND_SHORTCUTS[index];

    return (
      <Tooltip
        key={skill.id}
        position="top"
        content={
          <div className="combat-tooltip combat-tooltip--wide">
            {/* Header */}
            <div className="combat-tooltip__header">
              <div>
                <div className="combat-tooltip__title">{skill.name}</div>
                <div className="combat-tooltip__subtitle">
                  <span className="combat-tooltip__tier">{skill.tier}</span>
                  <span className={
                    skill.actionType === ActionType.SIDE ? 'combat-tooltip__action--side' :
                    skill.actionType === ActionType.TOGGLE ? 'combat-tooltip__action--toggle' :
                    'combat-tooltip__action--main'
                  }>
                    {skill.actionType || 'MAIN'} Action
                  </span>
                </div>
              </div>
              <span className="combat-tooltip__level">Lv.{skill.level || 1}</span>
            </div>

            {/* Description */}
            <div className="combat-tooltip__section">
              <div className="combat-tooltip__description">{skill.description}</div>
            </div>

            {/* Damage Section */}
            <div className="combat-tooltip__section">
              <div className="combat-tooltip__section-title">Damage</div>
              <div className="combat-tooltip__damage-row">
                <div className="combat-tooltip__scaling">
                  <span className={`combat-tooltip__scaling-value ${getStatColor(skill.scalingStat)}`}>
                    {Math.round(skill.damageMult * 100)}% {formatScalingStat(skill.scalingStat)}
                  </span>
                  <span className="combat-tooltip__scaling-label">scaling</span>
                </div>
                <div className="combat-tooltip__type-tags">
                  <span className={getDamageTypeColor(skill.damageType)}>{skill.damageType}</span>
                  <span className={getElementColor(skill.element)}>{skill.element}</span>
                  {skill.damageProperty && skill.damageProperty !== 'Normal' && (
                    <span className="combat-tooltip__damage-property">{skill.damageProperty}</span>
                  )}
                </div>
                <div className="combat-tooltip__mechanics">
                  <div>- {getDamageTypeDescription(skill.damageType)}</div>
                  {skill.damageProperty && skill.damageProperty !== 'Normal' && (
                    <div>- {getDamagePropertyDescription(skill.damageProperty)}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Hit Chance Section */}
            <div className="combat-tooltip__section">
              <div className="combat-tooltip__section-title">Hit Chance</div>
              <div className="combat-tooltip__hit-chance">
                <span className="combat-tooltip__attack-method">{skill.attackMethod}</span> - {getAttackMethodDescription(skill.attackMethod)}
              </div>
            </div>

            {/* Costs & Cooldown */}
            <div className="combat-tooltip__section">
              <div className="combat-tooltip__section-title">Cost</div>
              <div className="combat-tooltip__cost-row">
                <span className="combat-tooltip__cost--ap">{apCost} AP</span>
                <span className={skill.chakraCost > 0 ? 'combat-tooltip__cost--cp' : 'combat-tooltip__cost--none'}>
                  {skill.chakraCost} CP
                </span>
                {skill.hpCost > 0 && (
                  <span className="combat-tooltip__cost--hp">{skill.hpCost} HP</span>
                )}
                <span className={skill.cooldown > 0 ? 'combat-tooltip__cost--cd' : 'combat-tooltip__cost--none'}>
                  {skill.cooldown > 0 ? `${skill.cooldown} turn cooldown` : 'No cooldown'}
                </span>
              </div>
            </div>

            {/* Effects Section */}
            {skill.effects && skill.effects.length > 0 && (
              <div className="combat-tooltip__section">
                <div className="combat-tooltip__section-title">Effects</div>
                <div className="combat-tooltip__effects">
                  {skill.effects.map((effect, idx) => (
                    <div key={idx} className="combat-tooltip__effect">
                      <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                      <span className="combat-tooltip__effect-text">{formatEffectDescription(effect)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bonus Stats */}
            {(skill.critBonus || skill.penetration) && (
              <div className="combat-tooltip__section combat-tooltip__bonus-row">
                {skill.critBonus && (
                  <div className="combat-tooltip__crit-bonus">+{skill.critBonus}% Crit Chance</div>
                )}
                {skill.penetration && (
                  <div className="combat-tooltip__pen-bonus">{Math.round(skill.penetration * 100)}% Defense Penetration</div>
                )}
              </div>
            )}

            {/* Toggle Skill Info */}
            {(skill.isToggle || skill.actionType === ActionType.TOGGLE) && (
              <div className="combat-tooltip__section">
                <div className="combat-tooltip__toggle-info">
                  Toggle Skill - {skill.upkeepCost || 0} CP/turn upkeep
                </div>
              </div>
            )}

            {/* Damage Preview vs Enemy */}
            <div className="combat-tooltip__section combat-tooltip__preview">
              <div className="combat-tooltip__preview-target">vs {enemy.name}</div>
              <div className="combat-tooltip__preview-row">
                <div>
                  <span className="combat-tooltip__preview-dmg-label">Predicted: </span>
                  <span className={`combat-tooltip__preview-dmg ${isSuperEffective ? 'combat-tooltip__preview-dmg--effective' : ''}`}>
                    {prediction.finalDamage} dmg
                  </span>
                  {prediction.isCrit && <span className="combat-tooltip__crit-marker">(CRIT)</span>}
                </div>
                {isSuperEffective && (
                  <span className="combat-tooltip__effectiveness--super">SUPER EFFECTIVE!</span>
                )}
                {effectiveness < 1.0 && (
                  <span className="combat-tooltip__effectiveness--resist">Resisted</span>
                )}
              </div>
            </div>
          </div>
        }
      >
        <SkillCard
          skill={skill}
          predictedDamage={prediction.finalDamage}
          isEffective={isSuperEffective}
          canUse={usable}
          onClick={() => onUseSkill(skill)}
          shortcutKey={shortcutKey}
          apCost={apCost}
        />
      </Tooltip>
    );
  };

  return (
    <div className="hand">
      <div className="hand__label">
        Hand · {cards.length} card{cards.length === 1 ? '' : 's'}
      </div>
      <div className="hand__grid">
        {cards.length > 0 ? (
          cards.map((skill, index) => renderCard(skill, index))
        ) : (
          <div className="hand__empty">No cards left — end your turn (Space).</div>
        )}
      </div>
    </div>
  );
};
