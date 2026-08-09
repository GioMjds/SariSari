# AGENTS.md — Obsidian Vault (Second Brain) Etiquette

Guidance for AI Agents (Antigravity, Claude Code, Gemini CLI, Codex, etc.) reading from, creating, and modifying notes within `obsidian-vault/`.

## 1. Core Purpose & Boundaries

- **Second Brain Knowledge Base**: `obsidian-vault/` is the project's external knowledge base for strategic vision, roadmap planning, feature specs, research notes, and meeting context.
- **Vault vs. Codebase Docs**:
  - `obsidian-vault/`: Strategic planning, high-level architecture, specs, rationale, meeting notes, and research.
  - `docs/`: Developer implementation docs, ADRs, internal superpowers specs, and task lists.
  - Codebase (`app/`, `database/`, etc.): Production code and inline comments.

## 2. Golden Rules of Vault Etiquette

1. **Read Before Writing**: Always read existing notes, maps of content (MOCs), and templates in `08-Resources/` before creating or updating notes. Never write blind notes that duplicate existing context.
2. **Strict Folder Placement**: Every note MUST reside in the appropriate numbered subfolder:
   - `00-Vision/`: Core vision, principles, and strategic goals.
   - `01-Roadmap/`: Timelines, release plans, and status tracking.
   - `02-Features/`: Feature specifications, user stories, and acceptance criteria.
   - `03-Technical/`: Architecture decisions, tech notes, and system designs.
   - `04-Meetings/`: Meeting notes, transcripts, and action items.
   - `05-Bugs-Issues/`: Bug reports, issue logs, and root cause analysis notes.
   - `06-Research/`: Market research, competitive analysis, and user feedback.
   - `07-Planning/`: Tactical plans, sprint notes, and task breakdowns.
   - `08-Resources/`: Templates, reference materials, MOCs, and guides.
3. **Atomic Notes & Single Source of Truth**: Each note should focus on a single concept or topic. Avoid duplicating information across multiple notes; link instead.
4. **Naming Conventions**:
   - Use kebab-case for file names (e.g., `suki-credit-ledger-spec.md`).
   - Prefix dated notes (meetings, daily planning, logs) with `YYYY-MM-DD-` (e.g., `2026-08-09-sprint-planning.md`).
   - Keep two-digit numbering intact for subfolders (`00-Vision`, `01-Roadmap`, etc.).

## 3. Linking & Metadata Standards

- **Obsidian Wiki-Links**: Use `[[Note Title]]` or `[[Folder/Note Title|Display Alias]]` to establish bidirectional connections between related notes.
- **Codebase References**: Link to codebase files using relative paths from project root (e.g., `database/credits.ts` or `app/(tabs)/customers.tsx`).
- **Frontmatter**: Include YAML frontmatter at the top of notes when appropriate:

  ```yaml
  ---
  title: Suki Credit Ledger Spec
  created: 2026-08-09
  tags: [feature, utang, financial]
  status: draft # draft | active | archived
  ---
  ```

- **Tag Hygiene**: Use tags sparingly for cross-cutting themes (e.g., `#utang`, `#pos`, `#inventory`, `#sqlite`). Do not clutter notes with excessive custom tags.

## 4. Codebase ↔ Vault Alignment Protocol

- When implementing a feature or fixing a bug documented in the vault, update the corresponding vault note with links to relevant pull requests, code files, or architectural shifts.
- If technical constraints force a deviation from a vault specification, update the vault spec to reflect the revised technical design and rationale.

## 5. Agent Write Safety & System Constraints

- **Do Not Touch `.obsidian/`**: Never create, edit, or delete configuration files inside `.obsidian/` unless explicitly instructed by the user.
- **No Emojis or Special Characters**: Keep note content clean, standard Markdown, free of unnecessary ASCII/emoji decorations.
- **No Credentials or Personal Data**: Never commit passwords, tokens, API keys, or actual user personal data into vault notes.
- **Atomic Git Commits**: When creating or updating vault notes, commit changes cleanly with clear commit messages. Do not auto-push unless requested.
