import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  Player,
  Enemy,
  Skill,
  EffectType,
  DamageType,
  CharacterStats,
  Rarity,
  ActionType,
  Posture,
} from '../../game/types';
import StatBar from '../../components/shared/StatBar';
import Tooltip from '../../components/shared/Tooltip';
import { SkillCard } from '../../components/combat/SkillCard';
import { CinematicViewscreen } from '../../components/layout/CinematicViewscreen';
import PlayerHUD from '../../components/character/PlayerHUD';
import FloatingText, { FloatingTextItem, FloatingTextType } from '../../components/combat/FloatingText';
import { FeatureFlags, LaunchProperties } from '../../config/featureFlags';
import { getApCost } from '../../game/constants/combatCards';
import { describePosture } from '../../game/systems/PostureSystem';
import { Hourglass, Zap, ZapOff } from 'lucide-react';
import { calculateDamage, formatPercent } from '../../game/systems/StatSystem';
import { getElementEffectiveness } from '../../game/constants';
import {
  formatScalingStat,
  getStatColor,
  getElementColor,
  getEffectColor,
  getEffectIcon,
  formatEffectDescription,
  getBuffDescription,
  getCategoryRanks,
  getRankColor,
  getDetailedEffectMechanics,
  getEffectTip,
  getEffectSeverity,
  getSeverityColor,
  isPositiveEffect,
  getAttackMethodDescription,
  getDamagePropertyDescription,
  getDamageTypeDescription,
} from '../../game/utils/tooltipFormatters';
import './Combat.css';

export interface CombatRef {
  spawnFloatingText: (target: 'enemy' | 'player', text: string, type: FloatingTextType) => void;
}

interface CombatProps {
  player: Player;
  playerStats: CharacterStats;
  enemy: Enemy;
  enemyStats: CharacterStats;
  turnState: 'PLAYER' | 'ENEMY_TURN';
  /** Cards available to play this turn (T-004 deckbuilder hand). */
  hand: Skill[];
  /** Action Points remaining this turn. */
  currentAp: number;
  /** Action Point budget for the turn. */
  maxAp: number;
  /** Active combat posture. */
  posture: Posture;
  /** Switch the active posture (costs AP). */
  onChangePosture: (next: Posture) => void;
  onUseSkill: (skill: Skill) => void;
  onPassTurn: () => void;
  droppedSkill?: Skill | null;
  getDamageTypeColor: (dt: DamageType) => string;
  getRarityColor: (rarity: Rarity) => string;
  autoCombatEnabled?: boolean;
  onToggleAutoCombat?: () => void;
  autoPassTimeRemaining?: number | null;
}

/** Keyboard shortcuts for the 4 hand slots. */
const HAND_SHORTCUTS = ['Z', 'X', 'C', 'V'];
const POSTURE_ORDER: Posture[] = [Posture.AGGRESSIVE, Posture.BALANCED, Posture.DEFENSIVE];

const Combat = forwardRef<CombatRef, CombatProps>(({
  player,
  playerStats,
  enemy,
  enemyStats,
  turnState,
  hand,
  currentAp,
  maxAp,
  posture,
  onChangePosture,
  onUseSkill,
  onPassTurn,
  getDamageTypeColor,
  autoCombatEnabled = false,
  onToggleAutoCombat,
  autoPassTimeRemaining,
}, ref) => {
  // Floating text state
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const enemyRef = useRef<HTMLDivElement>(null);
  const playerHudRef = useRef<HTMLDivElement>(null);

  // Spawn floating text at target location
  const spawnFloatingText = useCallback((
    target: 'enemy' | 'player',
    text: string,
    type: FloatingTextType
  ) => {
    const targetRef = target === 'enemy' ? enemyRef : playerHudRef;
    const rect = targetRef.current?.getBoundingClientRect();
    if (!rect) return;

    const id = `fct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 60;
    const y = rect.top + rect.height * (target === 'enemy' ? 0.4 : 0.3);

    setFloatingTexts(prev => [...prev, { id, text, type, position: { x, y } }]);
  }, []);

  // Remove floating text after animation completes
  const removeFloatingText = useCallback((id: string) => {
    setFloatingTexts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Expose spawnFloatingText to parent via ref
  useImperativeHandle(ref, () => ({
    spawnFloatingText
  }), [spawnFloatingText]);

  // Resolve hand cards to their live skill objects (cooldowns/active state live
  // on player.skills; the hand only carries card identity).
  const handCards = hand
    .map((card) => player.skills.find((s) => s.id === card.id) ?? card)
    .slice(0, HAND_SHORTCUTS.length);

  // Helper to check if a card can be played this turn (resources + AP + state).
  const canUseSkill = useCallback((skill: Skill) => {
    const hasResources = player.currentChakra >= skill.chakraCost && player.currentHp > skill.hpCost;
    const noCooldown = skill.currentCooldown === 0;
    const isStunned = player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
    const hasAp = currentAp >= getApCost(skill);

    return (hasResources || skill.isActive) && noCooldown && !isStunned && hasAp;
  }, [player, currentAp]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (turnState !== 'PLAYER') return;

      // Tab to toggle auto-combat
      if (e.key === 'Tab') {
        e.preventDefault();
        onToggleAutoCombat?.();
        return;
      }

      // Space to pass turn
      if (e.code === 'Space') {
        e.preventDefault();
        onPassTurn();
        return;
      }

      // Z/X/C/V play the 4 hand slots
      const handKeyMap: Record<string, number> = {
        'KeyZ': 0, 'z': 0, 'Z': 0,
        'KeyX': 1, 'x': 1, 'X': 1,
        'KeyC': 2, 'c': 2, 'C': 2,
        'KeyV': 3, 'v': 3, 'V': 3,
      };

      const handIndex = handKeyMap[e.code] ?? handKeyMap[e.key];
      if (handIndex !== undefined) {
        const skill = handCards[handIndex];
        if (skill && canUseSkill(skill)) {
          e.preventDefault();
          onUseSkill(skill);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [turnState, handCards, canUseSkill, onUseSkill, onPassTurn, onToggleAutoCombat]);

  // Render a hand card with tooltip
  const renderSkillCard = (skill: Skill, index: number) => {
    const isEnemyTurn = turnState === 'ENEMY_TURN';
    const apCost = getApCost(skill);
    const usable = canUseSkill(skill) && !isEnemyTurn;

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

    // Hand slot shortcut (Z/X/C/V)
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
          canUse={usable || false}
          onClick={() => onUseSkill(skill)}
          shortcutKey={shortcutKey}
          apCost={apCost}
        />
      </Tooltip>
    );
  };

  return (
    <div className="combat">
      {/* CINEMATIC BATTLE HEADER - Enemy Area */}
      <div ref={enemyRef}>
        <CinematicViewscreen
          image={enemy.image || '/assets/image_3b2b13.jpg'}
          overlayContent={
            <div className="combat__enemy-overlay">
              {/* LEFT: Enemy Stats Overlay */}
              <div className="combat__enemy-stats">
                <h1 className="combat__enemy-name">{enemy.name}</h1>

                {/* HP Bar */}
                <div className="combat__enemy-hp">
                  <StatBar
                    current={enemy.currentHp}
                    max={enemyStats.derived.maxHp}
                    color="red"
                    className="h-4"
                    showValue={false}
                  />
                  <div className="combat__enemy-hp-value">
                    {enemy.currentHp} / {enemyStats.derived.maxHp}
                  </div>
                </div>

                {/* Tier & Affinity */}
                <div className="combat__enemy-tags">
                  <span className="combat__enemy-tag">{enemy.tier}</span>
                  <span className="combat__enemy-tag">
                    Affinity: <span className="combat__enemy-tag-value">{enemy.element}</span>
                  </span>
                </div>

                {/* Detailed Stats with Tooltip */}
                <Tooltip
                  content={
                    (() => {
                      const ranks = getCategoryRanks(enemyStats.effectivePrimary);
                      return (
                        <div className="combat-tooltip">
                          <div className="combat-tooltip__enemy-name">{enemy.name}</div>
                          <div className="combat-tooltip__enemy-info">{enemy.tier} - {enemy.element} Affinity</div>

                          {/* THE BODY */}
                          <div className="combat-tooltip__section">
                            <div className="combat-tooltip__category">
                              <span className="combat-tooltip__category-label combat-tooltip__category-label--body">The Body</span>
                              <span className={`combat-tooltip__category-rank ${getRankColor(ranks.body)}`}>{ranks.body}</span>
                            </div>
                            <div className="combat-tooltip__stat-grid">
                              <div><span className="combat-tooltip__stat-abbr--str">STR</span> {enemyStats.effectivePrimary.strength}</div>
                              <div><span className="combat-tooltip__stat-abbr--wil">WIL</span> {enemyStats.effectivePrimary.willpower}</div>
                              <div><span className="combat-tooltip__stat-abbr--cha">CHA</span> {enemyStats.effectivePrimary.chakra}</div>
                            </div>
                            <div className="combat-tooltip__derived">
                              Phys Def: <span className="combat-tooltip__derived-value--phys">{enemyStats.derived.physicalDefenseFlat} + {formatPercent(enemyStats.derived.physicalDefensePercent)}</span>
                            </div>
                          </div>

                          {/* THE MIND */}
                          <div className="combat-tooltip__section">
                            <div className="combat-tooltip__category">
                              <span className="combat-tooltip__category-label combat-tooltip__category-label--mind">The Mind</span>
                              <span className={`combat-tooltip__category-rank ${getRankColor(ranks.mind)}`}>{ranks.mind}</span>
                            </div>
                            <div className="combat-tooltip__stat-grid">
                              <div><span className="combat-tooltip__stat-abbr--spi">SPI</span> {enemyStats.effectivePrimary.spirit}</div>
                              <div><span className="combat-tooltip__stat-abbr--int">INT</span> {enemyStats.effectivePrimary.intelligence}</div>
                              <div><span className="combat-tooltip__stat-abbr--cal">CAL</span> {enemyStats.effectivePrimary.calmness}</div>
                            </div>
                            <div className="combat-tooltip__derived">
                              <div>Elem Def: <span className="combat-tooltip__derived-value--elem">{enemyStats.derived.elementalDefenseFlat} + {formatPercent(enemyStats.derived.elementalDefensePercent)}</span></div>
                              <div>Mind Def: <span className="combat-tooltip__derived-value--mind">{enemyStats.derived.mentalDefenseFlat} + {formatPercent(enemyStats.derived.mentalDefensePercent)}</span></div>
                            </div>
                          </div>

                          {/* THE TECHNIQUE */}
                          <div className="combat-tooltip__section">
                            <div className="combat-tooltip__category">
                              <span className="combat-tooltip__category-label combat-tooltip__category-label--technique">The Technique</span>
                              <span className={`combat-tooltip__category-rank ${getRankColor(ranks.technique)}`}>{ranks.technique}</span>
                            </div>
                            <div className="combat-tooltip__stat-grid">
                              <div><span className="combat-tooltip__stat-abbr--spd">SPD</span> {enemyStats.effectivePrimary.speed}</div>
                              <div><span className="combat-tooltip__stat-abbr--acc">ACC</span> {enemyStats.effectivePrimary.accuracy}</div>
                              <div><span className="combat-tooltip__stat-abbr--dex">DEX</span> {enemyStats.effectivePrimary.dexterity}</div>
                            </div>
                            <div className="combat-tooltip__derived">
                              <div>Evasion: <span className="combat-tooltip__derived-value--eva">{formatPercent(enemyStats.derived.evasion)}</span></div>
                              <div>Crit: <span className="combat-tooltip__derived-value--crit">{Math.round(enemyStats.derived.critChance)}%</span></div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  }
                >
                  <div className="combat__enemy-defense">
                    <span>Phys: <span className="combat__defense-phys">{enemyStats.derived.physicalDefenseFlat}+{formatPercent(enemyStats.derived.physicalDefensePercent)}</span></span>
                    <span>Elem: <span className="combat__defense-elem">{enemyStats.derived.elementalDefenseFlat}+{formatPercent(enemyStats.derived.elementalDefensePercent)}</span></span>
                    <span>Mind: <span className="combat__defense-mind">{enemyStats.derived.mentalDefenseFlat}+{formatPercent(enemyStats.derived.mentalDefensePercent)}</span></span>
                  </div>
                </Tooltip>
              </div>

              {/* RIGHT: Active Buffs */}
              <div className="combat__enemy-buffs">
                {enemy.activeBuffs.filter(b => b?.effect).map(buff => {
                  const isPositive = buff.effect ? isPositiveEffect(buff.effect.type) : false;
                  const severity = getEffectSeverity(buff);
                  const mechanics = getDetailedEffectMechanics(buff);
                  const tip = buff.effect ? getEffectTip(buff.effect.type) : '';

                  return (
                    <Tooltip
                      key={buff.id}
                      content={
                        <div className="combat-tooltip">
                          {/* Header */}
                          <div className="combat-tooltip__buff-header">
                            <span className={`combat-tooltip__buff-icon ${buff.effect ? getEffectColor(buff.effect.type) : ''}`}>
                              {buff.effect ? getEffectIcon(buff.effect.type) : '???'}
                            </span>
                            <div>
                              <div className={`combat-tooltip__buff-name ${isPositive ? 'combat-tooltip__buff-name--positive' : getSeverityColor(severity)}`}>
                                {buff.name}
                              </div>
                              <div className="combat-tooltip__buff-type">
                                {isPositive ? 'Enemy Buff' : 'Your Debuff on Enemy'}
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="combat-tooltip__section">
                            <div className="combat-tooltip__buff-desc">{getBuffDescription(buff)}</div>
                          </div>

                          {/* Mechanics Breakdown */}
                          <div className="combat-tooltip__section">
                            <div className="combat-tooltip__section-title">Mechanics</div>
                            <div className="combat-tooltip__mechanics-list">
                              {mechanics.map((mechanic, i) => (
                                <div key={i} className="combat-tooltip__mechanic">
                                  <span className="combat-tooltip__mechanic-bullet">-</span>
                                  <span>{mechanic}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Source & Duration */}
                          <div className="combat-tooltip__section combat-tooltip__source-row">
                            <div>
                              <span className="combat-tooltip__source-label">Source: </span>
                              <span className="combat-tooltip__source-value">{buff.source || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="combat-tooltip__duration-label">Remaining: </span>
                              <span className={buff.duration <= 1 ? 'combat-tooltip__duration-value--expiring' : 'combat-tooltip__duration-value'}>
                                {buff.duration === -1 ? 'Permanent' : `${buff.duration} turn${buff.duration !== 1 ? 's' : ''}`}
                              </span>
                            </div>
                          </div>

                          {/* Strategic Tip */}
                          {tip && (
                            <div className="combat-tooltip__section">
                              <div className="combat-tooltip__tip">Tip: {tip}</div>
                            </div>
                          )}
                        </div>
                      }
                    >
                      <div className={`combat__buff ${isPositive ? 'combat__buff--positive' : 'combat__buff--negative'}`}>
                        {buff.name} <span className={isPositive ? 'combat__buff-duration--positive' : 'combat__buff-duration--negative'}>[{buff.duration}]</span>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          }
        />
      </div>

      {/* SKILL INTERFACE AREA */}
      <div className="combat__interface">
        {/* AP & Posture Bar */}
        <div className="combat__econ-bar">
          {/* Action Points */}
          <div className="combat__ap" aria-label={`Action Points ${currentAp} of ${maxAp}`}>
            <span className="combat__ap-label">AP</span>
            <div className="combat__ap-pips">
              {Array.from({ length: Math.max(maxAp, currentAp) }).map((_, i) => (
                <span
                  key={i}
                  className={`combat__ap-pip ${i < currentAp ? 'combat__ap-pip--full' : 'combat__ap-pip--spent'}`}
                />
              ))}
            </div>
            <span className="combat__ap-value">{currentAp}/{maxAp}</span>
          </div>

          {/* Posture Control */}
          <div className="combat__posture">
            <span className="combat__posture-title">Stance</span>
            <div className="combat__posture-options">
              {POSTURE_ORDER.map((p) => {
                const profile = describePosture(p);
                const isActive = p === posture;
                const affordable = currentAp >= LaunchProperties.POSTURE_SWITCH_AP_COST;
                const disabled = turnState !== 'PLAYER' || (!isActive && !affordable);
                return (
                  <Tooltip
                    key={p}
                    position="top"
                    content={
                      <div className="combat-tooltip">
                        <div className="combat-tooltip__title">{profile.label} Stance</div>
                        <div className="combat-tooltip__description">{profile.drawBias}.</div>
                        <div className="combat-tooltip__mechanics">
                          <div>- Damage dealt: {Math.round(profile.damageMod * 100)}%</div>
                          {!isActive && <div>- Switch cost: {LaunchProperties.POSTURE_SWITCH_AP_COST} AP</div>}
                        </div>
                      </div>
                    }
                  >
                    <button
                      type="button"
                      className={`combat__posture-btn ${isActive ? 'combat__posture-btn--active' : ''}`}
                      onClick={() => { if (!isActive) onChangePosture(p); }}
                      disabled={disabled}
                    >
                      {profile.label}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Passive Skills Summary */}
          {player.skills.filter(s => s.actionType === ActionType.PASSIVE).length > 0 && (
            <Tooltip
              content={
                <div className="combat-tooltip">
                  <div className="combat-tooltip__passives-title">Active Passives</div>
                  {player.skills.filter(s => s.actionType === ActionType.PASSIVE).map(skill => (
                    <div key={skill.id} className="combat-tooltip__passive">
                      <span className="combat-tooltip__passive-name">{skill.name}</span> - {skill.description}
                    </div>
                  ))}
                </div>
              }
            >
              <div className="combat__passives-summary">
                {player.skills.filter(s => s.actionType === ActionType.PASSIVE).length} Passives Active
              </div>
            </Tooltip>
          )}
        </div>

        {/* Keyboard Hints */}
        <div className="combat__hints">
          <span className="combat__hint">
            <span className="sw-shortcut">Z</span><span className="sw-shortcut">X</span><span className="sw-shortcut">C</span><span className="sw-shortcut">V</span> Play Card
          </span>
          <span className="combat__hint">
            <span className="sw-shortcut">Space</span> End Turn
          </span>
          <span className="combat__hint">
            <span className="sw-shortcut">Tab</span> Auto
          </span>
        </div>

        {/* Hand */}
        <div className="combat__hand">
          <div className="combat__hand-label">
            Hand · {handCards.length} card{handCards.length === 1 ? '' : 's'}
          </div>
          <div className="combat__hand-grid">
            {handCards.length > 0 ? (
              handCards.map((skill, index) => renderSkillCard(skill, index))
            ) : (
              <div className="combat__hand-empty">No cards left — end your turn (Space).</div>
            )}
          </div>
        </div>

        {/* Turn Control */}
        <div className="combat__controls">
          {/* Auto-Combat Toggle */}
          <button
            type="button"
            onClick={onToggleAutoCombat}
            className={`combat__auto-btn ${autoCombatEnabled ? 'combat__auto-btn--active' : ''}`}
            title={autoCombatEnabled ? 'Auto-pass enabled - Click to disable' : 'Enable auto-pass for faster pacing'}
          >
            {autoCombatEnabled ? <Zap size={14} /> : <ZapOff size={14} />}
            <span className="combat__auto-label">Auto</span>
            {autoCombatEnabled && autoPassTimeRemaining != null && turnState === 'PLAYER' && (
              <span className="combat__auto-timer">
                {(autoPassTimeRemaining / 1000).toFixed(1)}s
              </span>
            )}
          </button>

          {/* Pass Turn Button */}
          <button
            type="button"
            onClick={onPassTurn}
            disabled={turnState === 'ENEMY_TURN'}
            className="combat__pass-btn"
          >
            <Hourglass size={14} />
            <span className="combat__pass-label">
              {turnState === 'ENEMY_TURN' ? 'Enemy Turn' : 'End Turn'}
            </span>
          </button>
        </div>
      </div>

      {/* PLAYER HUD */}
      <PlayerHUD
        ref={playerHudRef}
        player={player}
        playerStats={playerStats}
      />

      {/* FLOATING TEXT OVERLAY */}
      {FeatureFlags.SHOW_FLOATING_TEXT && floatingTexts.map(ft => (
        <FloatingText
          key={ft.id}
          id={ft.id}
          value={ft.text}
          type={ft.type}
          position={ft.position}
          onComplete={removeFloatingText}
        />
      ))}
    </div>
  );
});

Combat.displayName = 'Combat';

export default Combat;
