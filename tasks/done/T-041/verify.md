# T-041 · verify

| Command | Result |
|---|---|
| RING-GUARD | PASS (R0 types + SupportWeightSystem + DeckSystem + ResolveSkillSystem + skills; no React) |
| typecheck | PASS |
| lint | PASS |
| test | PASS 634/634 (t041 3/3; t016/t036/t038 still green) |
| build | PASS |
| budget:dist | PASS |
| `npm run verify` | PASS |
| `npm run simulate:quick` | PASS |

**False Surroundings probe:** authoring, confuse + Read Mind, MENTAL ATTACK +1 — all true.
**Balance vs unwired Confusion 3 @80%:** AP 2 / CP 8 unchanged; chance 0.75 (was 0.8 / 3t); MENTAL ATTACK Δ +1 (was 0). Live WR still ceilinged (Yamanaka/Mind Controller 100%; TTK ~1.5–1.9). Live draw does not pass `supportMentalAttackBonus` (OOS).
