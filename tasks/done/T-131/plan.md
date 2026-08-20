# T-131 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `C4_KARURA` to ATTACK AP5/CP18/CD6. Cast deals 0; plant enemy `c4` duration 1 stacks 35. `resolveC4AtEnemyOpportunity` fires 35 TRUE and consumes. `stripC4` removes without firing. Drop instant baseDamage 17. No live EnemyTurn wire (T-074 bar). No Kai/Medical rewrite.

## Files

1. `src/game/constants/skills.ts` — `C4_KARURA` authoring (R0)
2. `src/game/systems/MarkSystem.ts` — `resolveC4AtEnemyOpportunity` + `stripC4` + ids (R0)
3. `src/game/systems/__tests__/t131C4Karura.test.ts` — AC1–3 (R0 tests)
4. `src/simulation/C4KaruraBalance.ts` + `index.ts` — probe (R3)
5. `CHANGELOG.md`

`ResolveSkillSystem` needs no new branch: ATTACK `markEffects` without `requireHit` plants on cast; `baseDamage: 0` → `damageDealt === 0`.

## Authoring

- `cardRole: ATTACK`; AP5/CP18/HP0/CD6; `baseDamage: 0`; `scalingPerPoint: 0` (live hit-core must not sneak instant TRUE).
- Keep `DamageType.TRUE` / EARTH as catalog element; payload lives on the mark, not the roll.
- Tags: `NINJUTSU` + `EARTH` + `MARK`.
- `markEffects`: id `c4`, duration 1, stacks 35, `MarkFamily.STAT` (not recurring DOT), `targetActor: 'enemy'`. No `requireHit`.
- Honest description: C4 1 → 35 TRUE at next enemy opportunity; cleansable; not instant 17.

## Helpers

```
resolveC4AtEnemyOpportunity(marks)
```

- Enemy `c4` present: `{ trueDamage: 35, marks: stripped, fired: true }`.
- Else: `{ trueDamage: 0, fired: false }` (clone marks).

```
stripC4(marks)
```

- Strip enemy `c4` without dealing damage. `{ marks, stripped }`.

## Tests

`npm test -- src/game/systems/__tests__/t131C4Karura.test.ts`

- AC1 authoring — not baseDamage 17
- AC2 plant + `damageDealt === 0` (hit and miss)
- AC3 fire 35 + consume; unarmed 0; strip without fire

## Sim

Probe vs unused instant TRUE 17: AP 2→5; cast dmg 0 vs 17; delayed 35; strip prevents fire. Hook after Edo Tensei.

## Split

Single implementer (R0 file overlap).

## Risks / plan B

1. If plant skipped on 0 hits: drop any accidental `requireHit` (default path plants).
2. Live hit-core scaling: zero `scalingPerPoint`.
3. Live EnemyTurn: document follow-up.

## Out of scope

copy_jutsu; kawarimi/edo; live EnemyTurn rewrite; Kai taxonomy; live UI; SOUL; companion AI.
