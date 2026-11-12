import React from 'react';
import {
  Player,
  Enemy,
  Skill,
  DamageType,
  CharacterStats,
  CardRole,
  Posture,
  type TerrainDefinition,
} from '../../game/types';
import Tooltip from '../shared/Tooltip';
import { SkillCard } from './SkillCard';
import { getApCost } from '../../game/constants/combatCards';
import type { LocationTerrainMods } from '../../game/systems/LocationTerrainSystem';
import { previewSkillDamageForUi } from '../../game/systems/combatSkillViewModel';
import { formatCombatRange } from '../../game/systems/RangeSystem';
import { getElementEffectiveness } from '../../game/constants';
import {
  getElementColor,
  getEffectColor,
  getEffectIcon,
  formatEffectDescription,
} from '../../game/utils/tooltipFormatters';
import { compactSkillBlurb, highlightSkillKeywords } from './highlightSkillKeywords';
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
  /** Skill Config Main Attack id — SkillCard paints the Main ribbon. */
  mainAttackId?: string | null;
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
  mainAttackId = null,
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
          <div className="combat-tooltip combat-tooltip--compact">
            <div className="combat-tooltip__title">{skill.name}</div>
            {skill.description && (
              <p className="combat-tooltip__blurb">
                {highlightSkillKeywords(compactSkillBlurb(skill.description))}
              </p>
            )}
            <div className="combat-tooltip__cost-row">
              <span className="combat-tooltip__cost--ap">{apCost} AP</span>
              <span className={effectiveChakra > 0 ? 'combat-tooltip__cost--cp' : 'combat-tooltip__cost--none'}>
                {skipFirstSkillCost && skill.chakraCost > 0
                  ? '0 CP (waived)'
                  : `${skill.chakraCost} CP`}
              </span>
              {skill.hpCost > 0 && (
                <span className="combat-tooltip__cost--hp">{skill.hpCost} HP</span>
              )}
            </div>
            {skill.allowedRanges && skill.allowedRanges.length > 0 && (
              <div className="combat-tooltip__range">
                {skill.allowedRanges.map((band) => formatCombatRange(band)).join(' / ')}
              </div>
            )}
            <div className="combat-tooltip__preview-row">
              {skill.cardRole !== CardRole.SUPPORT && skill.cardRole !== CardRole.MODE && (
                <>
                  <span className={`combat-tooltip__preview-dmg ${isSuperEffective ? 'combat-tooltip__preview-dmg--effective' : ''}`}>
                    {predictedDamage}
                  </span>
                  <span className={getDamageTypeColor(skill.damageType)}>{skill.damageType}</span>
                </>
              )}
              <span className={getElementColor(skill.element)}>{skill.element}</span>
              {isSuperEffective && (
                <span className="combat-tooltip__effectiveness--super">Super</span>
              )}
              {effectiveness < 1.0 && (
                <span className="combat-tooltip__effectiveness--resist">Resisted</span>
              )}
            </div>
            {skill.effects && skill.effects.length > 0 && (
              <div className="combat-tooltip__effects">
                {skill.effects.map((effect, idx) => (
                  <div key={idx} className="combat-tooltip__effect">
                    <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                    <span className="combat-tooltip__effect-text">
                      {highlightSkillKeywords(formatEffectDescription(effect))}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {skill.stanceBonus?.posture === posture && (
              <div className="combat-tooltip__description">
                {skill.stanceBonus.posture}
                {skill.stanceBonus.damageMultBonus
                  ? ` +${Math.round(skill.stanceBonus.damageMultBonus * 100)}%`
                  : ''}
                {skill.stanceBonus.apDiscount ? ` −${skill.stanceBonus.apDiscount} AP` : ''}
              </div>
            )}
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
          mainAttackId={mainAttackId}
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
