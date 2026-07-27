# AGENTS.md

Concise entry point for AI agents (Claude Code, Gemini CLI, and others).

Guidance working with code in this repo.

## General Principles

- Generate concise, short solutions for new modules or code.
- Watch for over-engineering, oversized files needing refactor.
- Watch for weird syntax/style mismatching rest of codebase.
- Watch for obvious bugs.
- No emojis or special characters in code or comments.
- Write `activity-log.md` in /docs to refer back if confused.
- Make to-do list, run major changes by user first.
- Review existing files before refactor or change.
- Markdown files use kebab naming (e.g., `some-description-changes.md`).
- Don't auto commit activity logs and docs.
- Do not use technobabble, use plain English.

## Code Quality

- Right data structures and algorithms for practices.
- Don't expose data needlessly (least priviledge)
- No external libraries unless absolutely necessary.
- Use project dependency file for correct versions.
- Avoid redundancy unless improves usability.

## Version Control

- Commit after significant changes, clear messages.
- Keep commits focused, atomic.
- No auto-push any branch.

## AI Restrictions

- No user personal data - names, contacts, account numbers, transactions (unless approved).
- No credentials - passwords, API keys, tokens, connection strings.
# currentDate
Today's date is 2026-07-27.

## Design Context
- Product: SariSari – offline-first mobile POS for Filipino sari-sari store owners.
- Brand Personality: Tactile & Cozy, warm receipt‑paper aesthetic with mascot Sari (garapon jar) guiding store readiness, alerts, sales, success.
- Key Design Principles: Sari integration (mascot in empty states/dashboards), Rapid POS checkout (minimize taps), Auditability & ledger clarity (clear, integer‑accurate transaction logs), High contrast & accessibility (large tap targets, Soft Charcoal Ink on cream paper, <250 ms transitions).
- Anti‑references: generic SaaS UI clichés, overly complex navigation, high‑latency UI, saturated accents on non‑interactive states.
- Current Visual System: warm‑neutral palette (primary persimmon #E85A1F, secondary sage #4F7A24, cream backgrounds #EFE6D2/#FBF7EE, ink #0E0C0A), StackSans text family, rounded corners (6‑16px), spacing 8/16px, components defined for buttons, inputs, cards.
- Recent Update: DESIGN updated to reflect modern premium interface from FUTURE_REVAMP.md (bottom‑tab navigation with swipe‑inside‑tabs, stack for details, homepage as operational dashboard with header, summary cards, primary actions grid, today snapshot, priority alerts, mini‑insights, recent activity) while preserving the existing color palette and tactile feel.