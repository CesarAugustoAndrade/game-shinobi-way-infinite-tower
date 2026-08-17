# T-101 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S–M

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| SAND_BURIAL is legacy AP2 / base 15 / no cardRole / low-HP execute copy | **true** | `skills.ts:2445–2470` |
| Catalog wants ATTACK AP3/CP6/CD3 18 M/L +50% vs Coffined/Stunned; consume Coffined only | **true** | `#catalogo` sand_burial |
| T-100 plants enemy mark id `coffined` | **true** | `SAND_COFFIN` markEffects (merged) |
| `setupRead` multiplies on markId only; consume strips that mark only | **true** | `ResolveSkillSystem` ~1018–1020, ~1218–1225 |
| Stun is `enemyBuffs` `EffectType.STUN`, not a mark | **true** | `stunControlBuff` |
| `SetupReadSpec` has no stun-or clause | **true** | `types.ts` |

## Complexity premise

Mark-only `setupRead` does **not** cover Stunned-without-Coffined. Minimal extension: `alsoIfEnemyStunned?: boolean` on `SetupReadSpec` + OR in existing setupMult **and** the stub `!useHitCore` sibling (T-033: preMits vs catalog rollHit). Consume path already Coffined-only (markId filter). Do not fork a second Setup pipeline. No port change.

## Relevant files

- `src/game/types.ts` — `SetupReadSpec`
- `src/game/systems/ResolveSkillSystem.ts` — setupMult / consume
- `src/game/constants/skills.ts` — `SAND_BURIAL`
- `src/game/systems/__tests__/t042MindDestruction.test.ts` / `t100SandCoffin.test.ts`

## Port signatures

None. Stay R0. Optional field on existing spec only.
