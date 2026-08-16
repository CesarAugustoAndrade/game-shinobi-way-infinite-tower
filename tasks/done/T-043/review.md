# T-043 · review

**Verdict:** APPROVE

## Spec conformance

- AC1: SUPPORT AP1/CP4/CD3, 0 dmg, `bandMove` SELF_APPROACH, `shunshin_dex` ATTEMPT self. SPEED +0.4×2 gone.
- AC2: `intent.movement` PULL MEDIUM→CLOSE; flag false; 0 dmg; mark planted. LONG+PUSH stays LONG and still plants.
- AC3: DEX SIDE 10+4=14; mark gone after attempt; miss consumes; SUPPORT does not consume.

## Architecture

- Reused `bandMove` + `resolveForcedMove`. No second range engine.
- ATTEMPT consume gated to ATTACK/SIDE (next Offensive). RING-GUARD clean.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: live BattleSimulator still applies `effects` only — OOS.

Cycles: 0 fix (one test fixture range fix before review).
