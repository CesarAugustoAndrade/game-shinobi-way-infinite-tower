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

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/* ===========================================
   Risk Meter
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
   Outcome Preview
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
  staggerIndex: number;
  enter: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  locationTerrainMods?: LocationTerrainMods | null;
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({
  choice,
  player,
  playerStats,
  isSelected,
  isDimmed,
  index,
  staggerIndex,
  enter,
  onSelect,
  onConfirm,
  locationTerrainMods,
}) => {
  const meetsRequirements = checkRequirements(player, choice.requirements, playerStats);
  const canAffordCost = checkEventCost(player, choice.costs);
  const isDisabled = !meetsRequirements || !canAffordCost;
  const riskClass = getRiskClass(choice.riskLevel);

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

  const handleCardClick = useCallback(() => {
    if (isDisabled || isDimmed) return;
    if (isSelected) onConfirm();
    else onSelect();
  }, [isDisabled, isDimmed, isSelected, onSelect, onConfirm]);

  const stopClick = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  const statRequirement = choice.requirements?.minStat;
  const playerStatValue = statRequirement ? getPlayerStatValue(player, statRequirement.stat) : 0;
  const statCategory = statRequirement ? getStatCategory(statRequirement.stat) : 'body';

  return (
    <div
      className={`choice-card choice-card--${riskClass} ${
        isSelected ? 'choice-card--selected' : ''
      } ${isDimmed ? 'choice-card--dimmed' : ''} ${isDisabled ? 'choice-card--disabled' : ''} ${
        enter ? 'choice-card--enter' : ''
      }`}
      style={{ ['--choice-stagger' as string]: String(staggerIndex) }}
      onClick={handleCardClick}
      role="button"
      aria-pressed={isSelected}
      tabIndex={isDisabled || isDimmed ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled && !isDimmed && !isSelected) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="choice-card__header">
        <div className="choice-card__header-left">
          <span className="choice-card__index">{['A', 'S', 'D', 'Z', 'X', 'C'][index] ?? (index + 1)}</span>
          <span className="choice-card__label">{choice.label}</span>
        </div>
        <RiskMeter riskLevel={choice.riskLevel} />
      </div>

      <div className="choice-card__body">
        <p className="choice-card__description">{choice.description}</p>

        {choice.hintText && <p className="choice-card__hint">"{choice.hintText}"</p>}

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

        {isDisabled && (
          <div className="choice-card__gate">
            <Lock size={13} />
            <span>{gateReason}</span>
          </div>
        )}

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
   Main Event Scene — split poster + path (mockup style)
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
  const [choiceLocked, setChoiceLocked] = useState(false);
  const choiceLockRef = useRef(false);
  const [choicesEnter, setChoicesEnter] = useState(() => prefersReducedMotion());

  const availableChoices = useMemo(() => {
    const gated = player ? getAvailableChoices(activeEvent, player) : activeEvent.choices;
    return gated.length > 0 ? gated : activeEvent.choices;
  }, [activeEvent, player]);

  const hasHiddenPaths = availableChoices.length < activeEvent.choices.length;
  const eventArt = useMemo(() => getEventArt(activeEvent.id), [activeEvent.id]);

  useEffect(() => {
    setSelectedIndex(null);
    setChoiceLocked(false);
    choiceLockRef.current = false;
    if (prefersReducedMotion()) {
      setChoicesEnter(true);
      return;
    }
    setChoicesEnter(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setChoicesEnter(true));
    });
    return () => cancelAnimationFrame(id);
  }, [activeEvent]);

  const handleSelect = useCallback((index: number) => {
    if (choiceLockRef.current || choiceLocked) return;
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, [choiceLocked]);

  const handleConfirm = useCallback((choice: EventChoice) => {
    if (choiceLockRef.current || choiceLocked) return;
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

      const optionKeys = ['A', 'S', 'D', 'Z', 'X', 'C'];
      const upperKey = key.toUpperCase();
      let index = -1;
      if (key >= '1' && key <= '6') {
        index = parseInt(key, 10) - 1;
      } else if (optionKeys.includes(upperKey)) {
        index = optionKeys.indexOf(upperKey);
      }

      if (index >= 0 && index < availableChoices.length) {
        if (isChoiceAvailable(availableChoices[index])) {
          e.preventDefault();
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
    <SceneBackdrop background={background} dim={0.22}>
      <div
        className={`event${cameFromChain ? ' event--chained' : ''}`}
        role="region"
        aria-label={activeEvent.title}
      >
        {cameFromChain && (
          <div className="event__chain" role="status">
            <span className="event__chain-glyph" aria-hidden="true">›</span>
            <span>Ledger continues</span>
          </div>
        )}

        <div className="event__split">
          {/* ── LEFT: vertical cinematic poster ── */}
          <aside className="event__poster" aria-hidden={false}>
            <div className="event__poster-frame">
              <div className="event__poster-art">
                <ArtIcon art={eventArt} size="fill" title={activeEvent.title} />
              </div>
              <div className="event__poster-scrim" aria-hidden="true" />
              <div className="event__poster-copy">
                <span className="event__plate-tag">Scene of Choice</span>
                <h1 className="event__title">{activeEvent.title}</h1>
                {activeEvent.mysteryFlavor && (
                  <p className="event__mystery-flavor">{activeEvent.mysteryFlavor}</p>
                )}
                <p className="event__description">{activeEvent.description}</p>
              </div>
            </div>
          </aside>

          {/* ── RIGHT: path bar + choices ── */}
          <section className={`event__decision${choicesEnter ? ' event__decision--enter' : ''}`}>
            <div className="event__path-bar">
              <div className="event__divider">▸ Choose Your Path</div>
              <div className="event__hints">
                <span className="event__hint">
                  <span className="sw-shortcut">A</span>–<span className="sw-shortcut">C</span> Select
                </span>
                <span className="event__hint">
                  <span className="sw-shortcut">Enter</span> Confirm
                </span>
                <span className="event__hint">
                  <span className="sw-shortcut">Esc</span> Deselect
                </span>
                <span className="event__hint">
                  <span className="sw-shortcut">I</span> Bag
                </span>
                <span className="event__hint">
                  <span className="sw-shortcut">C</span> Character
                </span>
              </div>
            </div>

            <div className="event__choices" role="list">
              {availableChoices.length === 0 ? (
                <p className="event__empty-choices" role="status">
                  No paths are open for this moment.
                </p>
              ) : (
                availableChoices.map((choice, idx) => (
                  <ChoiceCard
                    key={`${activeEvent.id}-${idx}`}
                    choice={choice}
                    player={player}
                    playerStats={playerStats || null}
                    isSelected={selectedIndex === idx}
                    isDimmed={selectedIndex !== null && selectedIndex !== idx}
                    index={idx}
                    staggerIndex={idx}
                    enter={choicesEnter}
                    onSelect={() => handleSelect(idx)}
                    onConfirm={() => handleConfirm(choice)}
                    locationTerrainMods={locationTerrainMods}
                  />
                ))
              )}
            </div>

            {hasHiddenPaths && (
              <p className="event__hidden-note">
                Some paths stay sealed until your earlier choices open them.
              </p>
            )}
          </section>
        </div>
      </div>
    </SceneBackdrop>
  );
};

export default Event;
