# T-031 · plan

**Ring:** R0 · **auto-approved**

Reauthor Hidden Lotus as ATTACK 5×6 AP6/HP50/CD6. Peacock `modeInteraction` (`modeId: gate_of_limit`, `requireOn`, consume-all, 0.15/charge). Self `markEffects` `vulnerable` duration 2, `stacks: 30`, `MarkFamily.STAT`, not IMPACT-gated. No resolve fork. Tests `t031HiddenLotus` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts HIDDEN_LOTUS |
| AC2 reject no Limit | existing requireOn + modeId (Life-only fails) |
| AC3 scale + close + self Vulnerable | Peacock spend/mult + applySkillMarkEffects |

## Steps (single implementer)

1. Reauthor `HIDDEN_LOTUS` (physical 5×6; drop TRUE/self-stun identity).
2. Tests + `HiddenLotusBalance` probe.

## Risks

- Do not change Peacock numbers or T-030 `requireFamily`.
- Do not invent Hidden Lotus stun or enemy +30% taken pipeline.
- Life-only board must reject.

## Research

Skipped — local expand, T-021/T-028 path in-tree.
