# Bugfix Workflow

Workflow for diagnosing, fixing, and verifying bug fixes.

## Steps

1. **Identification & Reproduction**
   - Read problem description and inspect error logs or stack traces.
   - Reproduce issue locally or isolate the root cause in component state / API route.

2. **Root Cause Analysis**
   - Inspect target source files in `src/` or `api/`.
   - Trace inputs, custom hooks, and state flow to find contract violations.

3. **Targeted Fix**
   - Apply minimal, targeted fix without scope creep or unnecessary refactoring.
   - Preserve existing API signatures and UI contracts.

4. **Verification**
   - Run type check and build command (`npm run build`).
   - Run linter (`npm run lint`) to confirm zero lint errors.

5. **Documentation**
   - Update `.agents/memory/known-issues.md` if issue was previously logged.
   - Record fix entry in `docs/activity-log.md`.
