# T-070 verify

**Verdict:** PASS

| Gate | Result |
|---|---|
| RING-GUARD | PASS |
| `npm run typecheck` | PASS |
| `npm test -- t070SenbonRain` | PASS 3/3 |
| T-048 / T-058 / T-069 regression | PASS |
| AC1 authoring | PASS SIDE AP2/CP3/CD3 4×2 M/L + poison 3×2 |
| AC2 poison | PASS 1-hit plants 3/2; miss none; CLOSE reject |
| AC3 once | PASS 4 hits → one mark stacks 3, dmg 8 |
| Senbon Rain probe | PASS authoring/poison/once true |
