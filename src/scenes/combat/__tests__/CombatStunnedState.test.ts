import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('TASK-R12: Stunned Player Turn Banner & Action Button', () => {
  const tsxPath = join(process.cwd(), 'src/scenes/combat/Combat.tsx');
  const cssPath = join(process.cwd(), 'src/scenes/combat/Combat.css');

  it('Combat.tsx detects STUN status effect and presents explicit banner and action button', () => {
    const tsxContent = readFileSync(tsxPath, 'utf-8');
    expect(tsxContent).toContain('EffectType.STUN');
    expect(tsxContent).toContain('combat-stunned-banner');
    expect(tsxContent).toContain('combat-stunned-banner__action-btn');
    expect(tsxContent).toContain('STUNNED - PASS TURN');
    expect(tsxContent).toContain('combat__pass-btn--stunned');
  });

  it('Combat.css defines retro styling for stunned banner and pulsating action button', () => {
    const cssContent = readFileSync(cssPath, 'utf-8');
    expect(cssContent).toContain('.combat-stunned-banner');
    expect(cssContent).toContain('.combat-stunned-banner__action-btn');
    expect(cssContent).toContain('.combat__pass-btn--stunned');
    expect(cssContent).toContain('@keyframes combat-stunned-pulse');
  });
});
