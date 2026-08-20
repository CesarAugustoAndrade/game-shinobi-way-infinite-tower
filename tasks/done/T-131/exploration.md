# T-131 exploration

**Ring:** R0 (no port signature change). Route: autonomous.

## Relevant files

- `src/game/constants/skills.ts` — `C4_KARURA` (~3832): FORBIDDEN ACTIVE AP2/CP18/CD6, `baseDamage: 17`, TRUE, no `cardRole`, no `markEffects`.
- `src/game/systems/ResolveSkillSystem.ts` — ATTACK/SIDE rolls hits then `applySkillMarkEffects(..., hitsLanded)`. Plant without `requireHit` / IMPACT consume applies even on 0 hits. Stub `rollHit` damage is `baseDamage` → 0-dmg ATTACK yields `damageDealt === 0`.
- `src/game/systems/MarkSystem.ts` — one-shot helpers (`applySubstitutionIncoming`, `applyReanimationLethal`). No delayed-opportunity fire yet.
- `src/game/systems/ResolveSkillSystem.ts` `resolveSupportHeal` — `cleanseOneOf` strips **PLAYER** marks only (`basic_medical`: poison/bleed). Cannot list enemy `c4` without rewriting the player-only predicate.
- `supportCleanse` / Kai — player Confusion/Silence + hostile **player** mental marks. Spec: do not rewrite Kai.
- `src/game/types.ts` `SkillTag` — NINJUTSU / EARTH exist. No DELAYED tag.
- `src/game/systems/__tests__/t130EdoTensei.test.ts` / `t129Kawarimi.test.ts` — AC pattern (authoring + plant + helper).
- `src/simulation/EdoTenseiBalance.ts` + `index.ts` — probe hook after Kawarimi/Edo.

## Ports / reuse

- Plant: existing ATTACK `markEffects` with `targetActor: 'enemy'`, **no** `requireHit` (cast plant, not impact).
- Fire: new pure `resolveC4AtEnemyOpportunity(marks)` on MarkSystem.
- Cleanse: Medical/Kai cannot strip enemy C4 as written. Spec allows `stripC4(marks)` in MarkSystem for AC3.
- Do **not** fold C4 into DoT tick (not recurring).

## Local deps

`skills.ts` → types. ResolveSkillSystem → MarkSystem.addMark. Tests import SKILLS, resolveSkill, MarkSystem.

## Existing tests

No `c4_karura` AC. Art manifest id only.

## Surprises / debt

- Live ATTACK hit-core uses `calculateDamage` + `scalingPerPoint` (currently 14). Must zero scaling or live combat deals instant TRUE on top of the plant.
- `applySkillMarkEffects` default (no requireHit) plants on miss — matches delayed plant-on-cast.
- Live EnemyTurn opportunity start has no C4 hook (T-074 optional bar).
- Last ACTIVE without `cardRole` after this: `copy_jutsu` (OOS).

**RE-CLASSIFY:** no. Stays R0.
