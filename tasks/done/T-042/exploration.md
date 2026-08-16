# T-042 exploration

**Ring:** R0 confirmed. No port-signature change. Route: `autonomous`.

## Terrain

| Path | Role |
|---|---|
| `src/game/constants/skills.ts` ~1607 | `MIND_DESTRUCTION` — AP 2, no `cardRole`, Confusion 3@1.0 via `effects`, no Setup read |
| `src/game/types.ts` | `Skill.modeInteraction` (Mode-gated); `controlConfusion` SUPPORT-only; **no** `setupRead` |
| `src/game/systems/ResolveSkillSystem.ts` ~624–663 | `damageMultBonus` only when `autoModeOn && boundModeId` |
| same ~741–772 | ATTACK hits: mode bucket then `markDamageMultiplier` (off_balance / exposed). No Setup bucket |
| same ~392–407 | `resolveConfusionSupport` — SUPPORT only (`rng() < chance` → enemy CONFUSION buff) |
| `src/game/systems/__tests__/t041FalseSurroundings.test.ts` | Plants `read_mind` duration 2; does not consume |
| `src/game/systems/__tests__/t037HellViewing.test.ts` | ATTACK fixture + `rollHit` port pattern |
| `src/game/systems/__tests__/t022TwinLionFists.test.ts` | Mode+mark +50%; **requires Mode ON** — not reusable as-is |
| `src/simulation/FalseSurroundingsBalance.ts` | Probe pattern to copy |

## Premises (verified)

- **Data:** `read_mind` id is stable on `FALSE_SURROUNDINGS.markEffects` (`skills.ts` ~2529). T-041 OOS named this payoff.
- **Complexity:** Mode `requireMarkId` path is **not** sufficient — it is gated on Mode ON. Need a mark-only Setup read.
- **Confusion on ATTACK:** `skill.effects` is **not** applied by `resolveSkill`. Live `useCombat` / `BattleSimulator` apply `effects` (R1/R3). R0 AC must use a resolve-wired contract (`controlConfusion` on hit) and drop legacy 3@1.0 as primary identity.
- **AUTO:** default `rollHit` is 85%, not always-hit. Tests must use deterministic `rollHit` (T-037 style). Do not change global AUTO policy.

## Ports / reuse

- Reuse `hasEnemyMark`, `resolveConfusionSupport`, `cloneState` mark-map (immutability already).
- Do **not** overload `modeInteraction` (would require Mode or a fake modeId).
- New field: `setupRead?: { markId; damageMultBonus; consume?: boolean }` on `Skill`.

## Re-classify

No. Domain authoring + resolve only. RING stays R0.

## Out of scope (do not touch)

False Surroundings / Transfer / Hell Viewing; `useCombat`; Terrain/Heat; Mode motors; R2 badges.
