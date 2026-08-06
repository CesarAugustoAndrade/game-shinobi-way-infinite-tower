/**
 * Mandatory post-level-up stat assignment (F1).
 * Cannot dismiss while unspentStatPoints > 0.
 */

import React, { useMemo, useState } from 'react';
import { Player, PrimaryAttributes, PrimaryStat } from '../../game/types';
import { assignStatPoints, finalizeLevelUpResources } from '../../game/systems/LevelSystem';

const STAT_KEYS: (keyof PrimaryAttributes)[] = [
  'willpower',
  'chakra',
  'strength',
  'spirit',
  'intelligence',
  'calmness',
  'speed',
  'accuracy',
  'dexterity',
];

const STAT_LABELS: Record<keyof PrimaryAttributes, string> = {
  willpower: 'Willpower',
  chakra: 'Chakra',
  strength: 'Strength',
  spirit: 'Spirit',
  intelligence: 'Intelligence',
  calmness: 'Calmness',
  speed: 'Speed',
  accuracy: 'Accuracy',
  dexterity: 'Dexterity',
};

interface StatAssignModalProps {
  player: Player;
  onConfirm: (player: Player) => void;
}

export function StatAssignModal({ player, onConfirm }: StatAssignModalProps) {
  const total = player.unspentStatPoints ?? 0;
  const [alloc, setAlloc] = useState<Partial<PrimaryAttributes>>({});

  const spent = useMemo(
    () => STAT_KEYS.reduce((sum, k) => sum + (alloc[k] ?? 0), 0),
    [alloc]
  );
  const remaining = total - spent;

  const add = (key: keyof PrimaryAttributes, delta: number) => {
    setAlloc((prev) => {
      const cur = prev[key] ?? 0;
      const next = Math.max(0, cur + delta);
      const other = STAT_KEYS.reduce((s, k) => s + (k === key ? 0 : prev[k] ?? 0), 0);
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

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="stat-assign-title">
      <div className="modal-panel" style={{ maxWidth: 420 }}>
        <h2 id="stat-assign-title">Assign Stat Points</h2>
        <p>
          You have <strong>{total}</strong> point{total === 1 ? '' : 's'} to assign.
          Remaining: <strong>{remaining}</strong>
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {STAT_KEYS.map((key) => (
            <li
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span>
                {STAT_LABELS[key]}{' '}
                <small>
                  ({player.primaryStats[key]}
                  {(alloc[key] ?? 0) > 0 ? ` → ${player.primaryStats[key] + (alloc[key] ?? 0)}` : ''})
                </small>
              </span>
              <span>
                <button type="button" onClick={() => add(key, -1)} disabled={(alloc[key] ?? 0) <= 0}>
                  −
                </button>
                <span style={{ margin: '0 8px' }}>{alloc[key] ?? 0}</span>
                <button type="button" onClick={() => add(key, 1)} disabled={remaining <= 0}>
                  +
                </button>
              </span>
            </li>
          ))}
        </ul>
        <button type="button" disabled={remaining !== 0} onClick={handleConfirm}>
          Confirm & Heal
        </button>
        {remaining !== 0 && (
          <p style={{ fontSize: 12, opacity: 0.8 }}>Spend all points to continue.</p>
        )}
      </div>
    </div>
  );
}

export default StatAssignModal;
