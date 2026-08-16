# T-001 · review

**Verdict:** APPROVE  
**Ring:** R0 · **Route:** autonomous  
**Reviewed:** worktree `.worktrees/T-001` impl (types + `CardContractSystem` + AC tests)

## Objective AC

| AC | Result |
|---|---|
| RING-GUARD | PASS — `CardContractSystem.ts` imports only `../types`. `types.ts` change is additive enums/interfaces + optional `Skill` fields. No React/DOM or `src/components\|scenes\|hooks\|contexts`. |
| typecheck | PASS — `tsc --noEmit` in worktree |
| AC1 taxonomy | PASS — `t001CardContracts.test.ts` pins enum members + Mode/Mark/SkillConfig fixtures |
| AC2 no damage inference | PASS — case `T-001 cardRole not inferred from damage`; high vs low `baseDamage` without `cardRole` both `incomplete-authoring` |
| AC3 Main invariants | PASS — empty Main + rng pick + notify; never empty when ATTACK exists; `withAddedSkill` keeps Main |

## Design

- `Skill.cardRole` optional — catalog compiles (risk #1 avoided).
- No `getCardCategory` fallback (risk #3 avoided).
- Helper named `defaultBaseWeight` (risk #2 avoided).
- Injected `rng`; immutable `{ ...config }` copies.

## Out of scope (not implemented — correct)

DeckSystem, catalog authoring, Mode/Mark runtime, UI, `getCardCategory` behavior.

## Cycles

0 FIX cycles.
