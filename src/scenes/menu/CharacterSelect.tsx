import React, { useEffect, useCallback, useState } from 'react';
import { Clan, PrimaryAttributes } from '../../game/types';
import {
  CLAN_STATS,
  CLAN_START_LOADOUT,
  getClanStartingSkills,
  getClanArt,
  getHeroArt,
  getHeroCutout,
} from '../../game/constants';
import { getSkillArt } from '../../game/constants/artRegistry';
import { HELP_TEXT } from '../../game/constants/helpText';
import ArtIcon from '../../components/shared/ArtIcon';
import Tooltip from '../../components/shared/Tooltip';
import './CharacterSelect.css';

interface CharacterSelectProps {
  onSelectClan: (clan: Clan) => void;
  /** R1-002: return to main menu to retune difficulty */
  onBack?: () => void;
  /** T-027: pending run mode so lineage screen is not silent about Infinite Ascent */
  runMode?: 'campaign' | 'infinite';
}

// Canon triad (types.ts / Training / helpText): Body · Mind · Technique
const BODY_KEYS: (keyof PrimaryAttributes)[] = ['willpower', 'chakra', 'strength'];
const MIND_KEYS: (keyof PrimaryAttributes)[] = ['spirit', 'intelligence', 'calmness'];
const TECHNIQUE_KEYS: (keyof PrimaryAttributes)[] = ['speed', 'accuracy', 'dexterity'];

const getStatRank = (stats: PrimaryAttributes, keys: (keyof PrimaryAttributes)[]): string => {
  const average = keys.reduce((sum, key) => sum + stats[key], 0) / keys.length;
  if (average >= 22) return 'S';
  if (average >= 19) return 'A';
  if (average >= 16) return 'B';
  if (average >= 13) return 'C';
  return 'D';
};

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

/** Cutout → portrait → clan crest cascade (no broken-image flash). */
const ClanHeroPortrait: React.FC<{ clan: Clan }> = ({ clan }) => {
  const cutout = getHeroCutout(clan);
  const portrait = getHeroArt(clan);
  const crest = getClanArt(clan);
  const [stage, setStage] = useState<'cutout' | 'portrait' | 'crest'>('cutout');

  useEffect(() => {
    setStage('cutout');
  }, [clan]);

  if (stage === 'crest') {
    return (
      <div className="clan-card__portrait-fallback" aria-hidden>
        <ArtIcon art={crest} size="xl" title={clan} />
      </div>
    );
  }

  const art = stage === 'cutout' ? cutout : portrait;
  const src = art.src;
  if (!src) {
    return (
      <div className="clan-card__portrait-fallback" aria-hidden>
        <ArtIcon art={crest} size="xl" title={clan} />
      </div>
    );
  }

  return (
    <img
      key={`${clan}-${stage}`}
      src={src}
      alt=""
      draggable={false}
      className={`clan-card__portrait-img clan-card__portrait-img--${stage}`}
      onError={() => setStage((s) => (s === 'cutout' ? 'portrait' : 'crest'))}
    />
  );
};

const CharacterSelect: React.FC<CharacterSelectProps> = ({
  onSelectClan,
  onBack,
  runMode = 'campaign',
}) => {
  const clans = Object.values(Clan);
  const isInfinite = runMode === 'infinite';

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;
    const target = e.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }

    if ((key === 'Escape' || key === 'Backspace') && onBack) {
      if (e.repeat) return;
      e.preventDefault();
      onBack();
      return;
    }

    if (key >= '1' && key <= '5' && !e.repeat) {
      e.preventDefault();
      const index = parseInt(key, 10) - 1;
      if (index < clans.length) {
        onSelectClan(clans[index]);
      }
    }
  }, [clans, onSelectClan, onBack]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className={`char-select${isInfinite ? ' char-select--infinite' : ''}`}
      data-run-mode={runMode}
    >
      <header className="char-select__header">
        {onBack && (
          <button
            type="button"
            className="char-select__back"
            onClick={onBack}
            aria-label="Back to main menu"
          >
            ← Mission Brief
          </button>
        )}
        {isInfinite && (
          <p className="char-select__mode" role="status">
            Infinite Ascent
            <span className="char-select__mode-sub">no summit · floor rises forever</span>
          </p>
        )}
        <h2 className="char-select__title">Choose Your Lineage</h2>
        <p className="char-select__hint">
          <span className="sw-shortcut">1</span>–<span className="sw-shortcut">5</span> select
          {onBack && (
            <>
              {' · '}
              <span className="sw-shortcut">Esc</span> return
            </>
          )}
          {' · '}
          card click starts the run
        </p>
        <p className="char-select__tip">
          {isInfinite ? (
            <>
              The tower does not forgive. <strong>Uzumaki</strong> endures longest.
            </>
          ) : (
            <>
              First run? <strong>Uzumaki</strong> — will and chakra hold the line.
            </>
          )}
        </p>
      </header>

      <div className="char-select__grid">
        {clans.map((clan, index) => {
          const stats = CLAN_STATS[clan];
          const loadout = CLAN_START_LOADOUT[clan];
          const startingSkills = getClanStartingSkills(clan);
          const signatureSkills = loadout.active.filter(s => s.id !== 'basic_atk').slice(0, 2);
          const loadoutLabel = signatureSkills.map(s => s.name).join(' · ') || startingSkills[0]?.name;

          const bodyRank = getStatRank(stats, BODY_KEYS);
          const mindRank = getStatRank(stats, MIND_KEYS);
          const techniqueRank = getStatRank(stats, TECHNIQUE_KEYS);
          const clanMeta = HELP_TEXT.CLANS.find((c) => c.id === clan);

          const startLabel = isInfinite
            ? `Begin Infinite Ascent as ${clan}`
            : `Enter the mist as ${clan}`;

          return (
            <Tooltip
              key={clan}
              className="clan-card__tip-host"
              content={
                <div className="clan-tooltip">
                  <div className="clan-tooltip__skill">
                    Starting loadout ({startingSkills.length})
                  </div>
                  <div className="clan-tooltip__loadout">
                    {loadout.active.length > 0 && (
                      <div className="clan-tooltip__loadout-row">
                        <span className="clan-tooltip__loadout-label">Active</span>
                        <span className="clan-tooltip__loadout-skills">
                          {loadout.active.map((s) => (
                            <span key={s.id} className="clan-tooltip__loadout-skill">
                              <ArtIcon art={getSkillArt(s)} size="xs" title={s.name} />
                              {s.name}
                            </span>
                          ))}
                        </span>
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
              <div
                className="clan-card"
                role="button"
                tabIndex={0}
                aria-label={`${startLabel}${clanMeta ? `: ${clanMeta.role}` : ''}`}
                onClick={() => onSelectClan(clan)}
                onKeyDown={(e) => {
                  if (e.repeat) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectClan(clan);
                  }
                }}
              >
                <div className="clan-card__portrait" aria-hidden>
                  <ClanHeroPortrait clan={clan} />
                  <span className="clan-card__index">{index + 1}</span>
                </div>

                <div className="clan-card__body">
                  <h3 className="clan-card__name">{clan}</h3>
                  {clanMeta && (
                    <p className="clan-card__role" title={clanMeta.strategy}>
                      {clanMeta.role}
                    </p>
                  )}

                  <div className="clan-card__skill" title={`${startingSkills.length} starting jutsu`}>
                    <div className="clan-card__skill-arts" aria-hidden={signatureSkills.length === 0}>
                      {signatureSkills.map((skill) => (
                        <span key={skill.id} className="clan-card__skill-chip" title={skill.name}>
                          <ArtIcon
                            art={getSkillArt(skill)}
                            size="sm"
                            className="clan-card__skill-art"
                            title={skill.name}
                          />
                        </span>
                      ))}
                    </div>
                    <span className="clan-card__skill-names">{loadoutLabel}</span>
                  </div>

                  {clanMeta && (
                    <p className="clan-card__weak" title={clanMeta.desc}>
                      Soft spot: {clanMeta.weakness}
                    </p>
                  )}

                  <div className="clan-card__stats" aria-label="Stat ranks">
                    <div className="stat-rank">
                      <span className="stat-rank__label stat-rank__label--body">Body</span>
                      <span className={`stat-rank__value ${getRankModifier(bodyRank)}`}>{bodyRank}</span>
                    </div>
                    <div className="stat-rank">
                      <span className="stat-rank__label stat-rank__label--mind">Mind</span>
                      <span className={`stat-rank__value ${getRankModifier(mindRank)}`}>{mindRank}</span>
                    </div>
                    <div className="stat-rank">
                      <span className="stat-rank__label stat-rank__label--technique">Tech</span>
                      <span className={`stat-rank__value ${getRankModifier(techniqueRank)}`}>{techniqueRank}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterSelect;
