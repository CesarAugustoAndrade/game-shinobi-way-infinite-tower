import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../../game/types';
import './GameLog.css';

interface GameLogProps {
  logs: LogEntry[];
  /** When set, only the most recent N lines are shown (mini combat log). */
  maxLines?: number;
  /** Compact overlay styling for the combat stage. */
  compact?: boolean;
}

const GameLog: React.FC<GameLogProps> = ({ logs, maxLines, compact = false }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const visibleLogs = maxLines != null ? logs.slice(-maxLines) : logs;

  useEffect(() => {
    if (!compact) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, compact]);

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'combat':
        return 'game-log__line--combat';
      case 'danger':
        return 'game-log__line--danger';
      case 'gain':
        return 'game-log__line--gain';
      case 'loot':
        return 'game-log__line--loot';
      default:
        return 'game-log__line--info';
    }
  };

  const rootClass = compact ? 'game-log game-log--compact' : 'game-log';

  return (
    <div
      className={rootClass}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Combat log"
    >
      {visibleLogs.length === 0 && (
        <span className="game-log__empty">Adventure awaits...</span>
      )}
      {visibleLogs.map((log) => (
        <div
          key={log.id}
          className={`game-log__line ${getTypeClass(log.type)}`}
        >
          {!compact && (
            <span className="game-log__id">[{log.id}]</span>
          )}
          {log.text}
        </div>
      ))}
      {!compact && <div ref={endRef} />}
    </div>
  );
};

export default GameLog;
