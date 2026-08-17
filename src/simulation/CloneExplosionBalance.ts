/**
 * T-105 probe — Clone Explosion ATTACK 20 ANY; clones +50% + 1 charge + Burn 5×2.
 */

import { CardRole, CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface CloneExplosionProbe {
  authoring: boolean;
  baseNoMode: boolean;
  clonesEnhance: boolean;
  metrics: {
    baseDamage: number;
    enhancedDamage: number;
    apCost: number;
    chakraCost: number;
    hpCost: number;
    rasenganBase: number;
    rasenganEnhanced: number;
    dmgPerApBase: number;
    dmgPerApEnhanced: number;
  };
}

export function runCloneExplosionProbe(): CloneExplosionProbe {
  const blast = SKILLS.CLONE_EXPLOSION;
  const rasengan = SKILLS.RASENGAN;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 8, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [blast],
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
  const hit = (dmg: number) => ({
    rollHit: () => ({ hit: true as const, damage: dmg }),
  });
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const base = resolveSkill({ skill: blast }, state(), hit(blast.baseDamage));
  const on = resolveSkill({ skill: blast }, state({ modes: clonesOn }), hit(blast.baseDamage));
  const whiff = resolveSkill({ skill: blast }, state({ modes: clonesOn }), miss);
  const rBase = resolveSkill(
    { skill: rasengan },
    state({ skills: [rasengan], range: CombatRange.CLOSE }),
    hit(rasengan.baseDamage),
  );
  const rOn = resolveSkill(
    { skill: rasengan },
    state({ skills: [rasengan], modes: clonesOn, range: CombatRange.CLOSE }),
    hit(rasengan.baseDamage),
  );
  const ap = blast.apCost ?? 0;
  const baseDmg = base.ok ? base.damageDealt : 0;
  const onDmg = on.ok ? on.damageDealt : 0;
  const burn = on.ok ? on.state.marks.find((m) => m.id === 'burn') : undefined;
  return {
    authoring:
      blast.cardRole === CardRole.ATTACK &&
      blast.apCost === 4 &&
      blast.chakraCost === 7 &&
      blast.hpCost === 10 &&
      blast.cooldown === 5 &&
      blast.baseDamage === 20 &&
      blast.modeInteraction?.modeId === 'shadow_clone' &&
      blast.modeInteraction.consumeCharges === 1 &&
      blast.modeInteraction.damageMultBonus === 0.5 &&
      blast.markEffects?.some(
        (m) =>
          m.id === 'burn' &&
          m.stacks === 5 &&
          m.duration === 2 &&
          m.requireModeEnhance === true,
      ) === true,
    baseNoMode:
      base.ok === true &&
      base.damageDealt === 20 &&
      (base.state.marks ?? []).every((m) => m.id !== 'burn'),
    clonesEnhance:
      on.ok === true &&
      on.damageDealt === 30 &&
      on.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges === 2 &&
      burn?.stacks === 5 &&
      burn.duration === 2 &&
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges === 2 &&
      !(whiff.state.marks ?? []).some((m) => m.id === 'burn'),
    metrics: {
      baseDamage: baseDmg,
      enhancedDamage: onDmg,
      apCost: ap,
      chakraCost: blast.chakraCost,
      hpCost: blast.hpCost ?? 0,
      rasenganBase: rBase.ok ? rBase.damageDealt : 0,
      rasenganEnhanced: rOn.ok ? rOn.damageDealt : 0,
      dmgPerApBase: ap > 0 ? baseDmg / ap : 0,
      dmgPerApEnhanced: ap > 0 ? onDmg / ap : 0,
    },
  };
}

export function printCloneExplosionProbe(probe: CloneExplosionProbe): void {
  const m = probe.metrics;
  console.log('\n── T-105 Clone Explosion probe ──');
  console.log(`  authoring ATTACK 20 + clones 0.5 + Burn 5×2: ${probe.authoring}`);
  console.log(`  OFF 20 no burn:                              ${probe.baseNoMode}`);
  console.log(`  ON 30 + charge + burn / miss no burn:        ${probe.clonesEnhance}`);
  console.log('  ── balance vs mute 20/AP2/no Mode and Rasengan clones 15→22 ──');
  console.log(`  dmg base / clones:  ${m.baseDamage} / ${m.enhancedDamage}  (was mute 20 / 20)`);
  console.log(`  AP / CP / HP:       ${m.apCost} / ${m.chakraCost} / ${m.hpCost}  (was 2 / 7 / 10)`);
  console.log(`  dmg/AP base / ON:   ${m.dmgPerApBase.toFixed(2)} / ${m.dmgPerApEnhanced.toFixed(2)}  (was 10.00)`);
  console.log(`  Rasengan sibling:   ${m.rasenganBase} → ${m.rasenganEnhanced} AP2 no Burn`);
}
