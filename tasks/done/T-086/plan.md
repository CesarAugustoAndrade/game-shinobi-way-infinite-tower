# T-086 · plan

**Ring:** R1 · **auto-approved** (standing loop order)

Activity/treasure already call `applyLearnSkill` / `applyForgetSkill`. Choke the remaining loot `learnSkill` in App through the same adapters. Do not invent a new Skill Config UI.

## Files

1. `src/App.tsx` — loot `learnSkill`: upgrade via `applyLearnSkill`; replace via `applyForgetSkill` + `applyLearnSkill`; learn via `applyLearnSkill`.
2. Keep `t086SkillConfigChoke.test.ts` AC1.
3. `src/simulation/SkillConfigChokeBalance.ts` + `index.ts` — forget-Main realign vs orphan id.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t086SkillConfigChoke.test.ts`

## Out of scope

Skill Config UI. T-082. Campaign boon raw skills (note).
