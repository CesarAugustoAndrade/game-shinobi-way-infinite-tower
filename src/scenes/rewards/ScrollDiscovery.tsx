import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Skill,
  SkillTier,
  Player,
  DamageType,
  ScrollDiscoveryActivity,
  CharacterStats,
  RegionLootTheme,
  ActionType,
} from '../../game/types';
import { Scroll, Zap, Brain, Sparkles } from 'lucide-react';
import Tooltip from '../../components/shared/Tooltip';
import {
  formatScalingStat,
  getStatColor,
  getElementColor,
  getEffectColor,
  getEffectIcon,
  formatEffectDescription,
} from '../../game/utils/tooltipFormatters';
import { isFocusStat } from '../../game/utils/itemFocusMatch';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import ArtIcon from '../../components/shared/ArtIcon';
import { getSkillArt } from '../../game/constants/artRegistry';
import { canLearnSkill } from '../../game/systems/StatSystem';
import { canAddPlayableSkill } from '../../game/systems/DeckSystem';
import { LaunchProperties } from '../../config/featureFlags';
import './ScrollDiscovery.css';

interface ScrollDiscoveryProps {
  scrollDiscovery: ScrollDiscoveryActivity;
  player: Player;
  playerStats: CharacterStats;
  onLearnScroll: (skill: Skill, slotIndex?: number) => void;
  onSkip: () => void;
  /** Biome background image — fills the scene like CinematicViewscreen. */
  background?: string;
  /**
   * T-113: region lootTheme for Affinity/Focus chips and themed scroll marks.
   */
  lootTheme?: RegionLootTheme | null;
}

/** T-051: local result before parent applies learn and leaves */
interface ScrollLearnResult {
  skill: Skill;
  mode: 'learned' | 'upgraded' | 'replaced';
  chakraCost: number;
  chakraBefore: number;
  chakraAfter: number;
  levelBefore?: number;
  levelAfter?: number;
  forgottenName?: string;
  slotIndex?: number;
}

// Helper functions for tier-based styling
const getTierNameClass = (tier: SkillTier): string => {
  switch (tier) {
    case SkillTier.ADVANCED:
      return 'scroll-card__name--advanced';
    case SkillTier.HIDDEN:
      return 'scroll-card__name--hidden';
    case SkillTier.FORBIDDEN:
      return 'scroll-card__name--forbidden';
    case SkillTier.KINJUTSU:
      return 'scroll-card__name--kinjutsu';
    default:
      return 'scroll-card__name--basic';
  }
};

const getTierCardClass = (tier: SkillTier): string => {
  switch (tier) {
    case SkillTier.ADVANCED:
      return 'scroll-card--advanced';
    case SkillTier.HIDDEN:
      return 'scroll-card--hidden';
    case SkillTier.FORBIDDEN:
      return 'scroll-card--forbidden';
    case SkillTier.KINJUTSU:
      return 'scroll-card--kinjutsu';
    default:
      return 'scroll-card--basic';
  }
};

const getDamageTypeClass = (dt: DamageType): string => {
  switch (dt) {
    case DamageType.PHYSICAL:
      return 'scroll-card__stat-value--physical';
    case DamageType.ELEMENTAL:
      return 'scroll-card__stat-value--elemental';
    case DamageType.MENTAL:
      return 'scroll-card__stat-value--mental';
    case DamageType.TRUE:
      return 'scroll-card__stat-value--true';
    default:
      return '';
  }
};

const ScrollDiscovery: React.FC<ScrollDiscoveryProps> = ({
  scrollDiscovery,
  player,
  playerStats,
  onLearnScroll,
  onSkip,
  background,
  lootTheme = null,
}) => {
  const [result, setResult] = useState<ScrollLearnResult | null>(null);
  /** Sync mutex — result state lags; double Enter/click re-called onLearnScroll. */
  const resultContinueLockRef = useRef(false);

  const chakraCost = scrollDiscovery.cost?.chakra || 0;
  const canAfford = player.currentChakra >= chakraCost;
  const focus = lootTheme?.equipmentFocus ?? null;
  const preferredElement = lootTheme?.primaryElement;

  const isThemedScroll = (skill: Skill): boolean => {
    if (preferredElement && skill.element === preferredElement) return true;
    if (focus && focus.length > 0) {
      return isFocusStat(String(skill.scalingStat), focus);
    }
    return false;
  };

  // Check if player already knows the skill
  const alreadyKnows = (skill: Skill) => player.skills.some(s => s.id === skill.id);
  // Combat deck cap: non-PASSIVE cards (see LaunchProperties.MAX_DECK_SIZE)
  const deckHasRoom = canAddPlayableSkill(player.skills);

  // T-051: preview result then apply via parent on continue
  const prepareLearn = useCallback(
    (skill: Skill, slotIndex?: number) => {
      if (!canAfford || resultContinueLockRef.current) return;
      const known = alreadyKnows(skill);
      const chakraBefore = player.currentChakra;
      const chakraAfter = chakraBefore - chakraCost;

      if (known) {
        const existing = player.skills.find((s) => s.id === skill.id)!;
        const levelBefore = existing.level || 1;
        setResult({
          skill,
          mode: 'upgraded',
          chakraCost,
          chakraBefore,
          chakraAfter,
          levelBefore,
          levelAfter: levelBefore + 1,
        });
        return;
      }

      if (slotIndex !== undefined) {
        const forgotten = player.skills[slotIndex];
        setResult({
          skill,
          mode: 'replaced',
          chakraCost,
          chakraBefore,
          chakraAfter,
          forgottenName: forgotten?.name,
          slotIndex,
        });
        return;
      }

      setResult({
        skill,
        mode: 'learned',
        chakraCost,
        chakraBefore,
        chakraAfter,
      });
    },
    [canAfford, player.currentChakra, player.skills, chakraCost],
  );

  const handleResultContinue = useCallback(() => {
    if (!result || resultContinueLockRef.current) return;
    resultContinueLockRef.current = true;
    // Clear local result first so double Enter/click cannot re-learn / re-spend chakra
    const { skill, slotIndex } = result;
    setResult(null);
    onLearnScroll(skill, slotIndex);
  }, [result, onLearnScroll]);

  // Keyboard: result → continue (Space/Enter/Esc); browse → leave (same keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.repeat) return;

      if (result) {
        // Continue-family: Esc parity Reward/Rest/Treasure claim
        if (e.code === 'Space' || e.code === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          handleResultContinue();
        }
        return;
      }

      if (e.key === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip, result, handleResultContinue]);

  // Multi-stat + clan hard-gates via shared canLearnSkill
  const meetsRequirements = (skill: Skill): { meets: boolean; reason?: string } => {
    const { canLearn, reason } = canLearnSkill(
      skill,
      playerStats.effectivePrimary,
      player.level,
      player.clan,
    );
    return { meets: canLearn, reason };
  };

  // T-051: learn/upgrade/replace result beat before parent unmounts
  if (result) {
    const modeLabel =
      result.mode === 'upgraded'
        ? `Seal deepened — Level ${result.levelAfter}`
        : result.mode === 'replaced'
          ? `Overwrote ${result.forgottenName ?? 'a technique'}`
          : 'Seal Claimed';
    return (
      <SceneBackdrop background={background}>
        <div className="scroll-discovery scroll-discovery--result">
          <div className="scroll-result" role="status">
            <div className="scroll-result__art">
              <ArtIcon art={getSkillArt(result.skill)} size="fill" title={result.skill.name} />
            </div>
            <h2 className="scroll-result__title">{modeLabel}</h2>
            <p className="scroll-result__name">{result.skill.name}</p>
            {result.mode === 'upgraded' && result.levelBefore != null && (
              <p className="scroll-result__detail">
                Level {result.levelBefore} → {result.levelAfter}
              </p>
            )}
            {result.mode === 'replaced' && result.forgottenName && (
              <p className="scroll-result__detail">
                Forgot {result.forgottenName} to make room
              </p>
            )}
            {result.chakraCost > 0 && (
              <p className="scroll-result__chakra">
                Chakra {result.chakraBefore} → {result.chakraAfter} (−{result.chakraCost})
              </p>
            )}
            <button
              type="button"
              className="scroll-result__continue"
              onClick={handleResultContinue}
            >
              Continue
              <span className="sw-shortcut">Enter</span>
              <span className="sw-shortcut">Esc</span>
            </button>
          </div>
        </div>
      </SceneBackdrop>
    );
  }

  return (
    <SceneBackdrop background={background}>
    <div className="scroll-discovery">
      <div className="scroll-discovery__header">
        <Scroll className="scroll-discovery__header-icon" size={24} />
        <h2 className="scroll-discovery__title">Ancient Scrolls</h2>
        <Scroll className="scroll-discovery__header-icon" size={24} />
      </div>

      <p className="scroll-discovery__subtitle">
        Sealed techniques wait in ink and dust. One path, one toll of chakra — choose carefully.
      </p>

      {/* T-113: region Affinity / Focus identity (gen already biased) */}
      {lootTheme && (
        <div className="scroll-discovery__theme" aria-label="Region theme">
          {lootTheme.primaryElement && (
            <span className="scroll-discovery__theme-chip scroll-discovery__theme-chip--affinity">
              Affinity {lootTheme.primaryElement}
            </span>
          )}
          {lootTheme.equipmentFocus?.length > 0 && (
            <span className="scroll-discovery__theme-chip scroll-discovery__theme-chip--focus">
              Focus{' '}
              {lootTheme.equipmentFocus
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(' · ')}
            </span>
          )}
        </div>
      )}

      {/* Keyboard Hints */}
      <div className="scroll-discovery__hints">
        <span className="scroll-discovery__hint">
          <span className="sw-shortcut">Space</span> or <span className="sw-shortcut">Enter</span> Leave Scrolls
        </span>
      </div>

      <div className="scroll-discovery__resources">
        <div className="scroll-discovery__resource">
          <Zap className="scroll-discovery__resource-icon--chakra" size={16} />
          <span className="scroll-discovery__resource-value--chakra">
            {player.currentChakra} / {playerStats.derived.maxChakra}
          </span>
        </div>
        <div className="scroll-discovery__resource">
          <Brain className="scroll-discovery__resource-icon--int" size={16} />
          <span className="scroll-discovery__resource-value--int">
            INT: {Math.floor(playerStats.effectivePrimary.intelligence)}
          </span>
        </div>
      </div>

      <div className="scroll-discovery__grid">
        {scrollDiscovery.availableScrolls.length === 0 && (
          <div className="scroll-discovery__empty" role="status">
            <p className="scroll-discovery__empty-title">The seals are blank</p>
            <p className="scroll-discovery__empty-body">
              Whatever was written here has already faded into the fog.
            </p>
          </div>
        )}
        {scrollDiscovery.availableScrolls.map((skill) => {
          const known = alreadyKnows(skill);
          const reqCheck = meetsRequirements(skill);
          const themed = isThemedScroll(skill);

          return (
            <Tooltip
              key={skill.id}
              content={
                <div className="scroll-tooltip">
                  <div className={`scroll-tooltip__name ${getTierNameClass(skill.tier)}`}>{skill.name}</div>
                  <div className="scroll-tooltip__description">{skill.description}</div>

                  <div className="scroll-tooltip__section">
                    <div className="scroll-tooltip__stat">
                      <span className="scroll-tooltip__stat-label">Chakra Cost</span>
                      <span className="scroll-card__stat-value--chakra">{skill.chakraCost}</span>
                    </div>
                    <div className="scroll-tooltip__stat">
                      <span className="scroll-tooltip__stat-label">Damage Type</span>
                      <span className={getDamageTypeClass(skill.damageType)}>{skill.damageType}</span>
                    </div>
                    <div className="scroll-tooltip__stat">
                      <span className="scroll-tooltip__stat-label">Multiplier</span>
                      <span className="scroll-card__stat-value--multiplier">{skill.damageMult}x {formatScalingStat(skill.scalingStat)}</span>
                    </div>
                    <div className="scroll-tooltip__stat">
                      <span className="scroll-tooltip__stat-label">Element</span>
                      <span className={getElementColor(skill.element)}>{skill.element}</span>
                    </div>
                  </div>

                  {skill.effects && skill.effects.length > 0 && (
                    <div className="scroll-tooltip__section">
                      <div className="scroll-tooltip__effects-title">Effects</div>
                      {skill.effects.map((effect, idx) => (
                        <div key={idx} className="scroll-tooltip__effect">
                          <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                          <span className="scroll-tooltip__effect-text">{formatEffectDescription(effect)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {skill.requirements && (
                    <div className="scroll-tooltip__section">
                      <div className="scroll-tooltip__requirements-title">Requirements:</div>
                      {skill.requirements.intelligence && (
                        <div className={playerStats.effectivePrimary.intelligence >= skill.requirements.intelligence ? 'scroll-tooltip__requirement--met' : 'scroll-tooltip__requirement--unmet'}>
                          INT {skill.requirements.intelligence}
                        </div>
                      )}
                      {skill.requirements.clan && (
                        <div className={player.clan === skill.requirements.clan ? 'scroll-tooltip__requirement--met' : 'scroll-tooltip__requirement--unmet'}>
                          {skill.requirements.clan} bloodline
                        </div>
                      )}
                    </div>
                  )}
                </div>
              }
            >
              <div className={`scroll-card ${getTierCardClass(skill.tier)} ${themed ? 'scroll-card--region' : ''}`}>
                <div className="scroll-card__art" aria-hidden="true">
                  <ArtIcon art={getSkillArt(skill)} size="fill" title={skill.name} />
                </div>
                {themed && (
                  <span className="scroll-card__region-badge" title="Matches region Affinity or Focus">
                    Region
                  </span>
                )}
                <div className="scroll-card__header">
                  <div className="scroll-card__title-section">
                    <h3 className={`scroll-card__name ${getTierNameClass(skill.tier)}`}>
                      {skill.name}
                    </h3>
                    <p className="scroll-card__type">{skill.tier} Technique</p>
                  </div>
                  {known && (
                    <span className="scroll-card__known-badge">Known</span>
                  )}
                </div>

                <p className="scroll-card__description">{skill.description}</p>

                <div className="scroll-card__stats">
                  <div className="scroll-card__stat">
                    <span>Chakra Cost</span>
                    <span className="scroll-card__stat-value--chakra">{skill.chakraCost}</span>
                  </div>
                  <div className="scroll-card__stat">
                    <span>Damage Type</span>
                    <span className={getDamageTypeClass(skill.damageType)}>{skill.damageType}</span>
                  </div>
                  <div className="scroll-card__stat">
                    <span>Element</span>
                    <span className={getElementColor(skill.element)}>{skill.element}</span>
                  </div>
                  <div className="scroll-card__stat">
                    <span>Multiplier</span>
                    <span className="scroll-card__stat-value--multiplier">{skill.damageMult}x {formatScalingStat(skill.scalingStat)}</span>
                  </div>
                </div>

                {!reqCheck.meets && (
                  <div className="scroll-card__warning scroll-card__warning--requirement">
                    {reqCheck.reason}
                  </div>
                )}

                <div className="scroll-card__actions">
                  {/* Known → upgrade always available (deck size irrelevant) */}
                  {known ? (
                    <button
                      type="button"
                      disabled={!canAfford || !reqCheck.meets}
                      onClick={() => prepareLearn(skill)}
                      className={`scroll-card__btn scroll-card__btn--learn ${!canAfford || !reqCheck.meets ? 'scroll-card__btn--learn:disabled' : ''}`}
                    >
                      <Sparkles size={14} />
                      Upgrade Skill
                      {chakraCost > 0 && (
                        <span className={`scroll-card__btn-cost ${canAfford ? 'scroll-card__btn-cost--affordable' : 'scroll-card__btn-cost--insufficient'}`}>
                          (-{chakraCost} Chakra)
                        </span>
                      )}
                    </button>
                  ) : (
                    <>
                      {/* Under deck cap → Learn */}
                      {deckHasRoom && reqCheck.meets && (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => prepareLearn(skill)}
                          className={`scroll-card__btn scroll-card__btn--learn ${!canAfford ? 'scroll-card__btn--learn:disabled' : ''}`}
                        >
                          <Sparkles size={14} />
                          Learn Technique
                          {chakraCost > 0 && (
                            <span className={`scroll-card__btn-cost ${canAfford ? 'scroll-card__btn-cost--affordable' : 'scroll-card__btn-cost--insufficient'}`}>
                              (-{chakraCost} Chakra)
                            </span>
                          )}
                        </button>
                      )}

                      {/* Deck full → forget a non-PASSIVE card, then learn */}
                      {!deckHasRoom && player.skills.length > 0 && reqCheck.meets && (
                        <div className="scroll-card__replace-grid">
                          <p className="scroll-card__replace-hint">
                            Deck full ({LaunchProperties.MAX_DECK_SIZE}). Forget a card to learn this:
                          </p>
                          {player.skills
                            .map((s, idx) => ({ s, idx }))
                            .filter(({ s }) => s.actionType !== ActionType.PASSIVE)
                            .map(({ s, idx }) => (
                              <button
                                type="button"
                                key={s.id}
                                disabled={!canAfford}
                                onClick={() => prepareLearn(skill, idx)}
                                className="scroll-card__btn--replace"
                              >
                                Forget {s.name}
                              </button>
                            ))}
                        </div>
                      )}
                    </>
                  )}

                  {!canAfford && (
                    <div className="scroll-card__warning--chakra">
                      Chakra too thin to unseal this scroll
                    </div>
                  )}
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>

      <div className="scroll-discovery__footer">
        <button type="button" onClick={onSkip} className="scroll-discovery__leave-btn">
          Leave the scrolls sealed
          <span className="sw-shortcut">Esc</span>
        </button>
      </div>
    </div>
    </SceneBackdrop>
  );
};

export default ScrollDiscovery;
