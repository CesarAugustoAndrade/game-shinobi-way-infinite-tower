# T-098 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `BYAKUGAN_SCAN` to SUPPORT AP1/CP3/CD3, `requireOn` Byakugan (no charge spend), STAT `tenketsu_exposed` duration 2 stacks 30 (self), `nextDrawSkillBonuses` +2 on `gentle_fist` / `64_palms` / `twin_lion_fists`. Drop mute ACC +30%. On Hyuga ATTACK hit, apply 30% pen and consume the mark.

## Files

1. `src/game/constants/skills.ts` — `BYAKUGAN_SCAN`.
2. `src/game/systems/ResolveSkillSystem.ts` — Tenketsu pen consume.
3. `src/game/systems/__tests__/t098ByakuganScan.test.ts` — AC1–3.
4. `src/simulation/ByakuganScanBalance.ts` + `index.ts`.
5. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t098ByakuganScan.test.ts`

## Split

Single implementer.

## Out of scope

shadow_possession, fang_over_fang, kawarimi, counter_stance.
