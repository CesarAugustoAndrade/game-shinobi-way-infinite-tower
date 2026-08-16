# T-010 · verify

| Command | Result |
|---|---|
| RING-GUARD | PASS (R0 `combatSkillViewModel` has no React/DOM/UI imports) |
| typecheck | PASS |
| lint | PASS (after `--unset` BEM fix; first run failed on `.skill-card__action-badge--—`) |
| test | PASS 533/533 (t010CombatUi 3/3) |
| build | PASS |
| budget:dist | PASS |
| `npm run verify` | PASS |
| `npm run simulate:quick` | PASS |

**Honesty probe:** no-source enhanced=true; mode-source enhanced=18 (Byakugan).
