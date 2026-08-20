/**
 * T-133 probe — Decoy/Mist join live outgoing cuts; vs unused helpers (decorative marks).
 */

import { CombatActor, MarkFamily } from '../game/types';
import { applyOutgoingMarkCuts } from '../game/systems/MarkSystem';
import type { Mark } from '../game/types';

export interface DecoyMistLiveCutsProbe {
  decoy: boolean;
  mist: boolean;
  smoke: boolean;
  dual: boolean;
  metrics: {
    decoyFrom40: number;
    mistFrom40: number;
    smokeFrom40: number;
    emptyFrom40: number;
    dualFrom40: number;
  };
}

function mark(id: string, stacks: number): Mark {
  return {
    id,
    sourceSkillId: id,
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 1,
    stacks,
    family: MarkFamily.STAT,
  };
}

export function runDecoyMistLiveCutsProbe(): DecoyMistLiveCutsProbe {
  const decoy = applyOutgoingMarkCuts(40, [mark('decoy', 20)]);
  const mist = applyOutgoingMarkCuts(40, [mark('mist', 20)]);
  const smoke = applyOutgoingMarkCuts(40, [mark('smoke', 25)]);
  const empty = applyOutgoingMarkCuts(40, []);
  const dual = applyOutgoingMarkCuts(40, [mark('decoy', 20), mark('mist', 20)]);
  return {
    decoy: decoy.damage === 20 && decoy.consumed && !decoy.marks.some((m) => m.id === 'decoy'),
    mist: mist.damage === 20 && mist.consumed && !mist.marks.some((m) => m.id === 'mist'),
    smoke:
      smoke.damage === 15 &&
      empty.damage === 40 &&
      empty.consumed === false,
    dual: dual.damage === 0 && !dual.marks.some((m) => m.id === 'decoy' || m.id === 'mist'),
    metrics: {
      decoyFrom40: decoy.damage,
      mistFrom40: mist.damage,
      smokeFrom40: smoke.damage,
      emptyFrom40: empty.damage,
      dualFrom40: dual.damage,
    },
  };
}

export function printDecoyMistLiveCutsProbe(probe: DecoyMistLiveCutsProbe): void {
  const m = probe.metrics;
  console.log('\n── T-133 Decoy/Mist live cuts probe ──');
  console.log(`  decoy 40→20 strip:              ${probe.decoy}`);
  console.log(`  mist 40→20 strip:               ${probe.mist}`);
  console.log(`  smoke 40→15 + empty passthrough: ${probe.smoke}`);
  console.log(`  dual decoy+mist 40→0:           ${probe.dual}`);
  console.log('  ── balance vs decorative unused helpers ──');
  console.log(`  decoy 40:   ${m.decoyFrom40}  (was 40 live / 20 helper-only)`);
  console.log(`  mist 40:    ${m.mistFrom40}  (was 40 live / 20 helper-only)`);
  console.log(`  smoke 40:   ${m.smokeFrom40}  (was 15, still)`);
  console.log(`  empty 40:   ${m.emptyFrom40}`);
  console.log(`  dual 40:    ${m.dualFrom40}  (20+20 sequential)`);
  console.log('  ── equilibrium ──');
  console.log('  Live first-offensive honesty. Dual-arm 40 flat cut is strong vs one big hit, one-shot. Smoke 25 unchanged. Not a % DR stack.');
}
