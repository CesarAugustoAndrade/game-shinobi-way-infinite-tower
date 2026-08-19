# T-122 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `KIRIN` to ATTACK AP6/CP27/CD8, 45, LONG, ELEMENTAL LIGHTNING (drop ARMOR_BREAK), `modeInteraction`: `modeId: sharingan_3`, `requireOn`, `consumeAllCharges`, `requireMarkId: burn`, `requireMarkHard: true`, `consumeAllMatchingMarks: true`.

Add optional `requireMarkHard` on `ModeInteraction`. `validateIntent` rejects `'mark-required'` if hard mark missing (no pool spend). Twin Lion unchanged (no flag).

## Files

1. `src/game/types.ts` — `requireMarkHard?`
2. `src/game/systems/ResolveSkillSystem.ts` — hard mark gate + `'mark-required'`
3. `src/game/constants/skills.ts` — `KIRIN`
4. `src/game/systems/__tests__/t122Kirin.test.ts` — AC1–3
5. `src/simulation/KirinBalance.ts` + `index.ts`
6. `CHANGELOG.md`

## Tests

`npm test -- src/game/systems/__tests__/t122Kirin.test.ts`

## Split

Single implementer.

## Out of scope

c4; kawarimi; edo; copy_jutsu; Amaterasu/Tsukuyomi retune; live UI; SOUL.
