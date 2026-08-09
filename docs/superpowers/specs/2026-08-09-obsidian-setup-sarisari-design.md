# Obsidian Setup for SariSari Project

## Overview

This setup provides a clean, intuitive folder-based organization in Obsidian to store all types of project content: vision, roadmap, features, technical notes, meetings, bugs/issues, research, planning, and resources. The goal is to create a central knowledge base that combats forgetfulness and supports project growth.

## Folder Structure

```folder
00-Vision/          # Project vision, mission, core values
01-Roadmap/         # Timeline, milestones, release plans
02-Features/        # Feature ideas, specifications, user stories
03-Technical/       # Architecture, code notes, tech decisions, dev setup
04-Meetings/        # Meeting notes, brainstorming sessions
05-Bugs-Issues/     # Bug tracking, issue logs, todo items
06-Research/        # Market research, user feedback, competitor analysis
07-Planning/        # Sprints, task lists, development plans
08-Resources/       # Reference materials, links, templates, assets
```

## Naming Conventions

- Files: Use kebab-case with descriptive names (e.g., `pos-fast-lane-feature.md`, `bug-report-cart-freeze.md`)
- Folder numbers: Keep two-digit numbering for consistent ordering (00, 01, 02, etc.)
- Dates: When relevant, prefix with YYYY-MM-DD (e.g., `2026-08-09-meeting-notes.md`)

## Linking Strategy

- Use Obsidian's double-bracket linking (`[[Feature Name]]`) to connect related notes
- Create MOCs (Maps of Content) for complex topics (e.g., `[[02-Features/Feature-Map.md]]`)
- Use tags sparingly for cross-cutting concerns (e.g., `#urgent`, `#backend`, `#ui`)

## Maintenance & Best Practices

- Weekly review: Spend 10-15 minutes processing inbox, updating links, archiving old items
- Template system: Create templates for meeting notes, bug reports, feature specs
- Graph view: Use Obsidian's graph to visualize connections between ideas
- Backup: Since Obsidian stores files locally, ensure your vault is backed up (consider sync with Obsidian Sync or a cloud folder)
