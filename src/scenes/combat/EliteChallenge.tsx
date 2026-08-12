import React, { useEffect, useCallback, useState } from 'react';
import { Enemy, Item, Player, CharacterStats, Rarity } from '../../game/types';
import { Zap, Swords, Wind } from 'lucide-react';
import { getEscapeChanceDescription } from '../../game/systems/EliteChallengeSystem';
import { getEnemyFullStats } from '../../game/systems/StatSystem';
import { resolveEnemyDisplayArt, resolveItemArt } from '../../game/constants/artRegistry';
import ArtIcon from '../../components/shared/ArtIcon';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import './EliteChallenge.css';

interface EliteChallengeProps {
  enemy: Enemy;
  artifact: Item | null;
  player: Player;
  playerStats: CharacterStats;
  onFight: () => void;
  onEscape?: () => void;
  customTitle?: string;
  customDescription?: string;
  /** Biome background image — fills the scene like CinematicViewscreen. */
  background?: string;
  /**
   * T-111: room combat condition labels (Ambush, Sanctuary, …)
   * already applied when fight starts (T-108).
   */
  roomConditionNames?: string[] | null;
  roomConditionHints?: string[] | null;
}

const raritySlug = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.BROKEN:
      return 'broken';
    case Rarity.RARE:
      return 'rare';
    case Rarity.EPIC:
      return 'epic';
    case Rarity.LEGENDARY:
      return 'legendary';
    case Rarity.CURSED:
      return 'cursed';
    default:
      return 'common';
  }
};

const getRarityClass = (rarity: Rarity): string =>
  `elite-challenge__artifact-name--${raritySlug(rarity)}`;

const getRarityTileClass = (rarity: Rarity): string =>
  `elite-challenge__artifact-tile--${raritySlug(rarity)}`;

/** Strip dungeon-cliché suffixes so the elite name is the title, never Guardian chrome. */
const cleanEliteDisplayName = (name: string): string =>
  name
    .replace(/\s*\(\s*Artifact\s+Guardian\s*\)\s*$/i, '')
    .replace(/\s+the\s+Guardian\s*$/i, '')
    .trim() || name;

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const EliteChallenge: React.FC<EliteChallengeProps> = ({
  enemy,
  artifact,
  playerStats,
  onFight,
  onEscape,
  customTitle,
  customDescription,
  background,
  roomConditionNames = null,
  roomConditionHints = null,
}) => {
  const escapeInfo = getEscapeChanceDescription(playerStats);
  const conditionNames = (roomConditionNames ?? []).filter(Boolean);
  const conditionHint =
    roomConditionHints && roomConditionHints.length > 0
      ? roomConditionHints.join(' · ')
      : undefined;
  const enemyStats = getEnemyFullStats(enemy);
  const eliteName = cleanEliteDisplayName(enemy.name);

  // Prefer true-alpha cutout (enemy_cut_*) — never the green chroma portrait plate
  const enemyDisplayArt = resolveEnemyDisplayArt({
    name: eliteName,
    archetype: enemy.archetype,
    isBoss: false,
    image: enemy.image,
    label: eliteName,
  });
  const artifactArt = artifact ? resolveItemArt(artifact) : null;

  const displayTitle = customTitle || eliteName;
  const displayDescription =
    customDescription ||
    'An elite shinobi steps into your path. Defeat them to claim the prize — or slip away if you can.';

  const [decisionEnter, setDecisionEnter] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDecisionEnter(true);
      return;
    }
    setDecisionEnter(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setDecisionEnter(true));
    });
    return () => cancelAnimationFrame(id);
  }, [enemy.name, enemy.tier, enemy.element]);

  // Keyboard shortcuts: F for Fight, E for Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Hold re-fires; parent eliteResolveLockRef is belt — still skip repeat noise
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onFight();
      } else if (e.key.toLowerCase() === 'e' && onEscape) {
        e.preventDefault();
        onEscape();
      }
    },
    [onFight, onEscape],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getEscapeChanceClass = (chance: number): string => {
    if (chance >= 60) return 'elite-challenge__escape-chance--high';
    if (chance >= 40) return 'elite-challenge__escape-chance--medium';
    return 'elite-challenge__escape-chance--low';
  };

  return (
    <SceneBackdrop background={background} dim={0.22}>
      <div
        className="elite-challenge"
        role="region"
        aria-label={`Elite Challenge: ${displayTitle}`}
      >
        <div className="elite-challenge__split">
          {/* ── LEFT: tall vertical cinematic poster (Event poster sibling) ── */}
          <aside className="elite-challenge__poster">
            <div className="elite-challenge__poster-frame">
              <div className="elite-challenge__poster-art">
                <ArtIcon art={enemyDisplayArt} size="fill" title={eliteName} />
              </div>
              <div className="elite-challenge__poster-scrim" aria-hidden="true" />
              <div className="elite-challenge__poster-copy">
                <span className="elite-challenge__plate-tag">Elite Challenge</span>
                <h1 className="elite-challenge__title">{displayTitle}</h1>
                <p className="elite-challenge__enemy-meta">
                  {enemy.tier} · {enemy.element}
                </p>
                <p className="elite-challenge__description">{displayDescription}</p>
                <div
                  className="elite-challenge__enemy-stats"
                  aria-label={`${eliteName} combat stats`}
                >
                  <div className="elite-challenge__enemy-stat">
                    <span className="elite-challenge__enemy-stat-label">HP</span>
                    <span className="elite-challenge__enemy-stat-value--hp">
                      {enemyStats.derived.maxHp}
                    </span>
                  </div>
                  <div className="elite-challenge__enemy-stat">
                    <span className="elite-challenge__enemy-stat-label">ATK</span>
                    <span className="elite-challenge__enemy-stat-value--atk">
                      {enemy.primaryStats.strength}
                    </span>
                  </div>
                  <div className="elite-challenge__enemy-stat">
                    <span className="elite-challenge__enemy-stat-label">SPD</span>
                    <span className="elite-challenge__enemy-stat-value--spd">
                      {enemy.primaryStats.speed}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── RIGHT: path bar + support + choice cards (Event decision sibling) ── */}
          <section
            className={`elite-challenge__decision${
              decisionEnter ? ' elite-challenge__decision--enter' : ''
            }`}
          >
            <div className="elite-challenge__path-bar">
              <div className="elite-challenge__divider">▸ Face {eliteName}</div>
              <div className="elite-challenge__hints">
                <span className="elite-challenge__hint">
                  <span className="sw-shortcut">F</span> Fight
                </span>
                {onEscape && (
                  <span className="elite-challenge__hint">
                    <span className="sw-shortcut">E</span> Escape
                  </span>
                )}
              </div>
            </div>

            {/* CTAs first — elite duel is the decision; prize is secondary */}
            <div className="elite-challenge__choices" role="list">
              <button
                type="button"
                onClick={onFight}
                className="elite-challenge__choice-btn elite-challenge__choice-btn--fight"
                role="listitem"
                style={{ ['--choice-stagger' as string]: '0' }}
                aria-label={`Fight ${eliteName}`}
              >
                <div className="elite-challenge__choice-content">
                  <div className="elite-challenge__choice-header">
                    <div className="elite-challenge__choice-header-left">
                      <span className="elite-challenge__choice-index">F</span>
                      <Swords
                        size={18}
                        className="elite-challenge__choice-icon--fight"
                        aria-hidden="true"
                      />
                      <span className="elite-challenge__choice-title">Fight</span>
                    </div>
                    <span className="elite-challenge__risk-badge elite-challenge__risk-badge--high">
                      Elite
                    </span>
                  </div>
                  <div className="elite-challenge__choice-body">
                    <p className="elite-challenge__choice-desc">
                      Engage this elite. Victory unlocks the prize artifact.
                    </p>
                  </div>
                </div>
              </button>

              {onEscape && (
                <button
                  type="button"
                  onClick={onEscape}
                  className="elite-challenge__choice-btn elite-challenge__choice-btn--escape"
                  role="listitem"
                  style={{ ['--choice-stagger' as string]: '1' }}
                  aria-label={`Escape from ${eliteName}, ${escapeInfo.chance}% chance`}
                >
                  <div className="elite-challenge__choice-content">
                    <div className="elite-challenge__choice-header">
                      <div className="elite-challenge__choice-header-left">
                        <span className="elite-challenge__choice-index">E</span>
                        <Wind
                          size={18}
                          className="elite-challenge__choice-icon--escape"
                          aria-hidden="true"
                        />
                        <span className="elite-challenge__choice-title">Escape</span>
                      </div>
                      <span
                        className={`elite-challenge__escape-badge ${getEscapeChanceClass(escapeInfo.chance)}`}
                      >
                        <span className="elite-challenge__escape-badge-label">Chance</span>
                        <span className="elite-challenge__escape-badge-value">
                          {escapeInfo.chance}%
                        </span>
                      </span>
                    </div>
                    <div className="elite-challenge__choice-body">
                      <p className="elite-challenge__choice-desc">
                        Slip away with Speed {escapeInfo.speedValue} (+
                        {escapeInfo.speedBonus}% bonus).
                      </p>
                      <p className="elite-challenge__escape-failure">
                        Failure → you must fight
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Prize secondary — does not compete with elite poster / fight CTA */}
            {artifact && artifactArt && (
              <div className="elite-challenge__artifact">
                <div className="elite-challenge__artifact-header">
                  <Zap size={16} className="elite-challenge__artifact-icon" aria-hidden="true" />
                  <span className="elite-challenge__artifact-label">Prize on victory</span>
                  <span className="elite-challenge__artifact-claim">Win to claim</span>
                </div>
                <div className="elite-challenge__artifact-main">
                  <div
                    className={`elite-challenge__artifact-tile ${getRarityTileClass(artifact.rarity)}`}
                  >
                    <ArtIcon
                      art={artifactArt}
                      size="lg"
                      className="elite-challenge__artifact-art"
                    />
                  </div>
                  <div>
                    <h4
                      className={`elite-challenge__artifact-name ${getRarityClass(artifact.rarity)}`}
                    >
                      {artifact.name}
                    </h4>
                    <p className="elite-challenge__artifact-rarity">{artifact.rarity}</p>
                  </div>
                </div>
                {artifact.description && (
                  <p className="elite-challenge__artifact-description">{artifact.description}</p>
                )}
                <div className="elite-challenge__artifact-stats">
                  {Object.entries(artifact.stats)
                    .slice(0, 4)
                    .map(([key, val]) =>
                      val ? (
                        <span key={key} className="elite-challenge__artifact-stat-chip">
                          +{val} {key.toUpperCase()}
                        </span>
                      ) : null,
                    )}
                </div>
              </div>
            )}

            {/* T-111: room fight conditions — compact, after CTAs */}
            {conditionNames.length > 0 && (
              <div
                className="elite-challenge__conditions"
                title={conditionHint}
                aria-label={`Room fight conditions: ${conditionNames.join(', ')}`}
              >
                <span className="elite-challenge__conditions-label">Room</span>
                {conditionNames.map((name) => (
                  <span key={name} className="elite-challenge__condition-chip">
                    {name}
                  </span>
                ))}
              </div>
            )}

            {onEscape && (
              <div className="elite-challenge__footer">
                Escape chance = 30% base + (Speed × 2), max 80%
              </div>
            )}
          </section>
        </div>
      </div>
    </SceneBackdrop>
  );
};

export default EliteChallenge;
