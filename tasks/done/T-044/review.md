# T-044 · review

**Verdict:** APPROVE

## Spec conformance

- AC1: SUPPORT AP1/CP1/CD3, 0 dmg, SELF_APPROACH×2, `lotus_opening` 2 ATTEMPT self, LOTUS +2, no STR/DEX %.
- AC2: LONG/MEDIUM → CLOSE; flag false; mark duration 2; bag primary/hidden +2, no Peacock.
- AC3: Primary Lotus C=1 24→30 (`floor(*1.25)`); miss consumes; non-GATES keeps mark.

## Architecture

- Reused `bandMove` + T-016 bag via `nextDrawSkillBonuses`.
- ATTEMPT consume skips `lotus_opening` unless GATES finisher. RING-GUARD clean.

## Quality

- BLOCK: none
- NIT: live BattleSimulator still ignores `lotus_opening` (OOS).

Cycles: 0. EnemySystem danger-ratio flake once in full suite; re-run 643/643 green; not in this diff.
