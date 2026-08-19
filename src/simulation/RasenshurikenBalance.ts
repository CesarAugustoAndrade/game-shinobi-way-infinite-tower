/**
 * T-114 probe — Rasenshuriken ATTACK 6×5 M/L; clones +50% consume 2; base viable.
 */

import { CardRole, CombatRange, DamageType, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface RasenshurikenProbe {
  authoring: boolean;
  base: boolean;
  clones: boolean;
  metrics: {
    hitsLanded: number;
    baseDamage: number;
    enhancedDamage: number;
    apCost: number;
    chakraCost: number;
    rasenganDmgPerAp: number;
    dmgPerApBase: number;
    dmgPerApEnhanced: number;
  };
}

export function runRasenshurikenProbe(): RasenshurikenProbe {
  const shuriken = SKILLS.RASENSHURIKEN;
  const rasengan = SKILLS.RASENGAN;
  const baseline = (shuriken.hitCount ?? 1) * shuriken.baseDamage;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 8, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [shuriken],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const clones = (charges: number) => ({
    instances: [
      {
        id: 'shadow_clone',
        family: MODE_FAMILY.CLONES,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: shuriken.baseDamage }) };
  const off = resolveSkill({ skill: shuriken }, state(), hit);
  const on = resolveSkill({ skill: shuriken }, state({ modes: clones(3) }), hit);
  const short = resolveSkill({ skill: shuriken }, state({ modes: clones(1) }), hit);
  const ap = shuriken.apCost ?? 0;
  const baseDmg = off.ok ? off.damageDealt : 0;
  const enhDmg = on.ok ? on.damageDealt : 0;
  return {
    authoring:
      shuriken.cardRole === CardRole.ATTACK &&
      shuriken.apCost === 6 &&
      shuriken.chakraCost === 20 &&
      shuriken.cooldown === 5 &&
      shuriken.hitCount === 6 &&
      shuriken.baseDamage === 5 &&
      shuriken.damageType === DamageType.ELEMENTAL &&
      shuriken.modeInteraction?.modeId === 'shadow_clone' &&
      shuriken.modeInteraction.consumeCharges === 2 &&
      shuriken.modeInteraction.damageMultBonus === 0.5 &&
      shuriken.modeInteraction.requireOn !== true,
    base: off.ok === true && off.hitsLanded === 6 && baseDmg === baseline && off.state.modes.instances.length === 0,
    clones:
      on.ok === true &&
      enhDmg === Math.floor(baseline * 1.5) &&
      on.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges === 1 &&
      short.ok === true &&
      short.damageDealt === baseline &&
      short.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges === 1,
    metrics: {
      hitsLanded: off.ok ? off.hitsLanded : 0,
      baseDamage: baseDmg,
      enhancedDamage: enhDmg,
      apCost: ap,
      chakraCost: shuriken.chakraCost,
      rasenganDmgPerAp: rasengan.apCost ? rasengan.baseDamage / rasengan.apCost : 0,
      dmgPerApBase: ap > 0 ? baseDmg / ap : 0,
      dmgPerApEnhanced: ap > 0 ? enhDmg / ap : 0,
    },
  };
}

export function printRasenshurikenProbe(probe: RasenshurikenProbe): void {
  const m = probe.metrics;
  console.log('\n── T-114 Rasenshuriken probe ──');
  console.log(`  authoring ATTACK 6×5 M/L clones +50% consume 2: ${probe.authoring}`);
  console.log(`  base 6 hits / 30 / no spend:                   ${probe.base}`);
  console.log(`  clones 45 / charges 3→1; 1 charge stays base:  ${probe.clones}`);
  console.log('  ── balance vs mute 15 TRUE/AP2 and Rasengan 15/AP2 consume 1 ──');
  console.log(`  dmg / AP base:      ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerApBase.toFixed(2)}; was 15 / 2 = 7.50)`);
  console.log(`  dmg / AP clones:    ${m.enhancedDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerApEnhanced.toFixed(2)})`);
  console.log(`  CP / CD / hits:     ${m.chakraCost} / 5 / ${m.hitsLanded}`);
  console.log(`  rasengan sibling:   dmg/AP ${m.rasenganDmgPerAp.toFixed(2)} consume 1 CLOSE`);
}
