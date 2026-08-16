# T-008 · plan

**Ring:** R0 · **route:** autonomous · **auto-approved**

## Design

Add exactly 12 SOUL v1 techniques in `skillsCombatV1New.ts` with authored `cardRole`/costs/tags/contracts. Merge into `SKILLS`. None in starters. 5 clan-gated + 7 universal (vendor-eligible via no `requirements.clan` + BASIC/ADVANCED). Mode skill id `sharingan_3`.

## Steps

1. `src/game/constants/skillsCombatV1New.ts` — 12 skills + exported id lists.
2. `skills.ts` — rename object to `SKILLS_CLASSIC`, `export const SKILLS = { ...SKILLS_CLASSIC, ...SKILLS_COMBAT_V1_NEW }`.
3. `index.ts` — clan five on `CLAN_FAVORITE_SKILLS` + `CLAN_LEVEL_SKILL_POOL` (lv 4–5).
4. Tests `src/game/constants/__tests__/t008NewTechniques.test.ts` — AC1/2/3.
5. Tiny catalog probe in `simulate:quick` + CHANGELOG.

## AC map

| AC | Step |
|---|---|
| RING-GUARD | constants only |
| AC1 twelve present | 1–2, 4 |
| AC2 roles costs | 1, 4 |
| AC3 distribution | 1–4 |
