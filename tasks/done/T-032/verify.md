# T-032 · verify

| Command | Result |
|---|---|
| RING-GUARD | PASS (R0 skills.ts only; no React/UI) |
| typecheck | PASS |
| lint | PASS |
| test | PASS 605/605 (t032Fireball 4/4) |
| build | PASS |
| budget:dist | PASS |
| `npm run verify` | PASS (worktree `.worktrees/T-032`; typecheck+lint+test+build+budget) |
| `npm run simulate:quick` | PASS |

**Fireball probe:** authoring 17 + 2T, base no Mode, 2T +50% + 1 charge — all true.
**Balance vs legacy 15/AP2/Burn 15×3@80%:** base 17 (was 15); 2T enhanced 25 (was none); AP 3 (was 2); burn package 10 (was expected 36); dmg/AP 5.67 base / 8.33 enhanced (was 7.50).
**Live WR:** 100% all presets (unchanged vs T-031).
