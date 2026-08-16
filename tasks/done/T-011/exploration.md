# T-011 · exploration

**Ring:** R0 constants. No React.

- Seven live rows still ship as % toggle/active buffs: `byakugan`, `sharingan_2`, `shadow_clone`, `gate_of_life`, `gate_of_limit`, `curse_mark_1`, `curse_mark_2`.
- T-005 `MODE_DEFINITIONS` already has matching ids, families, charges, and SOUL §8 costs.
- Link field on Skill is `modeInteraction.modeId` (no `modeDefinitionId`). T-008 `sharingan_3` is the pattern.
- Shadow Clone is `ActionType.ACTIVE` today; academy/index still references the same stable id.
