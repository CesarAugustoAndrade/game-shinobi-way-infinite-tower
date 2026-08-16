# T-027 · plan

**Ring:** R0 · **auto-approved**

`classifyFamilyTransition(board, target)`: same-family higher stage → GATES/CURSE ascent, SHARINGAN lateral; stage ≤ current → reject-downgrade. `resolveSkill` default activate and explicit `family-replace` both use it. Family transitions skip skill pre-commit and apply Mode `pools` so T-005 economics hold. Downgrade / failed dry-run reject before commit.

## AC map

| AC | Where |
|---|---|
| AC1 ascent | classify + `ascendMode`; Curse I→II or Gate Life→Limit charges 2+1 |
| AC2 lateral | classify + `lateralSwap`; Sharingan 2→3 charges 2, prior CD |
| AC3 no downgrade | validate reject, clone unchanged |

## Steps (single implementer)

1. Classifier in `CombatModeSystem.ts`. Wire MODE branch + validate-first.
2. Tests `t027ModeFamilyReplace` + sim probe.

## Risks

- Do not treat Sharingan as ascent.
- Do not change first-time activate / T-007 MODE skill-pay.
- Do not invent a third soft upgrade.

## Research

Skipped — local expand, T-005 APIs already in-tree.
