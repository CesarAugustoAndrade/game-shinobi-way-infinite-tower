import React from 'react';
import {
  Player,
  Enemy,
  Skill,
  DamageType,
  CharacterStats,
  ActionType,
  Posture,
  type TerrainDefinition,
} from '../../game/types';
import Tooltip from '../shared/Tooltip';
import { SkillCard } from './SkillCard';
import { getApCost } from '../../game/constants/combatCards';
import type { LocationTerrainMods } from '../../game/systems/LocationTerrainSystem';
import { previewSkillDamageForUi } from '../../game/systems/combatSkillViewModel';
import { getElementEffectiveness } from '../../game/constants';
import { getSkillArt } from '../../game/constants/artRegistry';
import ArtIcon from '../shared/ArtIcon';
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
  /** Active combat posture — included in damage preview (A-004). */
  posture?: Posture;
  /** Whether it is the player's turn (cards are inert during the enemy turn). */
  isPlayerTurn: boolean;
  /** Single source of truth for playability (resources + AP + cooldown + stun). */
  canUseSkill: (skill: Skill) => boolean;
  /** Optional: why a card is unplayable (shown as title when greyed). */
  getSkillBlockReason?: (skill: Skill) => string | null;
  onUseSkill: (skill: Skill) => void;
  getDamageTypeColor: (dt: DamageType) => string;
  /** Approach ambush first-hit mult when still on the opening strike. */
  isFirstTurn?: boolean;
  firstHitMultiplier?: number;
  /** T-063 location terrain damage mods (match live PlayerTurnSystem). */
  locationTerrainMods?: LocationTerrainMods | null;
  /** Room terrain definition for element amplification preview. */
  roomTerrain?: TerrainDefinition | null;
  /**
   * FREE_FIRST_SKILL: first accepted skill costs 0 chakra.
   * Surface as waived CP on the card face (WAVE9 cost honesty).
   */
  skipFirstSkillCost?: boolean;
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
  posture = Posture.BALANCED,
  isPlayerTurn,
  canUseSkill,
  getSkillBlockReason,
  onUseSkill,
  getDamageTypeColor,
  isFirstTurn = false,
  firstHitMultiplier = 1,
  locationTerrainMods = null,
  roomTerrain = null,
  skipFirstSkillCost = false,
}) => {
  const renderCard = (skill: Skill, index: number) => {
    const apCost = getApCost(skill);
    const usable = canUseSkill(skill) && isPlayerTurn;
    const effectiveChakra = skipFirstSkillCost ? 0 : skill.chakraCost;
    const chakraShort =
      !skipFirstSkillCost &&
      skill.chakraCost > 0 &&
      player.currentChakra < skill.chakraCost;
    const hpShort = skill.hpCost > 0 && player.currentHp <= skill.hpCost;

    const skillArt = getSkillArt(skill);
    // Pure UI damage stack (clan traits, event flags, passives, first-hit,
    // terrain, launch mult, posture) — forces hit + non-crit for stable preview.
    const { predictedDamage, isSuperEffective } = previewSkillDamageForUi({
      player,
      playerStats,
      enemy,
      enemyStats,
      skill,
      posture,
      isFirstTurn,
      firstHitMultiplier,
      locationTerrainMods,
      roomTerrain,
    });

    const effectiveness = getElementEffectiveness(skill.element, enemy.element);
    const shortcutKey = HAND_SHORTCUTS[index];

    return (
      <Tooltip
        key={skill.id}
        position="top"
        content={
          <div className="combat-tooltip combat-tooltip--wide">
            {/* Header — T-038: Imagine skill tile */}
            <div className="combat-tooltip__header">
              <div className="combat-tooltip__header-main">
                <ArtIcon
                  art={skillArt}
                  size="md"
                  className="combat-tooltip__skill-art"
                  title={skill.name}
                />
                <div>
                  <div className="combat-tooltip__title">{skill.name}</div>
                  <div className="combat-tooltip__subtitle">
                    <span className="combat-tooltip__tier">{skill.tier}</span>
                    <span className={
                      skill.actionType === ActionType.TOGGLE ? 'combat-tooltip__action--toggle' :
                      'combat-tooltip__action--active'
                    }>
                      {skill.actionType || ActionType.ACTIVE} · {apCost} AP
                    </span>
                  </div>
                </div>
              </div>
              <span className="combat-tooltip__level">Lv.{skill.level || 1}</span>
            </div>

            {/* Description */}
            <div className="combat-tooltip__section">
              <div className="combat-tooltip__description">{skill.description}</div>
            </div>

            {(skill.stanceBonus || skill.stanceShift) && (
              <div className="combat-tooltip__section">
                <div className="combat-tooltip__section-title">Stance</div>
                {skill.stanceBonus && (
                  <div className="combat-tooltip__description">
                    Match {skill.stanceBonus.posture}
                    {skill.stanceBonus.damageMultBonus
                      ? `: +${Math.round(skill.stanceBonus.damageMultBonus * 100)}% dmg`
                      : ''}
                    {skill.stanceBonus.apDiscount
                      ? `${skill.stanceBonus.damageMultBonus ? ' · ' : ': '}-${skill.stanceBonus.apDiscount} AP`
                      : ''}
                    {skill.stanceBonus.posture === posture ? ' · active' : ''}
                  </div>
                )}
                {skill.stanceShift && (
                  <div className="combat-tooltip__description">
                    On play → shift to {skill.stanceShift}
                  </div>
                )}
              </div>
            )}

            {/* Strike force */}
            <div className="combat-tooltip__section">
              <div className="combat-tooltip__section-title">Force</div>
              <div className="combat-tooltip__damage-row">
                <div className="combat-tooltip__scaling">
                  <span className={`combat-tooltip__scaling-value ${getStatColor(skill.scalingStat)}`}>
                    {skill.baseDamage}+{skill.scalingPerPoint}/{formatScalingStat(skill.scalingStat)}
                  </span>
                  <span className="combat-tooltip__scaling-label">from</span>
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

            {/* Precision / delivery */}
            <div className="combat-tooltip__section">
              <div className="combat-tooltip__section-title">Precision</div>
              <div className="combat-tooltip__hit-chance">
                <span className="combat-tooltip__attack-method">{skill.attackMethod}</span> - {getAttackMethodDescription(skill.attackMethod)}
              </div>
            </div>

            {/* Toll & cooldown */}
            <div className="combat-tooltip__section">
              <div className="combat-tooltip__section-title">Toll</div>
              <div className="combat-tooltip__cost-row">
                <span className="combat-tooltip__cost--ap">{apCost} AP</span>
                <span className={effectiveChakra > 0 ? 'combat-tooltip__cost--cp' : 'combat-tooltip__cost--none'}>
                  {skipFirstSkillCost && skill.chakraCost > 0
                    ? `0 CP (waived · base ${skill.chakraCost})`
                    : `${skill.chakraCost} CP`}
                </span>
                {skill.hpCost > 0 && (
                  <span className="combat-tooltip__cost--hp">{skill.hpCost} HP</span>
                )}
                <span className={skill.cooldown > 0 ? 'combat-tooltip__cost--cd' : 'combat-tooltip__cost--none'}>
                  {skill.cooldown > 0 ? `${skill.cooldown} turn cooldown` : 'No cooldown'}
                </span>
              </div>
            </div>

            {/* Lingering marks */}
            {skill.effects && skill.effects.length > 0 && (
              <div className="combat-tooltip__section">
                <div className="combat-tooltip__section-title">Marks</div>
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
                  Stance lock · {skill.upkeepCost || 0} CP/turn upkeep
                </div>
              </div>
            )}

            {/* Damage Preview vs Enemy (includes posture + launch mult like live hits) */}
            <div className="combat-tooltip__section combat-tooltip__preview">
              <div className="combat-tooltip__preview-target">vs {enemy.name}</div>
              <div className="combat-tooltip__preview-row">
                <div>
                  <span className="combat-tooltip__preview-dmg-label">Predicted: </span>
                  <span className={`combat-tooltip__preview-dmg ${isSuperEffective ? 'combat-tooltip__preview-dmg--effective' : ''}`}>
                    {predictedDamage} dmg
                  </span>
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
          predictedDamage={predictedDamage}
          isEffective={isSuperEffective}
          canUse={usable}
          onClick={() => onUseSkill(skill)}
          shortcutKey={shortcutKey}
          apCost={apCost}
          freeChakra={skipFirstSkillCost}
          chakraShort={chakraShort}
          hpShort={hpShort}
          blockReason={
            !usable
              ? (!isPlayerTurn
                  ? 'Enemy turn'
                  : getSkillBlockReason?.(skill) ?? 'Cannot play')
              : null
          }
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
          <div className="hand__empty" role="status">
            <div className="hand__empty-title">Hand empty</div>
            <div className="hand__empty-hint">End your turn (Space) — AP does not carry over.</div>
          </div>
        )}
      </div>
    </div>
  );
};
