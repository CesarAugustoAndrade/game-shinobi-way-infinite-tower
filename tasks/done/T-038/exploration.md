# T-038 · exploration

**Ring:** R0 Smoke Bomb: SUPPORT Smoke mark (−25 first offensive) + SIDE weight +1 next draw. Extend T-016 bag with role entries. No Terrain.

## Relevant files

- `skills.ts` — `SMOKE_BOMB` BASIC, no `cardRole`. AP 1 / CP 0 / CD 3 / base 0. SPEED +35% / ACC −20% identity.
- `SupportWeightSystem.ts` — skillId-only `PendingSupportWeight`. `applySupportWeightOnPlay` hardcodes drill/gate ids.
- `DeckSystem.effectiveWeight` — `supportBonuses[skill.id]` only. No role term.
- SUPPORT resolve plants `markEffects` and enqueues T-016 bag.
- T-016 tests must stay green (skillId path).
- T-037 `applyFearOutgoing` — sibling helper pattern for −25 smoke.

## Premises

- Complexity: **role bag required**. Enumerating SIDE ids at play time is the discarded path. Confirmed `DeckSystem.ts` 93.
- Data: catalog AP1 CD3 CP —. No Terrain mutation.
- T-016 one-shot: consume clears bag; second consume empty.
- IMPACT consume would be player-hit — use helper `applySmokeOutgoing` like Fear (live EnemyTurn OOS).

## Surprises

- Incomplete authoring (`resolveSkill` rejects without `cardRole`).
- `applySupportWeightOnPlay` takes `{ id }` only — extend for `nextDrawRoleBonus`.

## Port / ring

R0: types + SupportWeightSystem + DeckSystem + skills + MarkSystem helper. No React.
