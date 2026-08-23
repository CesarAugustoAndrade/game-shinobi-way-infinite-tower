/**
 * T-148 AC: Combat.tsx mounts SkillConfigInspector, locked, from player.skillConfig.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const combatSrc = readFileSync(join(process.cwd(), 'src/scenes/combat/Combat.tsx'), 'utf-8');

describe('T-148 mount', () => {
  it('imports and renders SkillConfigInspector', () => {
    expect(combatSrc).toMatch(/import\s*\{[^}]*SkillConfigInspector[^}]*\}\s*from/);
    expect(combatSrc).toContain('<SkillConfigInspector');
  });
});

describe('T-148 props', () => {
  it('passes config derived from player.skillConfig', () => {
    expect(combatSrc).toMatch(/config=\{player\.skillConfig/);
  });
});

describe('T-148 locked', () => {
  it('combat mount uses combatLocked true', () => {
    expect(combatSrc).toMatch(/combatLocked=\{true\}/);
  });
});
