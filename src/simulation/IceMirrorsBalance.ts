/**
 * T-104 probe — Ice Mirrors ATTACK 4×4 ANY; 40% Stun 1 if ≥2 hits; no PIERCING/50%.
 */

import { CardRole, CombatRange, EffectType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface IceMirrorsProbe {
  authoring: boolean;
  multiStun: boolean;
  threshold: boolean;
  metrics: {
    twoHitDmg: number;
    fourHitDmg: number;
    apCost: number;
    chakraCost: number;
    rainDmg: number;
    dmgPerApFull: number;
  };
}

export function runIceMirrorsProbe(): IceMirrorsProbe {
  const mirrors = SKILLS.ICE_MIRRORS;
  const rain = SKILLS.SENBON_RAIN;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [mirrors],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const nHits = (land: number) => {
    let n = 0;
    return {
      rollHit: () => {
        n += 1;
        return n <= land
          ? { hit: true as const, damage: mirrors.baseDamage }
          : { hit: false as const, damage: 0 };
      },
    };
  };
  const two = resolveSkill({ skill: mirrors }, state(), { ...nHits(2), rng: () => 0 });
  const one = resolveSkill({ skill: mirrors }, state(), { ...nHits(1), rng: () => 0 });
  const none = resolveSkill({ skill: mirrors }, state(), { ...nHits(0), rng: () => 0 });
  const four = resolveSkill({ skill: mirrors }, state(), { ...nHits(4), rng: () => 0.4 });
  const ap = mirrors.apCost ?? 0;
  const twoDmg = two.ok ? two.damageDealt : 0;
  const fourDmg = four.ok ? four.damageDealt : 0;
  const stunned =
    two.ok === true &&
    (two.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.STUN && b.duration === 1);
  return {
    authoring:
      mirrors.cardRole === CardRole.ATTACK &&
      mirrors.apCost === 3 &&
      mirrors.chakraCost === 7 &&
      mirrors.cooldown === 4 &&
      mirrors.baseDamage === 4 &&
      mirrors.hitCount === 4 &&
      mirrors.impactStun?.chance === 0.4 &&
      mirrors.impactStun.duration === 1 &&
      mirrors.impactStun.minHitsLanded === 2,
    multiStun: two.ok === true && two.damageDealt === 8 && stunned,
    threshold:
      one.ok === true &&
      one.damageDealt === 4 &&
      !(one.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.STUN) &&
      none.ok === true &&
      none.damageDealt === 0 &&
      four.ok === true &&
      four.damageDealt === 16 &&
      !(four.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.STUN),
    metrics: {
      twoHitDmg: twoDmg,
      fourHitDmg: fourDmg,
      apCost: ap,
      chakraCost: mirrors.chakraCost,
      rainDmg: (rain.baseDamage ?? 0) * (rain.hitCount ?? 1),
      dmgPerApFull: ap > 0 ? fourDmg / ap : 0,
    },
  };
}

export function printIceMirrorsProbe(probe: IceMirrorsProbe): void {
  const m = probe.metrics;
  console.log('\n── T-104 Ice Mirrors probe ──');
  console.log(`  authoring ATTACK 4×4 + stun 0.4 minHits 2: ${probe.authoring}`);
  console.log(`  2 hits floor 8 + stun on rng 0:            ${probe.multiStun}`);
  console.log(`  1 hit no stun / 0 miss / 4 hits 16 no stun:${probe.threshold}`);
  console.log('  ── balance vs mute 15/AP2/PIERCING/Stun 50% and Senbon Rain 4×2 ──');
  console.log(`  dmg 2-hit / 4-hit:  ${m.twoHitDmg} / ${m.fourHitDmg}  (was mute 15 / 15)`);
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (was 2 / 7)`);
  console.log(`  dmg/AP full:        ${m.dmgPerApFull.toFixed(2)}  (was 7.50)`);
  console.log(`  Rain sibling:       ${m.rainDmg} dmg SIDE 4×2 no stun`);
}
