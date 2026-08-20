# T-129 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `KAWARIMI` to SUPPORT AP1/CP3/CD4. Plant self `substitution` duration 2. `applySubstitutionIncoming` zeros first enemy hit (`damage > 0`), strips the mark, signals `retreatSteps: 1` (PUSH toward LONG). Drop Shield 30 + SPEED 0.3 + Defensive stance. No live EnemyTurn mit rewrite (T-074 bar).

## Files

1. `src/game/constants/skills.ts` — `KAWARIMI` authoring (R0)
2. `src/game/systems/MarkSystem.ts` — `applySubstitutionIncoming` + `SUBSTITUTION_MARK_ID` (R0)
3. `src/game/systems/__tests__/t129Kawarimi.test.ts` — AC1–3 (R0 tests)
4. `src/simulation/KawarimiBalance.ts` + `index.ts` — probe (R3)
5. `CHANGELOG.md`

`ResolveSkillSystem` needs no new branch if `markEffects` + `targetActor: 'self'` already plant (they do).

## Authoring

- `cardRole: SUPPORT`; AP1/CP3/CD4; `baseDamage: 0`; `hpCost: 0`.
- Tags: `NINJUTSU` + `MARK` (DEFENSE/MOVEMENT tags do not exist).
- `markEffects`: id `substitution`, duration 2, stacks 1, `MarkFamily.STAT`, `targetActor: 'self'`.
- Remove `effects` SHIELD 30 / SPEED 0.3; remove `stanceShift` / `stanceBonus`.
- Honest description: Substitution 2 ignores first enemy hit, retreats one band, consumes.

## Helper

```
applySubstitutionIncoming(damage, marks, range?)
```

- Armed + `damage > 0`: `{ damage: 0, marks: stripped, consumed: true, retreatSteps: 1, range: PUSH(range) if given }`.
- Else passthrough; `retreatSteps: 0`; do not consume on `damage <= 0`.
- Mark match: `id === 'substitution' && target === PLAYER`.
- Do **not** add to `applyOutgoingMarkCuts`.

## Tests

`npm test -- src/game/systems/__tests__/t129Kawarimi.test.ts`

- AC1 authoring — step 1
- AC2 plant (`resolveSkill` SUPPORT, duration 2, `damageDealt === 0`) — existing plant path
- AC3 helper ignore + strip + retreatSteps 1; without mark damage unchanged — step 2

## Sim

Probe: authoring; plant; 40→0; retreat MEDIUM→LONG; leftover Shield/SPEED 0 vs unused Shield 30 + SPEED 30%. Hook after Shadow Possession.

## Split

Single implementer (R0 files overlap).

## Risks / plan B

1. If `applySkillMarkEffects` skipped SUPPORT somehow: add one plant call — but bunshin/counter already plant this way.
2. `damage === 0` must not consume (first **hit**). Assert in AC3.
3. PUSH@LONG: `retreatSteps` still 1; range unchanged (forced-move boundary).

## Out of scope

Live EnemyTurn/PlayerTurn mit rewrite; edo/c4/copy; PASSIVE reauthors; live UI; SOUL; DEFENSE/MOVEMENT tag enum; Shield leftover as honesty path.
