/**
 * T-109 probe — Shukaku Arm ATTACK 27 C/M; self Shield 30 on resolve even on miss.
 */

import { CardRole, CombatRange, DamageProperty, EffectType, MarkFamily } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface ShukakuArmProbe {
  authoring: boolean;
  hit: boolean;
  missShield: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    shieldStacks: number;
    missShieldStacks: number;
    toadShield: number;
    sandShield: number;
    mudShield: number;
    dmgPerAp: number;
  };
}

export function runShukakuArmProbe(): ShukakuArmProbe {
  const arm = SKILLS.SHUKAKU_ARM;
  const toad = SKILLS.SUMMON_GAMABUNTA;
  const sand = SKILLS.SAND_SHIELD;
  const wall = SKILLS.MUD_WALL;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [arm],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: arm.baseDamage }) };
  const missHit = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const landed = resolveSkill({ skill: arm }, state(), hit);
  const whiff = resolveSkill({ skill: arm }, state(), missHit);
  const ap = arm.apCost ?? 0;
  const dmg = landed.ok ? landed.damageDealt : 0;
  const shield = landed.ok ? landed.state.marks.find((m) => m.id === 'shukaku_arm_shield') : undefined;
  const missShield = whiff.ok
    ? whiff.state.marks.find((m) => m.id === 'shukaku_arm_shield')
    : undefined;
  return {
    authoring:
      arm.cardRole === CardRole.ATTACK &&
      arm.apCost === 4 &&
      arm.chakraCost === 8 &&
      arm.cooldown === 6 &&
      arm.baseDamage === 27 &&
      arm.damageProperty === DamageProperty.NORMAL &&
      arm.allowedRanges?.includes(CombatRange.CLOSE) === true &&
      arm.allowedRanges?.includes(CombatRange.MEDIUM) === true &&
      arm.markEffects?.some(
        (m) =>
          m.id === 'shukaku_arm_shield' &&
          m.stacks === 30 &&
          m.family === MarkFamily.SHIELD &&
          m.targetActor === 'self' &&
          m.requireHit !== true,
      ) === true &&
      arm.effects?.some((e) => e.type === EffectType.SHIELD && e.value === 100 && e.duration === 2) !==
        true,
    hit: landed.ok === true && dmg === 27 && shield?.stacks === 30,
    missShield:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      missShield?.stacks === 30 &&
      missShield?.target !== undefined,
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: arm.chakraCost,
      shieldStacks: shield?.stacks ?? 0,
      missShieldStacks: missShield?.stacks ?? 0,
      toadShield: toad.markEffects?.find((m) => m.id === 'gamabunta_shield')?.stacks ?? 0,
      sandShield: sand.markEffects?.find((m) => m.id === 'sand_shield')?.stacks ?? 0,
      mudShield: wall.markEffects?.find((m) => m.id === 'mud_wall_shield')?.stacks ?? 0,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printShukakuArmProbe(probe: ShukakuArmProbe): void {
  const m = probe.metrics;
  console.log('\n── T-109 Shukaku Arm probe ──');
  console.log(`  authoring ATTACK 27 C/M + Shield 30 even-miss: ${probe.authoring}`);
  console.log(`  hit 27 + shield 30:                            ${probe.hit}`);
  console.log(`  miss 0 dmg still shield 30:                    ${probe.missShield}`);
  console.log('  ── balance vs mute 27/AP2/ARMOR_BREAK/SHIELD 100×2 and Toad 35 / Sand 45 ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 27 / 2 = 13.50)`);
  console.log(`  CP / CD:            ${m.chakraCost} / 6  (unchanged 8 / 6)`);
  console.log(`  live shield hit/miss: ${m.shieldStacks} / ${m.missShieldStacks}  (was mute 100×2; Toad ${m.toadShield} on-hit; Sand ${m.sandShield}; Mud ${m.mudShield})`);
}
