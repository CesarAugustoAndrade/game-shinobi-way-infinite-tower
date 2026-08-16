# T-007 · plan

**Ring:** R0 · **route:** autonomous · **auto-approved** (standing loop order)

## Design (3–5 lines)

Add `src/game/systems/ResolveSkillSystem.ts`: pure `resolveSkill(intent, state, ports)` that clones state, validates (snapshot, PASSIVE / missing `cardRole`, `getSkillBlockReason`, `isSkillReadyOnTurn`), rejects with deep-equal input state, else commits AP + chakra (FREE_FIRST waives chakra only) + HP + `markSkillUsedOnTurn`, consumes attempt-marks + declared Mode charges, dispatches by authored `cardRole` (MODE → activate port once; SUPPORT → `addMark` without damage; ATTACK/SIDE → `resolveMultiHit`), impact-consume iff `hitsLanded ≥ 1`, then declared PUSH/PULL + `collectRangeReactions`. `SkillResolutionSystem` untouched. Live `useSkill` not rewritten this increment.

## Steps

1. **R0 module** `ResolveSkillSystem.ts` — types (`ResolveSkillIntent/State/Ports/Result`), clone, validate, commit, role dispatch, movement. AC1+AC2+AC3.
2. **Tests** `src/game/systems/__tests__/t007ResolveSkill.test.ts` — describes `T-007 invalid no consume`, `T-007 attempt impact`, `T-007 roles`. Gate: `npm test -- src/game/systems/__tests__/t007ResolveSkill`.
3. **Barrel** re-export `resolveSkill` from `CombatWorkflowSystem.ts` (R0).
4. **R3 probe** `src/simulation/ResolveSkillBalance.ts` + call from `simulate --quick` so commit/miss/reject rates are measurable without wiring BattleSimulator.
5. **CHANGELOG** `[Unreleased]`.

## Split

Single implementer (file overlap if split).

## Risks

- Double-pay Mode activation: after skill commit, Mode port must not deduct `activationCost` again (board-only / test stub).
- Mutating input: always clone; reject returns clone of **original**.
- Inferring SUPPORT from `baseDamage === 0`: forbidden; role from `resolveCardRole` only.

## Out of scope

Catalog reauthor, UI, full `useSkill` cutover, Terrain/Heat card rules, AI parity.

## AC map

| AC | Step |
|---|---|
| RING-GUARD | 1 (systems only) |
| typecheck | all |
| AC1 invalid no consume | 1–2 |
| AC2 attempt vs impact | 1–2 |
| AC3 roles | 1–2 |
