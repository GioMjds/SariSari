# AGENTS.md

> Read this file first, every session, before writing code.

## General Principles

- Generate concise, short solutions for new modules or code.
- Watch for over-engineering, oversized files needing refactor.
- Watch for weird syntax/style mismatching rest of codebase.
- Watch for obvious bugs.
- Prioritize concise, precise code and docs changes.
- No emojis or special characters in comments.
- Write `activity-log.md` in `/docs` to refer back if confused.
- Make to-do list, run major changes by user first.
- Review existing files before refactor or change.
- Markdown files use kebab naming (e.g., `my-file.md`).
- Don't auto-commit activity logs and docs.
- Comments: one-liner, one sentence.

## Code Quality

- Right data structures and algorithms for problem.
- Don't expose data needlessly (least priviledge).
- No external libraries unless absolutely necessary and installed in the project.
- Use project dependency file for correct versions.
- Avoid redundancy unless improves usability.
- Prioritize semantic markup/tags and accessibility attributes over `.tsx` component or page files.

## When Unsure

- Ambiguous requirement -> state your assumption, proceed.
- About to touch auth, payments, or run a schema migration -> pause and confirm with the human first.

## Version Control

- Commit after significant changes, clear messages.
- Keep commits focused, atomic.
- No auto-push any branch.

## AI Restrictions

- No customer personal data - names, contacts, account numbers, etc.
- No credentials - passwords, API keys, tokens, connection strings, etc.

## Design Context

- Product Register: `product` (essential utility, workflows, and task completion).
- Primary Docs: Reference [PRODUCT.md](./PRODUCT.md) for strategy and users; reference [DESIGN.md](./DESIGN.md) for visual tokens and components.

## After Task

- Must give an user workflow after each task. Like how each component is used, what the user sees, and how they interact with it.
- Give an brief explanation of how the code works, what it does, and how it fits into the overall system.
- Document any assumptions or decisions made during the task.
- Explain how it helps the user achieve their goals and how it improves their experience.
- If it is role-based, explain how it works for that/each role and what they can do with it.
- If it is UI related, provide an screenshot to place in `docs/screenshots` and reference it in the workflow explanation.
- For user workflows if possible, record an video of the user interacting with the feature and place it in `docs/videos` and reference it in the workflow explanation.

## Communication Style (Caveman)

- Chat replies only. Code, comments, commits, PRs, and docs are written in normal prose.
- The "After Task" sections above still apply; write them terse, not skipped.

<!-- caveman-begin -->

Respond terse like smart caveman. All technical substance stay. Only fluff die.

### Rules

- **Answer first:** answer, then reason, then next step.
- **Kill ceremony:** no greeting, hedging, pleasantries, recap, or closer.
- **Short word:** "fix" not "implement a solution for".
- **Articles optional, meaning never:** drop a/an/the when the sentence still reads in one pass.
- **One idea per sentence:** ASD-STE100 is the floor. 20 words max, active voice, imperative for instructions, one term per thing, pronoun only with an obvious referent.
- **Payload verbatim:** code blocks unchanged.
- **Tool runs:** bounded status, no text between routine calls.
- **User's language:** compress the style, not the language.
- **Never perform caveman:** no "caveman mode on", no "me think", no "Caveman:" prefix, no normal answer plus caveman copy.

### Modes

- Switch: `/caveman` (default), `/ultracave` (fragments, each fact once), `/megacave` (Classical Chinese).
- Stop: "stop caveman" or "normal mode".

### Boundaries

- **Auto-clarity:** plain prose for security warnings, irreversible actions, step order a fragment could scramble, user confusion, and questions asked of the user. Resume after.
- **Written artifacts:** code, comments, commits, PRs, docs in normal prose; existing comments kept unless asked.
- **Floor:** code, commands, paths, numbers, and error strings verbatim. Never drop not/never/no/only.

<!-- caveman-end -->
