# T-141 · review

**Verdict:** APPROVE (auto-approved)

- Allowlist only `suijinheki_elem_def`; `spd_down` / `blinded` / `aim` / `cloaked` → 0. Not folded into T-140 primaries.
- Integer stacks onto `elementalDefenseFlat`. No SPIRIT %. No skill reauthor. Duration stays on TurnClock.
- Live mit: EnemyTurn `defenderDerived` overlay from `actionMarks`. Getters fold when callers pass `marks`. Live `playerStats` is marks-less → no double-count today.
- RING-GUARD: MarkSystem / StatSystem / EnemyTurnSystem have no React/UI imports.
- AC tests PASS (3). Physical finalDamage unchanged. CESAR ×2 → elemental 24→22 (flat +1, not HP Δ === 1).

OOS noted: GameContext playerStats / BattleSimulator still no marks arg.
