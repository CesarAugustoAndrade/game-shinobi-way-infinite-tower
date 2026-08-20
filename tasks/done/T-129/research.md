# T-129 research

Local expand. No external library.

## Options

1. **New `applySubstitutionIncoming` helper** (mirror `applyDecoyOutgoing`)
   - Pros: same T-074 contract; AC3 is a pure unit; no EnemyTurn rewrite; self-target + full ignore + retreat flag are the only deltas.
   - Cons: live combat still ignores the mark until a later wire (same as decoy).

2. **Fold into `applyOutgoingMarkCuts` / EnemyTurn**
   - Pros: substitution would fire in live fights immediately.
   - Cons: spec forbids inventing a second mit engine; decoy/mist are still off that chain; RING-GUARD-adjacent scope creep.

3. **Keep Shield 30 and add `bandMove: SELF_RETREAT` on cast**
   - Pros: zero new helper.
   - Cons: contradicts catalog (ignore first hit, retreat **on fire**, consume). Retreat-on-cast is T-023 Backstep.

## Recommendation

Option 1. Plant `substitution` self-mark duration 2 via existing `markEffects`. Helper zeros first `damage > 0`, strips, `retreatSteps: 1`, optional PUSH of `range`. Document live EnemyTurn wire as follow-up (T-074 bar).
