import React from 'react';
import { LocationActivities, ActivityStatus } from '../../game/types';
import { ACTIVITY_LABELS } from '../../game/constants/activityLabels';
import { getActivityArt } from '../../game/constants/artRegistry';
import ArtIcon from '../shared/ArtIcon';
import './exploration.css';

interface ActivityIconsProps {
  activities: LocationActivities | null;
}

const ACTIVITY_KEYS: (keyof LocationActivities)[] = [
  'combat',
  'merchant',
  'rest',
  'training',
  'event',
  'scrollDiscovery',
  'treasure',
  'eliteChallenge',
  'infoGathering',
];

const ACTIVITY_COLOR: Record<string, string> = {
  combat: 'activity-icons__icon--combat',
  merchant: 'activity-icons__icon--merchant',
  rest: 'activity-icons__icon--rest',
  training: 'activity-icons__icon--training',
  event: 'activity-icons__icon--event',
  scrollDiscovery: 'activity-icons__icon--scroll',
  treasure: 'activity-icons__icon--treasure',
  eliteChallenge: 'activity-icons__icon--elite',
  infoGathering: 'activity-icons__icon--info',
};

const ActivityIcons: React.FC<ActivityIconsProps> = ({ activities }) => {
  if (!activities) {
    return (
      <div className="activity-icons">
        <span className="activity-icons__label">📋</span>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="activity-icons__placeholder">?</span>
        ))}
      </div>
    );
  }

  const activeActivities = ACTIVITY_KEYS.filter((key) => activities[key] !== false);

  return (
    <div className="activity-icons">
      <span className="activity-icons__label">📋</span>
      {activeActivities.length === 0 ? (
        <span className="activity-icons__empty">No activities</span>
      ) : (
        activeActivities.map((key) => {
          const status: ActivityStatus = activities[key];
          const isSpecial = status === 'special';
          const label = ACTIVITY_LABELS[key as keyof typeof ACTIVITY_LABELS];
          const art = getActivityArt(key);
          const classes = [
            'activity-icons__icon',
            ACTIVITY_COLOR[key] ?? '',
            isSpecial ? 'activity-icons__icon--special' : '',
          ]
            .filter(Boolean)
            .join(' ');

          // 'special' ≈ soft hint; R1-012 amenities use 'available' / true
          const title = isSpecial ? `May have ${label}` : label;

          return (
            <span
              key={key}
              className={classes}
              title={title}
            >
              <ArtIcon
                art={art}
                size="xs"
                title={title}
              />
              {isSpecial ? <span className="activity-icons__special-mark" aria-hidden>≈</span> : null}
            </span>
          );
        })
      )}
    </div>
  );
};

export default ActivityIcons;
