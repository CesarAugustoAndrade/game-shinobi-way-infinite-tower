# T-036 · exploration

**Ring:** R0 Mind Transfer: SUPPORT 70% Stun 2 / fail self-Stun 1. New SUPPORT control helper. No Mode.

## Relevant files

- `skills.ts` — `MIND_TRANSFER` ADVANCED, no `cardRole`. AP 2 / CP 7 / CD 6 / base 0. `effects` Stun 2 @0.7. Description already “Miss = self stun.”
- `ResolveSkillSystem.ts` SUPPORT (~656–663): marks / sealing xor / discover only. No stun success/fail.
- `Buff` + `EffectType.STUN` already skip turns (EnemyTurn/PlayerTurn tests).
- T-019 Sealing Tag — sibling SUPPORT that writes `enemyBuffs`. Mirror buff shape.

## Premises

- Complexity: **new SUPPORT branch helper required**. Existing ATTACK hit path must not run (0 dmg, no on-hit). Confirmed SUPPORT does not apply `effects[]`.
- Catalog “contra resistencia” = single `ports.rng() < 0.7` (spec: do not invent Calmness tables).
- AUTO + omitted `allowedRanges` = any band.
- Data premise: no Mode required; clan Yamanaka stays.

## Surprises

- Incomplete authoring today (`resolveSkill` rejects without `cardRole`).
- `effects[]` is packaging honesty; resolve must use an explicit `controlStun` contract so other SUPPORT effects are not auto-rolled.

## Port / ring

R0: `types.ts` (`controlStun`) + `ResolveSkillSystem.ts` + `skills.ts`. No React.
