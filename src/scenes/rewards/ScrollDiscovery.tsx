import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Skill,
  SkillTier,
  Player,
  ScrollDiscoveryActivity,
  CharacterStats,
  RegionLootTheme,
  ActionType,
} from '../../game/types';
import { Scroll, Coins, Brain, Sparkles, Trash2, LogOut } from 'lucide-react';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import ArtIcon from '../../components/shared/ArtIcon';
import { getSkillArt } from '../../game/constants/artRegistry';
import { canLearnSkill } from '../../game/systems/StatSystem';
import { canAddPlayableSkill } from '../../game/systems/DeckSystem';
import { LaunchProperties } from '../../config/featureFlags';
import { getPlayableDeckSize } from '../../game/systems/DeckSystem';
import './ScrollDiscovery.css';

interface ScrollDiscoveryProps {
  scrollDiscovery: ScrollDiscoveryActivity;
  player: Player;
  playerStats: CharacterStats;
  onLearnScroll: (skill: Skill, slotIndex?: number) => void;
  onForgetSkill: (skillId: string) => void;
  onSkip: () => void;
  background?: string;
  lootTheme?: RegionLootTheme | null;
}

const VENDOR_POSTER = {
  src: '/assets/merchant_shop_poster.jpg',
  emoji: '📜',
  label: 'Scroll Vendor',
};
const CLAN_POSTER = {
  src: '/assets/treasure_vault_poster.jpg',
  emoji: '🩸',
  label: 'Clan Rite',
};

const tierClass = (tier: SkillTier): string => {
  switch (tier) {
    case SkillTier.ADVANCED: return 'advanced';
    case SkillTier.HIDDEN: return 'hidden';
    case SkillTier.FORBIDDEN: return 'forbidden';
    case SkillTier.KINJUTSU: return 'kinjutsu';
    default: return 'basic';
  }
};

const ScrollDiscovery: React.FC<ScrollDiscoveryProps> = ({
  scrollDiscovery,
  player,
  playerStats,
  onLearnScroll,
  onForgetSkill,
  onSkip,
  background,
}) => {
  const mode = scrollDiscovery.mode ?? 'vendor';
  const isClan = mode === 'clan';
  const [forgetOpen, setForgetOpen] = useState(false);
  const [enter, setEnter] = useState(false);
  const lockRef = useRef(false);

  const forgetCost = scrollDiscovery.forgetCostRyo ?? 40;
  const clanChoices = scrollDiscovery.clanSkillChoices ?? [];
  const vendorScrolls = scrollDiscovery.availableScrolls ?? [];
  const prices = scrollDiscovery.prices ?? {};

  const deckSize = getPlayableDeckSize(player.skills);
  const deckCap = LaunchProperties.MAX_DECK_SIZE;

  useEffect(() => {
    setEnter(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEnter(true));
    });
    return () => cancelAnimationFrame(id);
  }, [mode]);

  const canBuy = useCallback(
    (skill: Skill): { ok: boolean; reason?: string } => {
      const price = prices[skill.id] ?? 0;
      if (player.ryo < price) return { ok: false, reason: 'Thin purse' };
      const { canLearn, reason } = canLearnSkill(
        skill,
        playerStats.effectivePrimary,
        player.level,
        player.clan,
      );
      if (!canLearn) return { ok: false, reason };
      const known = player.skills.some((s) => s.id === skill.id);
      if (!known && skill.actionType !== ActionType.PASSIVE && !canAddPlayableSkill(player.skills)) {
        return { ok: false, reason: 'Deck full — forget first' };
      }
      return { ok: true };
    },
    [prices, player, playerStats],
  );

  const canClanPick = useCallback(
    (skill: Skill): { ok: boolean; reason?: string } => {
      const { canLearn, reason } = canLearnSkill(
        skill,
        playerStats.effectivePrimary,
        player.level,
        player.clan,
      );
      if (!canLearn) return { ok: false, reason };
      const known = player.skills.some((s) => s.id === skill.id);
      if (!known && skill.actionType !== ActionType.PASSIVE && !canAddPlayableSkill(player.skills)) {
        return { ok: false, reason: 'Deck full' };
      }
      return { ok: true };
    },
    [player, playerStats],
  );

  const handleBuy = (skill: Skill) => {
    if (lockRef.current) return;
    const gate = canBuy(skill);
    if (!gate.ok) return;
    lockRef.current = true;
    onLearnScroll(skill);
  };

  const handleClanPick = (skill: Skill) => {
    if (lockRef.current) return;
    const gate = canClanPick(skill);
    if (!gate.ok) return;
    lockRef.current = true;
    onLearnScroll(skill);
  };

  const handleForget = (skillId: string) => {
    if (lockRef.current) return;
    if (player.ryo < forgetCost) return;
    lockRef.current = true;
    onForgetSkill(skillId);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (forgetOpen) {
          setForgetOpen(false);
          return;
        }
        onSkip();
        return;
      }
      if (forgetOpen) return;
      if (isClan) {
        if (e.key >= '1' && e.key <= '3') {
          const idx = parseInt(e.key, 10) - 1;
          const skill = clanChoices[idx];
          if (skill && canClanPick(skill).ok) handleClanPick(skill);
        }
      } else {
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          setForgetOpen(true);
        }
        if (e.key >= '1' && e.key <= '3') {
          const idx = parseInt(e.key, 10) - 1;
          const skill = vendorScrolls[idx];
          if (skill && canBuy(skill).ok) handleBuy(skill);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const poster = isClan ? CLAN_POSTER : VENDOR_POSTER;
  const title = isClan ? 'Clan Rite' : 'Scroll Vendor';
  const blurb = isClan
    ? `Ascend your bloodline (Lv ${(player.clanLevel ?? 0)} → ${scrollDiscovery.clanLevelAfter ?? (player.clanLevel ?? 0) + 1}). Choose one technique. Free — once per location.`
    : 'Buy a sealed scroll with ryo, or pay to forget a technique and free deck space.';

  return (
    <SceneBackdrop background={background} dim={0.22}>
      <div className={`scroll-discovery scroll-discovery--${mode}`} role="region" aria-label={title}>
        {forgetOpen && (
          <div className="scroll-forget" role="dialog" aria-modal="true" aria-label="Forget a skill">
            <div className="scroll-forget__panel">
              <h3>Forget a technique</h3>
              <p className="scroll-forget__cost">Costs {forgetCost} Ryo</p>
              <ul className="scroll-forget__list">
                {player.skills.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={player.ryo < forgetCost || player.skills.length <= 1}
                      onClick={() => handleForget(s.id)}
                    >
                      <span>{s.name}</span>
                      <span className="scroll-forget__meta">
                        {s.actionType} · Lv {s.level || 1}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="scroll-forget__cancel" onClick={() => setForgetOpen(false)}>
                Cancel [Esc]
              </button>
            </div>
          </div>
        )}

        <div className="scroll-discovery__split">
          <aside className="scroll-discovery__poster">
            <div className="scroll-discovery__poster-frame">
              <div className="scroll-discovery__poster-art">
                <ArtIcon art={poster} size="fill" title={title} />
              </div>
              <div className="scroll-discovery__poster-scrim" aria-hidden />
              <div className="scroll-discovery__poster-copy">
                <span className="scroll-discovery__plate-tag">
                  {isClan ? 'Bloodline' : 'Market'}
                </span>
                <h1 className="scroll-discovery__title">{title}</h1>
                <p className="scroll-discovery__description">{blurb}</p>
              </div>
            </div>
          </aside>

          <div className={`scroll-discovery__decision ${enter ? 'scroll-discovery__decision--enter' : ''}`}>
            <div className="scroll-discovery__path-bar">
              <span className="scroll-discovery__divider">
                {isClan ? 'Choose clan skill' : 'Stock · Buy or forget'}
              </span>
              <span className="scroll-discovery__meta">
                <Coins size={14} /> {player.ryo} Ryo
                {!isClan && (
                  <span className="scroll-discovery__deck">
                    Deck {deckSize}/{deckCap}
                  </span>
                )}
                {isClan && (
                  <span className="scroll-discovery__deck">
                    Clan Lv {player.clanLevel ?? 0}
                  </span>
                )}
              </span>
            </div>

            {isClan ? (
              <div className="scroll-discovery__choices" role="list">
                {clanChoices.length === 0 && (
                  <p className="scroll-discovery__empty">
                    No new clan techniques remain. Leave and walk on.
                  </p>
                )}
                {clanChoices.map((skill, idx) => {
                  const gate = canClanPick(skill);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      role="listitem"
                      className={`scroll-choice scroll-choice--${tierClass(skill.tier)} ${
                        !gate.ok ? 'scroll-choice--locked' : ''
                      }`}
                      disabled={!gate.ok}
                      onClick={() => handleClanPick(skill)}
                    >
                      <span className="scroll-choice__index">{idx + 1}</span>
                      <span className="scroll-choice__art">
                        <ArtIcon art={getSkillArt(skill)} size="fill" title={skill.name} />
                      </span>
                      <span className="scroll-choice__body">
                        <span className="scroll-choice__label">{skill.name}</span>
                        <span className="scroll-choice__desc">
                          {skill.actionType} · {skill.tier}
                          {!gate.ok && gate.reason ? ` · ${gate.reason}` : ''}
                        </span>
                      </span>
                      <span className="scroll-choice__cost scroll-choice__cost--free">
                        <Sparkles size={14} /> Free
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="scroll-discovery__choices" role="list">
                {vendorScrolls.map((skill, idx) => {
                  const price = prices[skill.id] ?? 0;
                  const gate = canBuy(skill);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      role="listitem"
                      className={`scroll-choice scroll-choice--${tierClass(skill.tier)} ${
                        !gate.ok ? 'scroll-choice--locked' : ''
                      }`}
                      disabled={!gate.ok}
                      onClick={() => handleBuy(skill)}
                    >
                      <span className="scroll-choice__index">{idx + 1}</span>
                      <span className="scroll-choice__art">
                        <ArtIcon art={getSkillArt(skill)} size="fill" title={skill.name} />
                      </span>
                      <span className="scroll-choice__body">
                        <span className="scroll-choice__label">{skill.name}</span>
                        <span className="scroll-choice__desc">
                          {skill.actionType} · {skill.tier}
                          {!gate.ok && gate.reason ? ` · ${gate.reason}` : ''}
                        </span>
                      </span>
                      <span className={`scroll-choice__cost ${player.ryo < price ? 'is-short' : ''}`}>
                        {price} Ryo
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="scroll-discovery__actions">
              {!isClan && (
                <button
                  type="button"
                  className="scroll-discovery__forget-btn"
                  onClick={() => setForgetOpen(true)}
                  disabled={player.skills.length <= 1 || player.ryo < forgetCost}
                >
                  <Trash2 size={14} />
                  Forget skill ({forgetCost} Ryo)
                  <span className="sw-shortcut">F</span>
                </button>
              )}
              <button type="button" className="scroll-discovery__leave-btn" onClick={onSkip}>
                <LogOut size={14} />
                Leave
                <span className="sw-shortcut">Esc</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SceneBackdrop>
  );
};

export default ScrollDiscovery;
