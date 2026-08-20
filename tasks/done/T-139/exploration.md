# T-139 · exploration

**Ring:** R0 (confirmed). `resolveHardControlSkips` + `executeEnemyAction` live stun gate. No React/UI. No skill reauthor.

## Spec premises vs code

- **Data:** Tripwire plants `id: 'stun'` `MarkFamily.HARD_CONTROL` targeting ENEMY (`tripwireStunMark`, MarkSystem.ts). Bound is also HARD_CONTROL (`id: 'bound'`, T-128/T-132) and must not skip.
- **Complexity:** Helper already exists (~530) but sums **all** HARD_CONTROL stacks. Live skip is buff-only (`executeEnemyAction` ~304: `EffectType.STUN`). Residual comment: “live skip still reads STUN buffs.” Pattern is T-133–T-137: refine helper + one EnemyTurn call.
- **T-004:** collapse test uses ids `stun-a` / `stun-b`. T-139 allowlist is `id === 'stun'`. Invert T-004 in place to two `id: 'stun'` instances (same collapse, correct ids). Do not delete.
- **Sim/player gates:** `CombatSimulationService` / `skillPlayability` / `BattleSimulator` stun checks have **no marks** on the call site. Do not invent marks plumbing. AC3 is enemy live path only.

## Ports

- `resolveHardControlSkips(setup, target?)` — refine filter + optional target.
- `actorHasHardControlSkip(setup, actor)` — boolean companion.
- `executeEnemyAction` — OR helper with existing buff stun. Same early return / STUNNED log.
