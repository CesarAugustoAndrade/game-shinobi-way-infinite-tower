# T-030 · plan

**Ring:** R0 · **auto-approved**

Add `ModeInteraction.requireFamily`. `bindLiveModeId` returns `modeId` if set, else the ON instance of that family. `requireOn` and auto-spend use the bound id. Author Primary Lotus ATTACK 3×7 AP5/HP15/CD5, GATES `requireFamily` + consume-all + 0.15/charge. Tests `t030PrimaryLotus` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts PRIMARY_LOTUS |
| AC2 reject no Gate | requireOn + family bind |
| AC3 scale + close Life/Limit | Peacock spend/mult path |

## Steps (single implementer)

1. `requireFamily` + bind helper; reauthor Lotus.
2. Tests + `PrimaryLotusBalance` probe.

## Risks

- Do not change Peacock Limit-only `modeId`.
- Do not invent Hidden Lotus Vulnerable.
- Reject Byakugan-only boards.

## Research

Skipped — local expand, T-021 path in-tree.
