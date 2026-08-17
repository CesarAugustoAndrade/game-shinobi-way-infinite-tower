/**
 * T-094 probe — Suijinheki SUPPORT Shield 40 + +1 elem STAT; no SPIRIT %.
 */

import { CardRole, MarkFamily } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { CombatRange } from '../game/types';

export interface SuijinhekiProbe {
  authoring: boolean;
  shield: boolean;
  honestDef: boolean;
  metrics: {
    shieldAbsorb: number;
    shieldDuration: number;
    elemFlat: number;
    braceAbsorb: number;
    sandAbsorb: number;
    apCost: number;
    chakraCost: number;
  };
}

export function runSuijinhekiProbe(): SuijinhekiProbe {
  const wall = SKILLS.WATER_WALL;
  const brace = SKILLS.BRACE;
  const sand = SKILLS.SAND_SHIELD;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [wall],
    playerBuffs: [],
    enemyHp: 80,
  });
  const result = resolveSkill({ skill: wall }, state());
  const shield = result.ok ? result.state.marks.find((m) => m.id === 'suijinheki_shield') : undefined;
  const elem = result.ok ? result.state.marks.find((m) => m.id === 'suijinheki_elem_def') : undefined;
  const braceAbsorb = brace.markEffects?.find((m) => m.family === MarkFamily.SHIELD)?.stacks ?? 0;
  const sandAbsorb = sand.markEffects?.find((m) => m.family === MarkFamily.SHIELD)?.stacks ?? 0;
  return {
    authoring:
      wall.id === 'suijinheki' &&
      wall.cardRole === CardRole.SUPPORT &&
      wall.apCost === 1 &&
      wall.chakraCost === 6 &&
      wall.cooldown === 4 &&
      wall.baseDamage === 0 &&
      wall.markEffects?.some(
        (m) => m.id === 'suijinheki_shield' && m.stacks === 40 && m.duration === 1,
      ) === true &&
      wall.markEffects?.some(
        (m) => m.id === 'suijinheki_elem_def' && m.stacks === 1 && m.family === MarkFamily.STAT,
      ) === true,
    shield:
      result.ok === true &&
      result.damageDealt === 0 &&
      shield?.stacks === 40 &&
      shield.duration === 1 &&
      shield.family === MarkFamily.SHIELD,
    honestDef: elem?.stacks === 1 && elem.duration === 1 && elem.family === MarkFamily.STAT,
    metrics: {
      shieldAbsorb: shield?.stacks ?? 0,
      shieldDuration: shield?.duration ?? 0,
      elemFlat: elem?.stacks ?? 0,
      braceAbsorb,
      sandAbsorb,
      apCost: wall.apCost ?? 0,
      chakraCost: wall.chakraCost,
    },
  };
}

export function printSuijinhekiProbe(probe: SuijinhekiProbe): void {
  const m = probe.metrics;
  console.log('\n── T-094 Suijinheki probe ──');
  console.log(`  authoring SUPPORT Shield 40 + elem +1: ${probe.authoring}`);
  console.log(`  resolve shield 40/1 no dmg:            ${probe.shield}`);
  console.log(`  honest STAT +1 no SPIRIT %:            ${probe.honestDef}`);
  console.log('  ── balance vs legacy Shield 60×2 + SPIRIT 30% and Brace 20 / Sand 45 ──');
  console.log(`  absorb / duration:  ${m.shieldAbsorb} / ${m.shieldDuration}  (was mute 60×2)`);
  console.log(`  elem flat:          ${m.elemFlat}  (was SPIRIT +30%)`);
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (unchanged 1 / 6)`);
  console.log(`  Brace / Sand:       ${m.braceAbsorb} / ${m.sandAbsorb}`);
}
