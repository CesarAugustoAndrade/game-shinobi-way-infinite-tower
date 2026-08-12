/**
 * Mandatory post-level-up stat assignment (F1).
 * Event Split Poster Layout — 3:4 poster key art, categorized attributes,
 * pixel-arcade controls, and keyboard hotkey navigation.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  Heart,
  Droplet,
  Swords,
  Flame,
  Brain,
  Eye,
  Wind,
  Target,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react';
import { Player, PrimaryAttributes } from '../../game/types';
import { assignStatPoints, finalizeLevelUpResources } from '../../game/systems/LevelSystem';
import ModalShell from './ModalShell';
import './StatAssignModal.css';

interface StatMeta {
  key: keyof PrimaryAttributes;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  shortcut: string;
  category: 'body' | 'mind' | 'technique';
}

const STAT_METADATA: StatMeta[] = [
  // THE BODY
  { key: 'willpower', label: 'Willpower', desc: 'Max HP & Guts chance', icon: <Heart size={12} />, color: '#ef4444', shortcut: '1', category: 'body' },
  { key: 'chakra', label: 'Chakra', desc: 'Max Chakra capacity', icon: <Droplet size={12} />, color: '#3b82f6', shortcut: '2', category: 'body' },
  { key: 'strength', label: 'Strength', desc: 'Taijutsu & Physical Def', icon: <Swords size={12} />, color: '#f97316', shortcut: '3', category: 'body' },
  // THE MIND
  { key: 'spirit', label: 'Spirit', desc: 'Ninjutsu & Elemental Def', icon: <Flame size={12} />, color: '#a855f7', shortcut: '4', category: 'mind' },
  { key: 'intelligence', label: 'Intelligence', desc: 'Jutsu Req & Chakra Regen', icon: <Brain size={12} />, color: '#06b6d4', shortcut: '5', category: 'mind' },
  { key: 'calmness', label: 'Calmness', desc: 'Genjutsu & Status Resist', icon: <Eye size={12} />, color: '#14b8a6', shortcut: '6', category: 'mind' },
  // THE TECHNIQUE
  { key: 'speed', label: 'Speed', desc: 'Initiative, Hit & Evasion', icon: <Wind size={12} />, color: '#22c55e', shortcut: '7', category: 'technique' },
  { key: 'accuracy', label: 'Accuracy', desc: 'Ranged Hit & Crit Bonus', icon: <Target size={12} />, color: '#eab308', shortcut: '8', category: 'technique' },
  { key: 'dexterity', label: 'Dexterity', desc: 'Overall Critical Chance', icon: <Sparkles size={12} />, color: '#ec4899', shortcut: '9', category: 'technique' },
];

interface StatAssignModalProps {
  player: Player;
  onConfirm: (player: Player) => void;
}

export function StatAssignModal({ player, onConfirm }: StatAssignModalProps) {
  const total = player.unspentStatPoints ?? 0;
  const [alloc, setAlloc] = useState<Partial<PrimaryAttributes>>({});

  const spent = useMemo(
    () => STAT_METADATA.reduce((sum, meta) => sum + (alloc[meta.key] ?? 0), 0),
    [alloc]
  );
  const remaining = total - spent;

  const add = (key: keyof PrimaryAttributes, delta: number) => {
    setAlloc((prev) => {
      const cur = prev[key] ?? 0;
      const next = Math.max(0, cur + delta);
      const other = STAT_METADATA.reduce((s, m) => s + (m.key === key ? 0 : prev[m.key] ?? 0), 0);
      if (other + next > total) return prev;
      return { ...prev, [key]: next };
    });
  };

  const handleConfirm = () => {
    if (remaining !== 0) return;
    const assigned = assignStatPoints(player, alloc);
    if (!assigned) return;
    onConfirm(finalizeLevelUpResources(assigned));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && remaining === 0) {
        e.preventDefault();
        handleConfirm();
        return;
      }
      // Hotkeys 1-9
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        const meta = STAT_METADATA[num - 1];
        if (meta && remaining > 0) {
          e.preventDefault();
          add(meta.key, 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [remaining, player, alloc]);

  const bodyStats = STAT_METADATA.filter((m) => m.category === 'body');
  const mindStats = STAT_METADATA.filter((m) => m.category === 'mind');
  const techStats = STAT_METADATA.filter((m) => m.category === 'technique');

  const renderCategoryGroup = (
    title: string,
    categoryClass: string,
    Icon: React.FC<{ size?: number }>,
    stats: StatMeta[]
  ) => (
    <div className="stat-assign__category-group">
      <div className={`stat-assign__category-header ${categoryClass}`}>
        <Icon size={10} />
        <span>{title}</span>
      </div>
      {stats.map((meta) => {
        const baseVal = player.primaryStats[meta.key];
        const added = alloc[meta.key] ?? 0;
        const nextVal = baseVal + added;

        return (
          <div
            key={meta.key}
            className={`stat-assign__card ${added > 0 ? 'stat-assign__card--allocated' : ''}`}
          >
            <div className="stat-assign__stat-info">
              <span className="stat-assign__key-shortcut">{meta.shortcut}</span>
              <span
                className="stat-assign__icon"
                style={{ color: meta.color, borderColor: `${meta.color}66` }}
                aria-hidden
              >
                {meta.icon}
              </span>
              <div className="stat-assign__label-block">
                <span className="stat-assign__label">{meta.label}</span>
                <span className="stat-assign__desc">{meta.desc}</span>
              </div>
            </div>

            <div className="stat-assign__controls">
              <span
                className={`stat-assign__val-display ${
                  added > 0 ? 'stat-assign__val-display--next' : ''
                }`}
              >
                {baseVal}
                {added > 0 && ` → ${nextVal}`}
              </span>
              <button
                type="button"
                className="stat-assign__btn"
                onClick={() => add(meta.key, -1)}
                disabled={added <= 0}
                aria-label={`Decrease ${meta.label}`}
              >
                −
              </button>
              <button
                type="button"
                className="stat-assign__btn"
                onClick={() => add(meta.key, 1)}
                disabled={remaining <= 0}
                aria-label={`Increase ${meta.label}`}
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <ModalShell
      ariaLabel="Level up stat assignment"
      className="stat-assign"
      containerClassName="stat-assign__panel"
      onClose={() => {}}
      footer={
        <div className="stat-assign__footer">
          <button
            type="button"
            className="stat-assign__confirm"
            disabled={remaining !== 0}
            onClick={handleConfirm}
            autoFocus
          >
            Confirm Advancement & Heal <span className="sw-shortcut">Enter</span>
          </button>
          {remaining !== 0 ? (
            <p className="stat-assign__hint">Press [1-9] or click [+] to spend remaining points.</p>
          ) : (
            <p className="stat-assign__hint">Press Enter or click to confirm choices and restore HP/Chakra.</p>
          )}
        </div>
      }
    >
      {/* Top Banner Ribbon */}
      <div className="stat-assign__chain" role="status">
        <TrendingUp size={14} />
        <span>Level Up Advancement · Level {player.level}</span>
      </div>

      {/* Split Poster Layout */}
      <div className="stat-assign__split">
        {/* Left Poster Panel */}
        <div className="stat-assign__poster">
          <div className="stat-assign__poster-frame">
            <div className="stat-assign__poster-art">
              <img
                src="/assets/posters/level_up_poster.jpg"
                alt="Level Up Key Art"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="stat-assign__poster-scrim" />
            <div className="stat-assign__poster-copy">
              <span className="stat-assign__plate-tag">Shinobi Advancement</span>
              <h2 className="stat-assign__poster-title">Chakra Awakening</h2>
              <p className="stat-assign__poster-desc">
                Your shinobi training bears fruit. Allocate your attribute gains to hone your body, mind, and technique.
              </p>
            </div>
          </div>
        </div>

        {/* Right Decision Column */}
        <div className="stat-assign__decision">
          <div className="stat-assign__path-bar">
            <span className="stat-assign__path-title">Attribute Gains</span>
            <span className={`stat-assign__badge ${remaining === 0 ? 'stat-assign__badge--complete' : ''}`}>
              Points: {remaining} / {total}
            </span>
          </div>

          <div className="stat-assign__categories">
            {renderCategoryGroup('The Body', 'stat-assign__category-header--body', Shield, bodyStats)}
            {renderCategoryGroup('The Mind', 'stat-assign__category-header--mind', Zap, mindStats)}
            {renderCategoryGroup('The Technique', 'stat-assign__category-header--technique', Sparkles, techStats)}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

export default StatAssignModal;
