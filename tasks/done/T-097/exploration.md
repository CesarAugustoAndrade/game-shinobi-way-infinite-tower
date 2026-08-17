# T-097 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S–M

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| ADAMANTINE_CHAINS is legacy HIDDEN AP2 + STUN 35% + CHAKRA % | **true** | `skills.ts:1574–1603` |
| Catalog wants ATTACK AP3/CP6/CD4 20 M/L + PULL to CLOSE + 70% Stun 1 + −1 SPD×2 | **true** | `#catalogo` adamantine_chains |
| Multi-step `bandMove.steps` PULL loop exists | **true** | `ResolveSkillSystem` forced-move loop |
| `impactStun` applies on ATTACK hit | **true** | `ResolveSkillSystem.ts:1249–1254` |
| SPD STAT mark plant exists | **true** | T-051 `spd_down` |
| SkillTag.CONTROL available | **false** | UZUMAKI / NINJUTSU / PHYSICAL only |

## Complexity premise

Authoring-only. Reuse T-093 `impactStun` + T-071/T-093 PULL + T-051 STAT mark with `requireHit` (once per card). `steps: 2` covers LONG→CLOSE. No port change.

## Relevant files

- `src/game/constants/skills.ts` — `ADAMANTINE_CHAINS`
- `src/game/systems/__tests__/t093EarthDecapitation.test.ts` / `t051LeafWhirlwind.test.ts`

## Port signatures

None. Stay R0.
