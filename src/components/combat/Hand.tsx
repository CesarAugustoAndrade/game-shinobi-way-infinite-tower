import React from 'react';
import {
  Player,
  Enemy,
  Skill,
  DamageType,
  CharacterStats,
  ActionType,
  Posture,
} from '../../game/types';
import Tooltip from '../shared/Tooltip';
import { SkillCard } from './SkillCard';
import { getApCost } from '../../game/constants/combatCards';
import { previewDamage, resolvePassiveDamageBonus } from '../../game/systems/StatSystem';
import {
  getTotalDefenseBypass,
  getCritDefenseBypass,
  hasAllElementsPassive,
  getConvertToElementalPercent,
  applyClanTraitToDamageContext,
} from '../../game/systems/EquipmentPassiveSystem';
import { getEventFlagRunModifiers } from '../../game/systems/EventSystem';
import { postureDamageMod } from '../../game/systems/PostureSystem';
import {
  skillLocationDamageMult,
  applyEnemyDefenseBonus,
  type LocationTerrainMods,
} from '../../game/systems/LocationTerrainSystem';
import { getTerrainElementAmplification } from '../../game/systems/CombatCalculationSystem';
import type { TerrainDefinition } from '../../game/types';
import { LaunchProperties } from '../../config/featureFlags';
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
  onUseSkill: (skill: Skill) => void;
  getDamageTypeColor: (dt: DamageType) => string;
  /** Approach ambush first-hit mult when still on the opening strike. */
  isFirstTurn?: boolean;
  firstHitMultiplier?: number;
  /** T-063 location terrain damage mods (match live PlayerTurnSystem). */
  locationTerrainMods?: LocationTerrainMods | null;
  /** Room terrain definition for element amplification preview. */
  roomTerrain?: TerrainDefinition | null;
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
  onUseSkill,
  getDamageTypeColor,
  isFirstTurn = false,
  firstHitMultiplier = 1,
  locationTerrainMods = null,
  roomTerrain = null,
}) => {
  const renderCard = (skill: Skill, index: number) => {
    const apCost = getApCost(skill);
    const usable = canUseSkill(skill) && isPlayerTurn;

    // T-038: match live combat mods (clan traits T-031 + event flags T-034)
    const clanCtx = applyClanTraitToDamageContext(
      player,
      playerStats.derived,
      enemyStats.effectivePrimary,
      enemyStats.derived,
    );
    const flagDmg = getEventFlagRunModifiers(player).damageBonus;
    const skillArt = getSkillArt(skill);
    // previewDamage forces hit + non-crit so tooltips do not flicker miss/CRIT
    const prediction = previewDamage(
      playerStats.effectivePrimary,
      clanCtx.attackerDerived,
      clanCtx.defenderPrimary,
      clanCtx.defenderDerived,
      skill,
      player.element,
      enemy.element,
      {
        damageBonus:
          resolvePassiveDamageBonus(playerStats.passiveBonuses, skill.element) + flagDmg,
        defenseBypass: getTotalDefenseBypass(player),
        critDefenseBypass: getCritDefenseBypass(player),
        forceSuperEffective: hasAllElementsPassive(player),
        convertToElementalPercent: getConvertToElementalPercent(player),
      }
    );

    // Match PlayerTurnSystem post-calc mods: first-hit, room terrain amp,
    // location terrain, launch mult, posture
    let modified = prediction.finalDamage;
    if (isFirstTurn && firstHitMultiplier > 1) {
      modified = Math.floor(modified * firstHitMultiplier);
    }
    if (roomTerrain && player.element) {
      const terrainAmp = getTerrainElementAmplification(roomTerrain, player.element);
      if (terrainAmp > 1) {
        modified = Math.floor(modified * terrainAmp);
      }
    }
    if (locationTerrainMods) {
      const locMult = skillLocationDamageMult(skill, locationTerrainMods);
      if (locMult !== 1) {
        modified = Math.floor(modified * locMult);
      }
      modified = applyEnemyDefenseBonus(modified, locationTerrainMods);
    }
    const predictedDamage = Math.floor(
      Math.floor(modified * LaunchProperties.PLAYER_DAMAGE_MULTIPLIER) *
        postureDamageMod(posture)
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
                      skill.actionType === ActionType.SIDE ? 'combat-tooltip__action--side' :
                      skill.actionType === ActionType.TOGGLE ? 'combat-tooltip__action--toggle' :
                      'combat-tooltip__action--main'
                    }>
                      {skill.actionType || ActionType.MAIN} · {apCost} AP
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
