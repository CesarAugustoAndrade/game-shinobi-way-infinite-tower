# T-122 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S–M

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `KIRIN` is KINJUTSU AP2/CP27/CD8, base 15, ARMOR_BREAK AUTO, no `cardRole` / Mode / Burn | **true** | `skills.ts:3894–3919` |
| Catalog wants ATTACK 45 LONG AP6/CP27/CD8, hard 3T ON + Burn, consume-all close, Burn on hit only | **true** | spec + `#catalogo` |
| `requireOn` + `consumeAllCharges` closes Mode | **true** | T-112 Tsukuyomi; `validateIntent` + spend at attempt |
| `bindLiveModeId` with `modeId` binds that id only (not family) | **true** | `ResolveSkillSystem.ts:319–321` |
| `requireMarkId` is **soft** (enhance/spend gate, not validate reject) | **true** | Twin Lion / 64 Palms; spend only if `markOk` |
| `consumeAllMatchingMarks` strips enemy mark **after ≥1 hit** | **true** | `ResolveSkillSystem.ts:1218–1248` |
| Hard Burn gate exists | **false** | no `requireMarkHard`; must add opt-in so Twin Lion stays soft |
| KINJUTSU / FINISHER tags | **false** | `SkillTag.UCHIHA` + `LIGHTNING` available |

## Complexity premise

Authoring + one non-breaking `requireMarkHard` on `ModeInteraction` + validate reject `'mark-required'`. No skill-id branch. Spend-all already attempt-time; Burn strip already impact-time.

## Relevant files

- `src/game/types.ts` — `requireMarkHard?`
- `src/game/systems/ResolveSkillSystem.ts` — validate hard mark
- `src/game/constants/skills.ts` — `KIRIN`
- `src/game/systems/__tests__/t112Tsukuyomi.test.ts` — consume-all sibling
- `src/game/systems/__tests__/t022TwinLionFists.test.ts` — soft requireMark (must stay)

## Port signatures

`ModeInteraction.requireMarkHard` optional. Reject reason `'mark-required'`. Stay R0.
