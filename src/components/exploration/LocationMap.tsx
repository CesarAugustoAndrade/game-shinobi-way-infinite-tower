import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BranchingFloor,
  BranchingRoom,
  BranchingRoomType,
  Player,
  CharacterStats,
} from '../../game/types';
import RoomCard from './RoomCard';
import { getCurrentRoom, getChildRooms, getCurrentActivity, isFloorComplete } from '../../game/systems/LocationSystem';
import { ACTIVITY_FULL_NAMES } from '../../game/constants/activityLabels';
import {
  formatLocationTerrainEffectLines,
  formatRoomTerrainEffectLines,
  getRoomHiddenRoomBonus,
  getRoomMovementCost,
  getRoomVisibilityRange,
} from '../../game/systems/LocationTerrainSystem';
import { TERRAIN_DEFINITIONS } from '../../game/constants/terrain';
import { COMBAT_MODIFIER_EFFECTS } from '../../game/constants/roomTypes';
import { CombatModifierType } from '../../game/types';
import { formatHeatTier, tierFromHeat } from '../../game/systems/HeatSystem';
import { resolveLaminaPaths } from '../../utils/colorHelpers';
import { queryBlockingModal } from '../../game/ui/overlayStack';
import './exploration.css';

interface LocationMapProps {
  branchingFloor: BranchingFloor;
  player: Player;
  playerStats: CharacterStats;
  currentIntel: number;
  onRoomSelect: (room: BranchingRoom) => void;
  onRoomEnter: (room: BranchingRoom) => void;
  /**
   * A4 wave7: escape hatch when exit room is already cleared.
   * Auto-complete usually stages LocationCompleteModal; this recovers soft-stuck maps.
   */
  onLeaveLocation?: () => void;
  /** R1-009: authored location name (title); biome stays as subtitle */
  locationName?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({
  branchingFloor,
  currentIntel,
  onRoomSelect,
  onRoomEnter,
  onLeaveLocation,
  locationName,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // RELATIVE VIEW: Get rooms relative to current position
  // Current room at bottom, children in middle, grandchildren at top
  const currentRoom = useMemo(() => getCurrentRoom(branchingFloor), [branchingFloor]);
  const childRooms = useMemo(
    () => currentRoom ? getChildRooms(branchingFloor, currentRoom.id) : [],
    [branchingFloor, currentRoom]
  );
  // Exit room cleared → location meta path available (stuck recovery + honest coach)
  const floorComplete = useMemo(
    () => isFloorComplete(branchingFloor),
    [branchingFloor],
  );

  // Entry hub (START) is structural only — auto-select first open path so the map
  // is 2 choices, not a dead "you are here" on an invisible node.
  // After leaving a cleared room, prefer next open child; otherwise current.
  useEffect(() => {
    if (!currentRoom) return;

    const isEntryHub = currentRoom.type === BranchingRoomType.START;
    if (isEntryHub || currentRoom.isCleared) {
      const nextPath =
        childRooms.find((r) => r.isAccessible && !r.isCleared) ?? childRooms[0];
      if (nextPath) {
        setSelectedRoomId(nextPath.id);
        onRoomSelect(nextPath);
        return;
      }
    }

    setSelectedRoomId(currentRoom.id);
    onRoomSelect(currentRoom);
    // Only re-run when player position changes — do not override manual path picks.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: currentRoom.id only
  }, [currentRoom?.id]);

  // Get selected room
  const selectedRoom = useMemo(
    () => selectedRoomId ? branchingFloor.rooms.find(r => r.id === selectedRoomId) : null,
    [branchingFloor.rooms, selectedRoomId]
  );

  // T-074: location terrain effects active while exploring (from floor thread)
  const terrainLines = useMemo(
    () => formatLocationTerrainEffectLines(branchingFloor.terrainEffects),
    [branchingFloor.terrainEffects],
  );

  // T-080: room terrain visibilityRange gates grandchild foresight
  const currentTerrainDef = useMemo(() => {
    if (!currentRoom) return null;
    return TERRAIN_DEFINITIONS[currentRoom.terrain];
  }, [currentRoom]);
  const visibilityRange = useMemo(
    () => getRoomVisibilityRange(currentTerrainDef),
    [currentTerrainDef],
  );
  const showGrandchildren = visibilityRange >= 2;
  // T-081: secrets/exit discovery bonus from current room terrain
  const secretsBonusPct = useMemo(() => {
    const frac = getRoomHiddenRoomBonus(currentTerrainDef);
    return Math.round(frac * 100);
  }, [currentTerrainDef]);
  // T-082: room movementCost (pace) shown when not 1.0
  const movementCost = useMemo(
    () => getRoomMovementCost(currentTerrainDef),
    [currentTerrainDef],
  );

  // T-084: selected room terrain (path choice honesty)
  const selectedTerrainDef = useMemo(() => {
    if (!selectedRoom) return null;
    return TERRAIN_DEFINITIONS[selectedRoom.terrain];
  }, [selectedRoom]);
  const selectedSight = useMemo(
    () => getRoomVisibilityRange(selectedTerrainDef),
    [selectedTerrainDef],
  );
  const selectedSecretsPct = useMemo(
    () => Math.round(getRoomHiddenRoomBonus(selectedTerrainDef) * 100),
    [selectedTerrainDef],
  );
  const selectedPace = useMemo(
    () => getRoomMovementCost(selectedTerrainDef),
    [selectedTerrainDef],
  );
  const selectedRoomCombatLines = useMemo(
    () => formatRoomTerrainEffectLines(selectedTerrainDef).slice(0, 3),
    [selectedTerrainDef],
  );
  // T-105/T-108: combat or elite room condition before enter
  const selectedCombatConditions = useMemo(() => {
    const mods =
      selectedRoom?.activities.combat?.modifiers
      ?? selectedRoom?.activities.eliteChallenge?.modifiers
      ?? [];
    return mods
      .filter((m) => m !== CombatModifierType.NONE)
      .map((m) => COMBAT_MODIFIER_EFFECTS[m]?.name)
      .filter(Boolean) as string[];
  }, [selectedRoom]);

  // Next pending activity (ACTIVITY_ORDER) — multi-activity rooms stay uncleared
  // until all finish; surface which one Enter will open so the map never looks stuck.
  const selectedNextActivity = useMemo(
    () => (selectedRoom && !selectedRoom.isCleared ? getCurrentActivity(selectedRoom) : null),
    [selectedRoom],
  );

  // Handle room click
  const handleRoomClick = (room: BranchingRoom) => {
    setSelectedRoomId(room.id);
    onRoomSelect(room);
  };

  // Handle enter button (parity with keyboard: block under result/approach modals)
  const handleEnterRoom = useCallback(() => {
    if (queryBlockingModal()) return;
    if (selectedRoom && selectedRoom.isAccessible && !selectedRoom.isCleared) {
      onRoomEnter(selectedRoom);
    }
  }, [selectedRoom, onRoomEnter]);

  // Keyboard: SPACE/ENTER enter room; 1/2 (and numpad) select child paths
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space/Enter hold re-fires keydown — same-tick double enter double-heals rest /
      // double-grants intel / re-opens approach on a stale floor snapshot.
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.target as HTMLElement | null)?.isContentEditable) return;
      // Leave Enter/Space to reward / approach / complete modals (DOM fallback)
      if (queryBlockingModal()) {
        return;
      }

      const digitMap: Record<string, number> = {
        Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
        Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3,
      };
      if (e.code in digitMap) {
        e.preventDefault();
        const childRoom = childRooms[digitMap[e.code]];
        if (childRoom) {
          setSelectedRoomId(childRoom.id);
          onRoomSelect(childRoom);
        }
        return;
      }

      if (e.code !== 'Space' && e.code !== 'Enter') return;

      e.preventDefault();
      e.stopPropagation();

      // Open room selected → enter immediately
      if (selectedRoom && selectedRoom.isAccessible && !selectedRoom.isCleared) {
        onRoomEnter(selectedRoom);
        return;
      }

      // Spent / locked selection: mark first open path (or enter if already marked)
      const nextPath = childRooms.find((r) => r.isAccessible && !r.isCleared);
      if (nextPath) {
        if (selectedRoomId === nextPath.id) {
          onRoomEnter(nextPath);
        } else {
          setSelectedRoomId(nextPath.id);
          onRoomSelect(nextPath);
        }
        return;
      }

      // Current still has work
      if (currentRoom && !currentRoom.isCleared) {
        if (selectedRoomId === currentRoom.id) {
          onRoomEnter(currentRoom);
        } else {
          setSelectedRoomId(currentRoom.id);
          onRoomSelect(currentRoom);
        }
        return;
      }

      // A4 wave7: exit cleared, no open paths — leave instead of soft-stuck no-op
      if (floorComplete && onLeaveLocation) {
        onLeaveLocation();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    selectedRoom,
    selectedRoomId,
    currentRoom,
    childRooms,
    floorComplete,
    onRoomEnter,
    onRoomSelect,
    onLeaveLocation,
  ]);

  // Get arc-based modifier
  const getArcModifier = (): string => {
    switch (branchingFloor.arc) {
      case 'ACADEMY_ARC': return 'location-map--academy';
      case 'WAVES_ARC': return 'location-map--waves';
      case 'EXAMS_ARC': return 'location-map--exams';
      case 'ROGUE_ARC': return 'location-map--rogue';
      case 'WAR_ARC': return 'location-map--war';
      default: return 'location-map--academy';
    }
  };

  // Get action button class
  const getActionButtonClass = (): string => {
    if (selectedRoom?.isCleared) return 'location-map__action-btn location-map__action-btn--cleared';
    if (selectedRoom?.isAccessible) return 'location-map__action-btn location-map__action-btn--enter';
    return 'location-map__action-btn location-map__action-btn--locked';
  };

  // A4: location-as-transform — biome location_*.png first, map exploring fallback.
  // No dark scrim filter over the painted plate.
  const locationStageBg = useMemo(() => {
    const mapFallback = 'url(/assets/backgrounds/background_map_exploring.png)';
    if (!branchingFloor.biome) {
      return {
        backgroundColor: '#050608',
        backgroundImage: mapFallback,
      };
    }
    const { background } = resolveLaminaPaths(branchingFloor.biome);
    return {
      backgroundColor: '#050608',
      backgroundImage: [`url(${background})`, mapFallback].join(', '),
    };
  }, [branchingFloor.biome]);

  const dangerLevel = branchingFloor.dangerLevel;

  return (
    <div
      className={`location-map ${getArcModifier()}`}
      style={{
        ...locationStageBg,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Header */}
      <div className="location-map__header">
        <div className="location-map__header-content">
          <div>
            <div className="location-map__title-row">
              <h2 className="location-map__title">
                {locationName || branchingFloor.biome}
              </h2>
              {dangerLevel != null && (
                <span
                  className={`location-map__danger location-map__danger--d${dangerLevel}`}
                  aria-label={`Danger level ${dangerLevel}`}
                >
                  D{dangerLevel}
                </span>
              )}
              {branchingFloor.isRevisit && (
                <span
                  className="location-map__scar"
                  title="Revisit — reduced rewards"
                  aria-label="Revisit scar: reduced rewards"
                >
                  Scar
                </span>
              )}
              {branchingFloor.isSecret && (
                <span
                  className="location-map__veiled"
                  title="Unmarked path — not on the official route"
                  aria-label="Veiled route"
                >
                  Veiled
                </span>
              )}
            </div>
            {/* R1-009: show biome under the real place name when both exist */}
            {locationName && branchingFloor.biome && locationName !== branchingFloor.biome && (
              <p className="location-map__biome" aria-label="Biome">
                {branchingFloor.biome}
              </p>
            )}
            {/* T-046: ambient flavor from location atmosphereEvents */}
            {branchingFloor.atmosphereFlavor && (
              <p className="location-map__atmosphere">{branchingFloor.atmosphereFlavor}</p>
            )}
            {/* T-074: live terrain mods (combat/intel already apply these) */}
            {terrainLines.length > 0 && (
              <p className="location-map__terrain" aria-label="Location terrain effects">
                Terrain: {terrainLines.slice(0, 4).join(' · ')}
              </p>
            )}
            {/* T-080: room foresight from current room terrain */}
            <p className="location-map__sight" aria-label="Map foresight range">
              Sight: {visibilityRange}
              {!showGrandchildren && (
                <span className="location-map__sight-fog"> · path ahead fogged</span>
              )}
            </p>
            {/* T-081: hiddenRoomBonus shifts exit discovery when branching from here */}
            {secretsBonusPct !== 0 && (
              <p className="location-map__secrets" aria-label="Exit discovery bonus">
                Secrets:{' '}
                <span className={secretsBonusPct > 0 ? 'location-map__secrets--pos' : 'location-map__secrets--neg'}>
                  {secretsBonusPct > 0 ? '+' : ''}{secretsBonusPct}%
                </span>
                {' '}exit find
              </p>
            )}
            {/* T-082: room footing affects combat AP budget */}
            {movementCost !== 1 && (
              <p className="location-map__pace" aria-label="Room movement pace">
                Pace:{' '}
                <span className={movementCost > 1 ? 'location-map__pace--slow' : 'location-map__pace--fast'}>
                  ×{movementCost.toFixed(1)}
                </span>
                {movementCost > 1 ? ' (slower AP)' : ' (easier footing)'}
              </p>
            )}
          </div>
          <div className="location-map__stats">
            <p className="location-map__stat">
              Rooms Explored: {branchingFloor.roomsVisited}
            </p>
            {/* Intel Bar */}
            <div className="location-map__intel">
              <span className="location-map__intel-icon" aria-hidden="true">IN</span>
              <div className="location-map__intel-bar">
                <div
                  className="location-map__intel-fill"
                  style={{ width: `${currentIntel}%` }}
                />
              </div>
              <span className="location-map__intel-value">{currentIntel}%</span>
            </div>
            {/* F3 HEAT meter (visit runtime only) */}
            {(() => {
              const heat = branchingFloor.heat ?? 0;
              const tier = tierFromHeat(heat);
              const armed = branchingFloor.hunterArmed ?? false;
              return (
                <div
                  className={`location-map__heat${armed ? ' location-map__heat--armed' : ''}`}
                  title="Visit heat — optional rewards raise alert; does not buff ordinary foes"
                >
                  <span className="location-map__heat-icon" aria-hidden="true">HT</span>
                  <div className="location-map__heat-bar">
                    <div
                      className="location-map__heat-fill"
                      style={{ width: `${heat}%` }}
                    />
                  </div>
                  <span className="location-map__heat-value">
                    {formatHeatTier(tier)} {heat}
                    {armed || heat >= 100 ? ' · HUNTER ARMED' : ''}
                  </span>
                </div>
              );
            })()}
            <p className="location-map__hint">
              {floorComplete
                ? 'Exit cleared — return to the ops table when ready'
                : branchingFloor.exitRoomId
                  ? (branchingFloor.hunterArmed
                    ? 'Exit discovered — a Hunter guards the way out'
                    : 'Exit discovered — find and defeat the Guardian')
                  : 'Film the path — enter rooms to reveal the Exit'}
            </p>
            {branchingFloor.isRevisit && (
              <p className="location-map__scar-note" role="status">
                Scar active — loot thinner on this ground
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Path board — two branch columns: foresight (2) → stem → choice (1) */}
      <div className="location-map__area">
        <div className="location-map__rooms location-map__rooms--path">
          {childRooms.length > 0 ? (
            <div className="location-map__path-board" role="group" aria-label="Path choices">
              {childRooms.map((child, branchIndex) => {
                const childGrandchildren = getChildRooms(branchingFloor, child.id);
                const foresightSlots = 2;
                const branchSelected =
                  selectedRoomId === child.id ||
                  childGrandchildren.some((g) => g.id === selectedRoomId);
                return (
                  <div
                    key={child.id}
                    className={[
                      'location-map__branch',
                      branchSelected ? 'location-map__branch--selected' : '',
                      child.isCleared ? 'location-map__branch--cleared' : '',
                      !child.isAccessible ? 'location-map__branch--locked' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-path={branchIndex + 1}
                  >
                    <div className="location-map__branch-foresight">
                      {showGrandchildren ? (
                        <>
                          {childGrandchildren.map((room) => (
                            <div key={room.id} className="location-map__foresight-slot">
                              <RoomCard
                                room={room}
                                isSelected={selectedRoomId === room.id}
                                onClick={() => handleRoomClick(room)}
                              />
                            </div>
                          ))}
                          {Array.from(
                            { length: Math.max(0, foresightSlots - childGrandchildren.length) },
                            (_, i) => (
                              <div
                                key={`ph-${child.id}-${i}`}
                                className="location-map__placeholder location-map__foresight-slot"
                                aria-hidden="true"
                              >
                                ...
                              </div>
                            ),
                          )}
                        </>
                      ) : (
                        Array.from({ length: foresightSlots }, (_, i) => (
                          <div
                            key={`fog-${child.id}-${i}`}
                            className="location-map__fog location-map__foresight-slot"
                            title="Fogged intel — advance to scout (threat unreadable, not empty)"
                            aria-label="Path ahead obscured by terrain"
                          >
                            ???
                          </div>
                        ))
                      )}
                    </div>

                    {/* Y-junction: two arms into one trunk */}
                    <div className="location-map__branch-stem" aria-hidden="true">
                      <span className="location-map__branch-stem-y" />
                      <span className="location-map__branch-stem-trunk" />
                    </div>

                    <div className="location-map__branch-choice">
                      <RoomCard
                        room={child}
                        isSelected={selectedRoomId === child.id}
                        onClick={() => handleRoomClick(child)}
                      />
                      <span className="location-map__branch-hotkey" aria-hidden="true">
                        {branchIndex + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="location-map__path-fallback">
              {currentRoom?.isExit && !currentRoom.isCleared && (
                <div className="location-map__exit-message">
                  Floor exit — defeat the Guardian to clear this location
                </div>
              )}
              {currentRoom?.isExit && currentRoom.isCleared && (
                <div className="location-map__exit-message location-map__exit-message--clear">
                  Guardian fallen — location clear
                </div>
              )}
              {currentRoom && !currentRoom.isExit && !currentRoom.isCleared && (
                <RoomCard
                  key={currentRoom.id}
                  room={currentRoom}
                  isSelected={selectedRoomId === currentRoom.id}
                  onClick={() => handleRoomClick(currentRoom)}
                />
              )}
              {currentRoom?.isCleared && !currentRoom.isExit && (
                <div
                  className="location-map__void-plate"
                  title="No branch visible — void underplate holds the frame"
                  aria-hidden="true"
                >
                  <span className="location-map__void-plate-mark">···</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Room Panel */}
      {selectedRoom && (
        <div className="location-map__selected">
          <div className="location-map__selected-content">
            <div className="location-map__selected-info">
              <h3 className="location-map__selected-name">
                {selectedRoom.name}
              </h3>
              <p className="location-map__selected-desc">
                {selectedRoom.description}
              </p>

              {/* T-084: room terrain identity before enter */}
              {selectedTerrainDef && (
                <div className="location-map__selected-terrain" aria-label="Selected room terrain">
                  <p className="location-map__selected-terrain-name">
                    Terrain: <strong>{selectedTerrainDef.name}</strong>
                  </p>
                  <div className="location-map__selected-terrain-chips">
                    <span className="location-map__chip">Sight {selectedSight}</span>
                    {selectedSecretsPct !== 0 && (
                      <span className={`location-map__chip ${selectedSecretsPct > 0 ? 'location-map__chip--pos' : 'location-map__chip--neg'}`}>
                        Secrets {selectedSecretsPct > 0 ? '+' : ''}{selectedSecretsPct}%
                      </span>
                    )}
                    {selectedPace !== 1 && (
                      <span className={`location-map__chip ${selectedPace > 1 ? 'location-map__chip--slow' : 'location-map__chip--fast'}`}>
                        Pace ×{selectedPace.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {selectedRoomCombatLines.length > 0 && (
                    <p className="location-map__selected-terrain-mods">
                      {selectedRoomCombatLines.join(' · ')}
                    </p>
                  )}
                  {selectedCombatConditions.length > 0 && (
                    <p className="location-map__selected-condition" aria-label="Room combat condition">
                      Fight: {selectedCombatConditions.join(' · ')}
                    </p>
                  )}
                </div>
              )}

              {/* Activity list — highlight next pending so multi-activity rooms
                  (event done, scroll/training still open) do not look stuck. */}
              <div className="location-map__selected-activities">
                {selectedNextActivity && (
                  <span className="location-map__activity-next" aria-live="polite">
                    Next: {ACTIVITY_FULL_NAMES[selectedNextActivity]}
                  </span>
                )}
                {selectedRoom.activities.combat && !selectedRoom.activities.combat.completed && (
                  <span className={`location-map__activity-tag location-map__activity-tag--combat${selectedNextActivity === 'combat' ? ' location-map__activity-tag--current' : ''}`}>
                    {ACTIVITY_FULL_NAMES.combat}: {selectedRoom.activities.combat.enemy.name}
                  </span>
                )}
                {selectedRoom.activities.eliteChallenge && !selectedRoom.activities.eliteChallenge.completed && (
                  <span className={`location-map__activity-tag location-map__activity-tag--elite${selectedNextActivity === 'eliteChallenge' ? ' location-map__activity-tag--current' : ''}`}>
                    {ACTIVITY_FULL_NAMES.eliteChallenge}: {selectedRoom.activities.eliteChallenge.enemy.name}
                  </span>
                )}
                {selectedRoom.activities.merchant && !selectedRoom.activities.merchant.completed && (
                  <span className={`location-map__activity-tag location-map__activity-tag--merchant${selectedNextActivity === 'merchant' ? ' location-map__activity-tag--current' : ''}`}>
                    {ACTIVITY_FULL_NAMES.merchant}
                  </span>
                )}
                {selectedRoom.activities.event && !selectedRoom.activities.event.completed && (
                  <span className={`location-map__activity-tag location-map__activity-tag--event${selectedNextActivity === 'event' ? ' location-map__activity-tag--current' : ''}`}>
                    {ACTIVITY_FULL_NAMES.event}
                  </span>
                )}
                {selectedRoom.activities.scrollDiscovery && !selectedRoom.activities.scrollDiscovery.completed && (
                  <span className={`location-map__activity-tag location-map__activity-tag--scroll${selectedNextActivity === 'scrollDiscovery' ? ' location-map__activity-tag--current' : ''}`}>
                    {ACTIVITY_FULL_NAMES.scrollDiscovery}
                  </span>
                )}
                {selectedRoom.activities.rest && !selectedRoom.activities.rest.completed && (
                  <span className={`location-map__activity-tag location-map__activity-tag--rest${selectedNextActivity === 'rest' ? ' location-map__activity-tag--current' : ''}`}>
                    {ACTIVITY_FULL_NAMES.rest} (+{selectedRoom.activities.rest.healPercent}% HP)
                  </span>
                )}
                {selectedRoom.activities.training && !selectedRoom.activities.training.completed && (
                  <span className={`location-map__activity-tag location-map__activity-tag--training${selectedNextActivity === 'training' ? ' location-map__activity-tag--current' : ''}`}>
                    {ACTIVITY_FULL_NAMES.training}
                  </span>
                )}
                {selectedRoom.activities.treasure && !selectedRoom.activities.treasure.collected && (
                  <span className={`location-map__activity-tag location-map__activity-tag--treasure${selectedNextActivity === 'treasure' ? ' location-map__activity-tag--current' : ''}`}>
                    {ACTIVITY_FULL_NAMES.treasure}
                  </span>
                )}
                {selectedRoom.activities.infoGathering && !selectedRoom.activities.infoGathering.completed && (
                  <span className={`location-map__activity-tag location-map__activity-tag--intel${selectedNextActivity === 'infoGathering' ? ' location-map__activity-tag--current' : ''}`}>
                    {ACTIVITY_FULL_NAMES.infoGathering}
                    {selectedRoom.activities.infoGathering.intelGain > 0
                      ? ` (+${selectedRoom.activities.infoGathering.intelGain}%)`
                      : ''}
                  </span>
                )}
              </div>
              {selectedNextActivity && selectedRoom.isCurrent && !selectedRoom.isCleared && (
                <p className="location-map__multi-activity-hint">
                  Paths unlock when all room activities are finished
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="location-map__selected-actions">
              {selectedRoom.isAccessible && !selectedRoom.isCleared && (
                <button
                  type="button"
                  onClick={handleEnterRoom}
                  className={getActionButtonClass()}
                  aria-label={
                    selectedRoom.isExit
                      ? `Enter Guardian — ${selectedRoom.name}`
                      : selectedNextActivity
                        ? `Continue ${ACTIVITY_FULL_NAMES[selectedNextActivity]} in ${selectedRoom.name}`
                        : `Enter ${selectedRoom.name}`
                  }
                >
                  {selectedRoom.isExit
                    ? 'Enter Guardian'
                    : selectedNextActivity
                      ? `Continue: ${ACTIVITY_FULL_NAMES[selectedNextActivity]}`
                      : 'Enter Room'}
                </button>
              )}
              {floorComplete && onLeaveLocation && (
                <button
                  type="button"
                  onClick={onLeaveLocation}
                  className="location-map__action-btn location-map__action-btn--leave"
                  aria-label="Return to region map — location cleared"
                >
                  Return to Region
                  <span className="sw-shortcut">Enter</span>
                </button>
              )}
              {/* Once exit is clear, never claim a side path is the blocker */}
              {!floorComplete && !selectedRoom.isAccessible && !selectedRoom.isCleared && (
                <span className={getActionButtonClass()}>
                  Locked — pick a path above
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leave recovery when selection panel missing (no selected room) */}
      {floorComplete && onLeaveLocation && !selectedRoom && (
        <div className="location-map__selected-actions location-map__selected-actions--leave-only">
          <button
            type="button"
            onClick={onLeaveLocation}
            className="location-map__action-btn location-map__action-btn--leave"
            aria-label="Return to region map — location cleared"
          >
            Return to Region
            <span className="sw-shortcut">Enter</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default LocationMap;
