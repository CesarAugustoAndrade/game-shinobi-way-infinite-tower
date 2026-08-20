# T-131 research

In-repo only (expand of T-129/T-130 mark helpers + ATTACK plant). No external library.

## Options

### Delayed fire placement
1. **MarkSystem `resolveC4AtEnemyOpportunity`** — T-129/T-130 sibling. AC is the helper. **Recommend.**
2. Fold into generic DoT opportunity tick — C4 is one-shot TRUE, not recurring DoT. Reject (spec).
3. ResolveSkill on-cast delayed timer — no opportunity clock in resolve. Reject.

### Cleanse
1. **`stripC4(marks)` on MarkSystem** — AC3 explicitly allows; Kai/Medical are player-target. **Recommend.**
2. Add `c4` to `basic_medical.cleanseOneOf` — Medical only strips PLAYER marks; C4 is enemy. Would rewrite heal. Reject this task.
3. Rewrite Kai mental taxonomy to include enemy C4. Spec forbids.

### Cast damage
1. `baseDamage: 0` + `scalingPerPoint: 0` so stub and live hit-core deal 0. Plant via markEffects. **Recommend.**
2. Keep base 17 and ignore it — contradicts catalog / AC1.

## Recommendation

Reauthor ATTACK AP5/CP18/CD6, plant enemy `c4` duration 1 stacks 35, helpers `resolveC4AtEnemyOpportunity` + `stripC4`. Live EnemyTurn wire optional (document).
