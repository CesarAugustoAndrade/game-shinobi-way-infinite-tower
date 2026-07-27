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
  CheckCircle,
  Lock,
  Sparkles,
  Radio,
  Skull,
} from 'lucide-react';
import { getCurrentActivity } from '../../game/systems/LocationSystem';
import { getBranchingRoomColors } from '../../game/constants/roomTypeMapping';
import { ACTIVITY_LABELS } from '../../game/constants/activityLabels';
import { TERRAIN_DEFINITIONS } from '../../game/constants/terrain';
import { COMBAT_MODIFIER_EFFECTS } from '../../game/constants/roomTypes';
import {
  getRoomHiddenRoomBonus,
  getRoomMovementCost,
  getRoomVisibilityRange,
} from '../../game/systems/LocationTerrainSystem';
import './exploration.css';

interface RoomCardProps {
  room: BranchingRoom;
  isSelected: boolean;
  onClick: () => void;
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

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isSelected,
  onClick,
}) => {
  // Get the appropriate icon for the room type
  const getRoomIcon = (): React.ReactNode => {
    return BRANCHING_ROOM_ICONS[room.type] || <Home className="room-card__icon" />;
  };

  // Get colors from shared utility (returns Tailwind classes)
  const colors = getBranchingRoomColors(room.type, room.isCleared);

  // Get activity icons for the room
  const getActivityIcons = (): React.ReactNode[] => {
    const icons: React.ReactNode[] = [];
    const wrap = (key: string, label: string, node: React.ReactNode) => (
      <span key={key} className="room-card__activity-wrap" title={label} aria-label={label}>
        {node}
      </span>
    );

    if (room.activities.combat && !room.activities.combat.completed) {
      icons.push(wrap('combat', 'Combat', <Sword className="room-card__activity text-orange-400" />));
    }
    if (room.activities.merchant && !room.activities.merchant.completed) {
      icons.push(wrap('merchant', 'Merchant', <ShoppingBag className="room-card__activity text-yellow-400" />));
    }
    if (room.activities.event && !room.activities.event.completed) {
      icons.push(wrap('event', 'Event', <Scroll className="room-card__activity text-blue-400" />));
    }
    if (room.activities.scrollDiscovery && !room.activities.scrollDiscovery.completed) {
      icons.push(wrap('scrollDiscovery', 'Scroll Discovery', <BookOpen className="room-card__activity text-purple-400" />));
    }
    if (room.activities.rest && !room.activities.rest.completed) {
      icons.push(wrap('rest', 'Rest', <Heart className="room-card__activity text-green-400" />));
    }
    if (room.activities.training && !room.activities.training.completed) {
      icons.push(wrap('training', 'Training', <Dumbbell className="room-card__activity text-teal-400" />));
    }
    if (room.activities.treasure && !room.activities.treasure.collected) {
      icons.push(wrap('treasure', 'Treasure', <Gift className="room-card__activity text-amber-400" />));
    }
    if (room.activities.eliteChallenge && !room.activities.eliteChallenge.completed) {
      icons.push(wrap('eliteChallenge', 'Elite Challenge', <Skull className="room-card__activity text-red-400" />));
    }
    if (room.activities.infoGathering && !room.activities.infoGathering.completed) {
      icons.push(wrap('infoGathering', 'Info Gathering', <Radio className="room-card__activity text-teal-400" />));
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
      title: [
        def.name,
        sight !== 2 ? `Sight ${sight}` : null,
        secretsPct !== 0 ? `Secrets ${secretsPct > 0 ? '+' : ''}${secretsPct}%` : null,
        pace !== 1 ? `Pace ×${pace.toFixed(1)}` : null,
      ].filter(Boolean).join(' · '),
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
      title: names.join(' · '),
    };
  }, [room.activities.combat?.modifiers, room.activities.eliteChallenge?.modifiers]);

  // Determine card state
  const isLocked = !room.isAccessible && !room.isCleared;
  const canClick = room.isAccessible || room.isCurrent;

  // Build class list - combine BEM structure with Tailwind dynamic colors
  const cardClasses = [
    'room-card',
    colors.bg,
    colors.border,
    canClick && !room.isCurrent ? 'room-card--accessible' : '',
    room.isCurrent ? 'room-card--current' : '',
    isSelected ? 'room-card--selected' : '',
    isLocked ? 'room-card--locked' : '',
    room.isCleared ? 'room-card--cleared' : '',
  ].filter(Boolean).join(' ');

  // Honest titles — never claim Guardian lives once exit is cleared (W7/W8 residual)
  const lockTitle = isLocked
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

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      className={cardClasses}
      title={lockTitle}
    >
      {/* Background pattern */}
      <div className="room-card__bg">
        <div className="room-card__bg-gradient" />
      </div>

      {/* Content */}
      <div className="room-card__content">
        {/* Icon container */}
        <div className={`room-card__icon-container ${colors.iconBg} ${colors.text}`}>
          {getRoomIcon()}
        </div>

        {/* Room name */}
        <div className="room-card__name-container">
          <h3 className={`room-card__name ${colors.text}`}>
            {room.name}
          </h3>
        </div>

        {/* T-085: terrain micro-hint (scan before select) */}
        {terrainHint && !isLocked && (
          <div className="room-card__terrain" title={terrainHint.title}>
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
          <div className="room-card__fight" title={fightCondition.title}>
            {fightCondition.short}
          </div>
        )}

        {/* Activity indicators */}
        {activityIcons.length > 0 && (
          <div className="room-card__activities">
            {activityIcons}
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

      {/* Cleared overlay */}
      {room.isCleared && (
        <div className="room-card__overlay room-card__overlay--cleared">
          <CheckCircle className="room-card__overlay-icon room-card__overlay-icon--cleared" />
        </div>
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
  );
};

export default RoomCard;
