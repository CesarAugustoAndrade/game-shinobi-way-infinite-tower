# T-040 · plan

**Ring:** R0 · **auto-approved**

Reauthor `GATE_PREP` as SUPPORT AP1/HP15/CD5, 0 dmg. Drop WIL % buff. Add `pendingGateHpDiscount` on `ResolveSkillState`. After successful play, enqueue T-016 +3 (already generic) and arm `onGatePrepPlayed()`. Tests `t040GatePrepSupport` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts |
| AC2 arm both | resolve HP−15 + bag +3 + discount armed |
| AC3 reject | HP < 15 → `hp`, nothing armed |

## Steps (single implementer)

1. Reauthor GATE_PREP.
2. State field + clone + SUPPORT arm via GATE_PREP_ID / onGatePrepPlayed.
3. Tests + `GatePrepSupportBalance` probe.

## Risks

- Do not change T-016/T-017 formulas.
- Do not invent Discover 3.
- Do not retune Lotus / Gates.

## Research

Skipped — T-016/T-017 in-tree.
