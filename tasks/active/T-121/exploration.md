# T-121 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `TENGAI_SHINSEI` is KINJUTSU AP2/CP27/CD8, TRUE 27, AUTO EARTH, no `cardRole` / ranges / Stun / bandMove | **true** | `skills.ts:3992–4016` |
| Catalog wants ATTACK 35 LONG, AP6/CP27/CD8, Stun 1, force LONG, no Mode | **true** | spec + `#catalogo` |
| `bandMove` PUSH N steps already loops to LONG | **true** | `ResolveSkillSystem.ts:1377–1398`; T-115 steps 1 |
| CLOSE→MEDIUM→LONG needs **2** PUSH steps | **true** | RangeSystem forced move |
| `impactStun` `{ chance, duration }` hit-gated | **true** | `resolveImpactStun`; minHitsLanded default 1 |
| KINJUTSU / FINISHER tags | **false** | `SkillTag.EARTH` + `NINJUTSU` available |
| `forceBand` one-liner | **false** | no set-to-LONG field; multi-step PUSH is the existing surface |

## Complexity premise

Authoring-only. Reuse PUSH steps 2 + `impactStun: { chance: 1, duration: 1 }` `requireHit`. Playable LONG-only. AC3 force from closer bands uses a **range-override fixture** (spec AC2). Miss: Stun and PUSH skipped (`requireHit`).

## Relevant files

- `src/game/constants/skills.ts` — `TENGAI_SHINSEI`
- `src/game/systems/__tests__/t115ShinraTensei.test.ts` — PUSH + Stun sibling

## Port signatures

None. Stay R0.
