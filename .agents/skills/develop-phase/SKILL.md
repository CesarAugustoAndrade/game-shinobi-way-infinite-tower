---
name: develop-phase
description: |
  Phase-based iterative development workflow for implementing project phases. Use when user invokes:
  - `/develop-phase X.Y` - Full development loop for a phase
  - `/research-phase X.Y` - Research only (Step 1)
  - `/plan-phase X.Y` - Research + Plan with compatibility check (Steps 1-2.5)
  - `/compat-check X.Y` - Compatibility check only (Step 2.5)
  - `/review-phase X.Y` - Review current implementation (Step 4)
  - `/gap-check X.Y` - Check completion status (Step 5)
  - `/polish-phase X.Y` - Polish and finalize (Steps 8-9)
---

# Phase Development Workflow

Execute iterative development loops for project phases.

## Commands

| Command | Steps |
|---------|-------|
| `/develop-phase X.Y` | Full loop (1-9) |
| `/research-phase X.Y` | Step 1 only |
| `/plan-phase X.Y` | Steps 1-2.5 |
| `/compat-check X.Y` | Step 2.5 only |
| `/review-phase X.Y` | Step 4 only |
| `/gap-check X.Y` | Step 5 only |
| `/polish-phase X.Y` | Steps 8-9 |

## The Loop

```
1. RESEARCH → 2. PLAN → 2.5 COMPAT CHECK → [ASK USER if conflicts]
                                    ↓
3. IMPLEMENT → 4. REVIEW → 5. GAP ANALYSIS
                                    ↓
              [gaps?] → 6. PLAN COMPLETION → 7. IMPLEMENT → back to 4
                 ↓ no gaps
              8. POLISH → 9. VERIFY COMPLETE
```

## Step Details

### STEP 1: RESEARCH
Read phase spec, scan codebase, document what IS/IS NOT implemented.

Output:
```markdown
## Research Report: Phase [X.Y]
### Specification Requirements:
- [List requirements]
### Currently Implemented:
- ✅ [Feature] - Location: [file]
### Not Yet Implemented:
- ❌ [Feature] - Notes
### Dependencies:
- [Blockers/prerequisites]
```

### STEP 2: PLAN
Break down tasks, order by dependency, identify files to modify.

Output:
```markdown
## Implementation Plan: Phase [X.Y]
### Tasks (in order):
1. [ ] [Task] - [S/M/L] - [files]
### Approach:
[Strategy description]
```

### STEP 2.5: COMPAT CHECK (BLOCKING)
Check for: architecture conflicts, breaking API changes, dependency conflicts, data structure mismatches, pattern conflicts.

**If ANY incompatibility found → STOP and present options:**

```markdown
## ⚠️ INCOMPATIBILITY DETECTED: Phase [X.Y]
### Conflict: [description]
### Affected: [file, current vs required]
### Options:
**A: Refactor existing** - Effort: [S/M/L], Risk: [L/M/H]
**B: Adapt new impl** - Effort: [S/M/L], Trade-offs: [what]
**C: Hybrid** - [description]
**D: Defer phase** - Prerequisites: [what first]

❓ **Which approach?**
```

**DO NOT PROCEED until user responds.**

### STEP 3: IMPLEMENT
Execute tasks in order. Focus on WORKING code first. Leave `// TODO:` for improvements.

### STEP 4: REVIEW
Test implementation, check against requirements, identify bugs/issues.

Output:
```markdown
## Review: Phase [X.Y] - Pass [N]
### Working: ✅ [features]
### Issues: 🐛 [bugs] ⚠️ [concerns]
### Edge Cases: [handled/not]
```

### STEP 5: GAP ANALYSIS
Compare to spec, list missing items.

- **Gaps exist** → Step 6
- **No gaps** → Step 8

Output:
```markdown
## Gap Analysis: Phase [X.Y]
### Missing: [ ] [items]
### Status: [INCOMPLETE/COMPLETE]
```

### STEP 6: COMPLETION PLAN
List remaining tasks, prioritize, plan bug fixes.

### STEP 7: IMPLEMENT REMAINING
Execute remaining tasks, fix bugs. **LOOP BACK TO STEP 4.**

### STEP 8: POLISH
Refactor, improve comments, optimize, ensure consistent style, remove debug code.

### STEP 9: VERIFY
Confirm ALL requirements met, final review, mark complete.

Output:
```markdown
## ✅ PHASE [X.Y] COMPLETE
### All Requirements Met:
- ✅ [requirement]
### Files Modified:
- [files]
### Ready for: Phase [X.Y+1]
```

## Rules
- Track loop iterations (Pass 1, 2, etc.)
- Max 5 passes before escalating to user
- Preserve working code before changes
- Create commits at major steps when possible
