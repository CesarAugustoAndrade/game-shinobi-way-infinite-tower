/**
 * Post-boss interlude (T-023): narrative + full heal + boon 1-of-3.
 * T-043: Imagine art on item/skill boons + story-run bonus chips.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Player, RegionLootTheme } from '../../game/types';
import { CampaignBoon } from '../../game/systems/CampaignSystem';
import { getSkillArt, resolveItemArt } from '../../game/constants/artRegistry';
import { getEventFlagRunModifiers } from '../../game/systems/EventSystem';
import {
  itemMatchesEquipmentFocus,
  isFocusStat,
} from '../../game/utils/itemFocusMatch';
import ArtIcon from '../../components/shared/ArtIcon';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import './Interlude.css';

interface InterludeProps {
  regionName: string;
  title: string;
  body: string;
  nextRegionName: string;
  boons: CampaignBoon[];
  runSummary: {
    level: number;
    ryo: number;
    locationsCleared: number;
    regionsCompleted: number;
  };
  /** Optional: show story-run bonuses from eventFlags (T-043) */
  player?: Player | null;
  /**
   * T-095: next region's lootTheme so boon pick is honest about upcoming Focus.
   */
  nextLootTheme?: RegionLootTheme | null;
  onChooseBoon: (boon: CampaignBoon) => void;
  background?: string;
}

/** Stat boon glyph when no registry tile applies */
const STAT_GLYPH: Record<string, string> = {
  Willpower: '❤️',
  Chakra: '💧',
  Strength: '💪',
  Spirit: '🔥',
  Intelligence: '🧠',
  Calmness: '🧘',
  Speed: '💨',
  Accuracy: '🎯',
  Dexterity: '✋',
};

const Interlude: React.FC<InterludeProps> = ({
  regionName,
  title,
  body,
  nextRegionName,
  boons,
  runSummary,
  player,
  nextLootTheme = null,
  onChooseBoon,
  background,
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const storyLabels = player ? getEventFlagRunModifiers(player).activeLabels : [];
  const focus = nextLootTheme?.equipmentFocus;

  const boonMatchesFocus = (boon: CampaignBoon): boolean => {
    if (!focus || focus.length === 0) return false;
    if (boon.kind === 'item' && boon.item) {
      return itemMatchesEquipmentFocus(boon.item, focus);
    }
    if (boon.kind === 'stat' && boon.stat) {
      return isFocusStat(String(boon.stat), focus);
    }
    return false;
  };

  const confirm = useCallback(() => {
    if (selected == null) return;
    const boon = boons[selected];
    if (boon) onChooseBoon(boon);
  }, [selected, boons, onChooseBoon]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '3') {
        e.preventDefault();
        const i = parseInt(e.key, 10) - 1;
        if (boons[i]) setSelected(i);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [boons, confirm]);

  const renderBoonArt = (boon: CampaignBoon) => {
    if (boon.kind === 'item' && boon.item) {
      return (
        <ArtIcon
          art={resolveItemArt(boon.item)}
          size="lg"
          className="interlude__boon-art"
          title={boon.item.name}
        />
      );
    }
    if (boon.kind === 'skill' && boon.skill) {
      return (
        <ArtIcon
          art={getSkillArt(boon.skill)}
          size="lg"
          className="interlude__boon-art"
          title={boon.skill.name}
        />
      );
    }
    // stat or fallback
    const glyph = (boon.stat && STAT_GLYPH[boon.stat]) || '✨';
    return (
      <span className="interlude__boon-stat-glyph" aria-hidden>
        {glyph}
      </span>
    );
  };

  return (
    <div className="interlude">
      <SceneBackdrop background={background} dim={0.35}>
        <div className="interlude__panel">
          <p className="interlude__eyebrow">Region Cleared · {regionName}</p>
          <h1 className="interlude__title">{title}</h1>
          <p className="interlude__body">{body}</p>

          <div className="interlude__summary">
            <span>Lv.{runSummary.level}</span>
            <span>💰 {runSummary.ryo}</span>
            <span>📍 {runSummary.locationsCleared}</span>
            <span>🏛 {runSummary.regionsCompleted} region(s)</span>
          </div>

          {storyLabels.length > 0 && (
            <div className="interlude__story" aria-label="Story bonuses this run">
              <span className="interlude__story-label">Story bonuses:</span>
              {storyLabels.map((label) => (
                <span key={label} className="interlude__story-chip">
                  {label}
                </span>
              ))}
            </div>
          )}

          <p className="interlude__heal">✦ Full heal applied on continue</p>

          {/* T-095: next region theme at the only peak where Focus changes */}
          {nextLootTheme && (
            <div className="interlude__next-theme" aria-label={`Next region theme: ${nextRegionName}`}>
              <span className="interlude__next-theme-label">Next: {nextRegionName}</span>
              <div className="interlude__next-theme-chips">
                {nextLootTheme.primaryElement && (
                  <span className="interlude__theme-chip interlude__theme-chip--affinity">
                    Affinity {nextLootTheme.primaryElement}
                  </span>
                )}
                {nextLootTheme.equipmentFocus?.length > 0 && (
                  <span className="interlude__theme-chip interlude__theme-chip--focus">
                    Focus{' '}
                    {nextLootTheme.equipmentFocus
                      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                      .join(' · ')}
                  </span>
                )}
                {nextLootTheme.goldMultiplier !== 1 && (
                  <span className="interlude__theme-chip interlude__theme-chip--gold">
                    Ryo ×{nextLootTheme.goldMultiplier}
                  </span>
                )}
              </div>
            </div>
          )}

          <h2 className="interlude__boon-heading">Choose a boon (1 of 3)</h2>

          <div className="interlude__boons">
            {boons.map((boon, i) => {
              const focusMatch = boonMatchesFocus(boon);
              return (
              <button
                key={boon.id}
                type="button"
                className={`interlude__boon ${selected === i ? 'interlude__boon--selected' : ''} ${focusMatch ? 'interlude__boon--focus' : ''}`}
                onClick={() => setSelected(i)}
              >
                <div className="interlude__boon-top">
                  <span className="interlude__boon-idx">{i + 1}</span>
                  <div className="interlude__boon-art-wrap">{renderBoonArt(boon)}</div>
                  {focusMatch && (
                    <span className="interlude__boon-focus-badge" title="Matches next region Focus">
                      Focus
                    </span>
                  )}
                </div>
                <span className="interlude__boon-kind">{boon.kind}</span>
                <span className="interlude__boon-title">{boon.title}</span>
                <span className="interlude__boon-desc">{boon.description}</span>
              </button>
              );
            })}
          </div>

          <button
            type="button"
            className="interlude__continue"
            disabled={selected == null}
            onClick={confirm}
          >
            Continue to {nextRegionName}
            <span className="interlude__key">Enter</span>
          </button>
        </div>
      </SceneBackdrop>
    </div>
  );
};

export default Interlude;
