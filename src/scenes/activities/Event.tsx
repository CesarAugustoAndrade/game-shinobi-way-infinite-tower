import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  GameEvent,
  Player,
  EventChoice,
  EventOutcome,
  CharacterStats,
  RiskLevel,
  PrimaryStat,
} from '../../game/types';
import {
  checkRequirements,
  checkEventCost,
  checkEventFlags,
  getAvailableChoices,
} from '../../game/systems/EventSystem';
import { applyVisibilityToIntelGain } from '../../game/systems/LocationTerrainSystem';
import type { LocationTerrainMods } from '../../game/systems/LocationTerrainSystem';
import { getEventArt } from '../../game/constants/artRegistry';
import ArtIcon from '../../components/shared/ArtIcon';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import { CheckCircle, Lock, Info } from 'lucide-react';
import './Event.css';

interface EventProps {
  activeEvent: GameEvent;
  /** false = gate failed / ignored — re-arm confirm so choices are not dead forever */
  onChoice: (choice: EventChoice) => boolean | void;
  player?: Player | null;
  playerStats?: CharacterStats | null;
  /** T-011: true when this event was reached by chaining from a prior outcome. */
  cameFromChain?: boolean;
  /**
   * T-088: location visibility mods for fog-honest outcome preview
   * (same scaling as applyVisibilityToIntelGain on resolve).
   */
  locationTerrainMods?: LocationTerrainMods | null;
  /** Biome plate — location BG take via SceneBackdrop (same as Merchant/Training). */
  background?: string;
}

/* ===========================================
   Helper Functions
   =========================================== */

const getRiskClass = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case RiskLevel.SAFE:
      return 'safe';
    case RiskLevel.LOW:
      return 'low';
    case RiskLevel.MEDIUM:
      return 'medium';
    case RiskLevel.HIGH:
      return 'high';
    case RiskLevel.EXTREME:
      return 'extreme';
    default:
      return 'safe';
  }
};

/** Filled segments (1-5) for the risk meter, one step per escalation. */
const getRiskLevelIndex = (riskLevel: RiskLevel): number => {
  switch (riskLevel) {
    case RiskLevel.SAFE:
      return 1;
    case RiskLevel.LOW:
      return 2;
    case RiskLevel.MEDIUM:
      return 3;
    case RiskLevel.HIGH:
      return 4;
    case RiskLevel.EXTREME:
      return 5;
    default:
      return 1;
  }
};

const getStatCategory = (stat: PrimaryStat): 'body' | 'mind' | 'technique' => {
  switch (stat) {
    case PrimaryStat.WILLPOWER:
    case PrimaryStat.CHAKRA:
    case PrimaryStat.STRENGTH:
      return 'body';
    case PrimaryStat.SPIRIT:
    case PrimaryStat.INTELLIGENCE:
    case PrimaryStat.CALMNESS:
      return 'mind';
    case PrimaryStat.SPEED:
    case PrimaryStat.ACCURACY:
    case PrimaryStat.DEXTERITY:
      return 'technique';
    default:
      return 'body';
  }
};

const getPlayerStatValue = (player: Player, stat: PrimaryStat): number => {
  const statKey = stat.toLowerCase() as keyof typeof player.primaryStats;
  return player.primaryStats[statKey] || 0;
};

const getOutcomeType = (outcome: EventOutcome): 'reward' | 'danger' | 'neutral' => {
  const { effects } = outcome;

  if (effects.triggerCombat || effects.curse || effects.removeRandomItem) return 'danger';
  if (
    effects.hpChange &&
    ((typeof effects.hpChange === 'number' && effects.hpChange < 0) ||
      (typeof effects.hpChange === 'object' && effects.hpChange.percent < 0))
  )
    return 'danger';

  if (
    effects.exp ||
    (effects.ryo && effects.ryo > 0) ||
    effects.grantSkillById ||
    effects.statChanges ||
    effects.upgradeTreasureQuality ||
    effects.addMerchantSlot
  ) {
    return 'reward';
  }

  return 'neutral';
};

const formatOutcomeText = (
  outcome: EventOutcome,
  locationTerrainMods?: LocationTerrainMods | null,
): string => {
  const { effects } = outcome;
  const parts: string[] = [];

  if (effects.triggerCombat) parts.push(`Fight: ${effects.triggerCombat.name || 'Enemy'}`);
  if (effects.exp) parts.push(`+${effects.exp} XP`);
  if (effects.ryo) parts.push(`${effects.ryo > 0 ? '+' : ''}${effects.ryo} Ryo`);
  if (effects.hpChange) {
    if (typeof effects.hpChange === 'number') {
      parts.push(`${effects.hpChange > 0 ? '+' : ''}${effects.hpChange} HP`);
    } else {
      parts.push(`${effects.hpChange.percent > 0 ? '+' : ''}${effects.hpChange.percent}% HP`);
    }
  }
  if (effects.statChanges) {
    Object.entries(effects.statChanges).forEach(([stat, value]) => {
      if (value) parts.push(`${value > 0 ? '+' : ''}${value} ${stat.toUpperCase()}`);
    });
  }
  if (effects.grantSkillById) parts.push('Learn Jutsu');
  if (effects.curse) parts.push('Curse');
  if (effects.removeRandomItem) parts.push('Lose item');
  if (effects.upgradeTreasureQuality) parts.push('Treasure ↑');
  if (effects.addMerchantSlot) parts.push('+1 Merchant slot');
  // T-088: fog-honest intel preview (matches resolve path)
  if (effects.intelGain) {
    const base = effects.intelGain;
    const effective = applyVisibilityToIntelGain(base, locationTerrainMods);
    if (effective !== base) {
      parts.push(`+${base}%→+${effective}% Intel · fog`);
    } else {
      parts.push(`+${effective}% Intel`);
    }
  }

  return parts.length > 0 ? parts.join(' · ') : 'The story continues…';
};

/* ===========================================
   Risk Meter (badge + segmented bar)
   =========================================== */

const RiskMeter: React.FC<{ riskLevel: RiskLevel }> = ({ riskLevel }) => {
  const riskClass = getRiskClass(riskLevel);
  const filled = getRiskLevelIndex(riskLevel);

  return (
    <div className={`risk-meter risk-meter--${riskClass}`}>
      <span className="risk-meter__badge">{riskLevel}</span>
      <span className="risk-meter__bar" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`risk-meter__seg ${i < filled ? 'risk-meter__seg--on' : ''}`}
          />
        ))}
      </span>
    </div>
  );
};

/* ===========================================
   Outcome Preview (revealed when selected)
   =========================================== */

const OutcomePreview: React.FC<{
  outcomes: EventOutcome[];
  locationTerrainMods?: LocationTerrainMods | null;
}> = ({ outcomes, locationTerrainMods }) => {
  const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);

  return (
    <div className="choice-card__outcomes">
      <div className="choice-card__outcomes-header">Possible Outcomes</div>
      {outcomes.map((outcome, idx) => {
        const type = getOutcomeType(outcome);
        const percent = totalWeight > 0 ? Math.round((outcome.weight / totalWeight) * 100) : 0;
        return (
          <div key={idx} className="choice-card__outcome">
            <span className="choice-card__outcome-percent">{percent}%</span>
            <span className={`choice-card__outcome-type choice-card__outcome-type--${type}`}>
              {type}
            </span>
            <span className="choice-card__outcome-text">
              {formatOutcomeText(outcome, locationTerrainMods)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ===========================================
   Choice Card
   =========================================== */

interface ChoiceCardProps {
  choice: EventChoice;
  player: Player;
  playerStats: CharacterStats | null;
  isSelected: boolean;
  isDimmed: boolean;
  index: number;
  onSelect: () => void;
  onConfirm: () => void;
  /** T-088: fog mods for outcome preview */
  locationTerrainMods?: LocationTerrainMods | null;
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({
  choice,
  player,
  playerStats,
  isSelected,
  isDimmed,
  index,
  onSelect,
  onConfirm,
  locationTerrainMods,
}) => {
  const meetsRequirements = checkRequirements(player, choice.requirements, playerStats);
  const canAffordCost = checkEventCost(player, choice.costs);
  const isDisabled = !meetsRequirements || !canAffordCost;
  const riskClass = getRiskClass(choice.riskLevel);

  // Presentation-only gate reason (does not touch the engine).
  const gateReason = ((): string => {
    if (!meetsRequirements) {
      if (choice.requirements?.minStat) {
        return `Requires: ${choice.requirements.minStat.stat} ${choice.requirements.minStat.value}`;
      }
      if (choice.requirements?.requiredClan) {
        return `Requires clan: ${choice.requirements.requiredClan}`;
      }
    }
    if (!canAffordCost && choice.costs?.ryo) {
      return `Costs: ${choice.costs.ryo} Ryo`;
    }
    return 'Unavailable';
  })();

  // Click flow without inline expansion: first click selects, a click on the
  // already-selected card confirms it. Enter/1-4 are handled at scene level.
  const handleCardClick = useCallback(() => {
    if (isDisabled || isDimmed) return;
    if (isSelected) onConfirm();
    else onSelect();
  }, [isDisabled, isDimmed, isSelected, onSelect, onConfirm]);

  // Clicks inside the outcomes affordance must not select/confirm the card.
  const stopClick = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  const statRequirement = choice.requirements?.minStat;
  const playerStatValue = statRequirement ? getPlayerStatValue(player, statRequirement.stat) : 0;
  const statCategory = statRequirement ? getStatCategory(statRequirement.stat) : 'body';

  return (
    <div
      className={`choice-card choice-card--${riskClass} ${
        isSelected ? 'choice-card--selected' : ''
      } ${isDimmed ? 'choice-card--dimmed' : ''} ${isDisabled ? 'choice-card--disabled' : ''}`}
      onClick={handleCardClick}
      role="button"
      aria-pressed={isSelected}
      tabIndex={isDisabled || isDimmed ? -1 : 0}
      onKeyDown={(e) => {
        // Confirm is owned by the scene-level Enter handler (avoids double-fire);
        // here Enter/Space only selects an unselected, focused card.
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled && !isDimmed && !isSelected) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Header */}
      <div className="choice-card__header">
        <div className="choice-card__header-left">
          <span className="choice-card__index">{index + 1}</span>
          <span className="choice-card__label">{choice.label}</span>
        </div>
        <RiskMeter riskLevel={choice.riskLevel} />
      </div>

      {/* Body */}
      <div className="choice-card__body">
        <p className="choice-card__description">{choice.description}</p>

        {choice.hintText && <p className="choice-card__hint">"{choice.hintText}"</p>}

        {/* Requirement / cost read-out */}
        {statRequirement && (
          <div className="choice-card__requirements">
            <span
              className={`choice-card__requirement ${
                meetsRequirements
                  ? 'choice-card__requirement--met'
                  : 'choice-card__requirement--unmet'
              }`}
            >
              {meetsRequirements ? <CheckCircle size={12} /> : <Lock size={12} />}
              <span>
                {statRequirement.stat} {statRequirement.value}+
              </span>
            </span>
            <span className={`choice-card__stat-value choice-card__stat-value--${statCategory}`}>
              You: {playerStatValue}
            </span>
          </div>
        )}

        {/* Gated indicator */}
        {isDisabled && (
          <div className="choice-card__gate">
            <Lock size={13} />
            <span>{gateReason}</span>
          </div>
        )}

        {/* Possible outcomes — revealed as a hover/focus tooltip, no layout shift. */}
        {!isDisabled && choice.outcomes && choice.outcomes.length > 0 && (
          <div
            className="choice-card__outcomes-wrap"
            onClick={stopClick}
            tabIndex={0}
            aria-label="Show possible outcomes"
          >
            <span className="choice-card__outcomes-cue">
              <Info size={13} />
              <span>Possible Outcomes</span>
            </span>
            <div className="choice-card__tooltip" role="tooltip">
              <OutcomePreview
                outcomes={choice.outcomes}
                locationTerrainMods={locationTerrainMods}
              />
            </div>
          </div>
        )}

        {/* Confirm affordance (selected) — absolute, does not expand the card. */}
        {isSelected && !isDisabled && (
          <span className="choice-card__confirm-tag" aria-hidden="true">
            Confirm ▸
          </span>
        )}
      </div>
    </div>
  );
};

/* ===========================================
   Main Event Scene
   =========================================== */

const Event: React.FC<EventProps> = ({
  activeEvent,
  onChoice,
  player,
  playerStats,
  cameFromChain = false,
  locationTerrainMods = null,
  background,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  /** UI disable after confirm (re-render lag). */
  const [choiceLocked, setChoiceLocked] = useState(false);
  /**
   * Sync mutex — choiceLocked state alone lags one frame. Double Enter / Enter+click
   * same-tick both saw choiceLocked=false → double resolveEventChoice (double HP/ryo/flags).
   */
  const choiceLockRef = useRef(false);

  // T-008: hide choices gated out by the player's run flags. Requirement/cost
  // gating still shows-but-disables; flag gating removes the choice entirely.
  const availableChoices = useMemo(() => {
    const gated = player ? getAvailableChoices(activeEvent, player) : activeEvent.choices;
    // Anti-softlock guard: never open an event with zero selectable options.
    return gated.length > 0 ? gated : activeEvent.choices;
  }, [activeEvent, player]);

  // Some paths were hidden by flag gating → hint the player their run matters.
  const hasHiddenPaths = availableChoices.length < activeEvent.choices.length;

  // Reset selection whenever the event changes (e.g. a chain advances).
  useEffect(() => {
    setSelectedIndex(null);
    setChoiceLocked(false);
    choiceLockRef.current = false;
  }, [activeEvent]);

  const handleSelect = useCallback((index: number) => {
    if (choiceLockRef.current || choiceLocked) return;
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, [choiceLocked]);

  const handleConfirm = useCallback((choice: EventChoice) => {
    if (choiceLockRef.current || choiceLocked) return;
    // Lock first (same-tick Enter+click) — parent returns false on failed gate so we re-arm
    choiceLockRef.current = true;
    setChoiceLocked(true);
    const applied = onChoice(choice);
    if (applied === false) {
      choiceLockRef.current = false;
      setChoiceLocked(false);
    }
  }, [choiceLocked, onChoice]);

  const isChoiceAvailable = useCallback(
    (choice: EventChoice) => {
      if (!player || choiceLocked || choiceLockRef.current) return false;
      return (
        checkEventFlags(player, choice.requiresFlags, choice.excludesFlags) &&
        checkRequirements(player, choice.requirements, playerStats) &&
        checkEventCost(player, choice.costs)
      );
    },
    [player, playerStats, choiceLocked],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!player || choiceLocked || choiceLockRef.current) return;
      const key = e.key;

      if (key >= '1' && key <= '4') {
        e.preventDefault();
        const index = parseInt(key) - 1;
        if (index < availableChoices.length && isChoiceAvailable(availableChoices[index])) {
          handleSelect(index);
        }
      }

      if (key === 'Enter' && selectedIndex !== null) {
        e.preventDefault();
        const choice = availableChoices[selectedIndex];
        if (isChoiceAvailable(choice)) handleConfirm(choice);
      }

      if (key === 'Escape' && selectedIndex !== null) {
        e.preventDefault();
        setSelectedIndex(null);
      }
    },
    [player, availableChoices, selectedIndex, isChoiceAvailable, handleSelect, handleConfirm, choiceLocked],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!player) return null;

  return (
    <SceneBackdrop background={background} dim={0.32}>
      <div className="event">
        {/* Chain ribbon */}
        {cameFromChain && (
          <div className="event__chain" role="status">
            <span className="event__chain-glyph" aria-hidden="true">›</span>
            <span>Ledger continues</span>
          </div>
        )}

        {/* Cinematic header — plate art as scene of choice */}
        <header className="event__header">
          <div className="event__plate" aria-hidden="true">
            <div className="event__plate-frame">
              <ArtIcon art={getEventArt(activeEvent.id)} size="xl" title={activeEvent.title} />
            </div>
            <span className="event__plate-tag">Scene of Choice</span>
          </div>
          <h1 className="event__title">{activeEvent.title}</h1>
          {activeEvent.mysteryFlavor && (
            <p className="event__mystery-flavor">{activeEvent.mysteryFlavor}</p>
          )}
          <p className="event__description">{activeEvent.description}</p>
        </header>

        {/* Divider + keyboard hints */}
        <div className="event__path-bar">
          <div className="event__divider">▸ Choose Your Path</div>
          <div className="event__hints">
            <span className="event__hint">
              <span className="sw-shortcut">1</span>-<span className="sw-shortcut">4</span> Select
            </span>
            <span className="event__hint">
              <span className="sw-shortcut">Enter</span> Confirm
            </span>
            <span className="event__hint">
              <span className="sw-shortcut">Esc</span> Deselect
            </span>
          </div>
        </div>

        {/* Choice cards */}
        <div className="event__choices">
          {availableChoices.length === 0 ? (
            <p className="event__empty-choices" role="status">
              No paths are open for this moment.
            </p>
          ) : (
            availableChoices.map((choice, idx) => (
              <ChoiceCard
                key={idx}
                choice={choice}
                player={player}
                playerStats={playerStats || null}
                isSelected={selectedIndex === idx}
                isDimmed={selectedIndex !== null && selectedIndex !== idx}
                index={idx}
                onSelect={() => handleSelect(idx)}
                onConfirm={() => handleConfirm(choice)}
                locationTerrainMods={locationTerrainMods}
              />
            ))
          )}
        </div>

        {/* Hidden-path hint */}
        {hasHiddenPaths && (
          <p className="event__hidden-note">
            Some paths stay sealed until your earlier choices open them.
          </p>
        )}
      </div>
    </SceneBackdrop>
  );
};

export default Event;
