# T-112 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| TSUKUYOMI is legacy AP2 / base 15 TRUE / STUN 1.0×1 effects / no cardRole / no modeInteraction | **true** | `skills.ts:3561–3588` |
| Catalog wants ATTACK AP5/CP13/HP15/CD6 30 mental + Stun 2 + Sharingan consume-all close | **true** | `#catalogo` tsukuyomi |
| `requireOn` + `consumeAllCharges` closes Mode at 0 | **true** | Hidden Lotus T-031; spend at attempt `ResolveSkillSystem.ts:913` |
| `impactStun` hit-gated Stun | **true** | Lightning Ball / Decap; miss = no Stun |
| `DamageType.MENTAL` exists | **true** | `types.ts` — catalog wins over legacy TRUE |
| SkillTag.DOJUTSU / FINISHER | **absent** | use UCHIHA + GENJUTSU + MENTAL |

## Complexity premise

Authoring-only. Reuse T-031 consume-all + T-090 `impactStun`. No ResolveSkill fork. No port change.

## Relevant files

- `src/game/constants/skills.ts` — `TSUKUYOMI`
- `src/game/systems/__tests__/t031HiddenLotus.test.ts` / `t090LightningBall.test.ts`

## Port signatures

None. Stay R0.
