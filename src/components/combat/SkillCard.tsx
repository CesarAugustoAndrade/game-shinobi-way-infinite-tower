import React, { useState } from 'react';
import { Skill, DamageType, ActionType, ElementType } from '../../game/types';
import { getSkillArt } from '../../game/constants/artRegistry';
import { getEffectIcon } from '../../game/utils/tooltipFormatters';
import './SkillCard.css';

interface SkillCardProps {
  skill: Skill;
  predictedDamage: number;
  isEffective: boolean;
  canUse: boolean;
  onClick: () => void;
  /** Whether to show simplified passive display (non-interactive) */
  showAsPassive?: boolean;
  /** Keyboard shortcut key to display (e.g., "Z", "X", "C", "V") */
  shortcutKey?: string;
  /** Action Point cost to play this card (T-004). */
  apCost?: number;
  /** R1: why the card is greyed (tooltip/title when !canUse) */
  blockReason?: string | null;
  /**
   * FREE_FIRST_SKILL window: effective chakra cost is 0 this play.
   * Face shows struck base CP + FREE so the toll stays honest (WAVE9).
   */
  freeChakra?: boolean;
  /** Player cannot currently afford CP (display-only short signal). */
  chakraShort?: boolean;
  /** Player cannot currently afford HP toll (display-only short signal). */
  hpShort?: boolean;
}

/** BEM element-tint modifier from ElementType / string. */
function elementModifier(element: ElementType | string): string {
  const key = String(element).toLowerCase();
  switch (key) {
    case 'fire':
      return 'skill-card--el-fire';
    case 'water':
      return 'skill-card--el-water';
    case 'lightning':
      return 'skill-card--el-lightning';
    case 'earth':
      return 'skill-card--el-earth';
    case 'wind':
      return 'skill-card--el-wind';
    case 'mental':
      return 'skill-card--el-mental';
    case 'physical':
      return 'skill-card--el-physical';
    default:
      return 'skill-card--el-physical';
  }
}

function damageChannel(damageType: DamageType | string): 'physical' | 'elemental' | 'mental' | 'true' {
  switch (damageType) {
    case DamageType.PHYSICAL:
    case 'Physical':
      return 'physical';
    case DamageType.ELEMENTAL:
    case 'Elemental':
      return 'elemental';
    case DamageType.TRUE:
    case 'True':
      return 'true';
    case DamageType.MENTAL:
    case 'Mental':
    default:
      return 'mental';
  }
}

/** Compact effect chip label for card face (trade-off / status preview). */
function effectChipLabel(type: string): string {
  return type.replace(/_/g, ' ').slice(0, 10);
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  predictedDamage,
  isEffective,
  canUse,
  onClick,
  showAsPassive = false,
  shortcutKey,
  apCost,
  blockReason = null,
  freeChakra = false,
  chakraShort = false,
  hpShort = false,
}) => {
  const actionType = skill.actionType || ActionType.MAIN;
  const isPassive = actionType === ActionType.PASSIVE || showAsPassive;
  const isSide = actionType === ActionType.SIDE;
  const isToggle = actionType === ActionType.TOGGLE;
  const isActive = skill.isActive || false;

  // Art registry (T-020/T-028/T-029): Imagine tile with emoji cascade on load error.
  const skillArt = getSkillArt(skill);
  const bgImage = skillArt.src ?? skill.image;
  const [bgFailed, setBgFailed] = useState(false);
  const showBgImg = Boolean(bgImage) && !bgFailed;
  const bgEmoji = skillArt.emoji || skill.icon || '🌀';

  // First meaningful effect for face trade-off preview (StS-style status hint)
  const primaryEffect = !isPassive && skill.effects?.find((e) => e.type) || null;

  // Build class names
  const getCardClasses = () => {
    const classes = ['skill-card', elementModifier(skill.element)];

    // Action type variant
    if (isPassive) {
      classes.push('skill-card--passive');
    } else if (isToggle) {
      classes.push('skill-card--toggle');
      if (isActive) classes.push('skill-card--active');
    } else if (isSide) {
      classes.push('skill-card--side');
    } else {
      classes.push('skill-card--main');
    }

    // State modifiers
    if (!canUse && !isPassive && !isActive) {
      classes.push('skill-card--disabled');
    }
    if (isEffective && canUse) {
      classes.push('skill-card--effective');
    }

    // Reserve room in the header for the absolute shortcut badge (Z/X/C/V)
    if (shortcutKey) {
      classes.push('skill-card--has-shortcut');
    }

    return classes.join(' ');
  };

  // Get action type badge config (category only — turn economy is AP, not MAIN/SIDE rules)
  const getActionBadge = () => {
    if (isPassive) return { text: 'PASSIVE', className: 'skill-card__action-badge--passive' };
    if (isToggle) {
      return isActive
        ? { text: 'ACTIVE', className: 'skill-card__action-badge--toggle-active' }
        : { text: 'TOGGLE', className: 'skill-card__action-badge--toggle' };
    }
    if (isSide) return { text: 'SIDE', className: 'skill-card__action-badge--side' };
    return { text: 'MAIN', className: 'skill-card__action-badge--main' };
  };

  const actionBadge = getActionBadge();
  const effectivelyUsable = !isPassive && canUse;
  const resolvedAp = apCost ?? 0;
  const channel = damageChannel(skill.damageType);
  // FREE_FIRST or naturally free CP skills both read as free on the face.
  const cpIsFree = freeChakra || skill.chakraCost <= 0;
  const cpIsWaived = freeChakra && skill.chakraCost > 0;

  return (
    <button
      type="button"
      onClick={effectivelyUsable ? onClick : undefined}
      className={getCardClasses()}
      title={
        !effectivelyUsable && blockReason
          ? blockReason
          : skill.name
      }
      aria-disabled={!effectivelyUsable}
      data-element={skill.element}
      data-damage-type={skill.damageType}
      data-free-chakra={freeChakra ? 'true' : undefined}
    >
      {/* Keyboard Shortcut Badge */}
      {shortcutKey && (
        <div className="skill-card__shortcut">{shortcutKey}</div>
      )}

      {/* Background art — Imagine src, emoji if missing/404 (T-029) */}
      {showBgImg ? (
        <img
          src={bgImage}
          alt=""
          aria-hidden="true"
          className="skill-card__bg"
          onError={() => setBgFailed(true)}
        />
      ) : (
        <span className="skill-card__bg skill-card__bg--emoji" aria-hidden="true">
          {bgEmoji}
        </span>
      )}

      {/* Gradient Overlay (element-tinted via CSS) */}
      <div className="skill-card__overlay" />

      {/* Content Layer */}
      <div className="skill-card__content">
        {/* Top Row: Name and Level */}
        <div className="skill-card__header">
          <div className="skill-card__title-block">
            <h3 className="skill-card__name">{skill.name}</h3>
            <div className="skill-card__type-row">
              <span className={`skill-card__damage-type skill-card__damage-type--${channel}`}>
                {skill.damageType.charAt(0)} · {skill.element}
              </span>
            </div>
          </div>
          <div className="skill-card__badges">
            {/* Cost stack first — AP rust, CP cool blue — primary affordance (WAVE9 legibility) */}
            {!isPassive && (
              <div className="skill-card__cost-stack" aria-label="Card costs">
                {apCost !== undefined && (
                  <div
                    className="skill-card__cost-badge skill-card__cost-badge--ap"
                    aria-label={`Costs ${resolvedAp} action points`}
                  >
                    <span className="skill-card__cost-num">{resolvedAp}</span>
                    <span className="skill-card__cost-unit">AP</span>
                  </div>
                )}
                <div
                  className={[
                    'skill-card__cost-badge',
                    'skill-card__cost-badge--cp',
                    cpIsFree ? 'skill-card__cost-badge--free' : '',
                    cpIsWaived ? 'skill-card__cost-badge--waived' : '',
                    !cpIsFree && chakraShort ? 'skill-card__cost-badge--short' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={
                    cpIsWaived
                      ? `Chakra waived this play (normally ${skill.chakraCost})`
                      : skill.chakraCost > 0
                        ? `Costs ${skill.chakraCost} chakra`
                        : 'No chakra cost'
                  }
                >
                  {cpIsWaived ? (
                    <>
                      <span className="skill-card__cost-strike" aria-hidden="true">
                        {skill.chakraCost} CP
                      </span>
                      <span className="skill-card__cost-waive-label">FREE</span>
                    </>
                  ) : skill.chakraCost > 0 ? (
                    <>
                      <span className="skill-card__cost-num">{skill.chakraCost}</span>
                      <span className="skill-card__cost-unit">CP</span>
                    </>
                  ) : (
                    <span className="skill-card__cost-num">FREE</span>
                  )}
                </div>
              </div>
            )}
            {/* Action Type Badge */}
            {actionBadge && (
              <div className={`skill-card__action-badge ${actionBadge.className}`}>
                <span className="skill-card__action-badge-text">{actionBadge.text}</span>
              </div>
            )}
            {/* Level Badge */}
            <div className="skill-card__level-badge">
              <span className="skill-card__level-text">LVL {skill.level || 1}</span>
            </div>
          </div>
        </div>

        {/* Damage Display */}
        <div className="skill-card__damage">
          <div className="skill-card__damage-label">DMG</div>
          <div
            className={[
              'skill-card__damage-value',
              `skill-card__damage-value--${channel}`,
              isEffective ? 'skill-card__damage-value--effective' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {predictedDamage > 0 ? predictedDamage : '—'}
          </div>
        </div>

        {/* Trade-off / secondary costs + status chip */}
        <div className="skill-card__costs">
          {isPassive ? (
            <span className="skill-card__cost--passive">Always Active</span>
          ) : (
            <>
              {skill.hpCost > 0 && (
                <span
                  className={[
                    'skill-card__cost--hp',
                    hpShort ? 'skill-card__cost--hp-short' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={hpShort ? 'Not enough HP for this toll' : 'HP cost'}
                >
                  −{skill.hpCost} HP
                </span>
              )}
              {isToggle && skill.upkeepCost && skill.upkeepCost > 0 && (
                <span className="skill-card__cost--upkeep" title="Chakra upkeep per turn">
                  {skill.upkeepCost} CP/t
                </span>
              )}
              {primaryEffect && (
                <span
                  className="skill-card__effect-chip"
                  title={effectChipLabel(String(primaryEffect.type))}
                >
                  <span className="skill-card__effect-icon" aria-hidden="true">
                    {getEffectIcon(primaryEffect.type)}
                  </span>
                  {effectChipLabel(String(primaryEffect.type))}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cooldown Overlay */}
      {skill.currentCooldown > 0 && (
        <div className="skill-card__cooldown">
          <span className="skill-card__cooldown-value">{skill.currentCooldown}</span>
        </div>
      )}

      {/* Trade-off gate: why this card cannot be played (readable before confirm) */}
      {!effectivelyUsable && !isPassive && blockReason && skill.currentCooldown === 0 && (
        <span className="skill-card__block-reason" aria-hidden="true">
          {blockReason}
        </span>
      )}
    </button>
  );
};
