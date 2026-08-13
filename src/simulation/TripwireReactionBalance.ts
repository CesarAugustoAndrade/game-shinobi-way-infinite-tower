/**
 * T-024 probe — Tripwire 8 dmg + consume; no-move no fire; stun 60% / player ignore.
 */

import {
  CombatActor,
  CombatRange,
  CombatTrigger,
  MarkConsumeTiming,
  MarkFamily,
  RangeMoveDirection,
} from '../game/types';
import {
  TRIPWIRE_DAMAGE,
  TRIPWIRE_MARK_ID,
  applyEnemyBandChange,
  fireTripwireOnEnemyMove,
} from '../game/systems/MarkSystem';

export interface TripwireReactionProbe {
  fireConsume: boolean;
  noMove: boolean;
  stunAndPlayerIgnore: boolean;
}

export function runTripwireReactionProbe(): TripwireReactionProbe {
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
  const fire = fireTripwireOnEnemyMove({
    marks: [tripwire],
    moved: true,
    mover: 'enemy',
    enemyHp: 40,
    rng: () => 1,
  });
  const edge = applyEnemyBandChange(
    { marks: [tripwire], range: CombatRange.LONG, enemyHp: 40 },
    RangeMoveDirection.RETREAT,
    () => 0,
  );
  const stunned = fireTripwireOnEnemyMove({
    marks: [tripwire],
    moved: true,
    mover: 'enemy',
    enemyHp: 40,
    rng: () => 0,
  });
  const noStun = fireTripwireOnEnemyMove({
    marks: [tripwire],
    moved: true,
    mover: 'enemy',
    enemyHp: 40,
    rng: () => 0.6,
  });
  const player = fireTripwireOnEnemyMove({
    marks: [tripwire],
    moved: true,
    mover: 'player',
    enemyHp: 40,
    rng: () => 0,
  });
  return {
    fireConsume:
      fire.fired &&
      fire.damageDealt === TRIPWIRE_DAMAGE &&
      fire.enemyHp === 32 &&
      !fire.marks.some((m) => m.id === TRIPWIRE_MARK_ID),
    noMove:
      !edge.moved &&
      !edge.fired &&
      edge.enemyHp === 40 &&
      edge.marks.some((m) => m.id === TRIPWIRE_MARK_ID),
    stunAndPlayerIgnore:
      stunned.stunned &&
      stunned.marks.some((m) => m.family === MarkFamily.HARD_CONTROL) &&
      !noStun.stunned &&
      !player.fired &&
      player.marks.some((m) => m.id === TRIPWIRE_MARK_ID),
  };
}

export function printTripwireReactionProbe(probe: TripwireReactionProbe): void {
  console.log('\n── T-024 Tripwire reaction probe ──');
  console.log(`  fire + consume:        ${probe.fireConsume}`);
  console.log(`  no-move no fire:       ${probe.noMove}`);
  console.log(`  stun / player ignore:  ${probe.stunAndPlayerIgnore}`);
}
