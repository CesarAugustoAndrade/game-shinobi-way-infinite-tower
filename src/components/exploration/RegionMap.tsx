import React, { useEffect, useCallback } from 'react';
import {
  Region,
  Player,
  CharacterStats,
  LocationCard,
  LocationType,
} from '../../game/types';
import { getCardDisplayInfo } from '../../game/systems/RegionSystem';
import LocationCardDisplay from './LocationCardDisplay';
import './exploration.css';

// ============================================================================
// MAIN REGION MAP COMPONENT
// ============================================================================

/** Cinematic ops-table backdrops per arc (not parchment). */
const REGION_MAP_BG: Record<string, string> = {
  WAVES_ARC: '/assets/backgrounds/background_map_exploring.png',
  EXAMS_ARC: '/assets/backgrounds/background_map_exploring.png',
  ROGUE_ARC: '/assets/backgrounds/background_map_exploring.png',
  WAR_ARC: '/assets/backgrounds/background_map_exploring.png',
};

interface RegionMapProps {
  region: Region;
  player: Player;
  playerStats: CharacterStats;
  drawnCards: LocationCard[];
  selectedIndex: number | null;
  onCardSelect: (index: number) => void;
  onEnterLocation: () => void;
}

const RegionMap: React.FC<RegionMapProps> = ({
  region,
  // player and playerStats kept in interface for future use
  drawnCards,
  selectedIndex,
  onCardSelect,
  onEnterLocation,
}) => {
  // First-time / post-redraw affordance: auto-pick card 1 when nothing selected
  useEffect(() => {
    if (selectedIndex === null && drawnCards.length > 0) {
      onCardSelect(0);
    }
  }, [drawnCards, selectedIndex, onCardSelect]);

  // Valid selection (or null when deck empty). Out-of-range index after redraw → treat as 0.
  const resolvedIndex =
    drawnCards.length === 0
      ? null
      : selectedIndex !== null && selectedIndex >= 0 && selectedIndex < drawnCards.length
        ? selectedIndex
        : 0;
  const canDeploy = resolvedIndex !== null;

  // Handle keyboard shortcuts (capture so focused card buttons don't swallow Enter/Space)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Hold re-fires keydown — double enterLocationFromCard / double intel reset
    if (e.repeat) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if ((e.target as HTMLElement | null)?.isContentEditable) return;
    // Never steal keys from overlays / result / approach modals (some lack role=dialog)
    if (
      document.querySelector(
        '[role="dialog"][aria-modal="true"], .reward-modal, .event-result, .loc-complete, .intel-result, .rest-result, .explore-overlay, .approach-modal, .confirm-modal',
      )
    ) {
      return;
    }

    // Number keys 1-3 to select cards
    if (e.code === 'Digit1' || e.code === 'Numpad1') {
      e.preventDefault();
      if (drawnCards.length >= 1) onCardSelect(0);
      return;
    }
    if (e.code === 'Digit2' || e.code === 'Numpad2') {
      e.preventDefault();
      if (drawnCards.length >= 2) onCardSelect(1);
      return;
    }
    if (e.code === 'Digit3' || e.code === 'Numpad3') {
      e.preventDefault();
      if (drawnCards.length >= 3) onCardSelect(2);
      return;
    }

    // Space/Enter deploys — works even if selection state lags auto-pick by a frame
    if (e.code === 'Space' || e.code === 'Enter') {
      if (!canDeploy) return;
      e.preventDefault();
      e.stopPropagation();
      if (selectedIndex === null || selectedIndex !== resolvedIndex) {
        onCardSelect(resolvedIndex!);
      }
      onEnterLocation();
    }
  }, [drawnCards, selectedIndex, resolvedIndex, canDeploy, onCardSelect, onEnterLocation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  // Get arc-based modifier
  const getArcModifier = (): string => {
    switch (region.arc) {
      case 'WAVES_ARC': return 'region-map--waves';
      case 'EXAMS_ARC': return 'region-map--exams';
      case 'ROGUE_ARC': return 'region-map--rogue';
      case 'WAR_ARC': return 'region-map--war';
      default: return 'region-map--default';
    }
  };

  const selectedCard = resolvedIndex !== null ? drawnCards[resolvedIndex] : null;
  const selectedDisplay = selectedCard ? getCardDisplayInfo(selectedCard) : null;
  const mapBg = REGION_MAP_BG[region.arc] ?? '/assets/backgrounds/background_map_exploring.png';
  const isMystery = Boolean(selectedDisplay?.showMystery);
  const isSecretSelected = Boolean(
    selectedDisplay?.isSecret ||
      selectedCard?.location.flags?.isSecret ||
      selectedCard?.location.type === LocationType.SECRET,
  );

  // StS-style next action: always one clear verb for the current selection.
  const nextActionCoach =
    !canDeploy
      ? 'No destinations drawn — raise intel or clear a site to open new paths.'
      : isMystery && isSecretSelected
        ? 'Veiled signal under fog — name sealed. Space / Enter to slip off the ledgers.'
      : isMystery
        ? 'Threat unreadable — fog scrambles the read. Deploy if you accept the unknown.'
        : selectedCard?.isRevisit
          ? 'Scarred ground — thinner loot. Space / Enter to return.'
          : isSecretSelected
            ? 'Veiled route confirmed. Space / Enter to slip off the ledgers.'
            : 'Path marked. Space / Enter to enter location.';

  const enterLabel =
    !canDeploy
      ? 'No Path Available'
      : isMystery && isSecretSelected
        ? 'Slip Off-Ledger'
      : isMystery
        ? 'Deploy into Fog'
        : selectedCard?.isRevisit
          ? 'Revisit Location'
          : isSecretSelected
            ? 'Slip Off-Ledger'
            : 'Enter Location';

  const enterDisabledReason = !canDeploy
    ? 'No destination cards available yet. Raise intel or clear a location.'
    : undefined;

  const handleDeployClick = () => {
    if (!canDeploy || resolvedIndex === null) return;
    if (selectedIndex !== resolvedIndex) onCardSelect(resolvedIndex);
    onEnterLocation();
  };

  return (
    <div
      className={`region-map ${getArcModifier()}`}
      style={{
        // Void underplate always — map plate never leaves an empty panel.
        backgroundColor: '#050608',
        backgroundImage: [
          'linear-gradient(180deg, rgba(5,6,8,0.72) 0%, rgba(5,6,8,0.48) 40%, rgba(5,6,8,0.82) 100%)',
          `url(${mapBg})`,
          'url(/assets/backgrounds/background_map_exploring.png)',
        ].join(', '),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Header */}
      <div className="region-map__header">
        <div className="region-map__header-content">
          {/* Region Title with decorative flourish */}
          <div className="region-map__title-section">
            <div className="region-map__flourish">
              <span className="region-map__flourish-line">━━━━</span>
              <span className="region-map__flourish-icon">✦</span>
              <span className="region-map__flourish-line">━━━━</span>
            </div>
            <h2 className="region-map__title">
              {region.name}
            </h2>
            {region.biome && (
              <p className="region-map__biome" aria-label="Region biome">
                {region.biome}
              </p>
            )}
            <p className="region-map__theme">
              {region.theme}
            </p>
            {region.locationsCompleted === 0 && (
              <p className="region-map__first-tip" role="status">
                First step: pick a card, then Enter Location. Gato&apos;s Compound is the endgame —
                side paths and veiled routes surface as intel rises.
              </p>
            )}
            {/* T-069/T-074: lootTheme identity (element, ryo, equipment focus) */}
            {region.lootTheme?.primaryElement && (
              <p className="region-map__affinity" aria-label="Region elemental affinity">
                Affinity:{' '}
                <span className="region-map__affinity-el">
                  {region.lootTheme.primaryElement}
                </span>
                {region.lootTheme.goldMultiplier !== 1 && (
                  <span className="region-map__affinity-gold">
                    {' '}· Ryo ×{region.lootTheme.goldMultiplier}
                  </span>
                )}
              </p>
            )}
            {region.lootTheme?.equipmentFocus && region.lootTheme.equipmentFocus.length > 0 && (
              <p className="region-map__focus" aria-label="Region loot focus stats">
                Focus:{' '}
                <span className="region-map__focus-stats">
                  {region.lootTheme.equipmentFocus
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(' · ')}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card Selection Area */}
      <div className="region-map__cards">
        {/* Cards Container */}
        <div className="region-map__cards-grid">
          {drawnCards.map((card, index) => (
            <LocationCardDisplay
              key={`${card.locationId}-${index}`}
              card={card}
              isSelected={resolvedIndex === index}
              onClick={() => onCardSelect(index)}
              cardIndex={index}
            />
          ))}

          {/* Placeholder for missing cards */}
          {drawnCards.length < 3 && Array.from({ length: 3 - drawnCards.length }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="region-map__placeholder"
              title="Raise intel or clear more sites for additional destination cards"
            >
              <span className="region-map__placeholder-text">Low intel</span>
            </div>
          ))}
        </div>

        {/* Enter Location Button */}
        <div className="region-map__enter-section">
          <button
            type="button"
            onClick={handleDeployClick}
            disabled={!canDeploy}
            title={enterDisabledReason}
            className={`region-map__enter-btn ${canDeploy ? 'region-map__enter-btn--active' : 'region-map__enter-btn--disabled'}`}
            aria-label={canDeploy ? enterLabel : enterDisabledReason}
            aria-disabled={!canDeploy}
          >
            {/* Glow effect */}
            {canDeploy && (
              <div className="region-map__enter-glow" />
            )}
            <span className="region-map__enter-text">
              {enterLabel}
            </span>
          </button>
          {!canDeploy && enterDisabledReason && (
            <p className="region-map__enter-disabled-reason" role="status">
              {enterDisabledReason}
            </p>
          )}
          <p className="region-map__coach" role="status">
            {nextActionCoach}
          </p>
        </div>

        {/* Selected card preview — T-047 + A4: identity chips without clutter */}
        {selectedCard && selectedDisplay && (
          <div className="region-map__preview">
            <div className="region-map__preview-meta">
              {selectedDisplay.showMystery ? (
                <>
                  <span className="region-map__preview-chip region-map__preview-chip--mystery">
                    Signal fogged
                  </span>
                  <span
                    className="region-map__preview-chip region-map__preview-chip--threat"
                    title="Fog hides the true danger — not a false number, just no read"
                  >
                    Threat unreadable
                  </span>
                  {/* A4 wave7: veiled route still tagged under fog (no name leak) */}
                  {isSecretSelected && (
                    <span
                      className="region-map__preview-chip region-map__preview-chip--secret"
                      title="Unmarked path — not on the official route"
                    >
                      Veiled signal
                    </span>
                  )}
                </>
              ) : (
                <>
                  {selectedCard.location.biome && (
                    <span className="region-map__preview-chip region-map__preview-chip--biome">
                      {selectedCard.location.biome}
                    </span>
                  )}
                  {selectedDisplay.dangerLevel != null && (
                    <span
                      className={`region-map__preview-chip region-map__preview-chip--danger region-map__preview-chip--d${selectedDisplay.dangerLevel}`}
                    >
                      Danger {selectedDisplay.dangerLevel}
                    </span>
                  )}
                  {selectedCard.location.terrain && (
                    <span className="region-map__preview-chip region-map__preview-chip--terrain">
                      {String(selectedCard.location.terrain).replace(/_/g, ' ')}
                    </span>
                  )}
                  {isSecretSelected && (
                    <span
                      className="region-map__preview-chip region-map__preview-chip--secret"
                      title="Unmarked path — not on the official route"
                    >
                      Veiled route
                    </span>
                  )}
                  {selectedCard.isRevisit && (
                    <span
                      className="region-map__preview-chip region-map__preview-chip--scar"
                      title="Already cleared — thinner loot"
                    >
                      Scar · reduced rewards
                    </span>
                  )}
                </>
              )}
            </div>
            <p className="region-map__preview-text">
              {selectedDisplay.showMystery
                ? isSecretSelected
                  ? 'Veiled signal in the fog — name sealed; slip only if you accept the unknown'
                  : 'Destination unconfirmed — the fog misleads without inventing numbers'
                : selectedCard.isRevisit
                  ? `Return to ${selectedDisplay.name} — the place remembers you`
                  : isSecretSelected
                    ? `Slip into ${selectedDisplay.name} — off the ledgers`
                    : `Deploy to ${selectedDisplay.name}`
              }
            </p>
            {selectedDisplay.description && (
              <p className="region-map__preview-desc">{selectedDisplay.description}</p>
            )}
            {selectedDisplay.atmosphereLine && (
              <p className="region-map__preview-atmosphere">{selectedDisplay.atmosphereLine}</p>
            )}
            {selectedDisplay.terrainEffectLines && selectedDisplay.terrainEffectLines.length > 0 && (
              <p className="region-map__preview-terrain">
                Terrain: {selectedDisplay.terrainEffectLines.join(' · ')}
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default RegionMap;
