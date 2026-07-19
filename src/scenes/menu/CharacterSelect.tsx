import React, { useEffect, useCallback } from 'react';
import { Clan, PrimaryAttributes } from '../../game/types';
import { CLAN_STATS, CLAN_START_LOADOUT, getClanStartingSkills, getClanArt } from '../../game/constants';
import ArtIcon from '../../components/shared/ArtIcon';
import Tooltip from '../../components/shared/Tooltip';
import './CharacterSelect.css';

interface CharacterSelectProps {
  onSelectClan: (clan: Clan) => void;
}

// Canon triad (types.ts / Training / helpText): Body · Mind · Technique
const BODY_KEYS: (keyof PrimaryAttributes)[] = ['willpower', 'chakra', 'strength'];
const MIND_KEYS: (keyof PrimaryAttributes)[] = ['spirit', 'intelligence', 'calmness'];
const TECHNIQUE_KEYS: (keyof PrimaryAttributes)[] = ['speed', 'accuracy', 'dexterity'];

// Calculate average stat for a category and return letter rank (D-S)
const getStatRank = (stats: PrimaryAttributes, keys: (keyof PrimaryAttributes)[]): string => {
  const average = keys.reduce((sum, key) => sum + stats[key], 0) / keys.length;
  if (average >= 22) return 'S';
  if (average >= 19) return 'A';
  if (average >= 16) return 'B';
  if (average >= 13) return 'C';
  return 'D';
};

// Get CSS modifier for rank
const getRankModifier = (rank: string): string => {
  switch (rank) {
    case 'S': return 'stat-rank__value--s';
    case 'A': return 'stat-rank__value--a';
    case 'B': return 'stat-rank__value--b';
    case 'C': return 'stat-rank__value--c';
    case 'D': return 'stat-rank__value--d';
    default: return '';
  }
};

const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelectClan }) => {
  const clans = Object.values(Clan);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;

    // Number keys 1-5 to select clan
    if (key >= '1' && key <= '5') {
      e.preventDefault();
      const index = parseInt(key) - 1;
      if (index < clans.length) {
        onSelectClan(clans[index]);
      }
    }
  }, [clans, onSelectClan]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="char-select">
      {/* Header */}
      <header className="char-select__header">
        <h2 className="char-select__title">Select Lineage</h2>
        <p className="char-select__hint">
          Press <span className="sw-shortcut">1</span>-<span className="sw-shortcut">5</span> to select
        </p>
      </header>

      {/* Clan Grid */}
      <div className="char-select__grid">
        {clans.map((clan, index) => {
          const stats = CLAN_STATS[clan];
          const loadout = CLAN_START_LOADOUT[clan];
          const startingSkills = getClanStartingSkills(clan);
          const signatureSkills = loadout.main.filter(s => s.id !== 'basic_atk').slice(0, 2);
          const loadoutLabel = signatureSkills.map(s => s.name).join(' · ') || startingSkills[0]?.name;

          // Canon ranks: Body / Mind / Technique
          const bodyRank = getStatRank(stats, BODY_KEYS);
          const mindRank = getStatRank(stats, MIND_KEYS);
          const techniqueRank = getStatRank(stats, TECHNIQUE_KEYS);

          return (
            <div
              key={clan}
              className="clan-card"
            >
              {/* Clan crest watermark (art registry T-019) */}
              <span className="clan-card__watermark" aria-hidden="true">
                <ArtIcon art={getClanArt(clan)} size="xl" title={clan} />
              </span>

              {/* Card Header */}
              <div className="clan-card__header">
                <h3 className="clan-card__name">
                  <span className="clan-card__index">{index + 1}</span>
                  {clan}
                </h3>
                <div className="clan-card__skill" title={`${startingSkills.length} starting jutsu`}>
                  {loadoutLabel}
                </div>
              </div>

              {/* Stat Ranks with Tooltip */}
              <Tooltip
                content={
                  <div className="clan-tooltip">
                    <div className="clan-tooltip__skill">
                      Starting loadout ({startingSkills.length})
                    </div>
                    <div className="clan-tooltip__loadout">
                      {loadout.main.length > 0 && (
                        <div className="clan-tooltip__loadout-row">
                          <span className="clan-tooltip__loadout-label">Main</span>
                          <span>{loadout.main.map(s => s.name).join(', ')}</span>
                        </div>
                      )}
                      {loadout.side.length > 0 && (
                        <div className="clan-tooltip__loadout-row">
                          <span className="clan-tooltip__loadout-label">Side</span>
                          <span>{loadout.side.map(s => s.name).join(', ')}</span>
                        </div>
                      )}
                      {loadout.toggle.length > 0 && (
                        <div className="clan-tooltip__loadout-row">
                          <span className="clan-tooltip__loadout-label">Toggle</span>
                          <span>{loadout.toggle.map(s => s.name).join(', ')}</span>
                        </div>
                      )}
                      {loadout.passive.length > 0 && (
                        <div className="clan-tooltip__loadout-row">
                          <span className="clan-tooltip__loadout-label">Passive</span>
                          <span>{loadout.passive.map(s => s.name).join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Body Stats */}
                    <div className="clan-tooltip__category">
                      <div className="clan-tooltip__category-title clan-tooltip__category-title--body">
                        The Body
                      </div>
                      <div className="clan-tooltip__stat">
                        <span className="clan-tooltip__stat-name clan-tooltip__stat-name--wil">WIL</span>
                        <span className="clan-tooltip__stat-value">{stats.willpower}</span>
                      </div>
                      <div className="clan-tooltip__stat">
                        <span className="clan-tooltip__stat-name clan-tooltip__stat-name--cha">CHA</span>
                        <span className="clan-tooltip__stat-value">{stats.chakra}</span>
                      </div>
                      <div className="clan-tooltip__stat">
                        <span className="clan-tooltip__stat-name clan-tooltip__stat-name--str">STR</span>
                        <span className="clan-tooltip__stat-value">{stats.strength}</span>
                      </div>
                    </div>

                    {/* Mind Stats */}
                    <div className="clan-tooltip__category">
                      <div className="clan-tooltip__category-title clan-tooltip__category-title--mind">
                        The Mind
                      </div>
                      <div className="clan-tooltip__stat">
                        <span className="clan-tooltip__stat-name clan-tooltip__stat-name--spi">SPI</span>
                        <span className="clan-tooltip__stat-value">{stats.spirit}</span>
                      </div>
                      <div className="clan-tooltip__stat">
                        <span className="clan-tooltip__stat-name clan-tooltip__stat-name--int">INT</span>
                        <span className="clan-tooltip__stat-value">{stats.intelligence}</span>
                      </div>
                      <div className="clan-tooltip__stat">
                        <span className="clan-tooltip__stat-name clan-tooltip__stat-name--cal">CAL</span>
                        <span className="clan-tooltip__stat-value">{stats.calmness}</span>
                      </div>
                    </div>

                    {/* Technique Stats */}
                    <div className="clan-tooltip__category">
                      <div className="clan-tooltip__category-title clan-tooltip__category-title--technique">
                        The Technique
                      </div>
                      <div className="clan-tooltip__stat">
                        <span className="clan-tooltip__stat-name clan-tooltip__stat-name--spd">SPD</span>
                        <span className="clan-tooltip__stat-value">{stats.speed}</span>
                      </div>
                      <div className="clan-tooltip__stat">
                        <span className="clan-tooltip__stat-name clan-tooltip__stat-name--acc">ACC</span>
                        <span className="clan-tooltip__stat-value">{stats.accuracy}</span>
                      </div>
                      <div className="clan-tooltip__stat">
                        <span className="clan-tooltip__stat-name clan-tooltip__stat-name--dex">DEX</span>
                        <span className="clan-tooltip__stat-value">{stats.dexterity}</span>
                      </div>
                    </div>
                  </div>
                }
              >
                <div className="clan-card__stats">
                  <div className="stat-rank">
                    <span className="stat-rank__label stat-rank__label--body">Body</span>
                    <span className={`stat-rank__value ${getRankModifier(bodyRank)}`}>{bodyRank}</span>
                  </div>
                  <div className="stat-rank">
                    <span className="stat-rank__label stat-rank__label--mind">Mind</span>
                    <span className={`stat-rank__value ${getRankModifier(mindRank)}`}>{mindRank}</span>
                  </div>
                  <div className="stat-rank">
                    <span className="stat-rank__label stat-rank__label--technique">Technique</span>
                    <span className={`stat-rank__value ${getRankModifier(techniqueRank)}`}>{techniqueRank}</span>
                  </div>
                </div>
              </Tooltip>

              {/* Select Button - Covers entire card for click */}
              <button
                type="button"
                onClick={() => onSelectClan(clan)}
                className="clan-card__select"
                aria-label={`Select ${clan} clan`}
              >
                <img
                  src="/assets/translucent_begin_journey.png"
                  alt="Begin Journey"
                  className="clan-card__select-img"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    const target = e.target as HTMLImageElement;
                    target.parentElement?.classList.add('clan-card__select--fallback');
                  }}
                />
                <span className="clan-card__select-text">Begin Journey</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterSelect;
