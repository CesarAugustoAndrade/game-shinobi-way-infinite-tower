# T-011 · plan

**Ring:** R0 · **auto-approved** (standing loop)

Reauthor exactly the 7 existing Mode-class rows in `skills.ts` to SOUL §8 costs + `cardRole: MODE` + `modeInteraction` → T-005 ids. Delete % SPEED/DEX/STR Mode bodies. Table `SOUL_MODE_SKILL_REAUTHOR` is the AC source. Do not touch `sharingan_3`. Sim probe reports cost match + remaining % Mode buffs.

## Steps

1. `src/game/constants/modeSkillReauthor.ts` — SOUL table + id list.
2. Patch the 7 `SKILLS_CLASSIC` objects in `skills.ts`.
3. Tests `src/game/constants/__tests__/t011ModeSkillsReauthor.test.ts` (AC1/2/3).
4. `src/simulation/ModeSkillsReauthorBalance.ts` + wire into `simulate:quick`.
5. CHANGELOG [Unreleased].

## AC map

| AC | Step |
|---|---|
| RING-GUARD | constants + sim probe only |
| AC1 seven MODE + costs | 1–3 |
| AC2 no % Mode buffs | 2–3 |
| AC3 ModeDefinition link + 3-Tomoe untouched | 2–3 |
