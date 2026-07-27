## 2026-07-22T14:04:50Z
You are Worker Roto Audit Fix for Shinobi Way Region 1 Polish.
Working directory: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\.agents\teamwork_preview_worker_roto_audit_fix

Your task:
Fix the compilation and test non-determinism issues in `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`:

1. Fix line 32 import path:
   - Replace `import { REGIONS } from '../../game/constants';` with `import { LAND_OF_WAVES_CONFIG } from '../../constants/regions';`.
   - Replace any `REGIONS.WAVES_ARC` reference in the test file with `LAND_OF_WAVES_CONFIG`.

2. Fix Area 3 non-deterministic test assertions:
   - In `src/game/systems/__tests__/RotoEmpiricalStress.test.ts`, pass `'BALANCED'` as the 6th argument (`forcedArchetype`) to `generateEnemy()` on lines 236, 239, 253, 254 (e.g. `generateEnemy(..., 'BALANCED')`) so enemy archetype stats are deterministic across test runs.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Verification:
- Run `npx tsc --noEmit` using run_command to ensure zero TypeScript errors.
- Run `npm test` using run_command to ensure 100% of test files pass cleanly.
- Write handoff.md in your working directory and send a message to parent when done.
