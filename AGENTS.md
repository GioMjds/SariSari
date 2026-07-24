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
