/**
 * T-122 probe — Kirin ATTACK 45 LONG; hard Sharingan 3T + Burn; consume-all closes Mode.
 */

import {
  CardRole,
  CombatActor,
  CombatRange,
  DamageProperty,
  MarkFamily,
  ModeRuntimeState,
} from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface KirinProbe {
  authoring: boolean;
  hit: boolean;
  gates: boolean;
  metrics: {
    legacyDmg: number;
    legacyAp: number;
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    tsukuyomiDmg: number;
    dmgPerAp: number;
    dmgPerApLegacy: number;
  };
}

export function runKirinProbe(): KirinProbe {
  const kirin = SKILLS.KIRIN;
  const tsukuyomi = SKILLS.TSUKUYOMI;
  const lions = SKILLS.TWIN_LION_FISTS;
  const burn = {
    id: 'burn',
    sourceSkillId: 'fireball',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks: 5,
    family: MarkFamily.DOT,
  };
  const threeOn = {
    instances: [
      {
        id: 'sharingan_3',
        family: MODE_FAMILY.SHARINGAN,
        charges: 3,
        state: ModeRuntimeState.ON,
      },
    ],
  };
  const twoOn = {
    instances: [
      {
        id: 'sharingan_2',
        family: MODE_FAMILY.SHARINGAN,
        charges: 3,
        state: ModeRuntimeState.ON,
      },
    ],
  };
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 8, chakra: 30, hp: 40, maxHp: 40 },
    range: CombatRange.LONG,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [kirin],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: kirin.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const happy = resolveSkill(
    { skill: kirin },
    state({ modes: threeOn, marks: [burn] }),
    hit,
  );
  const noMode = resolveSkill({ skill: kirin }, state({ marks: [burn] }), hit);
  const twoT = resolveSkill({ skill: kirin }, state({ modes: twoOn, marks: [burn] }), hit);
  const noBurn = resolveSkill({ skill: kirin }, state({ modes: threeOn }), hit);
  const whiff = resolveSkill(
    { skill: kirin },
    state({ modes: threeOn, marks: [burn] }),
    miss,
  );
  const close = resolveSkill(
    { skill: kirin },
    state({ range: CombatRange.CLOSE, modes: threeOn, marks: [burn] }),
    hit,
  );
  const ap = kirin.apCost ?? 0;
  const dmg = happy.ok ? happy.damageDealt : 0;
  return {
    authoring:
      kirin.cardRole === CardRole.ATTACK &&
      kirin.apCost === 6 &&
      kirin.chakraCost === 27 &&
      kirin.cooldown === 8 &&
      kirin.baseDamage === 45 &&
      kirin.damageProperty !== DamageProperty.ARMOR_BREAK &&
      kirin.allowedRanges?.[0] === CombatRange.LONG &&
      kirin.modeInteraction?.modeId === 'sharingan_3' &&
      kirin.modeInteraction.requireOn === true &&
      kirin.modeInteraction.consumeAllCharges === true &&
      kirin.modeInteraction.requireMarkId === 'burn' &&
      kirin.modeInteraction.requireMarkHard === true &&
      kirin.modeInteraction.consumeAllMatchingMarks === true &&
      lions.modeInteraction?.requireMarkHard === undefined,
    hit:
      happy.ok === true &&
      dmg === 45 &&
      !happy.state.marks.some((m) => m.id === 'burn') &&
      happy.state.modes.instances.find((m) => m.id === 'sharingan_3')?.state ===
        ModeRuntimeState.COOLDOWN &&
      close.ok === false,
    gates:
      noMode.ok === false &&
      twoT.ok === false &&
      noBurn.ok === false &&
      noBurn.ok === false &&
      (noBurn.ok ? false : noBurn.reason === 'mark-required') &&
      (noMode.ok ? false : noMode.reason === 'mode-required') &&
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.marks.some((m) => m.id === 'burn') &&
      whiff.state.modes.instances.find((m) => m.id === 'sharingan_3')?.state ===
        ModeRuntimeState.COOLDOWN,
    metrics: {
      legacyDmg: 15,
      legacyAp: 2,
      baseDamage: dmg,
      apCost: ap,
      chakraCost: kirin.chakraCost ?? 0,
      tsukuyomiDmg: tsukuyomi.baseDamage,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
      dmgPerApLegacy: 15 / 2,
    },
  };
}

export function printKirinProbe(probe: KirinProbe): void {
  const m = probe.metrics;
  console.log('\n── T-122 Kirin probe ──');
  console.log(`  authoring ATTACK 45 LONG AP6/CP27 3T+Burn hard: ${probe.authoring}`);
  console.log(`  hit 45 + close 3T + Burn gone; CLOSE reject:   ${probe.hit}`);
  console.log(`  no Mode/2T/Burn reject; miss keeps Burn:       ${probe.gates}`);
  console.log('  ── balance vs mute ARMOR_BREAK 15/AP2 and Tsukuyomi 30 consume-all ──');
  console.log(
    `  package:     ${m.baseDamage} / AP${m.apCost} CP${m.chakraCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was ${m.legacyDmg}/AP${m.legacyAp} = ${m.dmgPerApLegacy.toFixed(2)})`,
  );
  console.log(`  Tsukuyomi sibling: ${m.tsukuyomiDmg} mental consume-all (any Sharingan, no Burn)`);
}
