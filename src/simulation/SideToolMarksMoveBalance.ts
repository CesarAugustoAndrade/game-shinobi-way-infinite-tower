/**
 * T-023 probe — Wire mark+PULL; Off-Balance +20%; Exposed ranged / Blastback PUSH / Backstep.
 */

import { AttackMethod, CardRole, CombatActor, CombatRange, MarkConsumeTiming } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface SideToolMarksMoveProbe {
  wireMarkPull: boolean;
  offBalanceMult: boolean;
  exposedPushBackstep: boolean;
}

export function runSideToolMarksMoveProbe(): SideToolMarksMoveProbe {
  const wire = SKILLS.WIRE_KUNAI_REEL;
  const blastback = SKILLS.EXPLOSIVE_KUNAI_BLASTBACK;
  const backstep = SKILLS.BACKSTEP_SHURIKEN;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    ...overrides,
  });
  const mark = (id: string) => ({
    id,
    sourceSkillId: 'setup',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks: 1,
    consume: MarkConsumeTiming.ATTEMPT,
  });
  const hit = (dmg: number) => ({ rollHit: () => ({ hit: true as const, damage: dmg }) });
  const melee = createMockSkill({
    id: 'next_attack',
    cardRole: CardRole.ATTACK,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    hitCount: 1,
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  const ranged = createMockSkill({
    id: 'next_ranged',
    cardRole: CardRole.ATTACK,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    hitCount: 1,
    attackMethod: AttackMethod.RANGED,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  const pulled = resolveSkill({ skill: wire }, state({ range: CombatRange.MEDIUM }), hit(wire.baseDamage));
  const boosted = resolveSkill(
    { skill: melee },
    state({ marks: [mark('off_balance')] }),
    hit(10),
  );
  const exposedRanged = resolveSkill(
    { skill: ranged },
    state({ marks: [mark('exposed')] }),
    hit(10),
  );
  const exposedMelee = resolveSkill(
    { skill: melee },
    state({ marks: [mark('exposed')] }),
    hit(10),
  );
  const pushed = resolveSkill(
    { skill: blastback },
    state({ range: CombatRange.CLOSE }),
    hit(blastback.baseDamage),
  );
  const stepped = resolveSkill(
    { skill: backstep },
    state({ range: CombatRange.CLOSE }),
    hit(backstep.baseDamage),
  );
  return {
    wireMarkPull:
      pulled.ok &&
      pulled.state.marks.some((m) => m.id === 'off_balance') &&
      pulled.state.range === CombatRange.CLOSE &&
      pulled.state.playerMoveUsedThisTurn === false,
    offBalanceMult:
      boosted.ok &&
      boosted.damageDealt === Math.floor(10 * 1.2) &&
      !boosted.state.marks.some((m) => m.id === 'off_balance'),
    exposedPushBackstep:
      exposedRanged.ok &&
      exposedRanged.damageDealt === Math.floor(10 * 1.15) &&
      exposedMelee.ok &&
      exposedMelee.damageDealt === 10 &&
      pushed.ok &&
      pushed.state.range === CombatRange.MEDIUM &&
      stepped.ok &&
      stepped.state.range === CombatRange.MEDIUM &&
      stepped.state.playerMoveUsedThisTurn === false,
  };
}

export function printSideToolMarksMoveProbe(probe: SideToolMarksMoveProbe): void {
  console.log('\n── T-023 SIDE tools marks/move probe ──');
  console.log(`  Wire mark+PULL:         ${probe.wireMarkPull}`);
  console.log(`  Off-Balance +20%:       ${probe.offBalanceMult}`);
  console.log(`  Exposed/PUSH/backstep:  ${probe.exposedPushBackstep}`);
}
