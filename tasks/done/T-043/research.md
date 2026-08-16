# T-043 research

In-tree only (T-006/T-023/T-029/T-004).

## Options

1. **Reuse `bandMove` + `intent.movement`** (chosen). Default SELF_APPROACH; tests document `intent.movement`.
2. New `bandChoice` intent field. Rejected: duplicate of existing movement port.
3. Keep SPEED +40% as flicker. Rejected: anti-visión / catalog.

## +1 DEX lock

Under test `rollHit` ports, damage is `baseDamage` only. When `shunshin_dex` is among attempt-spent and `scalingStat === DEXTERITY`, add `scalingPerPoint * 1`. Non-DEX: +1 flat. Consume on Offensive attempt even if miss.

## Consume gate

`consumeOnAttempt` only for ATTACK / SIDE_ATTACK. SUPPORT/MODE leave `shunshin_dex`. Matches “next Offensive”. T-007 SUPPORT plant still works (plant after consume).
