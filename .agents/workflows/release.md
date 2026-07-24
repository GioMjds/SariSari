# Release Workflow

Workflow for auditing, packaging, and releasing application updates.

## Steps

1. **Pre-Release Integrity Audit**
   - Run `npm run build` and `npm run lint` to ensure zero compilation or styling errors.
   - Verify environment variable requirements and Vercel configuration (`vercel.json`).

2. **Security & Credentials Check**
   - Audit code to ensure no secret API keys, SMTP credentials, or personal data are exposed in client code.

3. **Changelog & Version Update**
   - Update `.agents/memory/changelog.md` with semantic versioning entries.
   - Update `package.json` version if tag is requested.

4. **Activity Log Summary**
   - Document release checklist completion in `docs/activity-log.md`.
