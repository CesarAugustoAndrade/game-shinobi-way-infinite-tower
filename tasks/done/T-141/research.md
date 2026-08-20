# T-141 · research

SOUL §9: honest integer defense, never secret %. Catalog `#catalogo` suijinheki = Shield 40 + **+1 elemental defense** until next enemy response. T-094 removed SPIRIT % and deferred this hook. T-140 explicitly OOS’d `suijinheki_elem_def` as non-primary.

**Options**

1. **Allowlisted stacks helper + fold into getters’ `elementalDefenseFlat` + EnemyTurn defenderDerived overlay** (recommended). Same units as existing flat def. One helper; two call sites that do not double-count because live `playerStats` omits marks. Duration stays on TurnClock.
2. Fold only in `calculateDamage` via new `marks?` arg — signature churn across every combat caller; physical/true paths must ignore it. Worse than derived overlay.
3. Stuff into T-140 `STAT_MARK_PRIMARY` as a fake primary — wrong axis (derived flat, not SPEED/ACC/STR). Rejected by spec.

**Recommendation:** option 1. Tiny allowlist (`suijinheki_elem_def` only). Integer stacks. Ignore `spd_down` / `aim` / `cloaked`. No skill reauthor. Shield absorb remains T-135.

OOS: R2 HUD, T-135 absorb, T-140 primaries, COOLDOWN_RESET, SPIRIT %.
