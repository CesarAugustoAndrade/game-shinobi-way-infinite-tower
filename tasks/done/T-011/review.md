# T-011 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: seven stable ids are `cardRole: MODE`, `ActionType.TOGGLE`, SOUL §8 AP/activation/upkeep/CD; charges via linked `MODE_DEFINITIONS`.
- AC2: legacy Sharingan 0.3/0.25 and Shadow Clone 0.6/0.4 percent BUFF bodies gone; no SPEED/DEX/STR percent Mode effects remain.
- AC3: `modeInteraction.modeId` matches T-005 ids/families; `sharingan_3` costs/link unchanged and not in the T-011 id list.
- Descriptions state charges/upkeep/identity; Rasengan +4 remains on T-005 `shadow_clone` enhancement (not invented here).

## Architecture

- RING-GUARD PASS: R0 constants + R3 sim probe. No React/DOM. No `src/components|scenes|hooks|contexts`.
- Numbers copied from T-005 / SOUL §8; no retune.

## Quality

- BLOCK: none.
- SHOULD: none required. Battle sim still overtuned; Mode routes are stubs (T-005 out of scope).
- NIT: `SOUL_MODE_SKILL_REAUTHOR` and live `SKILLS` rows are duplicated by hand (reviewable diffs; tests pin both).
