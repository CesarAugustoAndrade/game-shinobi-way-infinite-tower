/**
 * T-077 probe — Air Bullet 13 M/L; PUSH 1 + −1 ACC on hit; vs Explosive Tag / unused WIL −15%.
 */

import { CardRole, CombatActor, CombatRange, EffectType, MarkFamily, PrimaryStat } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface AirBulletProbe {
  authoring: boolean;
  mediumPush: boolean;
  longEdge: boolean;
  missSafe: boolean;
  closeIllegal: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    chipDamage: number;
    missDamage: number;
    accStacks: number;
    explosiveChip: number;
    dmgPerAp: number;
    dmgPerCp: number;
    mediumAfterRange: string;
    longAfterRange: string;
    missAfterRange: string;
    leftoverWil: boolean;
  };
}

export function runAirBulletProbe(): AirBulletProbe {
  const skill = SKILLS.AIR_BULLET;
  const state = (range: CombatRange): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const midHit = resolveSkill({ skill }, state(CombatRange.MEDIUM), hit);
  const longHit = resolveSkill({ skill }, state(CombatRange.LONG), hit);
  const whiff = resolveSkill({ skill }, state(CombatRange.MEDIUM), miss);
  const closePlay = resolveSkill({ skill }, state(CombatRange.CLOSE), hit);
  const acc = midHit.ok
    ? midHit.state.marks.find((m) => m.id === 'air_acc_down')
    : undefined;
  const chip = midHit.ok ? midHit.damageDealt : 0;
  const apCost = skill.apCost ?? 0;
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 2 &&
      skill.chakraCost === 5 &&
      skill.cooldown === 2 &&
      skill.baseDamage === 13 &&
      skill.bandMove?.kind === 'PUSH' &&
      skill.bandMove.steps === 1 &&
      skill.bandMove.requireHit === true &&
      skill.markEffects?.some(
        (m) =>
          m.id === 'air_acc_down' &&
          m.stacks === 1 &&
          m.duration === 1 &&
          m.family === MarkFamily.STAT &&
          m.targetActor === 'enemy' &&
          m.requireHit === true,
      ) === true &&
      !skill.effects?.some(
        (e) => e.type === EffectType.DEBUFF && e.targetStat === PrimaryStat.WILLPOWER,
      ),
    mediumPush:
      midHit.ok === true &&
      midHit.damageDealt === 13 &&
      midHit.state.range === CombatRange.LONG &&
      midHit.state.playerMoveUsedThisTurn === false &&
      acc?.stacks === 1 &&
      acc.target === CombatActor.ENEMY,
    longEdge:
      longHit.ok === true &&
      longHit.damageDealt === 13 &&
      longHit.state.range === CombatRange.LONG,
    missSafe:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.range === CombatRange.MEDIUM &&
      !whiff.state.marks.some((m) => m.id === 'air_acc_down'),
    closeIllegal: closePlay.ok === false,
    metrics: {
      apCost,
      chakraCost: skill.chakraCost,
      chipDamage: chip,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
      accStacks: acc?.stacks ?? 0,
      explosiveChip: SKILLS.EXPLOSIVE_TAG.baseDamage,
      dmgPerAp: apCost > 0 ? chip / apCost : 0,
      dmgPerCp: skill.chakraCost > 0 ? chip / skill.chakraCost : 0,
      mediumAfterRange: midHit.ok ? midHit.state.range : 'fail',
      longAfterRange: longHit.ok ? longHit.state.range : 'fail',
      missAfterRange: whiff.ok ? whiff.state.range : 'fail',
      leftoverWil:
        skill.effects?.some(
          (e) => e.type === EffectType.DEBUFF && e.targetStat === PrimaryStat.WILLPOWER,
        ) === true,
    },
  };
}

export function printAirBulletProbe(probe: AirBulletProbe): void {
  const m = probe.metrics;
  console.log('\n── T-077 Air Bullet probe ──');
  console.log(`  authoring SIDE PUSH+ACC: ${probe.authoring}`);
  console.log(`  MEDIUM hit → LONG −1ACC: ${probe.mediumPush}`);
  console.log(`  LONG hit stays LONG:     ${probe.longEdge}`);
  console.log(`  miss stays MEDIUM:       ${probe.missSafe}`);
  console.log(`  CLOSE illegal:           ${probe.closeIllegal}`);
  console.log('  ── balance vs Explosive Tag 11 / unused WIL −15%×2 ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (tag 1 / 0; was 2 / 5)`);
  console.log(`  chip:                   ${m.chipDamage}  (tag ${m.explosiveChip}; was 13 + unused WIL %)`);
  console.log(`  dmg/AP · dmg/CP:        ${m.dmgPerAp.toFixed(1)} / ${m.dmgPerCp.toFixed(1)}  (tag 11.0 / n/a)`);
  console.log(`  ACC stacks:             ${m.accStacks}  (was WIL −15% unused)`);
  console.log(`  leftover WIL %:         ${m.leftoverWil}`);
  console.log(`  MEDIUM / LONG after:    ${m.mediumAfterRange} / ${m.longAfterRange}`);
  console.log(`  miss after / dmg:       ${m.missAfterRange} / ${m.missDamage}`);
}
