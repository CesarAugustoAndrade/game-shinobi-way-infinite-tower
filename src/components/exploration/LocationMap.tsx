import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BranchingFloor,
  BranchingRoom,
  Player,
  CharacterStats,
} from '../../game/types';
import RoomCard from './RoomCard';
import { getCurrentRoom, getChildRooms } from '../../game/systems/LocationSystem';
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
import './exploration.css';

interface LocationMapProps {
  branchingFloor: BranchingFloor;
  player: Player;
  playerStats: CharacterStats;
  currentIntel: number;
  onRoomSelect: (room: BranchingRoom) => void;
  onRoomEnter: (room: BranchingRoom) => void;
}

const LocationMap: React.FC<LocationMapProps> = ({
  branchingFloor,
  currentIntel,
  onRoomSelect,
  onRoomEnter,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // RELATIVE VIEW: Get rooms relative to current position
  // Current room at bottom, children in middle, grandchildren at top
  const currentRoom = useMemo(() => getCurrentRoom(branchingFloor), [branchingFloor]);
  const childRooms = useMemo(
    () => currentRoom ? getChildRooms(branchingFloor, currentRoom.id) : [],
    [branchingFloor, currentRoom]
  );

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
  // T-105: room combat condition (Ambush / Sanctuary / …) before enter
  const selectedCombatConditions = useMemo(() => {
    const mods = selectedRoom?.activities.combat?.modifiers ?? [];
    return mods
      .filter((m) => m !== CombatModifierType.NONE)
      .map((m) => COMBAT_MODIFIER_EFFECTS[m]?.name)
      .filter(Boolean) as string[];
  }, [selectedRoom]);

  // Handle room click
  const handleRoomClick = (room: BranchingRoom) => {
    setSelectedRoomId(room.id);
    onRoomSelect(room);
  };

  // Handle enter button
  const handleEnterRoom = useCallback(() => {
    if (selectedRoom && selectedRoom.isAccessible && !selectedRoom.isCleared) {
      onRoomEnter(selectedRoom);
    }
  }, [selectedRoom, onRoomEnter]);

  // Keyboard shortcuts: SPACE/ENTER to enter room, 1/2 to select child nodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Number keys 1-2 to select child rooms (fixed 2 children per room)
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        e.preventDefault();
        const indexMap: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
        const index = indexMap[e.code];
        const childRoom = childRooms[index];
        if (childRoom) {
          setSelectedRoomId(childRoom.id);
          onRoomSelect(childRoom);
        }
        return;
      }

      // Only handle Space and Enter for entering rooms
      if (e.code !== 'Space' && e.code !== 'Enter') return;

      e.preventDefault();

      // If a room is already selected and accessible, enter it
      // This works for both child rooms AND the current/parent room
      if (selectedRoom && selectedRoom.isAccessible && !selectedRoom.isCleared) {
        handleEnterRoom();
        return;
      }

      // If current room is selected but not fully cleared, enter it
      // (currentRoom may be accessible but have remaining activities)
      if (selectedRoom && currentRoom && selectedRoom.id === currentRoom.id && !selectedRoom.isCleared) {
        onRoomEnter(selectedRoom);
        return;
      }

      // Otherwise, select the current/parent room if it has remaining activities
      if (currentRoom && !currentRoom.isCleared) {
        setSelectedRoomId(currentRoom.id);
        onRoomSelect(currentRoom);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRoom, currentRoom, childRooms, handleEnterRoom, onRoomEnter, onRoomSelect]);

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

  return (
    <div
      className={`location-map ${getArcModifier()}`}
      style={{
        backgroundImage: 'url(/assets/background_map_exploring.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header */}
      <div className="location-map__header">
        <div className="location-map__header-content">
          <div>
            <h2 className="location-map__title">
              {branchingFloor.biome}
            </h2>
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
              <span className="location-map__intel-icon">🔮</span>
              <div className="location-map__intel-bar">
                <div
                  className="location-map__intel-fill"
                  style={{ width: `${currentIntel}%` }}
                />
              </div>
              <span className="location-map__intel-value">{currentIntel}%</span>
            </div>
            <p className="location-map__hint">
              {branchingFloor.exitRoomId
                ? '🚪 Exit discovered - Find and defeat the Guardian'
                : 'Keep exploring to find the Exit'}
            </p>
          </div>
        </div>
      </div>

      {/* Map Area - RELATIVE VIEW: Current at bottom, children middle, grandchildren top */}
      <div className="location-map__area">
        {/* Room Cards Container */}
        <div className="location-map__rooms">
          {/* Grandchildren — T-080: fogged when current room visibilityRange < 2 */}
          <div className="location-map__row">
            {childRooms.map((child) => {
              const childGrandchildren = getChildRooms(branchingFloor, child.id);
              return (
                <div key={`gc-group-${child.id}`} className="location-map__row-group">
                  {showGrandchildren ? (
                    <>
                      {childGrandchildren.map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          isSelected={selectedRoomId === room.id}
                          onClick={() => handleRoomClick(room)}
                        />
                      ))}
                      {childGrandchildren.length === 0 && (
                        <div className="location-map__placeholder">...</div>
                      )}
                    </>
                  ) : (
                    <div
                      className="location-map__fog"
                      title="Low visibility — advance to scout further"
                      aria-label="Path ahead obscured by terrain"
                    >
                      ???
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Children - Middle (2 rooms) - Immediate choices */}
          <div className="location-map__row">
            {childRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onClick={() => handleRoomClick(room)}
              />
            ))}
            {childRooms.length === 0 && currentRoom?.isExit && (
              <div className="location-map__exit-message">
                ⚔️ Floor Exit - Defeat the Guardian ⚔️
              </div>
            )}
          </div>

          {/* Current Room - Bottom (1 room) - You are here */}
          <div className="location-map__row">
            {currentRoom && (
              <RoomCard
                key={currentRoom.id}
                room={currentRoom}
                isSelected={selectedRoomId === currentRoom.id}
                onClick={() => handleRoomClick(currentRoom)}
              />
            )}
          </div>
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

              {/* Activity list */}
              <div className="location-map__selected-activities">
                {selectedRoom.activities.combat && !selectedRoom.activities.combat.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--combat">
                    {ACTIVITY_FULL_NAMES.combat}: {selectedRoom.activities.combat.enemy.name}
                  </span>
                )}
                {selectedRoom.activities.eliteChallenge && !selectedRoom.activities.eliteChallenge.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--elite">
                    {ACTIVITY_FULL_NAMES.eliteChallenge}: {selectedRoom.activities.eliteChallenge.enemy.name}
                  </span>
                )}
                {selectedRoom.activities.merchant && !selectedRoom.activities.merchant.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--merchant">
                    {ACTIVITY_FULL_NAMES.merchant}
                  </span>
                )}
                {selectedRoom.activities.event && !selectedRoom.activities.event.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--event">
                    {ACTIVITY_FULL_NAMES.event}
                  </span>
                )}
                {selectedRoom.activities.scrollDiscovery && !selectedRoom.activities.scrollDiscovery.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--scroll">
                    {ACTIVITY_FULL_NAMES.scrollDiscovery}
                  </span>
                )}
                {selectedRoom.activities.rest && !selectedRoom.activities.rest.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--rest">
                    {ACTIVITY_FULL_NAMES.rest} (+{selectedRoom.activities.rest.healPercent}% HP)
                  </span>
                )}
                {selectedRoom.activities.training && !selectedRoom.activities.training.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--training">
                    {ACTIVITY_FULL_NAMES.training}
                  </span>
                )}
                {selectedRoom.activities.treasure && !selectedRoom.activities.treasure.collected && (
                  <span className="location-map__activity-tag location-map__activity-tag--treasure">
                    {ACTIVITY_FULL_NAMES.treasure}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="location-map__selected-actions">
              {selectedRoom.isAccessible && !selectedRoom.isCleared && (
                <button
                  type="button"
                  onClick={handleEnterRoom}
                  className={getActionButtonClass()}
                >
                  Enter
                </button>
              )}
              {selectedRoom.isCleared && (
                <span className={getActionButtonClass()}>
                  Cleared
                </span>
              )}
              {!selectedRoom.isAccessible && !selectedRoom.isCleared && (
                <span className={getActionButtonClass()}>
                  Locked
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMap;
