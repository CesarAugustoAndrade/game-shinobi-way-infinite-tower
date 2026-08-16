# T-074 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none. SUPPORT plant + optional `applyDecoyOutgoing`. Stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `BUNSHIN` unmarked ACTIVE AP1/CP1/CD3, SPEED +0.2×2 | **true** | `skills.ts` 219–237 |
| Smoke/Mist plant + flat cut helpers | **true** | `applySmokeOutgoing` / `applyMistOutgoing` |
| SkillTag.ILLUSION / DEFENSE | **false** | use NINJUTSU + MENTAL + MARK |
| Resolve does not grant Mode charges on SUPPORT plant | **true** | SUPPORT path only markEffects + weights |

## Complexity premise

Spec listed resolve + optional MarkSystem cut. Plant is author-only. Add `applyDecoyOutgoing` sibling (preferred −20). Do not touch `shadow_clone` Mode.

## Layers

R0: `skills.ts` `BUNSHIN`; `MarkSystem.ts` `applyDecoyOutgoing`. Tests + R3 probe.
