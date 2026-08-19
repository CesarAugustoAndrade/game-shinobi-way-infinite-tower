/**
 * T-108 probe — Summon Manda ATTACK 25 C/M; Poison 6×3 on hit; HP 20 at attempt.
 */

import { CardRole, CombatRange, DamageType, EffectType, MarkFamily } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SummonMandaProbe {
  authoring: boolean;
  hit: boolean;
  missPay: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    hpCost: number;
    hpAfterHit: number;
    hpAfterMiss: number;
    poisonStacks: number;
    poisonDur: number;
    fogPoisonTotal: number;
    toadDmgPerAp: number;
    dmgPerAp: number;
  };
}

export function runSummonMandaProbe(): SummonMandaProbe {
  const snake = SKILLS.SUMMON_MANDA;
  const fog = SKILLS.POISON_FOG;
  const toad = SKILLS.SUMMON_GAMABUNTA;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [snake],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: snake.baseDamage }) };
  const missHit = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const landed = resolveSkill({ skill: snake }, state(), hit);
  const whiff = resolveSkill({ skill: snake }, state(), missHit);
  const broke = resolveSkill(
    { skill: snake },
    state({ pools: { ap: 6, chakra: 20, hp: 19, maxHp: 40 } }),
    hit,
  );
  const ap = snake.apCost ?? 0;
  const dmg = landed.ok ? landed.damageDealt : 0;
  const poison = landed.ok ? landed.state.marks.find((m) => m.id === 'poison') : undefined;
  const fogPoison = fog.markEffects?.find((m) => m.id === 'poison');
  const toadAp = toad.apCost ?? 0;
  return {
    authoring:
      snake.cardRole === CardRole.ATTACK &&
      snake.apCost === 4 &&
      snake.chakraCost === 8 &&
      snake.hpCost === 20 &&
      snake.cooldown === 7 &&
      snake.baseDamage === 25 &&
      snake.allowedRanges?.includes(CombatRange.CLOSE) === true &&
      snake.allowedRanges?.includes(CombatRange.MEDIUM) === true &&
      snake.markEffects?.some(
        (m) =>
          m.id === 'poison' &&
          m.stacks === 6 &&
          m.duration === 3 &&
          m.family === MarkFamily.DOT &&
          m.requireHit === true,
      ) === true &&
      snake.effects?.some(
        (e) => e.type === EffectType.POISON && e.value === 15 && e.damageType === DamageType.TRUE,
      ) !== true,
    hit:
      landed.ok === true &&
      dmg === 25 &&
      landed.state.pools.hp === 20 &&
      poison?.stacks === 6 &&
      poison?.duration === 3,
    missPay:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.pools.hp === 20 &&
      !(whiff.state.marks ?? []).some((m) => m.id === 'poison') &&
      broke.ok === false &&
      broke.reason === 'hp' &&
      broke.state.pools.hp === 19,
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: snake.chakraCost,
      hpCost: snake.hpCost ?? 0,
      hpAfterHit: landed.ok ? landed.state.pools.hp : 0,
      hpAfterMiss: whiff.ok ? whiff.state.pools.hp : 0,
      poisonStacks: poison?.stacks ?? 0,
      poisonDur: poison?.duration ?? 0,
      fogPoisonTotal: (fogPoison?.stacks ?? 0) * (fogPoison?.duration ?? 0),
      toadDmgPerAp: toadAp > 0 ? toad.baseDamage / toadAp : 0,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printSummonMandaProbe(probe: SummonMandaProbe): void {
  const m = probe.metrics;
  console.log('\n── T-108 Summon Manda probe ──');
  console.log(`  authoring ATTACK 25 C/M + Poison 6×3 HP20: ${probe.authoring}`);
  console.log(`  hit 25 + HP−20 + Poison 6×3:               ${probe.hit}`);
  console.log(`  miss still HP−20 / no poison / broke HP:   ${probe.missPay}`);
  console.log('  ── balance vs mute 25/AP2/TRUE 15×4 and Fog 6×3 / Toad 25/AP4 ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 25 / 2 = 12.50)`);
  console.log(`  CP / HP / CD:       ${m.chakraCost} / ${m.hpCost} / 7  (HP paid even on miss)`);
  console.log(`  live poison:        ${m.poisonStacks}×${m.poisonDur}  (was mute TRUE 15×4; Fog package ${m.fogPoisonTotal})`);
  console.log(`  toad sibling dmg/AP:${m.toadDmgPerAp.toFixed(2)}  (same 25/4; toad Shield vs snake Poison+HP)`);
}
