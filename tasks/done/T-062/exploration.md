# T-062 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0. Do **not** change `rollHit` to take `forceCrit` (that would reclassify R1).

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `CLOAK_INVIS` is unmarked ACTIVE AP1/CP3/CD4, SPEED +0.6 / DEX +0.5 ×1 | **true** | `skills.ts` 1031–1053: no `cardRole`, no `cloaked` |
| Description promises auto-crit | **true** | same row: “next hit auto-crits” |
| SUPPORT already plants `markEffects` | **true** | `applySkillMarkEffects` on SUPPORT |
| ATTEMPT consume has ATTACK-only filters | **true** | `feint` / `aim` / `guard_break` in `consumeOnAttempt` allow |
| `shunshin_dex` is Offensive-any +1 DEX | **true** | filter `return true`; payoff at ResolveSkillSystem ~954 |
| `StatSystem.forceCrit` exists | **true** | `StatSystem.ts` 606, 744–746 |
| resolveSkill uses `forceCrit` | **false** | default `rollHit` is 85% hit + `baseDamage`; no crit step |
| Catalog next ATTACK only (not SIDE) | **true** | spec AC3 + HTML `#catalogo` |
| `SkillTag.STEALTH` exists | **false** | SkillTag has NINJUTSU/MARK; no STEALTH |
| No test locks SPEED/DEX % identity | **true** | no `cloak_invis` in `__tests__` |

## Ports / reuse

- SUPPORT plant: existing `applySkillMarkEffects` + `targetActor: 'self'`.
- Attempt consume: sibling of `feint` — `if (mark.id === 'cloaked') return role === CardRole.ATTACK`.
- +1 DEX: sibling of `shunshin_dex` but only when `cloaked` spent (ATTACK-only by filter).
- Force crit: **not** StatSystem (no attacker derived on resolve state). Apply `floor(dmg * 1.5)` (`BALANCE.CRIT_DAMAGE_MULT`) after hits land when `cloaked` was spent.

## Complexity premise

Spec said “reuse `forceCrit` + ATTEMPT consume filter like feint.” Consume filter is the real reuse. `forceCrit` lives on StatSystem and is unused by resolve; wiring StatSystem here would need derived stats not on `ResolveSkillState`. Equivalent: dedicated 1.5× after hit, same deterministic ports. Do not change `rollHit` signature.

## Layers

R0: `skills.ts` `CLOAK_INVIS`; `ResolveSkillSystem.ts` ATTACK-only consume + crit/DEX. Tests + R3 probe.

## Relevant files

- `src/game/constants/skills.ts` — `CLOAK_INVIS`.
- `src/game/systems/ResolveSkillSystem.ts` — attempt filter (~759) + `shunshin_dex` payoff (~954).
- `src/game/systems/__tests__/t043Shunshin.test.ts` / `t050FeintStrike.test.ts` — plant / ATTACK-only consume templates.
- `src/game/config.ts` — `CRIT_DAMAGE_MULT: 1.5`.

## Surprises / debt

- No `SkillTag.STEALTH` — use NINJUTSU + MARK.
- SIDE would eat `cloaked` if the allow-filter stays `return true` — must add the ATTACK-only branch (T-033 sibling-path).
- Iaido Cloak +50% Setup is out of scope.
