# T-069 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** additive `MarkSpec.requireHit` + `markDamageMultiplier` id. Stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `SHURIKEN_BARRAGE` unmarked ACTIVE base 6, no hitCount/ranges/role | **true** | `skills.ts` 680–699 |
| Multi-hit `hitCount` + independent rolls | **true** | Strong Fist / Phoenix |
| `markDamageMultiplier` launched/off_balance/exposed | **true** | ResolveSkillSystem ~397–403 |
| ATTEMPT consume filter is per-id | **true** | feint/aim/launched ATTACK-only |
| `perHit: true` plants stacks × hitsLanded | **true** | applySkillMarkEffects; 3 hits → 3 stacks |
| SkillTag.MULTI_HIT / TOOL / WEAPON | **true** | SkillTag enum |

## Ports / reuse

- Author 3×3 M/L SIDE like Phoenix ranges + Strong Fist hitCount.
- Plant: `barrage_setup` duration 2, ATTEMPT, self, **`requireHit: true`** (new MarkSpec flag) so 0 hits skip and 3 hits still plant **once** (not perHit stacks).
- Payoff: `markDamageMultiplier` ×1.1; consumeOnAttempt only `role === ATTACK`.

## Complexity premise

Spec listed multi-hit + ATTEMPT setup. Both exist. Only add `requireHit` so once-per-card plant does not reuse `perHit` stacking.

## Layers

R0: `types.ts` MarkSpec; `skills.ts` SHURIKEN_BARRAGE; `ResolveSkillSystem.ts` requireHit + multiplier + consume filter. Tests + R3 probe.
