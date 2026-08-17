/**
 * T-107 probe — Summon Gamabunta ATTACK 25 M/L; self Shield 35; no Mode consume.
 */

import { CardRole, CombatRange, MarkFamily, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SummonGamabuntaProbe {
  authoring: boolean;
  hitShield: boolean;
  miss: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    shieldStacks: number;
    cloneShield: number;
    mudShield: number;
    dmgPerAp: number;
  };
}

export function runSummonGamabuntaProbe(): SummonGamabuntaProbe {
  const toad = SKILLS.SUMMON_GAMABUNTA;
  const clone = SKILLS.WATER_CLONE;
  const wall = SKILLS.MUD_WALL;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [toad],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const clonesOn = {
    instances: [
      {
        id: 'shadow_clone',
        family: MODE_FAMILY.CLONES,
        charges: 3,
        state: ModeRuntimeState.ON,
      },
    ],
  };
  const hit = { rollHit: () => ({ hit: true as const, damage: toad.baseDamage }) };
  const missHit = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const landed = resolveSkill({ skill: toad }, state({ modes: clonesOn }), hit);
  const whiff = resolveSkill({ skill: toad }, state({ modes: clonesOn }), missHit);
  const ap = toad.apCost ?? 0;
  const dmg = landed.ok ? landed.damageDealt : 0;
  const shield = landed.ok ? landed.state.marks.find((m) => m.id === 'gamabunta_shield') : undefined;
  return {
    authoring:
      toad.cardRole === CardRole.ATTACK &&
      toad.apCost === 4 &&
      toad.chakraCost === 11 &&
      toad.cooldown === 8 &&
      toad.baseDamage === 25 &&
      toad.modeInteraction === undefined &&
      toad.markEffects?.some(
        (m) =>
          m.id === 'gamabunta_shield' &&
          m.stacks === 35 &&
          m.family === MarkFamily.SHIELD &&
          m.requireHit === true,
      ) === true,
    hitShield:
      landed.ok === true &&
      dmg === 25 &&
      shield?.stacks === 35 &&
      landed.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges === 3,
    miss:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !(whiff.state.marks ?? []).some((m) => m.id === 'gamabunta_shield') &&
      whiff.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges === 3,
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: toad.chakraCost,
      shieldStacks: shield?.stacks ?? 0,
      cloneShield: clone.markEffects?.find((m) => m.id === 'water_clone_shield')?.stacks ?? 0,
      mudShield: wall.markEffects?.find((m) => m.id === 'mud_wall_shield')?.stacks ?? 0,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printSummonGamabuntaProbe(probe: SummonGamabuntaProbe): void {
  const m = probe.metrics;
  console.log('\n── T-107 Summon Gamabunta probe ──');
  console.log(`  authoring ATTACK 25 + Shield 35 no Mode: ${probe.authoring}`);
  console.log(`  hit 25 + shield 35 charges stay:         ${probe.hitShield}`);
  console.log(`  miss no shield / no charge spend:        ${probe.miss}`);
  console.log('  ── balance vs mute 25/AP2/SHIELD 80×3 and Clone 15 / Mud 35 ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 25 / 2 = 12.50)`);
  console.log(`  CP / CD:            ${m.chakraCost} / 8  (unchanged 11 / 8)`);
  console.log(`  live shield:        ${m.shieldStacks}  (was mute 80×3; Clone ${m.cloneShield}; Mud ${m.mudShield})`);
}
