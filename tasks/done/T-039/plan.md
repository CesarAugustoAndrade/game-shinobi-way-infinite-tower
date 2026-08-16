# T-039 · plan

**Ring:** R0 · **auto-approved**

Reauthor Predict as SUPPORT AP1/CP3/CD3. `modeInteraction`: `requireOn` + `requireFamily: SHARINGAN` + `restoreCharges: 1` (no consume). Plant `read_window` duration 1 stacks 30. Add `tryRestoreCharges`. SUPPORT: reject without Sharingan; else plant + restore 1 capped. Tests `t039SharinganPredict` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts |
| AC2 reject OFF | requireOn gate |
| AC3 restore + cap | 1→2; 3→3 + mark |

## Steps (single implementer)

1. `restoreCharges` field + `tryRestoreCharges`.
2. SUPPORT restore wire (no spend).
3. Reauthor Predict + `applyReadWindowOutgoing`.
4. Tests + `SharinganPredictBalance` probe.

## Risks

- Do not spend charges (unlike Rotation).
- Do not overcap or revive COOLDOWN.
- Do not retune Smoke / Chidori.

## Research

Skipped — T-005/T-028/T-038 path in-tree.
