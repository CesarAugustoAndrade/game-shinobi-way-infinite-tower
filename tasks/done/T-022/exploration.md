# T-022 · exploration

**Ring:** R0 Twin Lion Byakugan+CP enhance. Inverts T-021 hard `requireOn` for Lions (SOUL soft-base). No new port.

## Relevant files

- `skillsCombatV1New.ts` — Twin Lion `requireOn: true`, `penetration: 0.3`, `markEffects: chakra_point`. Description already +50% / miss keeps.
- `ResolveSkillSystem.ts` — T-021 `requireOn` rejects if Mode OFF/0 charges. ATTACK does not apply `markEffects` (SUPPORT only). `consumeOnImpact` already runs on ≥1 hit. T-018 `damageMultBonus` applies on Mode ON without a mark gate.
- `MarkSystem.ts` — IMPACT consume only if `hitsLanded ≥ 1`; miss preserves.
- `types.ts` — `ModeInteraction` has `requireOn` / `damageMultBonus`; no mark-gated enhance field.

## Premises

- T-021 generic `requireOn` currently hard-rejects Twin Lion without Byakugan — must drop `requireOn` (invert in place).
- Enhance needs **both** Byakugan ON and enemy `chakra_point`. `damageMultBonus` alone would fire without CP.
- Pen is unused in resolve (no defender % def). Wire StatSystem-style `def * (1-pen)` with default def 0 so AC1 stays 1.5×.
- No Byakugan charge spend (Rotation, not Lions).

## Surprises

- Twin Lion `markEffects` never apply on ATTACK resolve today — still remove for authoring honesty.
- Live `useSkill` still not on this path (out of scope).
