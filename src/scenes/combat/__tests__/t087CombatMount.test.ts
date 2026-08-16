/**
 * T-087 AC1: Combat.tsx imports and renders Modes + Setup panels.
 * Gate: this file + `npm run build` (spec also names grep).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const combatSrc = readFileSync(join(process.cwd(), 'src/scenes/combat/Combat.tsx'), 'utf-8');
const handSrc = readFileSync(join(process.cwd(), 'src/components/combat/Hand.tsx'), 'utf-8');

describe('T-087 AC1 — Combat mounts Modes + Setup panels', () => {
  it('imports and renders CombatModesPanel and TacticalSetupPanel', () => {
    expect(combatSrc).toMatch(/import\s*\{[^}]*CombatModesPanel[^}]*\}\s*from/);
    expect(combatSrc).toMatch(/import\s*\{[^}]*TacticalSetupPanel[^}]*\}\s*from/);
    expect(combatSrc).toContain('<CombatModesPanel');
    expect(combatSrc).toContain('<TacticalSetupPanel');
  });

  it('passes mainAttackId from player.skillConfig into Hand', () => {
    expect(combatSrc).toMatch(/mainAttackId=\{player\.skillConfig\?\.mainAttackId/);
    expect(handSrc).toContain('mainAttackId');
    expect(handSrc).toMatch(/mainAttackId=\{mainAttackId\}/);
  });

  it('routes toggle playability through canPlaySkill + modeAlreadyOn context', () => {
    expect(combatSrc).toContain('canPlaySkill');
    expect(combatSrc).toContain('buildSkillPlayContext');
    expect(combatSrc).toContain('modeAlreadyOn');
    expect(combatSrc).not.toMatch(/if\s*\(\s*skill\.isActive\s*\)[\s\S]*skillAllowedAt/);
  });
});
