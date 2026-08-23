/**
 * T-148 probe — Skill Config inspector is mounted in Combat (was test-only).
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface SkillConfigMountProbe {
  mounted: boolean;
  propsFromPlayer: boolean;
  combatLocked: boolean;
  metrics: {
    hasImport: boolean;
    hasJsx: boolean;
    hasConfig: boolean;
    hasLock: boolean;
  };
}

export function runSkillConfigMountProbe(): SkillConfigMountProbe {
  const combatSrc = readFileSync(join(process.cwd(), 'src/scenes/combat/Combat.tsx'), 'utf-8');
  const hasImport = /import\s*\{[^}]*SkillConfigInspector[^}]*\}\s*from/.test(combatSrc);
  const hasJsx = combatSrc.includes('<SkillConfigInspector');
  const hasConfig = /config=\{player\.skillConfig/.test(combatSrc);
  const hasLock = /combatLocked=\{true\}/.test(combatSrc);
  return {
    mounted: hasImport && hasJsx,
    propsFromPlayer: hasConfig,
    combatLocked: hasLock,
    metrics: { hasImport, hasJsx, hasConfig, hasLock },
  };
}

export function printSkillConfigMountProbe(probe: SkillConfigMountProbe): void {
  const m = probe.metrics;
  console.log('\n── T-148 Skill Config mount probe ──');
  console.log(`  inspector mounted:     ${probe.mounted}`);
  console.log(`  config from player:    ${probe.propsFromPlayer}`);
  console.log(`  combatLocked true:     ${probe.combatLocked}`);
  console.log('  ── honesty vs invisible inspector ──');
  console.log(`  import/jsx/config/lock: ${m.hasImport}/${m.hasJsx}/${m.hasConfig}/${m.hasLock}  (was 0/0/0/0)`);
  console.log('  ── equilibrium ──');
  console.log('  Read-only combat audit. Weight stays behind one click. No draw-weight change.');
}
