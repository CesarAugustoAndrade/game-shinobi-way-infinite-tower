# T-014 · plan

**Ring:** R0 · **auto-approved**

Extend `ResolveSkillState` with optional `hand` / `playablePool` / `pendingDiscover`. On SUPPORT + `skill.discover`, free source from hand and call `discoverThree`. Export `commitDiscoverChoice`. Tests `t014DiscoverResolve` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 offer | resolveSkill SUPPORT+discover |
| AC2 CD disabled | commitDiscoverChoice |
| AC3 no discover | SUPPORT without discover |
