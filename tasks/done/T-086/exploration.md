# T-086 exploration

**Ring:** R1 · **Route:** autonomous · **Type:** fix S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| Vendor/loot mutate skills[] and leave Main orphan | **partial** | Activity/treasure already choke. `App.tsx:1527` loot `learnSkill` still writes `skills[]` raw. |
| Events already use the adapter | **true** | `eventEffectHandlers.ts:132` `applyLearnSkill` |
| applyForgetSkill realigns Main | **true** | `SkillConfigLive.ts:97–101` `ensureMainAttack` |
| AC test exists | **true** | `t086SkillConfigChoke.test.ts` |

## Complexity premise

No new R0 API. Remaining work is the loot `learnSkill` caller in App (only loot learner — spec allows App if unique). Campaign boon `skills: [...]` is out of layers (note).

## Port signatures

No port change. Stay R1. RING-GUARD: do not add R0 files.
