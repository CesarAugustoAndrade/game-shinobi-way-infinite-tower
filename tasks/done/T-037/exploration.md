# T-037 · exploration

**Ring:** R0 Hell Viewing: ATTACK 18 mental + Fear 1 (−20% next enemy action). Reuse ATTACK `markEffects`. Small Fear helper. No Mode.

## Relevant files

- `skills.ts` — `HELL_VIEWING` ADVANCED ACTIVE, no `cardRole`. AP 2 / CP 6 / CD 4 / base 18 MENTAL AUTO. Primary identity: STR −30%×3 `effects[]`.
- `ResolveSkillSystem.ts` — ATTACK plants `markEffects` after hits. `perHit: true` skips plant on miss without IMPACT consume (which would be eaten by the next *player* hit).
- `MarkSystem.ts` — no Fear outgoing helper yet. `consumeOnAttempt` is owner-scoped (player commit) — wrong for “next enemy action.”
- Hidden Lotus `vulnerable` stacks=30 encodes % — Fear stacks=20 same honesty.
- EnemyTurnSystem damage path is live/combat-state, not fixture-friendly.

## Premises

- Complexity: **plant is free** via existing markEffects. Enemy-turn ×0.8 is **not** a small wire into EnemyTurnSystem. Spec allows AC3 as a **pure helper** + test.
- AUTO still uses 0.85 unless `rollHit` injected — tests lock deterministic hit. Do not change global AUTO policy.
- Data: no Mode; STR −30% must go (catalog Fear wins).

## Surprises

- Incomplete authoring today (`resolveSkill` rejects without `cardRole`).
- IMPACT consume would strip Fear on the next player ATTACK — do not tag IMPACT.

## Port / ring

R0: `skills.ts` + `MarkSystem.ts` helper. No React. Live EnemyTurn consume OOS (helper is the contract).
