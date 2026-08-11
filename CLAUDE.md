# Vault-First Agent Architecture

The `obsidian-vault/` directory is the project's source of truth for vision, roadmap, feature specs, technical decisions, bug diagnoses, research, planning, and meeting context. Every agent working on this repo must consult the vault before answering project-specific questions or making architectural decisions.

## Vault-First Rule

1. On every session, `Read` `obsidian-vault/CONTEXT.md` first. It is the dense ~80-line entry point with principles, conventions, and the domain routing table.
2. Before answering any project-specific question, classify the domain and Grep the relevant folder per the routing table below. Never Grep the whole vault.
3. After a Grep returns matches, `Read` at most the top 1-3 matching notes. Never `Read` a whole folder.
4. Cite the vault note path in your response (e.g., `per obsidian-vault/02-Features/06-collection-queue.md`).
5. If no vault note is found, say so in one short line and proceed using code and `AGENTS.md` only. Do not fabricate a citation.

## Domain Routing

Map the question to a vault folder before Grepping. If a question spans multiple folders, Grep each in order.

| Question about...               | Look in...                                | Grep hint                      |
| ------------------------------- | ----------------------------------------- | ------------------------------ |
| Architecture, stack, ADRs       | `obsidian-vault/03-Technical/`            | full-text on keyword           |
| Feature spec, rationale, scopes | `obsidian-vault/02-Features/<id>-name.md` | exact filename or feature name |
| Roadmap, status, milestones     | `obsidian-vault/01-Roadmap/`              | "roadmap" or "status"          |
| Bug, known crash, root cause    | `obsidian-vault/05-Bugs-Issues/`          | symptom or library name        |
| Vision, principles, values      | `obsidian-vault/00-Vision/`               | "principle" or "vision"        |
| Meeting context, decisions      | `obsidian-vault/04-Meetings/`             | date (YYYY-MM-DD) or topic     |
| Sprint planning, daily tasks    | `obsidian-vault/07-Planning/`             | topic name                     |
| Market research, competitors    | `obsidian-vault/06-Research/`             | topic name                     |
| Marketing, channels, captions   | `obsidian-vault/09-Marketing/`            | only when explicitly asked     |
| Templates, reference materials  | `obsidian-vault/08-Resources/`            | only when creating a note      |

## Token Discipline

- Read `obsidian-vault/CONTEXT.md` first, then Grep, then Read top 1-3 hits only.
- Never Read whole folders. Never Read every match in a Grep result. Never recursively read the whole vault.
- Skip `09-Marketing/` for technical questions.
- Skip `08-Resources/` templates unless the task is to create a note.
- Skip `obsidian-vault/CLAUDE-CODE-INTEGRATION.md` mid-session. Its actionable content is summarized in `CONTEXT.md`.
- If a Grep returns more than 5 hits, narrow the pattern (add a 2nd keyword, restrict glob) before reading any file.
- Search first, retrieve second, reason third. Do NOT "read everything, then reason."

## Avoid Redundant Investigation

If the vault contains an explicit accepted decision (e.g., feature spec, ADR-style note, or `status: accepted` in frontmatter) for a question, do NOT re-evaluate the decision from first principles. Cite the decision and proceed. Only re-investigate if the user explicitly asks to reconsider, the implementation materially changed, new requirements conflict, or the decision is marked obsolete.

## Token budget pressure

The always-loaded core is small (~700 tokens). If context pressure mounts, the agent may drop already-cited vault notes from the response but must keep the lookup step. Do not skip the Grep. For the next question, restart from `obsidian-vault/CONTEXT.md` rather than relying on residual context. The routing table is the cheap, durable entry point.

## If sources conflict

Surface it. Do not pick. Cite both. Ask if implementation matters.

- Two vault notes disagree: cite both verbatim, ask the user which is authoritative.
- Vault note contradicts code: code is the source of current behavior. Cite the vault note, flag the discrepancy, suggest the vault note may need updating.
- Stale vault note (`status: draft` in frontmatter, or `created:` older than 90 days): still cite, but flag the staleness.

## Non-project questions

If the question is unrelated to SariSari (e.g., "what is React Native?", "help me write a poem"), skip the vault entirely. No Grep, no citation, direct answer.

## Subagent forwarding

Subagents do not inherit this protocol by default. When dispatching a subagent for a project-specific task, either pass the relevant vault notes inline in the prompt or explicitly tell the subagent to read the vault before answering.

## Update policy

Significant decisions made during a task may warrant a vault note update. Do not auto-write. Follow write etiquette in `obsidian-vault/AGENTS.md` (read existing note first, use template, place in correct folder, never touch `.obsidian/`, no credentials, no auto-push).
