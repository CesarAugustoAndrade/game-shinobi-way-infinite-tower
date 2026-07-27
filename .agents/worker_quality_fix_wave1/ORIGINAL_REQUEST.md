## 2026-07-23T11:00:03Z
You are a Worker subagent for Shinobi Way: The Infinite Tower.

Working Directory: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\worker_quality_fix_wave1

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your assigned tasks:

1. **Fix Test Selector in `src/game/systems/__tests__/RotoChallenger2Empirical.test.ts`**:
   - Line 258: Update `getZIndex('cinematic__enemy-sprite')` to `getZIndex('cinematic__enemy-stage')`.

2. **Fix 13 CSS Lint Errors across 8 CSS files**:
   - `src/components/combat/FloatingText.css:29:3`: Remove invalid non-standard property `font-smooth: antialiased;`.
   - `src/components/combat/SkillCard.css:289:1`: Remove or merge duplicate selector `.skill-card--toggle.skill-card--active` (first defined at line 72).
   - `src/components/inventory/inventory.css:119:1`: Remove or merge duplicate selector `.bag__slot` (first defined at line 37).
   - `src/scenes/combat/Combat.css:1474:10`: Convert `#ffffff` to 3-digit hex `#fff`.
   - `src/scenes/menu/Interlude.css:187:1`: Remove or merge duplicate selector `.interlude__boon-top` (first defined at line 128).
   - `src/scenes/menu/Victory.css:68:3`: Remove duplicate `padding` declaration within the rule block.
   - `src/scenes/rewards/ScrollDiscovery.css:209:1`: Remove or merge duplicate selector `.scroll-card` (first defined at line 80).
   - `src/scenes/rewards/treasure.css:927:1`: Remove or merge duplicate selector `.treasure-scene__body` (first defined at line 124).
   - `src/styles/design-system/_variables.css:277-286`: Remove duplicate custom property declarations (`--sw-abyss`, `--sw-bone`, `--sw-rust`, `--sw-rust-light`, `--sw-rust-glow`) inside `:root`.

3. **Full Verification Execution**:
   After applying the fixes, run all 5 verification commands from project root `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower`:
   - `npm test`
   - `npx tsc --noEmit`
   - `npm run build`
   - `npm run lint:css`
   - `npm run simulate:quick`
   - `npm run simulate:progression:quick`
   - `npm run simulate:campaign:quick`

4. **Write Handoff Report**:
   Save complete handoff report with exact command results to `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\worker_quality_fix_wave1\handoff.md`. Send a summary message to orchestrator upon completion.
