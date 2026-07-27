# Execution Plan — Production Quality & Stability Polish

## Objective
Ensure 100% test pass (`npm test`), 0 TypeScript errors (`npx tsc --noEmit`), clean production build (`npm run build`), clean CSS lint (`npm run lint:css`), and error-free simulation runs (`npm run simulate:quick`, `npm run simulate:progression:quick`, `npm run simulate:campaign:quick`).

## Milestones & Phases

### Phase 1: Diagnostic Exploration (Parallel Explorers)
- **Explorer 1 (Tests & TSC)**: Run `npm test` and `npx tsc --noEmit`, log every single failing test and compiler error with file path, line number, and root cause analysis.
- **Explorer 2 (Build & CSS Lint)**: Run `npm run build` and `npm run lint:css`, log any Vite/bundler build issues and CSS lint warnings/errors.
- **Explorer 3 (Simulations)**: Run `npm run simulate:quick`, `npm run simulate:progression:quick`, and `npm run simulate:campaign:quick`, log any unhandled exceptions, runtime crashes, stack traces, or state desyncs.

### Phase 2: Backlog & Task Breakdown
- Synthesize all findings into prioritized tasks.
- Categorize by module/area: Type safety / unit tests / simulation engine / CSS linting / build configuration.

### Phase 3: Implementation Waves (Workers)
- Dispatch specialized Workers to fix identified root causes cleanly without altering intended business logic.
- Each Worker verifies their changes by running relevant test/tsc/build/sim commands and reporting handoffs.

### Phase 4: Independent Review & Forensic Integrity Audit
- Dispatch Reviewers and Challengers to verify fix quality, test integrity, and edge case coverage.
- Dispatch Forensic Auditor to run integrity checks (verifying no hardcoded test shortcuts or dummy implementations).

### Phase 5: Final Verification & Victory Reporting
- Re-run all 5 verification commands in a clean final verification pass.
- Deliver comprehensive handoff and victory message to Parent.
