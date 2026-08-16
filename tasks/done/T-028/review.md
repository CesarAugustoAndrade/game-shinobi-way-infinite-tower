# T-028 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 require On:** empty board → `ok: false`, `mode-required`, pools/marks/modes unchanged.
- **AC2 spend + self setup:** Byakugan 4 → 3; `rotation_shield` stacks 50 and `rotation_reflect` stacks 60, both PLAYER/PLAYER. Last charge ends Mode COOLDOWN.
- **AC3 authoring:** SUPPORT + `requireOn` + `consumeCharges: 1` + `modeId: byakugan`. Pure contract is `markEffects`. `effects[]` kept as non-normative packaging so `getCardCategory` still reads SHIELD/REFLECTION as defensive (verify FIX: first gate failed after clearing them).

## Architecture

- RING-GUARD PASS: touched R0 (`skills.ts`, `types.ts`, `ResolveSkillSystem.ts`) has no React/DOM or UI imports.
- `MarkSpec.targetActor` defaults to enemy (T-023/T-026 stable). SUPPORT auto-spend requires `modeId` (Sealing Tag unchanged). No live incoming-damage reflect.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: live SHIELD absorb / reflect % still not wired (explicitly out of scope).
