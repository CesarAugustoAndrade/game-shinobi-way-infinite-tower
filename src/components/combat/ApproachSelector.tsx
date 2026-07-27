import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ApproachType,
  TerrainDefinition,
  TerrainType,
  CharacterStats,
  Player,
  Enemy,
} from '../../game/types';
import {
  APPROACH_DEFINITIONS,
  calculateApproachSuccessChance,
  meetsApproachRequirements,
  getApproachBenefitTags,
  getApproachFailureTags,
} from '../../game/constants/approaches';
import {
  describePosture,
  openingPostureForApproach,
} from '../../game/systems/PostureSystem';
import {
  Sword,
  Eye,
  Brain,
  TreePine,
  Wind,
  Shield,
  X,
  Check,
  AlertTriangle,
  Zap,
  LogOut,
} from 'lucide-react';
import { getHazardLabel } from '../../game/constants/terrain';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './ApproachSelector.css';

// Simplified combat node info for approach selection
interface CombatNodeInfo {
  id: string;
  type: 'COMBAT' | 'ELITE' | 'BOSS';
  terrain: TerrainType;
  enemy?: Enemy;
}

interface ApproachSelectorProps {
  node: CombatNodeInfo;
  terrain: TerrainDefinition;
  player: Player;
  playerStats: CharacterStats;
  onSelectApproach: (approach: ApproachType) => void;
  onCancel: () => void;
  /**
   * T-065: location terrain stealth points (fraction*100 from stealth_bonus).
   * Must match executeApproach so displayed % equals the roll.
   */
  locationStealthBonusPts?: number;
  /**
   * T-078: location evasion_bonus (fraction, e.g. 0.12). Stacks with room evasionModifier.
   */
  locationEvasionBonus?: number;
  /**
   * T-104: active room combat condition labels (Ambush, Sanctuary, …)
   * from COMBAT_MODIFIER_EFFECTS — fight already applies them (T-102/103).
   */
  roomConditionNames?: string[] | null;
  /** Optional short descriptions for tooltips */
  roomConditionHints?: string[] | null;
}

const getSuccessTier = (chance: number): string => {
  if (chance >= 80) return 'high';
  if (chance >= 60) return 'good';
  if (chance >= 40) return 'medium';
  if (chance >= 20) return 'low';
  return 'critical';
};

/** Human risk label — readable trade-off before commit (DD/StS scan) */
const getRiskLabel = (chance: number): string => {
  if (chance >= 80) return 'Low risk';
  if (chance >= 60) return 'Fair odds';
  if (chance >= 40) return 'Risky';
  if (chance >= 20) return 'High risk';
  return 'Desperate';
};

/** Accent class per approach for color-coding cards */
const approachAccent = (type: ApproachType): string => {
  switch (type) {
    case ApproachType.FRONTAL_ASSAULT: return 'frontal';
    case ApproachType.STEALTH_AMBUSH: return 'stealth';
    case ApproachType.GENJUTSU_SETUP: return 'genjutsu';
    case ApproachType.ENVIRONMENTAL_TRAP: return 'terrain';
    case ApproachType.IRON_GUARD: return 'guard';
    case ApproachType.SHADOW_BYPASS: return 'bypass';
    default: return 'frontal';
  }
};

const ApproachSelector: React.FC<ApproachSelectorProps> = ({
  node,
  terrain,
  player,
  playerStats,
  onSelectApproach,
  onCancel,
  locationStealthBonusPts = 0,
  locationEvasionBonus = 0,
  roomConditionNames = null,
  roomConditionHints = null,
}) => {
  const [selectedApproach, setSelectedApproach] = useState<ApproachType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  /** Blocks double Engage (double costs / double startCombat / double bypass complete). */
  const [commitLocked, setCommitLocked] = useState(false);
  const commitLockRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Focus the first *available* approach card, not the modal's first focusable — that is the
  // header "Exit Room" button, and both screens the player just came through teach
  // "Space / Enter enter room", so the taught keypress used to leave the room without fighting.
  const firstApproachRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(rootRef, true, firstApproachRef);

  const isEliteOrBoss = node.type === 'ELITE' || node.type === 'BOSS';

  const combinedStealthPts =
    (terrain.effects.stealthModifier || 0) + (locationStealthBonusPts || 0);

  const roomEvasion = terrain.effects.evasionModifier || 0;
  const combinedEvasion = roomEvasion + (locationEvasionBonus || 0);
  const amplifyElement = terrain.effects.elementAmplify;
  const amplifyRaw = terrain.effects.elementAmplifyPercent ?? 25;
  const amplifyPct = amplifyRaw <= 1 ? Math.round(amplifyRaw * 100) : Math.round(amplifyRaw);
  const conditionNames = (roomConditionNames ?? []).filter(Boolean);
  const conditionHint =
    roomConditionHints && roomConditionHints.length > 0
      ? roomConditionHints.join(' · ')
      : undefined;
  const movementCost = terrain.effects.movementCost ?? 1;

  const stats = useMemo(() => ({
    speed: playerStats.primary.speed,
    dexterity: playerStats.primary.dexterity,
    intelligence: playerStats.primary.intelligence,
    calmness: playerStats.primary.calmness,
    accuracy: playerStats.primary.accuracy,
    willpower: playerStats.primary.willpower,
    strength: playerStats.primary.strength,
    spirit: playerStats.primary.spirit,
    chakra: playerStats.primary.chakra,
  }), [playerStats]);

  const skillIds = useMemo(() => player.skills.map(s => s.id), [player.skills]);

  const approaches = useMemo(() => {
    const list = Object.values(ApproachType).map(approachType => {
      const def = APPROACH_DEFINITIONS[approachType];

      if (approachType === ApproachType.SHADOW_BYPASS && isEliteOrBoss) {
        return {
          type: approachType,
          def,
          available: false,
          reason: 'Cannot bypass Elite or Boss',
          successChance: 0,
          benefits: getApproachBenefitTags(approachType),
          failures: getApproachFailureTags(approachType),
        };
      }

      const { meets, reason } = meetsApproachRequirements(
        approachType,
        stats,
        skillIds,
        node.terrain
      );

      const successChance = meets
        ? calculateApproachSuccessChance(approachType, stats, combinedStealthPts)
        : 0;

      return {
        type: approachType,
        def,
        available: meets,
        reason,
        successChance: Math.round(successChance),
        benefits: getApproachBenefitTags(approachType),
        failures: getApproachFailureTags(approachType),
      };
    });

    // Readable order: available first, then locked; stable within groups by enum order
    return list.sort((a, b) => {
      if (a.available === b.available) return 0;
      return a.available ? -1 : 1;
    });
  }, [stats, skillIds, node.terrain, combinedStealthPts, isEliteOrBoss]);

  // Card that receives initial focus (the list is sorted available-first).
  const firstAvailableType = approaches.find(a => a.available)?.type;

  const getApproachIcon = (type: ApproachType): React.ReactNode => {
    switch (type) {
      case ApproachType.FRONTAL_ASSAULT:
        return <Sword />;
      case ApproachType.STEALTH_AMBUSH:
        return <Eye />;
      case ApproachType.GENJUTSU_SETUP:
        return <Brain />;
      case ApproachType.ENVIRONMENTAL_TRAP:
        return <TreePine />;
      case ApproachType.IRON_GUARD:
        return <Shield />;
      case ApproachType.SHADOW_BYPASS:
        return <Wind />;
      default:
        return <Zap />;
    }
  };

  const handleSelect = (approach: ApproachType) => {
    if (commitLockRef.current) return;
    setSelectedApproach(approach);
    setShowConfirm(true);
  };

  const handleBackFromConfirm = () => {
    if (commitLockRef.current) return;
    setShowConfirm(false);
  };

  /**
   * Exit Room / Esc cancel. Must not run after Engage is committed:
   * parent startCombat sets COMBAT + enemy, then cancel would setEnemy(null)
   * and leave a blank COMBAT shell (no Combat UI without enemy).
   */
  const handleCancel = () => {
    if (commitLockRef.current) return;
    onCancel();
  };

  const handleConfirm = () => {
    if (!selectedApproach || commitLockRef.current) return;
    // Sync ref first so a second click in the same tick cannot re-enter
    commitLockRef.current = true;
    setCommitLocked(true);
    try {
      onSelectApproach(selectedApproach);
    } catch (err) {
      // Parent threw — re-arm so player is not stuck on "Engaging…"
      commitLockRef.current = false;
      setCommitLocked(false);
      throw err;
    }
  };

  const selectedDef = selectedApproach ? APPROACH_DEFINITIONS[selectedApproach] : null;
  const selectedInfo = approaches.find(a => a.type === selectedApproach);

  const getCardClasses = (approach: typeof approaches[0]): string => {
    const classes = [
      'approach-card',
      `approach-card--${approachAccent(approach.type)}`,
    ];
    if (approach.available) {
      classes.push('approach-card--available');
    } else {
      classes.push('approach-card--disabled');
    }
    if (selectedApproach === approach.type) {
      classes.push('approach-card--selected');
    }
    return classes.join(' ');
  };

  const availableCount = approaches.filter(a => a.available).length;

  // Escape: confirm open → Back; else leave room without fighting
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (e.repeat) return;
      e.preventDefault();
      // Do not cancel/back mid-commit — Engage already started combat setup
      if (commitLockRef.current) return;
      if (showConfirm) {
        setShowConfirm(false);
        return;
      }
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, showConfirm]);

  return (
    <div
      ref={rootRef}
      className="approach-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your approach"
    >
      <div className="approach-modal__container">
        {/* Header */}
        <div className="approach-modal__header">
          <div className="approach-modal__identity">
            {/* R1 Feo: show foe face before the approach pick */}
            {node.enemy?.image ? (
              <img
                src={node.enemy.image}
                alt=""
                className="approach-modal__enemy-art"
                aria-hidden="true"
              />
            ) : null}
            <div>
            <h2 className="approach-modal__title">
              Choose Your Approach
            </h2>
            <p className="approach-modal__subtitle">
              <span className="approach-modal__enemy">{node.enemy?.name || 'Unknown Enemy'}</span>
              <span className="approach-modal__sep">·</span>
              <span className="approach-modal__terrain">{terrain.name}</span>
              <span className="approach-modal__sep">·</span>
              <span className="approach-modal__count">{availableCount}/{approaches.length} open</span>
            </p>
            </div>
          </div>
          <div className="approach-modal__header-actions">
            <button
              type="button"
              onClick={handleCancel}
              disabled={commitLocked}
              className="approach-modal__exit"
              title="Leave this room without fighting [Esc]"
            >
              <LogOut className="approach-modal__exit-icon" />
              <span>Exit Room</span>
              <span className="approach-modal__exit-key">Esc</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={commitLocked}
              className="approach-modal__close"
              aria-label="Exit room"
            >
              <X className="approach-modal__close-icon" />
            </button>
          </div>
        </div>

        {/* Approach Cards */}
        <div className="approach-modal__body">
          <div className="approach-modal__grid">
            {approaches.map(approach => {
              const tier = getSuccessTier(approach.successChance);
              const riskLabel = getRiskLabel(approach.successChance);
              const posture = approach.available && !approach.def.successEffects.skipCombat
                ? describePosture(openingPostureForApproach(approach.type, true))
                : null;
              const failPreview = approach.available
                ? approach.failures.slice(0, 2)
                : [];

              return (
                <button
                  type="button"
                  key={approach.type}
                  ref={approach.type === firstAvailableType ? firstApproachRef : undefined}
                  onClick={() => approach.available && handleSelect(approach.type)}
                  disabled={!approach.available}
                  className={getCardClasses(approach)}
                >
                  {/* Icon and Name */}
                  <div className="approach-card__header">
                    <div className={`approach-card__icon approach-card__icon--${approach.available ? 'available' : 'disabled'}`}>
                      {getApproachIcon(approach.type)}
                    </div>
                    <div className="approach-card__title-group">
                      <h3 className={`approach-card__name approach-card__name--${approach.available ? 'available' : 'disabled'}`}>
                        {approach.def.name}
                      </h3>
                      {approach.type === ApproachType.FRONTAL_ASSAULT && (
                        <span className="approach-card__tag approach-card__tag--safe">Always available</span>
                      )}
                      {approach.type === ApproachType.IRON_GUARD && approach.available && (
                        <span className="approach-card__tag approach-card__tag--tank">Tank path</span>
                      )}
                      {approach.available && approach.type !== ApproachType.FRONTAL_ASSAULT && (
                        <span className={`approach-card__tag approach-card__tag--risk approach-card__tag--risk-${tier}`}>
                          {riskLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description — short, high contrast */}
                  <p className={`approach-card__description approach-card__description--${approach.available ? 'available' : 'disabled'}`}>
                    {approach.def.description}
                  </p>

                  {/* Trade-off chips: success gains (green edge) */}
                  {approach.available && approach.benefits.length > 0 && (
                    <div className="approach-card__benefits" aria-label="On success">
                      {approach.benefits.slice(0, 3).map(tag => (
                        <span key={tag} className="approach-card__chip approach-card__chip--gain">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Trade-off chips: failure stakes (rust edge) — visible before confirm */}
                  {failPreview.length > 0 && (
                    <div className="approach-card__risks" aria-label="On failure">
                      {failPreview.map(tag => (
                        <span key={tag} className="approach-card__chip approach-card__chip--risk">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Success Chance */}
                  {approach.available && (
                    <div className="success-bar">
                      <div className="success-bar__header">
                        <span className="success-bar__label">Success</span>
                        <span className={`success-bar__value success-bar__value--${tier}`}>
                          {approach.successChance}%
                        </span>
                      </div>
                      <div className="success-bar__track">
                        <div
                          className={`success-bar__fill success-bar__fill--${tier}`}
                          style={{ width: `${approach.successChance}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Locked reason */}
                  {!approach.available && approach.reason && (
                    <div className="approach-card__requirement">
                      <AlertTriangle className="approach-card__requirement-icon" />
                      <span>{approach.reason}</span>
                    </div>
                  )}

                  {/* Meta row: cost + posture */}
                  {approach.available && (
                    <div className="approach-card__meta">
                      {approach.def.successEffects.chakraCost > 0 ? (
                        <span className="approach-card__cost">
                          <Zap className="approach-card__cost-icon" />
                          {approach.def.successEffects.chakraCost} Chakra
                        </span>
                      ) : (
                        <span className="approach-card__cost approach-card__cost--free">Free</span>
                      )}
                      {posture && (
                        <span className="approach-card__posture">
                          <span className="approach-card__posture-label">Opens</span>
                          <span className="approach-card__posture-value">{posture.label}</span>
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer: terrain + exit */}
        <div className="terrain-effects">
          <div className="terrain-effects__content">
            <span className="terrain-effects__label">Terrain:</span>
            {combinedStealthPts !== 0 && (
              <span className={`terrain-effects__item terrain-effects__item--${combinedStealthPts > 0 ? 'positive' : 'negative'}`}>
                Stealth {combinedStealthPts > 0 ? '+' : ''}{combinedStealthPts}%
                {locationStealthBonusPts !== 0 && (
                  <span className="terrain-effects__loc-note">
                    {' '}(loc {locationStealthBonusPts > 0 ? '+' : ''}{locationStealthBonusPts})
                  </span>
                )}
              </span>
            )}
            {terrain.effects.initiativeModifier !== 0 && (
              <span className={`terrain-effects__item terrain-effects__item--${terrain.effects.initiativeModifier > 0 ? 'positive' : 'negative'}`}>
                Initiative {terrain.effects.initiativeModifier > 0 ? '+' : ''}{terrain.effects.initiativeModifier}
              </span>
            )}
            {combinedEvasion !== 0 && (
              <span className={`terrain-effects__item terrain-effects__item--${combinedEvasion > 0 ? 'positive' : 'negative'}`}>
                Evasion {combinedEvasion > 0 ? '+' : ''}{Math.round(combinedEvasion * 100)}%
                {locationEvasionBonus !== 0 && (
                  <span className="terrain-effects__loc-note">
                    {' '}(loc {locationEvasionBonus > 0 ? '+' : ''}{Math.round(locationEvasionBonus * 100)}%)
                  </span>
                )}
              </span>
            )}
            {amplifyElement && (
              <span className="terrain-effects__item terrain-effects__item--positive">
                {amplifyElement} +{amplifyPct}%
              </span>
            )}
            {movementCost !== 1 && (
              <span className={`terrain-effects__item terrain-effects__item--${movementCost > 1 ? 'negative' : 'positive'}`}>
                Pace ×{movementCost.toFixed(1)}
                {movementCost > 1 ? ' (less AP)' : ' (more AP)'}
              </span>
            )}
            {terrain.effects.hazard && (
              <span className="terrain-effects__item terrain-effects__item--hazard">
                {getHazardLabel(terrain.effects.hazard.type)} hazard
              </span>
            )}
            {/* T-104: room combat conditions already applied at fight start */}
            {conditionNames.length > 0 && (
              <span
                className="terrain-effects__item terrain-effects__item--condition"
                title={conditionHint}
              >
                Room: {conditionNames.join(' · ')}
              </span>
            )}
            {combinedStealthPts === 0
              && terrain.effects.initiativeModifier === 0
              && combinedEvasion === 0
              && !amplifyElement
              && movementCost === 1
              && !terrain.effects.hazard
              && conditionNames.length === 0 && (
              <span className="terrain-effects__item">No special room modifiers</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={commitLocked}
            className="approach-modal__exit approach-modal__exit--footer"
            title="Leave this room without fighting [Esc]"
          >
            <LogOut className="approach-modal__exit-icon" />
            <span>Exit Room</span>
            <span className="approach-modal__exit-key">Esc</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedDef && selectedInfo && (
        <div className="confirm-modal">
          <div className="confirm-modal__container">
            <h3 className="confirm-modal__title">
              Confirm Approach
            </h3>

            <div className="confirm-modal__preview">
              <div className={`confirm-modal__preview-icon confirm-modal__preview-icon--${approachAccent(selectedApproach!)}`}>
                {getApproachIcon(selectedApproach!)}
              </div>
              <div className="confirm-modal__preview-info">
                <p className="confirm-modal__preview-name">{selectedDef.name}</p>
                <p className={`confirm-modal__preview-chance success-bar__value--${getSuccessTier(selectedInfo.successChance)}`}>
                  {selectedInfo.successChance}% success
                  <span className="confirm-modal__risk-inline">
                    {' '}· {getRiskLabel(selectedInfo.successChance)}
                  </span>
                </p>
              </div>
            </div>

            <p className="confirm-modal__desc">{selectedDef.description}</p>

            <p className="confirm-modal__tradeoff-lead">
              Weigh the gain against the stake before you commit.
            </p>

            {/* On Success */}
            <div className="confirm-modal__effects">
              <p className="confirm-modal__effects-title confirm-modal__effects-title--success">On Success</p>
              <ul className="confirm-modal__effects-list">
                {selectedInfo.benefits.map(b => (
                  <li key={b}>{b}</li>
                ))}
                {selectedDef.successEffects.guaranteedFirst && (
                  <li>Guaranteed first turn</li>
                )}
                {!selectedDef.successEffects.skipCombat && selectedApproach && (
                  <li>
                    Open in{' '}
                    {describePosture(openingPostureForApproach(selectedApproach, true)).label}{' '}
                    posture
                  </li>
                )}
              </ul>
            </div>

            {selectedApproach !== ApproachType.FRONTAL_ASSAULT && selectedInfo.failures.length > 0 && (
              <div className="confirm-modal__effects">
                <p className="confirm-modal__effects-title confirm-modal__effects-title--failure">On Failure</p>
                <ul className="confirm-modal__effects-list confirm-modal__effects-list--fail">
                  {selectedInfo.failures.map(f => (
                    <li key={f}>{f}</li>
                  ))}
                  <li>Open in Balanced posture</li>
                </ul>
              </div>
            )}

            {selectedDef.successEffects.chakraCost > 0 && (
              <div className="confirm-modal__cost-warning">
                Costs {selectedDef.successEffects.chakraCost} Chakra
                {player.currentChakra < selectedDef.successEffects.chakraCost && (
                  <span className="confirm-modal__cost-warning--insufficient">
                    {' '}— not enough chakra!
                  </span>
                )}
              </div>
            )}

            <div className="confirm-modal__buttons">
              <button
                type="button"
                onClick={handleBackFromConfirm}
                disabled={commitLocked}
                className="confirm-modal__btn confirm-modal__btn--back"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  commitLocked ||
                  selectedDef.successEffects.chakraCost > player.currentChakra
                }
                className="confirm-modal__btn confirm-modal__btn--confirm"
              >
                <Check className="confirm-modal__btn-icon" />
                {commitLocked ? 'Engaging…' : 'Engage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproachSelector;
