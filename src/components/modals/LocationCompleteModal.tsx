/**
 * T-060: Payoff panel when a location is cleared before returning to the region map.
 * A4 wave3: location-as-transform scar message (first clear + revisit).
 */

import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { getLocationArt } from '../../game/constants/artRegistry';
import ArtIcon from '../shared/ArtIcon';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './LocationCompleteModal.css';

export interface LocationCompleteResult {
  locationId: string;
  locationName: string;
  dangerLevel: number;
  roomsVisited: number;
  wasAlreadyComplete: boolean;
  locationsClearedAfter: number;
  regionCompleted: number;
  regionTotal: number;
  secretUnlocks: string[];
  isBoss: boolean;
  /** T-075: optional terrain summary from location */
  terrainLines?: string[];
  /** T-075: region affinity / focus label */
  regionIdentity?: string | null;
  /** A4: biome label for transform scar copy */
  biome?: string | null;
}

interface LocationCompleteModalProps {
  result: LocationCompleteResult;
  onContinue: () => void;
}

const LocationCompleteModal: React.FC<LocationCompleteModalProps> = ({
  result,
  onContinue,
}) => {
  const art = getLocationArt(result.locationId);
  const rootRef = useRef<HTMLDivElement>(null);
  // Space/Enter on autoFocus CTA fires keydown + synthetic click → double leave meta
  // (locationsCleared++, deck redraw). Parity RestResultModal / IntelResultModal.
  const closedRef = useRef(false);
  useFocusTrap(rootRef);

  const dismiss = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onContinue();
  }, [onContinue]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        dismiss();
      }
    },
    [dismiss],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [handleKey]);

  const progressPct =
    result.regionTotal > 0
      ? Math.min(100, Math.round((result.regionCompleted / result.regionTotal) * 100))
      : 0;

  // Location-as-transform scar: place leaves a mark on the ninja / map.
  const scarMessage = useMemo(() => {
    const place = result.locationName;
    const ground = result.biome ? `${place} (${result.biome})` : place;
    if (result.wasAlreadyComplete) {
      return `Scar deepens on ${ground}. The map remembers — thinner loot, same ground.`;
    }
    if (result.isBoss) {
      return `${place} falls. The region shifts — your path through the mist is marked.`;
    }
    return `${ground} leaves a mark. This ground is spent; the ops table will show a scar on return.`;
  }, [result.wasAlreadyComplete, result.isBoss, result.locationName, result.biome]);

  return (
    <div
      ref={rootRef}
      className="loc-complete"
      role="dialog"
      aria-modal="true"
      aria-label="Location complete"
    >
      <div className="loc-complete__panel">
        <div className="loc-complete__header">
          <ArtIcon art={art} size="xl" className="loc-complete__art" title={result.locationName} />
          <h2 className="loc-complete__title">
            {result.wasAlreadyComplete ? 'Location Revisited' : 'Location Cleared'}
          </h2>
          <p className="loc-complete__name">{result.locationName}</p>
          {result.isBoss && (
            <span className="loc-complete__boss-tag">Region Boss Defeated</span>
          )}
          {result.wasAlreadyComplete && (
            <span className="loc-complete__scar-tag" title="Revisit — reduced rewards">
              Scar
            </span>
          )}
        </div>

        <ul className="loc-complete__stats">
          <li>
            <span>Danger</span>
            <span>{result.dangerLevel}</span>
          </li>
          <li>
            <span>Rooms explored</span>
            <span>{result.roomsVisited}</span>
          </li>
          <li>
            <span>Locations cleared</span>
            <span>{result.locationsClearedAfter}</span>
          </li>
          <li>
            <span>Region progress</span>
            <span>
              {result.regionCompleted}/{result.regionTotal} ({progressPct}%)
            </span>
          </li>
        </ul>

        {result.secretUnlocks.length > 0 && (
          <div className="loc-complete__secrets" role="status" aria-label="Veiled routes unlocked">
            <div className="loc-complete__secrets-title">Veiled routes surface</div>
            <ul>
              {result.secretUnlocks.map((name, index) => (
                <li key={`veiled-${index}-${name}`}>
                  <span className="loc-complete__secret-name">{name}</span>
                  <span className="loc-complete__secret-tag">off the ledgers</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* T-075: identity from terrain + region lootTheme */}
        {(result.regionIdentity || (result.terrainLines && result.terrainLines.length > 0)) && (
          <div className="loc-complete__identity">
            {result.regionIdentity && (
              <p className="loc-complete__region">{result.regionIdentity}</p>
            )}
            {result.terrainLines && result.terrainLines.length > 0 && (
              <p className="loc-complete__terrain">
                Terrain: {result.terrainLines.slice(0, 3).join(' · ')}
              </p>
            )}
          </div>
        )}

        {/* A4 wave3: always-on location-as-transform scar line */}
        <p className="loc-complete__scar" role="status">
          {scarMessage}
        </p>
        {result.wasAlreadyComplete && (
          <p className="loc-complete__note">Revisit — no additional clear credit.</p>
        )}

        <button
          type="button"
          className="loc-complete__continue"
          onClick={dismiss}
          autoFocus
        >
          {result.isBoss ? 'Continue the journey' : 'Choose next destination'}
          <span className="sw-shortcut">Enter</span>
        </button>
      </div>
    </div>
  );
};

export default LocationCompleteModal;
