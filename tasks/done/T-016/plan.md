# T-016 · plan

**Ring:** R0 · **auto-approved**

Add `SupportWeightSystem` (`enqueue` / `consume` / `applySupportWeightOnPlay`). Drill → Main +2 (skip if Main empty). Gate Prep → `gate_of_life` + `gate_of_limit` +3. Hook successful `resolveSkill` to enqueue. Tests `t016SupportNextDraw` + sim probe. Do not persist live CombatState bag (R1).

## AC map

| AC | Where |
|---|---|
| AC1 Drill Main +2 one-shot | SupportWeightSystem + effectiveWeight |
| AC2 Gate Prep +3 | applySupportWeightOnPlay |
| AC3 No Main no-op | applySupportWeightOnPlay |
