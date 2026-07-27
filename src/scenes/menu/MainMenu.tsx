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
  // Keyboard shortcuts — Enter starts when focus is not already on a CTA button
  // (Handbook / Infinite / Enter the Mist use native button activation).
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    const target = e.target;
    const inField =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    if (e.key === 'Enter') {
      if (target instanceof HTMLElement && target.closest('button, a[href], [role="button"]')) {
        return;
      }
      // Slider / page body: enter campaign
      e.preventDefault();
      onEnter();
      return;
    }
    if ((e.key === 'i' || e.key === 'I') && infiniteUnlocked && onInfiniteEnter) {
      if (inField) return;
      e.preventDefault();
      onInfiniteEnter();
    }
  }, [onEnter, infiniteUnlocked, onInfiniteEnter]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get rank based on difficulty (R1-007: include Rank A — was D/C/B/S only)
  const getRank = () => {
    if (difficulty < 25) return { label: 'D', class: 'main-menu__rank--d' };
    if (difficulty < 45) return { label: 'C', class: 'main-menu__rank--c' };
    if (difficulty < 65) return { label: 'B', class: 'main-menu__rank--b' };
    if (difficulty < 85) return { label: 'A', class: 'main-menu__rank--a' };
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
          <p className="main-menu__subtitle">Land of Waves · then the Tower</p>
        </div>

        {/* Difficulty Selector */}
        <div className="main-menu__difficulty">
          <div className="main-menu__difficulty-header">
            <label htmlFor="difficulty-slider" className="main-menu__difficulty-label">
              Mission Rank
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
            aria-describedby="difficulty-hint"
          />
          <p id="difficulty-hint" className="main-menu__difficulty-hint">
            {difficulty < 25
              ? 'Rank D — the mist is thin. Room to learn the path.'
              : difficulty < 45
                ? 'Rank C — standard campaign pressure. Default (~40) for first Wave Country runs.'
                : difficulty < 65
                  ? 'Rank B — denser foes, thinner margins.'
                  : difficulty < 85
                    ? 'Rank A — elite pressure. Every room needs a plan.'
                    : 'Rank S — the tower does not forgive. Veterans only.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="main-menu__actions">
          <button type="button" onClick={onEnter} className="main-menu__enter">
            <span className="main-menu__enter-content">
              <span>Enter the Mist</span>
              <span className="sw-shortcut">Enter</span>
            </span>
          </button>
          <p className="main-menu__cta-sub">
            Campaign · opens in the Land of Waves
          </p>
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
