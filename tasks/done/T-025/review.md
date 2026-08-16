# T-025 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 authoring:** `chidori` is `cardRole: ATTACK` with `modeInteraction: { modeId: 'sharingan_3', consumeCharges: 2, grantRanges: [MEDIUM] }` (`skills.ts`). Description states 2-charge + MEDIUM only while 3-Tomoe is ON. No invented damage %.
- **AC2 Mode ON MEDIUM + spend 2:** `modeGrantedRanges` adds MEDIUM only when ON charges ≥ 2. `validateIntent` passes `grantedRanges` into `getSkillBlockReason`. Existing T-018 ATTACK auto-spend spends `consumeCharges` (2) at attempt. Test: 3 → 1 remaining.
- **AC3 OFF / short / CLOSE:** OFF or 1 charge at MEDIUM → `range` reject, no charge mutation. CLOSE + empty board resolves without Mode spend.

## Architecture

- RING-GUARD PASS: touched R0 (`skills.ts`, `types.ts`, `RangeSystem.ts`, `ResolveSkillSystem.ts`, `skillPlayability.ts`) has no React/DOM or `components`/`scenes`/`hooks`/`contexts` imports.
- Reuses T-018 `trySpendCharges` auto-spend. No new port. Live `useSkill` not cut over (out of scope).

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: AC tests compare `cardRole` to the string `'ATTACK'` rather than `CardRole.ATTACK`. Live callers still omit `grantedRanges` (explicitly out of scope).
