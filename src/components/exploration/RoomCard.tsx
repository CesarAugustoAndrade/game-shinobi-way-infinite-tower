import React, { useMemo } from 'react';
import {
  BranchingRoom,
  BranchingRoomType,
  CombatModifierType,
} from '../../game/types';
import {
  Sword,
  Heart,
  ShoppingBag,
  Scroll,
  BookOpen,
  Dumbbell,
  Gift,
  Crown,
  Home,
  TreePine,
  Mountain,
  Flame,
  Landmark,
  Lock,
  Sparkles,
  Radio,
  Skull,
} from 'lucide-react';
import { getCurrentActivity } from '../../game/systems/LocationSystem';
import { ACTIVITY_LABELS } from '../../game/constants/activityLabels';
import { TERRAIN_DEFINITIONS } from '../../game/constants/terrain';
import { COMBAT_MODIFIER_EFFECTS } from '../../game/constants/roomTypes';
import {
  getRoomHiddenRoomBonus,
  getRoomMovementCost,
  getRoomVisibilityRange,
} from '../../game/systems/LocationTerrainSystem';
import Tooltip from '../shared/Tooltip';
import './exploration.css';

interface RoomCardProps {
  room: BranchingRoom;
  isSelected: boolean;
  onClick: () => void;
  onActivate?: () => void;
}

// Icon mapping for branching room types
const BRANCHING_ROOM_ICONS: Record<BranchingRoomType, React.ReactNode> = {
  [BranchingRoomType.START]: <Home className="room-card__icon" />,
  [BranchingRoomType.VILLAGE]: <Home className="room-card__icon" />,
  [BranchingRoomType.OUTPOST]: <Sword className="room-card__icon" />,
  [BranchingRoomType.SHRINE]: <Sparkles className="room-card__icon" />,
  [BranchingRoomType.CAMP]: <Flame className="room-card__icon" />,
  [BranchingRoomType.RUINS]: <Landmark className="room-card__icon" />,
  [BranchingRoomType.BRIDGE]: <Mountain className="room-card__icon" />,
  [BranchingRoomType.BOSS_GATE]: <Crown className="room-card__icon" />,
  [BranchingRoomType.FOREST]: <TreePine className="room-card__icon" />,
  [BranchingRoomType.CAVE]: <Mountain className="room-card__icon" />,
  [BranchingRoomType.BATTLEFIELD]: <Sword className="room-card__icon" />,
};

const BRANCHING_ROOM_CLASSES: Record<BranchingRoomType, string> = {
  [BranchingRoomType.START]: 'room-card--type-start',
  [BranchingRoomType.VILLAGE]: 'room-card--type-village',
  [BranchingRoomType.OUTPOST]: 'room-card--type-outpost',
  [BranchingRoomType.SHRINE]: 'room-card--type-shrine',
  [BranchingRoomType.CAMP]: 'room-card--type-camp',
  [BranchingRoomType.RUINS]: 'room-card--type-ruins',
  [BranchingRoomType.BRIDGE]: 'room-card--type-bridge',
  [BranchingRoomType.BOSS_GATE]: 'room-card--type-boss-gate',
  [BranchingRoomType.FOREST]: 'room-card--type-forest',
  [BranchingRoomType.CAVE]: 'room-card--type-cave',
  [BranchingRoomType.BATTLEFIELD]: 'room-card--type-battlefield',
};

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isSelected,
  onClick,
  onActivate,
}) => {
  // Get the appropriate icon for the room type
  const getRoomIcon = (): React.ReactNode => {
    return BRANCHING_ROOM_ICONS[room.type] || <Home className="room-card__icon" />;
  };

  // Get activity icons for the room
  const getActivityIcons = (): Array<{ key: string; label: string; node: React.ReactNode }> => {
    const icons: Array<{ key: string; label: string; node: React.ReactNode }> = [];
    const add = (key: string, label: string, node: React.ReactNode) => {
      icons.push({ key, label, node });
    };

    if (room.activities.combat && !room.activities.combat.completed) {
      add('combat', 'Combat', <Sword className="room-card__activity room-card__activity--combat" />);
    }
    if (room.activities.merchant && !room.activities.merchant.completed) {
      add('merchant', 'Merchant', <ShoppingBag className="room-card__activity room-card__activity--merchant" />);
    }
    if (room.activities.event && !room.activities.event.completed) {
      add('event', 'Event', <Scroll className="room-card__activity room-card__activity--event" />);
    }
    if (room.activities.scrollDiscovery && !room.activities.scrollDiscovery.completed) {
      add('scrollDiscovery', 'Scroll Discovery', <BookOpen className="room-card__activity room-card__activity--scroll" />);
    }
    if (room.activities.rest && !room.activities.rest.completed) {
      add('rest', 'Rest', <Heart className="room-card__activity room-card__activity--rest" />);
    }
    if (room.activities.training && !room.activities.training.completed) {
      add('training', 'Training', <Dumbbell className="room-card__activity room-card__activity--training" />);
    }
    if (room.activities.treasure && !room.activities.treasure.collected) {
      add('treasure', 'Treasure', <Gift className="room-card__activity room-card__activity--treasure" />);
    }
    if (room.activities.eliteChallenge && !room.activities.eliteChallenge.completed) {
      add('eliteChallenge', 'Elite Challenge', <Skull className="room-card__activity room-card__activity--elite" />);
    }
    if (room.activities.infoGathering && !room.activities.infoGathering.completed) {
      add('infoGathering', 'Info Gathering', <Radio className="room-card__activity room-card__activity--info" />);
    }

    return icons;
  };

  const currentActivity = getCurrentActivity(room);
  const activityIcons = getActivityIcons();

  // T-085: terrain micro-hints for path scan (same semantics as selected panel)
  const terrainHint = useMemo(() => {
    const def = TERRAIN_DEFINITIONS[room.terrain];
    if (!def) return null;
    const sight = getRoomVisibilityRange(def);
    const secretsPct = Math.round(getRoomHiddenRoomBonus(def) * 100);
    const pace = getRoomMovementCost(def);
    const chips: string[] = [];
    if (sight !== 2) chips.push(`S${sight}`);
    if (secretsPct !== 0) chips.push(`X${secretsPct > 0 ? '+' : ''}${secretsPct}`);
    if (pace !== 1) chips.push(`P×${pace.toFixed(1)}`);
    return {
      name: def.name,
      chips,
      details: [
        def.name,
        sight !== 2 ? `Sight ${sight}` : null,
        secretsPct !== 0 ? `Secrets ${secretsPct > 0 ? '+' : ''}${secretsPct}%` : null,
        pace !== 1 ? `Pace ×${pace.toFixed(1)}` : null,
      ].filter((detail): detail is string => Boolean(detail)),
    };
  }, [room.terrain]);

  // T-106/T-108: combat or elite condition micro-chip
  const fightCondition = useMemo(() => {
    const mods =
      room.activities.combat?.modifiers
      ?? room.activities.eliteChallenge?.modifiers
      ?? [];
    const names = mods
      .filter((m) => m !== CombatModifierType.NONE)
      .map((m) => COMBAT_MODIFIER_EFFECTS[m]?.name)
      .filter(Boolean) as string[];
    if (names.length === 0) return null;
    return {
      short: names[0].slice(0, 6),
      names,
    };
  }, [room.activities.combat?.modifiers, room.activities.eliteChallenge?.modifiers]);

  // Determine card state
  const isLocked = !room.isAccessible && !room.isCleared;
  const canClick = room.isAccessible || room.isCurrent;

  // Build class list with stable BEM modifiers; dynamic Tailwind classes are not emitted.
  const cardClasses = [
    'room-card',
    BRANCHING_ROOM_CLASSES[room.type],
    canClick && !room.isCurrent ? 'room-card--accessible' : '',
    room.isCurrent ? 'room-card--current' : '',
    isSelected ? 'room-card--selected' : '',
    isLocked ? 'room-card--locked' : '',
    room.isCleared ? 'room-card--cleared' : '',
  ].filter(Boolean).join(' ');

  // Honest titles — never claim Guardian lives once exit is cleared (W7/W8 residual)
  const stateDescription = isLocked
    ? 'Locked — clear the room you are in to open this path'
    : room.isCleared && room.isExit
      ? 'Guardian fallen — location exit cleared'
      : room.isCleared
        ? 'Room cleared'
        : room.isCurrent
          ? 'You are here — enter to resolve room activities'
          : room.isExit
            ? 'Exit room — defeat the Guardian to clear the location'
            : undefined;

  const activityLabels = activityIcons.map((activity) => activity.label);
  const roomDescription = [
    room.name,
    stateDescription,
    terrainHint?.name,
    fightCondition?.names.join(', '),
    activityLabels.length > 0 ? `Activities: ${activityLabels.join(', ')}` : null,
  ].filter(Boolean).join('. ');

  const tooltipContent = (
    <div className="room-card__tooltip">
      <div className="room-card__tooltip-title">{room.name}</div>
      {stateDescription && <div className="room-card__tooltip-state">{stateDescription}</div>}
      {terrainHint && (
        <div>
          Terrain: {terrainHint.details.join(' · ')}
          {terrainHint.chips.length > 0 && (
            <div className="room-card__tooltip-legend">S Sight · X Secrets · P Pace</div>
          )}
        </div>
      )}
      {fightCondition && <div>Fight: {fightCondition.names.join(' · ')}</div>}
      {activityLabels.length > 0 && <div>Open: {activityLabels.join(' · ')}</div>}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position="top" className="room-card__tooltip-host">
      <button
        type="button"
        onClick={onClick}
        onKeyDown={(event) => {
          if (
            event.key !== 'Enter' ||
            !isSelected ||
            !onActivate ||
            !canClick ||
            room.isCleared
          ) return;
          event.preventDefault();
          event.stopPropagation();
          onActivate();
        }}
        disabled={isLocked}
        className={cardClasses}
        aria-label={roomDescription}
        aria-pressed={isSelected}
      >
      {/* Background pattern */}
      <div className="room-card__bg">
        <div className="room-card__bg-gradient" />
      </div>

      {/* Content */}
      <div className="room-card__content">
        {/* Icon container */}
        <div className="room-card__icon-container">
          {getRoomIcon()}
        </div>

        {/* Room name */}
        <div className="room-card__name-container">
          <h3 className="room-card__name">
            {room.name}
          </h3>
        </div>

        {/* T-085: terrain micro-hint (scan before select) */}
        {terrainHint && !isLocked && (
          <div className="room-card__terrain">
            <span className="room-card__terrain-name">{terrainHint.name}</span>
            {terrainHint.chips.length > 0 && (
              <span className="room-card__terrain-chips">
                {terrainHint.chips.join(' ')}
              </span>
            )}
          </div>
        )}
        {/* T-106: fight condition chip */}
        {fightCondition && !isLocked && (
          <div className="room-card__fight">
            {fightCondition.short}
          </div>
        )}

        {/* Activity indicators */}
        {activityIcons.length > 0 && (
          <div className="room-card__activities">
            {activityIcons.map((activity) => (
              <span key={activity.key} className="room-card__activity-wrap" aria-hidden="true">
                {activity.node}
              </span>
            ))}
          </div>
        )}

        {/* Current activity label */}
        {currentActivity && !room.isCleared && (
          <div className="room-card__current-activity">
            {ACTIVITY_LABELS[currentActivity] || currentActivity}
          </div>
        )}
      </div>

      {/* Exit badge */}
      {room.isExit && !room.isCleared && (
        <div className="room-card__exit-badge">EXIT</div>
      )}

      {/* Locked overlay */}
      {isLocked && (
        <div className="room-card__overlay room-card__overlay--locked">
          <Lock className="room-card__overlay-icon room-card__overlay-icon--locked" />
        </div>
      )}

      {/* Current room glow + explicit first-time affordance */}
      {room.isCurrent && !room.isCleared && (
        <>
          <div className="room-card__here-badge" aria-hidden="true">
            You are here
          </div>
          <div className="room-card__glow room-card__glow--current" />
        </>
      )}

      {/* Boss gate pulse */}
      {room.type === BranchingRoomType.BOSS_GATE && !room.isCleared && (
        <div className="room-card__glow room-card__glow--boss" />
      )}
      </button>
    </Tooltip>
  );
};

export default RoomCard;
