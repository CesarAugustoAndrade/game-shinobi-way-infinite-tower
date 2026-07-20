/**
 * T-060: Payoff panel when a location is cleared before returning to the region map.
 */

import React, { useEffect, useCallback } from 'react';
import { getLocationArt } from '../../game/constants/artRegistry';
import ArtIcon from '../shared/ArtIcon';
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

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onContinue();
      }
    },
    [onContinue],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [handleKey]);

  const progressPct =
    result.regionTotal > 0
      ? Math.round((result.regionCompleted / result.regionTotal) * 100)
      : 0;

  return (
    <div className="loc-complete" role="dialog" aria-modal="true" aria-label="Location complete">
      <div className="loc-complete__panel">
        <div className="loc-complete__header">
          <ArtIcon art={art} size="xl" className="loc-complete__art" title={result.locationName} />
          <h2 className="loc-complete__title">
            {result.wasAlreadyComplete ? 'Location Revisited' : 'Location Cleared'}
          </h2>
          <p className="loc-complete__name">{result.locationName}</p>
          {result.isBoss && (
            <span className="loc-complete__boss-tag">Region Boss</span>
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
          <div className="loc-complete__secrets">
            <div className="loc-complete__secrets-title">Secrets uncovered</div>
            <ul>
              {result.secretUnlocks.map((name) => (
                <li key={name}>{name}</li>
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

        {result.wasAlreadyComplete && (
          <p className="loc-complete__note">Revisit — no additional clear credit.</p>
        )}

        <button type="button" className="loc-complete__continue" onClick={onContinue}>
          Choose next destination
          <span className="sw-shortcut">Enter</span>
        </button>
      </div>
    </div>
  );
};

export default LocationCompleteModal;
