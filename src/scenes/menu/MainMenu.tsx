import React, { useEffect, useCallback } from 'react';
import './MainMenu.css';
import { BookOpen } from 'lucide-react';

interface MainMenuProps {
  difficulty: number;
  onDifficultyChange: (value: number) => void;
  onEnter: () => void;
  /** T-027: Infinite Ascent (only when campaign unlocked) */
  onInfiniteEnter?: () => void;
  infiniteUnlocked?: boolean;
  onGuide: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  difficulty,
  onDifficultyChange,
  onEnter,
  onInfiniteEnter,
  infiniteUnlocked = false,
  onGuide
}) => {
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter();
    }
    if ((e.key === 'i' || e.key === 'I') && infiniteUnlocked && onInfiniteEnter) {
      e.preventDefault();
      onInfiniteEnter();
    }
  }, [onEnter, infiniteUnlocked, onInfiniteEnter]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get rank based on difficulty
  const getRank = () => {
    if (difficulty < 30) return { label: 'D', class: 'main-menu__rank--d' };
    if (difficulty < 60) return { label: 'C', class: 'main-menu__rank--c' };
    if (difficulty < 85) return { label: 'B', class: 'main-menu__rank--b' };
    return { label: 'S', class: 'main-menu__rank--s' };
  };

  const rank = getRank();

  return (
    <div className="main-menu">
      <div className="main-menu__content">
        {/* Title Panel with decorative corners */}
        <div className="main-menu__title-panel">
          <div className="main-menu__corners" aria-hidden="true" />
          <h1 className="main-menu__title">SHINOBI WAY</h1>
          <p className="main-menu__subtitle">The Infinite Tower Awaits</p>
        </div>

        {/* Difficulty Selector */}
        <div className="main-menu__difficulty">
          <div className="main-menu__difficulty-header">
            <label htmlFor="difficulty-slider" className="main-menu__difficulty-label">
              Mission Difficulty
            </label>
            <span className={`main-menu__rank ${rank.class}`}>
              Rank {rank.label}
            </span>
          </div>
          <input
            id="difficulty-slider"
            type="range"
            min="0"
            max="100"
            value={difficulty}
            onChange={(e) => onDifficultyChange(parseInt(e.target.value))}
            className="main-menu__slider"
          />
        </div>

        {/* Action Buttons */}
        <div className="main-menu__actions">
          <button type="button" onClick={onEnter} className="main-menu__enter">
            <span className="main-menu__enter-content">
              <span>Campaign</span>
              <span className="sw-shortcut">Enter</span>
            </span>
          </button>
          {infiniteUnlocked && onInfiniteEnter && (
            <button type="button" onClick={onInfiniteEnter} className="main-menu__infinite">
              <span className="main-menu__enter-content">
                <span>Infinite Ascent</span>
                <span className="sw-shortcut">I</span>
              </span>
            </button>
          )}

          <button type="button" onClick={onGuide} className="main-menu__secondary">
            <BookOpen size={14} />
            <span>Shinobi Handbook</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
