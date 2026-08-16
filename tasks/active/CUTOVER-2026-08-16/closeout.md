# Closeout — CUTOVER-2026-08-16

After merging worktrees (order: T-083 → T-088 → T-085 → T-084 → T-082 → T-086 → T-087):

```bash
npm run typecheck
npm test -- src/game/systems/__tests__/t083TurnIndex.test.ts src/game/systems/__tests__/t088HitCore.test.ts src/game/systems/__tests__/t085LiveWeights.test.ts src/game/systems/__tests__/t084LiveReactions.test.ts src/game/systems/__tests__/t082LiveCutover.test.ts src/game/systems/__tests__/t086SkillConfigChoke.test.ts src/game/systems/__tests__/t007ResolveSkill.test.ts src/game/systems/__tests__/t012LiveTurnStart.test.ts src/game/systems/__tests__/t013SkillConfigLive.test.ts
npm run lint
npm run build
```

T-087 gate: `Combat.tsx` must import `CombatModesPanel` and `TacticalSetupPanel` + `npm run build`.

RING-GUARD: no `from 'react'` / `src/components` / `src/hooks` / `src/contexts` inside `src/game/systems`.

wave launched: 32-agent cutover T-082–T-088
