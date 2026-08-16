# T-056 review

**SPEC CONFORMANCE: 96/100.** Explosive Tag is SIDE AP1/CD2, 11 FIRE TOOL at CLOSE/MEDIUM, `bandMove` PUSH 1 `requireHit`. CLOSE hit → 11 + MEDIUM + `playerMoveUsedThisTurn` false; miss → 0 + stay. Air Palm / Blastback still PUSH without `requireHit`.

**ARCHITECTURE: PASS.** Opt-in `BandMoveSpec.requireHit` is the right R0 extension: miss-no-push without retuning T-026. Resolve skips `skillForcedMove` only when `requireHit && hitsLanded < 1`. Touched R0 (`types.ts`, `skills.ts`, `ResolveSkillSystem.ts`) has no React/DOM/`components`/`scenes`/`hooks`/`contexts`. Tests live at `t056ExplosiveTag.test.ts`. Probe hooked after Sweeping Kick.

**QUALITY:**
- NIT: AC tests omit MEDIUM→LONG (probe covers it).
- NIT: authoring test does not assert no Mode/Stun/Bleed (card has none).

**VERDICT: APPROVE**
