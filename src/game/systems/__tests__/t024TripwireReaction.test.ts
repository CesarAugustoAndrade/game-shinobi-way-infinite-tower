/**
 * T-024 AC: Tripwire fires 8 dmg + 60% Stun 1 on first real enemy band change.
 * rng() < 0.6 stuns; rng() >= 0.6 does not.
 */

import { describe, it, expect } from 'vitest';
import {
  CombatActor,
  CombatRange,
  CombatTrigger,
  MarkConsumeTiming,
  MarkFamily,
  RangeMoveDirection,
} from '../../types';
import {
  TRIPWIRE_DAMAGE,
  TRIPWIRE_MARK_ID,
  applyEnemyBandChange,
  fireTripwireOnEnemyMove,
  resolveHardControlSkips,
} from '../MarkSystem';

const tripwire = {
  id: TRIPWIRE_MARK_ID,
  sourceSkillId: 'tripwire_perimeter',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 2,
  stacks: 1,
  consume: MarkConsumeTiming.NONE,
  trigger: CombatTrigger.ON_MOVE,
};

describe('T-024 fire consume', () => {
  it('deals 8 and consumes tripwire on a real enemy band change', () => {
    const result = fireTripwireOnEnemyMove({
      marks: [tripwire],
      moved: true,
      mover: 'enemy',
      enemyHp: 40,
      rng: () => 1,
    });
    expect(result.fired).toBe(true);
    expect(result.damageDealt).toBe(TRIPWIRE_DAMAGE);
    expect(result.enemyHp).toBe(32);
    expect(result.marks.find((m) => m.id === TRIPWIRE_MARK_ID)).toBeUndefined();
  });
});

describe('T-024 no move', () => {
  it('does not fire when the band does not change', () => {
    const edge = applyEnemyBandChange(
      { marks: [tripwire], range: CombatRange.LONG, enemyHp: 40 },
      RangeMoveDirection.RETREAT,
      () => 0,
    );
    expect(edge.moved).toBe(false);
    expect(edge.fired).toBe(false);
    expect(edge.damageDealt).toBe(0);
    expect(edge.enemyHp).toBe(40);
    expect(edge.marks.some((m) => m.id === TRIPWIRE_MARK_ID)).toBe(true);

    const still = fireTripwireOnEnemyMove({
      marks: [tripwire],
      moved: false,
      mover: 'enemy',
      enemyHp: 40,
    });
    expect(still.fired).toBe(false);
    expect(still.marks).toHaveLength(1);
  });
});

describe('T-024 stun and player ignore', () => {
  it('stuns when rng < 0.6, skips stun when rng >= 0.6, and ignores player moves', () => {
    const stunned = fireTripwireOnEnemyMove({
      marks: [tripwire],
      moved: true,
      mover: 'enemy',
      enemyHp: 40,
      rng: () => 0,
    });
    expect(stunned.stunned).toBe(true);
    expect(stunned.marks.some((m) => m.family === MarkFamily.HARD_CONTROL)).toBe(true);
    expect(resolveHardControlSkips(stunned.marks)).toBe(1);

    const noStun = fireTripwireOnEnemyMove({
      marks: [tripwire],
      moved: true,
      mover: 'enemy',
      enemyHp: 40,
      rng: () => 0.6,
    });
    expect(noStun.stunned).toBe(false);
    expect(noStun.marks.some((m) => m.family === MarkFamily.HARD_CONTROL)).toBe(false);

    const player = fireTripwireOnEnemyMove({
      marks: [tripwire],
      moved: true,
      mover: 'player',
      enemyHp: 40,
      rng: () => 0,
    });
    expect(player.fired).toBe(false);
    expect(player.damageDealt).toBe(0);
    expect(player.marks.some((m) => m.id === TRIPWIRE_MARK_ID)).toBe(true);
  });
});
