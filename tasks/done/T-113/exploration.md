# T-113 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| AMATERASU is legacy AP2 / base 13 PIERCING / BURN 50×5 TRUE effects / no cardRole / no modeInteraction | **true** | `skills.ts:3814–3848` |
| Catalog wants ATTACK AP5/CP13/HP20/CD5 20 + TRUE Burn 8×4 + Sharingan consume 2 | **true** | `#catalogo` amaterasu |
| `requireOn` + `consumeCharges` exist | **true** | T-112 requireOn; Chidori `consumeCharges: 2`; spend at attempt |
| `requireOn` currently only checks charges > 0 | **true** | `ResolveSkillSystem.ts:810–814` — 1 charge would pass then `trySpendCharges` fail after commit |
| Live Burn plant is `markEffects` id `burn` | **true** | T-105 Clone Explosion; `effects[]` BURN is authoring-only (T-032) |
| MarkSpec has no damageType | **true** | TRUE identity via `effects` BURN 8×4 `damageType: TRUE` (replaces 50×5) |
| SkillTag.DOJUTSU | **absent** | use UCHIHA + FIRE + NINJUTSU |

## Complexity premise

Mostly authoring. Tiny `requireOn` gate: reject when `consumeCharges > remaining` so <2 charges consume nothing (spec §2). No new charge API.

## Relevant files

- `src/game/constants/skills.ts` — `AMATERASU`
- `src/game/systems/ResolveSkillSystem.ts` — requireOn charge floor
- `src/game/systems/__tests__/t112Tsukuyomi.test.ts` / `t105CloneExplosion.test.ts`

## Port signatures

None. Stay R0.
