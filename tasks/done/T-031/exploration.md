# T-031 · exploration

**Ring:** R0 Hidden Lotus: Limit-only finisher (+15%/charge, consume-all, self-Vulnerable). Reuse T-021 Peacock path + T-028 self markEffects. No new port.

## Relevant files

- `skills.ts` — `HIDDEN_LOTUS` FORBIDDEN ACTIVE, no `cardRole`/`modeInteraction`/`hitCount`. TRUE 20 dmg + self-stun flavor; AP 3 / HP 50 / CD 6.
- `ResolveSkillSystem.ts` — `requireOn` + `modeId` already rejects Limit-off. `consumeAllCharges` + `damagePerChargeBonus` already scale and close. `applySkillMarkEffects` plants `targetActor: 'self'` on ATTACK after resolve; non-IMPACT specs apply even if `hitsLanded === 0`.
- `types.ts` — `MarkSpec.targetActor`, `MarkFamily.STAT`. No `vulnerable` mark id in tree.
- `t021MorningPeacock.test.ts` — scale `floor(base * hits * (1+0.15*C))`; Limit-only `modeId`.
- `t028RotationKaiten.test.ts` — self mark plant (`stacks` = percent/amount convention).
- `t030PrimaryLotus.test.ts` — sibling any-GATES; do not retune.

## Premises

- Catalog: hard require **Gate of Limit** (Life-only board must reject). Fixed `modeId: gate_of_limit` is correct — do not use T-030 `requireFamily`.
- Self-Vulnerable is `markEffects` plant; AC does not require enemy +30% taken wiring.
- stacks `30` = +30% taken (Rotation `stacks: 60` = 60% reflect).

## Surprises

- Incomplete authoring today (`resolveSkill` rejects without `cardRole`).
- HP cost 50 — fixtures must have hp ≥ 50 (T-021 used 40).
- Live `useSkill` out of scope.

## Port / ring

No new field. Stays R0. Authoring-only + existing resolve/mark helpers.
