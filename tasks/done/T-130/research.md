# T-130 research

In-repo only (expand of T-129/T-064/T-108 patterns). No external library.

## Options

### Lethal save placement
1. **MarkSystem helper** (`applyReanimationLethal`) — same shape as `applySubstitutionIncoming` / Decoy. Guaranteed mark consume. **Recommend.**
2. Fold into `SurvivalSystem.checkLethalDamage` — mixes rng guts with a mark contract; harder to test isolation; would change every live call site. Reject.
3. Pre-step inside `checkLethalDamage` if marks passed — expands Survival signature (still R0 but broader blast). Reject this task.

### Shield 40 on fire
1. **Plant `MarkFamily.SHIELD` stacks 40 duration 99** via `addMark` (Mud Wall). Honest absorb. **Recommend.**
2. Secret `effects[]` SHIELD buff — anti-visión. Reject.
3. Return flag only and let caller plant — extra hop; helper can plant itself since `addMark` is already here.

### ATTACK +1 while armed
1. **`reanimationRoleBonuses(marks)` peek** merged into `supportRoleBonuses` at `effectiveWeight`. Continuous while mark present; gone after consume. **Recommend.**
2. `nextDrawRoleBonus` on the skill — one-shot bag, wrong identity.
3. Mutate `baseWeight` — dishonest, leaks across combat.

### Live wires
- EnemyTurn beside guts: optional (document follow-up). AC does not require it.
- `buildUpkeepWeightContext` mark peek: call sites do **not** currently merge marks; document unless a one-liner is trivial and test-covered via the peek.

## Recommendation

Implement `applyReanimationLethal` + `reanimationRoleBonuses` on MarkSystem. Reauthor `EDO_TENSEI` SUPPORT AP4/CP18/HP30/CD10 Reanimation 3. Tests in `t130EdoTensei.test.ts`. Sim probe vs unused STR/SPD 50%×5. Do not invent SUMMON/DEFENSE/KINJUTSU tags.
