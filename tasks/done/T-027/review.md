# T-027 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 ascent:** default `resolveSkill` of `curse_mark_2` while Curse I is ON (charges 2) calls `ascendMode`. Stage II ON, charges 3, I not ON. Pools AP 10→7 / HP 40→27 match T-005 (no double-pay).
- **AC2 lateral:** `sharingan_3` while 2-Tomoe ON (charges 2) calls `lateralSwap`. Charges stay 2; 2-Tomoe COOLDOWN. Pools AP 7 / chakra 14 match T-005.
- **AC3 no downgrade:** higher stage ON + lower MODE → `ok: false`, `mode-family`, clone pools/board. Validate-first, no consume.

## Architecture

- RING-GUARD PASS: touched R0 (`CombatModeSystem.ts`, `ResolveSkillSystem.ts`) has no React/DOM or `components`/`scenes`/`hooks`/`contexts` imports.
- Classifier keys `MODE_FAMILY` (Gate/Curse ascent, Sharingan lateral). Reuses T-005 APIs. No new public port. First-time activate / manual-off unchanged.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: Gate Life→Limit not separately tested (spec allows Curse or Gate). Live Modes panel still not wired (explicitly out of scope).
