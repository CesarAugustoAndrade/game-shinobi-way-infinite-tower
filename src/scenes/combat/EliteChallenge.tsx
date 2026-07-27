import React, { useEffect, useCallback } from 'react';
import { Enemy, Item, Player, CharacterStats, Rarity } from '../../game/types';
import { Shield, Zap, Swords, Wind } from 'lucide-react';
import { getEscapeChanceDescription } from '../../game/systems/EliteChallengeSystem';
import { getEnemyFullStats } from '../../game/systems/StatSystem';
import { getEnemyArt, resolveItemArt } from '../../game/constants/artRegistry';
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

// Helper for rarity class
const getRarityClass = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.BROKEN:
      return 'elite-challenge__artifact-name--broken';
    case Rarity.RARE:
      return 'elite-challenge__artifact-name--rare';
    case Rarity.EPIC:
      return 'elite-challenge__artifact-name--epic';
    case Rarity.LEGENDARY:
      return 'elite-challenge__artifact-name--legendary';
    case Rarity.CURSED:
      return 'elite-challenge__artifact-name--cursed';
    default:
      return 'elite-challenge__artifact-name--common';
  }
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
  // T-036: Imagine registry art (enemy portrait + artifact tile)
  const enemyArt = getEnemyArt({
    name: enemy.name,
    archetype: enemy.archetype,
    isBoss: false,
  });
  // Prefer combat sprite when present; cascade still falls back to emoji
  const enemyDisplayArt = enemy.image
    ? { ...enemyArt, src: enemy.image, label: enemy.name }
    : { ...enemyArt, label: enemy.name };
  const artifactArt = artifact ? resolveItemArt(artifact) : null;

  // Keyboard shortcuts: F for Fight, E for Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
  }, [onFight, onEscape]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get escape chance color class
  const getEscapeChanceClass = (chance: number): string => {
    if (chance >= 60) return 'elite-challenge__escape-chance--high';
    if (chance >= 40) return 'elite-challenge__escape-chance--medium';
    return 'elite-challenge__escape-chance--low';
  };

  return (
    <SceneBackdrop background={background}>
    <div className="elite-challenge">
      {/* Header */}
      <div className="elite-challenge__icon">
        <Shield size={48} />
      </div>
      <h2 className="elite-challenge__title">
        {customTitle || 'Artifact Guardian'}
      </h2>
      <p className="elite-challenge__subtitle">
        {customDescription || 'A powerful guardian stands between you and a rare artifact. Will you fight or flee?'}
      </p>

      {/* T-111: room fight condition before Accept (parity with approach strip) */}
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

      {/* Keyboard Hints */}
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

      {/* Enemy Info — T-036 Imagine portrait */}
      <div className="elite-challenge__enemy">
        <div className="elite-challenge__enemy-header">
          <div className="elite-challenge__enemy-identity">
            <div className="elite-challenge__enemy-portrait" aria-hidden={!enemyDisplayArt.src}>
              <ArtIcon art={enemyDisplayArt} size="xl" className="elite-challenge__enemy-art" />
            </div>
            <div>
              <h3 className="elite-challenge__enemy-name">{enemy.name}</h3>
              <p className="elite-challenge__enemy-type">{enemy.tier} Guardian</p>
            </div>
          </div>
          <div className="elite-challenge__enemy-element-wrapper">
            <div className="elite-challenge__enemy-element-label">Element</div>
            <div className="elite-challenge__enemy-element">{enemy.element}</div>
          </div>
        </div>

        {/* Enemy Stats Preview */}
        <div className="elite-challenge__enemy-stats">
          <div className="elite-challenge__enemy-stat">
            <span className="elite-challenge__enemy-stat-label">HP</span>
            <span className="elite-challenge__enemy-stat-value--hp">{enemyStats.derived.maxHp}</span>
          </div>
          <div className="elite-challenge__enemy-stat">
            <span className="elite-challenge__enemy-stat-label">ATK</span>
            <span className="elite-challenge__enemy-stat-value--atk">{enemy.primaryStats.strength}</span>
          </div>
          <div className="elite-challenge__enemy-stat">
            <span className="elite-challenge__enemy-stat-label">SPD</span>
            <span className="elite-challenge__enemy-stat-value--spd">{enemy.primaryStats.speed}</span>
          </div>
        </div>
      </div>

      {/* Artifact Preview — T-036 Imagine tile */}
      {artifact && artifactArt && (
        <div className="elite-challenge__artifact">
          <div className="elite-challenge__artifact-header">
            <Zap size={16} className="elite-challenge__artifact-icon" />
            <span className="elite-challenge__artifact-label">Guarded Artifact</span>
          </div>
          <div className="elite-challenge__artifact-main">
            <div className="elite-challenge__artifact-tile">
              <ArtIcon art={artifactArt} size="lg" className="elite-challenge__artifact-art" />
            </div>
            <div>
              <h4 className={`elite-challenge__artifact-name ${getRarityClass(artifact.rarity)}`}>
                {artifact.name}
              </h4>
              <p className="elite-challenge__artifact-rarity">{artifact.rarity}</p>
            </div>
          </div>
          {artifact.description && (
            <p className="elite-challenge__artifact-description">{artifact.description}</p>
          )}
          {/* Show key stats */}
          <div className="elite-challenge__artifact-stats">
            {Object.entries(artifact.stats).slice(0, 4).map(([key, val]) => (
              val ? <span key={key}>+{val} {key.toUpperCase()}</span> : null
            ))}
          </div>
        </div>
      )}

      {/* Choice Buttons */}
      <div className="elite-challenge__choices">
        {/* Fight Button */}
        <button
          type="button"
          onClick={onFight}
          className="elite-challenge__choice-btn elite-challenge__choice-btn--fight"
        >
          <div className="elite-challenge__choice-content">
            <Swords size={20} className="elite-challenge__choice-icon--fight" />
            <div className="elite-challenge__choice-text">
              <div className="elite-challenge__choice-title--fight">
                Fight <span className="sw-shortcut">F</span>
              </div>
              <div className="elite-challenge__choice-desc">
                Battle the guardian. Win the artifact; lose and you still walk away empty-handed if you die.
              </div>
            </div>
          </div>
        </button>

        {/* Escape Button - Only shown if escape is allowed */}
        {onEscape && (
          <button
            type="button"
            onClick={onEscape}
            className="elite-challenge__choice-btn elite-challenge__choice-btn--escape"
          >
            <div className="elite-challenge__choice-content">
              <Wind size={20} className="elite-challenge__choice-icon--escape" />
              <div className="elite-challenge__choice-text elite-challenge__choice-text--flex">
                <div className="elite-challenge__escape-header">
                  <span className="elite-challenge__choice-title--escape">
                    Escape <span className="sw-shortcut">E</span>
                  </span>
                  <span className={`elite-challenge__escape-chance ${getEscapeChanceClass(escapeInfo.chance)}`}>
                    {escapeInfo.chance}%
                  </span>
                </div>
                <div className="elite-challenge__choice-desc">
                  Use your speed to slip away. Your Speed: {escapeInfo.speedValue} (+{escapeInfo.speedBonus}% bonus)
                </div>
                <div className="elite-challenge__escape-failure">
                  Failure: Must fight anyway
                </div>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Escape Formula Hint - Only shown if escape is allowed */}
      {onEscape && (
        <div className="elite-challenge__footer">
          Escape chance = 30% base + (Speed x 2), max 80%
        </div>
      )}
    </div>
    </SceneBackdrop>
  );
};

export default EliteChallenge;
