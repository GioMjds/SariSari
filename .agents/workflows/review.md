# Review Workflow

Workflow for conducting multi-axis code reviews across correctness, security, architecture, and performance.

## Steps

1. **Architecture & Standards Alignment**
   - Verify code matches guidelines in `AGENTS.md` and `.agents/contexts/coding-style.md`.
   - Ensure separation of concerns between pages, section components, custom hooks, and serverless functions.

2. **Quality & Simplification Audit**
   - Check for over-engineering, oversized components, or unnecessary third-party dependencies.
   - Confirm proper data structures and least privilege exposure.

3. **Security & Privacy Audit**
   - Verify no credentials, API keys, or personal data exist in code or comments.
   - Verify input sanitization in `api/contact.ts` serverless route.

4. **Build & Lint Verification**
   - Run `npm run build` and `npm run lint`.

5. **Review Report**
   - Log review conclusions and any recommended updates in `docs/activity-log.md`.
