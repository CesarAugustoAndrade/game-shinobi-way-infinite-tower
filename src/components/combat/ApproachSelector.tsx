import React, { useState, useMemo, useEffect } from 'react';
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
    setSelectedApproach(approach);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (selectedApproach) {
      onSelectApproach(selectedApproach);
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

  // Escape / cancel → leave room without fighting
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showConfirm) {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, showConfirm]);

  return (
    <div className="approach-modal">
      <div className="approach-modal__container">
        {/* Header */}
        <div className="approach-modal__header">
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
          <div className="approach-modal__header-actions">
            <button
              type="button"
              onClick={onCancel}
              className="approach-modal__exit"
              title="Leave this room without fighting [Esc]"
            >
              <LogOut className="approach-modal__exit-icon" />
              <span>Exit Room</span>
              <span className="approach-modal__exit-key">Esc</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
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
              const posture = approach.available && !approach.def.successEffects.skipCombat
                ? describePosture(openingPostureForApproach(approach.type, true))
                : null;

              return (
                <button
                  type="button"
                  key={approach.type}
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
                        <span className="approach-card__tag approach-card__tag--new">Tank path</span>
                      )}
                    </div>
                  </div>

                  {/* Description — short, high contrast */}
                  <p className={`approach-card__description approach-card__description--${approach.available ? 'available' : 'disabled'}`}>
                    {approach.def.description}
                  </p>

                  {/* Benefit chips */}
                  {approach.available && approach.benefits.length > 0 && (
                    <div className="approach-card__benefits" aria-label="Benefits on success">
                      {approach.benefits.slice(0, 3).map(tag => (
                        <span key={tag} className="approach-card__chip">{tag}</span>
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
                {terrain.effects.hazard.type} hazard
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
            onClick={onCancel}
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
                </p>
              </div>
            </div>

            <p className="confirm-modal__desc">{selectedDef.description}</p>

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
                onClick={() => setShowConfirm(false)}
                className="confirm-modal__btn confirm-modal__btn--back"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedDef.successEffects.chakraCost > player.currentChakra}
                className="confirm-modal__btn confirm-modal__btn--confirm"
              >
                <Check className="confirm-modal__btn-icon" />
                Engage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproachSelector;
