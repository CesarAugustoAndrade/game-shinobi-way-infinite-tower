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
import { approachFailHeatDelta, approachHeatPenaltyPp } from '../../game/systems/HeatSystem';
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
import { getApproachArt } from '../../game/constants/artRegistry';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './ApproachSelector.css';

// Simplified combat node info for approach selection (engage mode only)
interface CombatNodeInfo {
  id: string;
  type: 'COMBAT' | 'ELITE' | 'BOSS';
  terrain: TerrainType;
  enemy?: Enemy;
}

export type ApproachSelectorMode = 'preference' | 'engage';

interface ApproachSelectorProps {
  player: Player;
  playerStats: CharacterStats;
  onSelectApproach: (approach: ApproachType) => void;
  onCancel: () => void;
  /**
   * preference — HUD: set approach for all encounters until changed.
   * engage — legacy per-room pick (kept for tests / rare forced pick).
   */
  mode?: ApproachSelectorMode;
  /** Currently preferred approach (preference mode highlight) */
  currentPreferred?: ApproachType;
  /** Required for engage mode */
  node?: CombatNodeInfo;
  /** Required for engage mode */
  terrain?: TerrainDefinition;
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
  /**
   * F3: current visit heat (0–100). Passed into calculateApproachSuccessChance
   * so previews match live PP penalties.
   */
  visitHeat?: number;
  /** Current location intel (0–100%). Grants up to +15% approach success odds. */
  currentIntel?: number;
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
    case ApproachType.ENVIRONMENTAL_TRAP: return 'trap';
    case ApproachType.IRON_GUARD: return 'guard';
    case ApproachType.SHADOW_BYPASS: return 'bypass';
    default: return 'frontal';
  }
};

const lucideFallback = (type: ApproachType): React.ReactNode => {
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

/** Imagine approach icon when registered; Lucide fallback otherwise. */
export const getApproachIconNode = (type: ApproachType): React.ReactNode => {
  const art = getApproachArt(type);
  if (art.src) {
    return (
      <img
        src={art.src}
        alt=""
        className="approach-card__icon-img"
        draggable={false}
      />
    );
  }
  return lucideFallback(type);
};

const ApproachSelector: React.FC<ApproachSelectorProps> = ({
  player,
  playerStats,
  onSelectApproach,
  onCancel,
  mode = 'preference',
  currentPreferred,
  node,
  terrain,
  locationStealthBonusPts = 0,
  locationEvasionBonus = 0,
  roomConditionNames = null,
  roomConditionHints = null,
  visitHeat = 0,
  currentIntel = 0,
}) => {
  const isPreference = mode === 'preference';
  const preferred = currentPreferred ?? player.preferredApproach ?? ApproachType.FRONTAL_ASSAULT;

  const [selectedApproach, setSelectedApproach] = useState<ApproachType | null>(
    isPreference ? preferred : null,
  );
  const [showConfirm, setShowConfirm] = useState(false);
  /** Blocks double Engage / double Set */
  const [commitLocked, setCommitLocked] = useState(false);
  const commitLockRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstApproachRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(rootRef, true, firstApproachRef);

  const isEliteOrBoss = !isPreference && (node?.type === 'ELITE' || node?.type === 'BOSS');

  const combinedStealthPts =
    ((terrain?.effects.stealthModifier || 0) + (locationStealthBonusPts || 0));

  const roomEvasion = terrain?.effects.evasionModifier || 0;
  const combinedEvasion = roomEvasion + (locationEvasionBonus || 0);
  const amplifyElement = terrain?.effects.elementAmplify;
  const amplifyRaw = terrain?.effects.elementAmplifyPercent ?? 25;
  const amplifyPct = amplifyRaw <= 1 ? Math.round(amplifyRaw * 100) : Math.round(amplifyRaw);
  const conditionNames = (roomConditionNames ?? []).filter(Boolean);
  const conditionHint =
    roomConditionHints && roomConditionHints.length > 0
      ? roomConditionHints.join(' · ')
      : undefined;
  const movementCost = terrain?.effects.movementCost ?? 1;

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
      const terrainGated = Boolean(def.requirements.allowedTerrains?.length);

      if (!isPreference && approachType === ApproachType.SHADOW_BYPASS && isEliteOrBoss) {
        return {
          type: approachType,
          def,
          available: false,
          reason: 'Cannot bypass Elite or Boss',
          successChance: 0,
          benefits: getApproachBenefitTags(approachType),
          failures: getApproachFailureTags(approachType),
          terrainGated,
        };
      }

      // Preference: ignore room terrain so player can lock terrain-gated styles.
      // Engage: enforce terrain (and all other gates).
      const { meets, reason } = meetsApproachRequirements(
        approachType,
        stats,
        skillIds,
        node?.terrain ?? TerrainType.TRAINING_FIELD,
        isPreference,
      );

      // F3: same heat PP penalties as executeApproach / live roll; includes Intel bonus
      const successChance = meets
        ? calculateApproachSuccessChance(
            approachType,
            stats,
            isPreference ? 0 : combinedStealthPts,
            visitHeat,
            currentIntel,
          )
        : 0;

      const failHeat = approachFailHeatDelta(approachType);
      const heatPp = approachHeatPenaltyPp(approachType, visitHeat);
      const intelPp = Math.round((Math.min(100, Math.max(0, currentIntel)) / 100) * 15);
      const failureTags = [
        ...getApproachFailureTags(approachType),
        ...(failHeat > 0 ? [`Fail heat +${failHeat}`] : []),
      ];
      const benefitTags = [
        ...getApproachBenefitTags(approachType),
        ...(intelPp > 0 && approachType !== ApproachType.FRONTAL_ASSAULT ? [`Intel +${intelPp}%`] : []),
        ...(heatPp < 0 && visitHeat >= 25 ? [`Heat ${heatPp}pp`] : []),
      ];

      return {
        type: approachType,
        def,
        available: meets,
        reason,
        successChance: Math.round(successChance),
        benefits: benefitTags,
        failures: failureTags,
        terrainGated,
      };
    });

    return list.sort((a, b) => {
      if (a.available === b.available) return 0;
      return a.available ? -1 : 1;
    });
  }, [stats, skillIds, node?.terrain, combinedStealthPts, isEliteOrBoss, isPreference, visitHeat]);

  const firstAvailableType = approaches.find(a => a.available)?.type;

  const handleSelect = (approach: ApproachType) => {
    if (commitLockRef.current) return;
    setSelectedApproach(approach);
    setShowConfirm(true);
  };

  const handleBackFromConfirm = () => {
    if (commitLockRef.current) return;
    setShowConfirm(false);
  };

  const handleCancel = () => {
    if (commitLockRef.current) return;
    onCancel();
  };

  const handleConfirm = () => {
    if (!selectedApproach || commitLockRef.current) return;
    commitLockRef.current = true;
    setCommitLocked(true);
    try {
      onSelectApproach(selectedApproach);
    } catch (err) {
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
    if (isPreference && preferred === approach.type) {
      classes.push('approach-card--preferred');
    }
    return classes.join(' ');
  };

  const availableCount = approaches.filter(a => a.available).length;

  const OPTION_SHORTCUTS = ['A', 'S', 'D', 'Z', 'X', 'C'];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (showConfirm) {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (!commitLockRef.current) {
            handleBackFromConfirm();
          }
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const chakraCost = selectedDef?.successEffects?.chakraCost ?? 0;
          const hasChakra = isPreference || chakraCost <= player.currentChakra;
          if (!commitLockRef.current && hasChakra) {
            handleConfirm();
          }
          return;
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (commitLockRef.current) return;
        onCancel();
        return;
      }

      if (commitLockRef.current) return;

      // Shortcut keys A, S, D, Z, X, C for approach cards 0..5
      const upperKey = e.key.toUpperCase();
      let index = -1;
      if (e.key >= '1' && e.key <= '6') {
        index = parseInt(e.key, 10) - 1;
      } else if (OPTION_SHORTCUTS.includes(upperKey)) {
        index = OPTION_SHORTCUTS.indexOf(upperKey);
      }

      if (index >= 0 && index < approaches.length) {
        const approach = approaches[index];
        if (approach && approach.available) {
          e.preventDefault();
          handleSelect(approach.type);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, showConfirm, approaches, selectedDef, player.currentChakra, isPreference]);

  return (
    <div
      ref={rootRef}
      className="approach-modal"
      role="dialog"
      aria-modal="true"
      aria-label={isPreference ? 'Set your approach' : 'Choose your approach'}
    >
      <div className="approach-modal__container">
        <div className="approach-modal__header">
          <div className="approach-modal__identity">
            {!isPreference && node?.enemy?.image ? (
              <img
                src={node.enemy.image}
                alt=""
                className="approach-modal__enemy-art"
                aria-hidden="true"
              />
            ) : null}
            <div>
              <h2 className="approach-modal__title">
                {isPreference ? 'Set Your Approach' : 'Choose Your Approach'}
              </h2>
              <p className="approach-modal__subtitle">
                {isPreference ? (
                  <>
                    <span className="approach-modal__enemy">Applies to every fight</span>
                    <span className="approach-modal__sep">·</span>
                    <span className="approach-modal__terrain">until you change it</span>
                    <span className="approach-modal__sep">·</span>
                    <span className="approach-modal__count">{availableCount}/{approaches.length} open</span>
                  </>
                ) : (
                  <>
                    <span className="approach-modal__enemy">{node?.enemy?.name || 'Unknown Enemy'}</span>
                    <span className="approach-modal__sep">·</span>
                    <span className="approach-modal__terrain">{terrain?.name ?? 'Unknown'}</span>
                    <span className="approach-modal__sep">·</span>
                    <span className="approach-modal__count">{availableCount}/{approaches.length} open</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="approach-modal__header-actions">
            <button
              type="button"
              onClick={handleCancel}
              disabled={commitLocked}
              className="approach-modal__exit"
              title={isPreference ? 'Close [Esc]' : 'Leave this room without fighting [Esc]'}
            >
              <LogOut className="approach-modal__exit-icon" />
              <span>{isPreference ? 'Close' : 'Exit Room'}</span>
              <span className="approach-modal__exit-key">Esc</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={commitLocked}
              className="approach-modal__close"
              aria-label={isPreference ? 'Close' : 'Exit room'}
            >
              <X className="approach-modal__close-icon" />
            </button>
          </div>
        </div>

        <div className="approach-modal__body">
          <div className="approach-modal__grid">
            {approaches.map((approach, idx) => {
              const tier = getSuccessTier(approach.successChance);
              const riskLabel = getRiskLabel(approach.successChance);
              const posture = approach.available && !approach.def.successEffects.skipCombat
                ? describePosture(openingPostureForApproach(approach.type, true))
                : null;
              const failPreview = approach.available
                ? approach.failures.slice(0, 2)
                : [];
              const isCurrentPreferred = isPreference && preferred === approach.type;

              return (
                <button
                  type="button"
                  key={approach.type}
                  ref={approach.type === firstAvailableType ? firstApproachRef : undefined}
                  onClick={() => approach.available && handleSelect(approach.type)}
                  disabled={!approach.available}
                  className={getCardClasses(approach)}
                >
                  <div className="approach-card__header">
                    <div className={`approach-card__icon approach-card__icon--${approach.available ? 'available' : 'disabled'}`}>
                      {getApproachIconNode(approach.type)}
                    </div>
                    <div className="approach-card__title-group">
                      <h3 className={`approach-card__name approach-card__name--${approach.available ? 'available' : 'disabled'}`}>
                        {approach.def.name}
                        {approach.available && OPTION_SHORTCUTS[idx] && (
                          <span className="sw-shortcut">{OPTION_SHORTCUTS[idx]}</span>
                        )}
                      </h3>
                      {isCurrentPreferred && (
                        <span className="approach-card__tag approach-card__tag--safe">Active</span>
                      )}
                      {approach.type === ApproachType.FRONTAL_ASSAULT && !isCurrentPreferred && (
                        <span className="approach-card__tag approach-card__tag--safe">Always available</span>
                      )}
                      {approach.type === ApproachType.IRON_GUARD && approach.available && !isCurrentPreferred && (
                        <span className="approach-card__tag approach-card__tag--tank">Tank path</span>
                      )}
                      {approach.available && approach.type !== ApproachType.FRONTAL_ASSAULT && !isCurrentPreferred && (
                        <span className={`approach-card__tag approach-card__tag--risk approach-card__tag--risk-${tier}`}>
                          {riskLabel}
                        </span>
                      )}
                      {approach.available && approach.terrainGated && isPreference && (
                        <span className="approach-card__tag approach-card__tag--tank">Terrain-gated</span>
                      )}
                    </div>
                  </div>

                  <p className={`approach-card__description approach-card__description--${approach.available ? 'available' : 'disabled'}`}>
                    {approach.def.description}
                  </p>

                  {approach.available && approach.benefits.length > 0 && (
                    <div className="approach-card__benefits" aria-label="On success">
                      {approach.benefits.slice(0, 3).map(tag => (
                        <span key={tag} className="approach-card__chip approach-card__chip--gain">{tag}</span>
                      ))}
                    </div>
                  )}

                  {failPreview.length > 0 && (
                    <div className="approach-card__risks" aria-label="On failure">
                      {failPreview.map(tag => (
                        <span key={tag} className="approach-card__chip approach-card__chip--risk">{tag}</span>
                      ))}
                    </div>
                  )}

                  {approach.available && !isPreference && (
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

                  {approach.available && isPreference && approach.type !== ApproachType.FRONTAL_ASSAULT && (
                    <div className="success-bar">
                      <div className="success-bar__header">
                        <span className="success-bar__label">Base odds</span>
                        <span className={`success-bar__value success-bar__value--${tier}`}>
                          ~{approach.successChance}%
                        </span>
                      </div>
                      <div className="success-bar__track">
                        <div
                          className={`success-bar__fill success-bar__fill--${tier}`}
                          style={{ width: `${approach.successChance}%` }}
                        />
                      </div>
                      <span className="approach-card__cost approach-card__cost--free" style={{ marginTop: 4 }}>
                        Varies by room terrain
                      </span>
                    </div>
                  )}

                  {!approach.available && approach.reason && (
                    <div className="approach-card__requirement">
                      <AlertTriangle className="approach-card__requirement-icon" />
                      <span>{approach.reason}</span>
                    </div>
                  )}

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

        <div className="terrain-effects">
          <div className="terrain-effects__content">
            {isPreference ? (
              <span className="terrain-effects__item">
                Your choice applies to every encounter. Unavailable rooms fall back to Frontal Assault.
              </span>
            ) : (
              <>
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
                {terrain && terrain.effects.initiativeModifier !== 0 && (
                  <span className={`terrain-effects__item terrain-effects__item--${terrain.effects.initiativeModifier > 0 ? 'positive' : 'negative'}`}>
                    Initiative {terrain.effects.initiativeModifier > 0 ? '+' : ''}{terrain.effects.initiativeModifier}
                  </span>
                )}
                {combinedEvasion !== 0 && (
                  <span className={`terrain-effects__item terrain-effects__item--${combinedEvasion > 0 ? 'positive' : 'negative'}`}>
                    Evasion {combinedEvasion > 0 ? '+' : ''}{Math.round(combinedEvasion * 100)}%
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
                {terrain?.effects.hazard && (
                  <span className="terrain-effects__item terrain-effects__item--hazard">
                    {getHazardLabel(terrain.effects.hazard.type)} hazard
                  </span>
                )}
                {conditionNames.length > 0 && (
                  <span
                    className="terrain-effects__item terrain-effects__item--condition"
                    title={conditionHint}
                  >
                    Room: {conditionNames.join(' · ')}
                  </span>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={commitLocked}
            className="approach-modal__exit approach-modal__exit--footer"
            title={isPreference ? 'Close [Esc]' : 'Leave this room without fighting [Esc]'}
          >
            <LogOut className="approach-modal__exit-icon" />
            <span>{isPreference ? 'Close' : 'Exit Room'}</span>
            <span className="approach-modal__exit-key">Esc</span>
          </button>
        </div>
      </div>

      {showConfirm && selectedDef && selectedInfo && (
        <div className="confirm-modal">
          <div className="confirm-modal__container">
            <h3 className="confirm-modal__title">
              {isPreference ? 'Confirm Approach' : 'Confirm Approach'}
            </h3>

            <div className="confirm-modal__preview">
              <div className={`confirm-modal__preview-icon confirm-modal__preview-icon--${approachAccent(selectedApproach!)}`}>
                {getApproachIconNode(selectedApproach!)}
              </div>
              <div className="confirm-modal__preview-info">
                <p className="confirm-modal__preview-name">{selectedDef.name}</p>
                {!isPreference && (
                  <p className={`confirm-modal__preview-chance success-bar__value--${getSuccessTier(selectedInfo.successChance)}`}>
                    {selectedInfo.successChance}% success
                    <span className="confirm-modal__risk-inline">
                      {' '}· {getRiskLabel(selectedInfo.successChance)}
                    </span>
                  </p>
                )}
                {isPreference && (
                  <p className="confirm-modal__preview-chance">
                    Used on every fight until you change it
                  </p>
                )}
              </div>
            </div>

            <p className="confirm-modal__desc">{selectedDef.description}</p>

            {!isPreference && (
              <p className="confirm-modal__tradeoff-lead">
                Weigh the gain against the stake before you commit.
              </p>
            )}

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
                Costs {selectedDef.successEffects.chakraCost} Chakra per fight
                {!isPreference && player.currentChakra < selectedDef.successEffects.chakraCost && (
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
                <span className="sw-shortcut">Esc</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  commitLocked ||
                  (!isPreference && selectedDef.successEffects.chakraCost > player.currentChakra)
                }
                className="confirm-modal__btn confirm-modal__btn--confirm"
              >
                <Check className="confirm-modal__btn-icon" />
                {commitLocked
                  ? (isPreference ? 'Saving…' : 'Engaging…')
                  : (isPreference ? 'Set Approach' : 'Engage')}
                <span className="sw-shortcut">Enter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproachSelector;
