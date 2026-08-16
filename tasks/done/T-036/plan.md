# T-036 · plan

**Ring:** R0 · **auto-approved**

Reauthor Mind Transfer as SUPPORT AP2/CP7/CD6, 0 dmg. Add `Skill.controlStun` `{ chance: 0.7, enemyDuration: 2, failSelfDuration: 1 }`. SUPPORT branch calls `resolveControlSupport`: `rng() < 0.7` → enemy STUN 2; else player STUN 1. Never deal HP. Tests `t036MindTransfer` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts + controlStun |
| AC2 success | rng 0 → enemy STUN 2, 0 dmg |
| AC3 fail | rng 0.99 → self STUN 1, 0 dmg |

## Steps (single implementer)

1. Add `ControlStunSpec` on Skill.
2. Helper + SUPPORT wire in ResolveSkillSystem.
3. Reauthor `MIND_TRANSFER`.
4. Tests + `MindTransferBalance` probe (success/fail rates vs unwired legacy).

## Risks

- Do not enter ATTACK hit path.
- Do not implement Hell Viewing / False Surroundings.
- Do not invent resistance tables.

## Research

Skipped — T-007/T-019 path in-tree.
