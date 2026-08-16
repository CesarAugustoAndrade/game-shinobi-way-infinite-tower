# T-025 · plan

**Ring:** R0 · **auto-approved**

Author Chidori ATTACK + `modeInteraction: { modeId: sharingan_3, consumeCharges: 2, grantRanges: [MEDIUM] }`. `effectiveAllowedRanges` adds grant when Mode ON and charges ≥ consume. `validateIntent` uses that for range. T-018 auto-spend spends 2 at attempt. Tests `t025ChidoriSharingan3` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts CHIDORI |
| AC2 MEDIUM + spend 2 | grantRanges + auto-spend |
| AC3 OFF / 1 charge | range reject; CLOSE no spend |

## Steps (single implementer)

1. Types + Chidori row (`grantRanges`).
2. effective ranges + validateIntent + playability `grantedRanges`.
3. Tests + `ChidoriSharingan3Balance` probe.

## Risks

- Do not grant MEDIUM when charges < 2 (trySpend would fail after a false legal).
- Do not add requireOn (CLOSE base must stay playable).
