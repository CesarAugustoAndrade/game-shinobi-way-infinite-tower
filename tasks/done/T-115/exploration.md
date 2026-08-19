# T-115 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| SHINRA_TENSEI is legacy AP2 / TRUE 23 / STUN 0.5 effects / no cardRole / no bandMove / no impactStun | **true** | `skills.ts:3907–3932` |
| Catalog wants ATTACK AP4/CP13/CD5 23 ANY + PUSH toward LONG + 70% Stun 1 | **true** | `#catalogo` shinra_tensei |
| PUSH `bandMove` requireHit exists | **true** | T-095 / T-103 `{ kind: 'PUSH', steps: 1, requireHit: true }`; PUSH@LONG no move |
| `impactStun` 0.7×1 exists | **true** | T-097 Adamantine Chains; rng() < 0.7 |
| AUTO defaults to ANY ranges | **true** | `defaultsForAttackMethod(AUTO)` = all bands |
| SkillTag.KINJUTSU / MOVEMENT / CONTROL | **absent** | use NINJUTSU + WIND |

## Complexity premise

Authoring-only. Reuse T-095/T-103 PUSH + T-097 impactStun. No ResolveSkill fork. steps: 1 (sibling default; CLOSE→MEDIUM, MEDIUM→LONG). No port change.

## Relevant files

- `src/game/constants/skills.ts` — `SHINRA_TENSEI`
- `src/game/systems/__tests__/t103WaterVortex.test.ts` / `t095GreatBreakthrough.test.ts` / `t097AdamantineChains.test.ts`

## Port signatures

None. Stay R0.
