# Obsidian Setup for SariSari Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up an organized Obsidian vault for the SariSari project to store vision, roadmap, features, technical notes, meetings, bugs/issues, research, planning, and resources using a folder-based structure.

**Architecture:** Create a structured folder hierarchy in Obsidian with numbered top-level folders for different content types, establish naming conventions, and set up initial template files for common note types.

**Tech Stack:** Obsidian (markdown-based note taking app), local file system

## Global Constraints

- Use kebab-case for file names
- Use two-digit folder numbering for consistent ordering (00, 01, 02, etc.)
- Store all files as markdown (.md) format
- Follow existing project documentation style from docs/ folder
- No external dependencies beyond Obsidian application

---

### Task 1: Create Obsidian vault folder structure

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/00-Vision/`
- Create: `D:/giomj/Projects/sarisari/obsidian-vault/01-Roadmap/`
- Create: `D:/giomj/Projects/sarisari/obsidian-vault/02-Features/`
- Create: `D:/giomj/Projects/sarisari/obsidian-vault/03-Technical/`
- Create: `D:/giomj/Projects/sarisari/obsidian-vault/04-Meetings/`
- Create: `D:/giomj/Projects/sarisari/obsidian-vault/05-Bugs-Issues/`
- Create: `D:/giomj/Projects/sarisari/obsidian-vault/06-Research/`
- Create: `D:/giomj/Projects/sarisari/obsidian-vault/07-Planning/`
- Create: `D:/giomj/Projects/sarisari/obsidian-vault/08-Resources/`

**Interfaces:**

- Consumes: None (initial setup)
- Produces: Empty folder structure for Obsidian vault

- [ ] **Step 1: Create main obsidian-vault directory**

```bash
mkdir D:/giomj/Projects/sarisari/obsidian-vault
```

- [ ] **Step 2: Create all top-level folders**

```bash
mkdir D:/giomj/Projects/sarisari/obsidian-vault/00-Vision
mkdir D:/giomj/Projects/sarisari/obsidian-vault/01-Roadmap
mkdir D:/giomj/Projects/sarisari/obsidian-vault/02-Features
mkdir D:/giomj/Projects/sarisari/obsidian-vault/03-Technical
mkdir D:/giomj/Projects/sarisari/obsidian-vault/04-Meetings
mkdir D:/giomj/Projects/sarisari/obsidian-vault/05-Bugs-Issues
mkdir D:/giomj/Projects/sarisari/obsidian-vault/06-Research
mkdir D:/giomj/Projects/sarisari/obsidian-vault/07-Planning
mkdir D:/giomj/Projects/sarisari/obsidian-vault/08-Resources
```

- [ ] **Step 3: Verify folder structure**

```bash
tree D:/giomj/Projects/sarisari/obsidian-vault
```

Expected: Show all 9 folders created

- [ ] **Step 4: Commit folder structure**

```bash
git add docs/superpowers/plans/2026-08-09-obsidian-setup-sarisari.md
git commit -m "plan: create obsidian setup implementation plan"
```

### Task 2: Create initial vision document

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/00-Vision/project-vision.md`
- Modify: None

**Interfaces:**

- Consumes: None
- Produces: Initial vision document referencing existing project docs

- [ ] **Step 1: Create project vision document**

```markdown
# SariSari Project Vision

## Overview

SariSari is an offline-first mobile assistant for Filipino sari-sari store owners. Tracks inventory, runs a POS, and maintains suki credit (utang) ledgers on-device.

## Core Purpose

To empower small neighborhood store owners with technology that works reliably without constant internet connectivity, helping them manage their businesses more efficiently.

## Key Values

- Offline-first functionality
- Simplicity and ease of use
- Relevant to Filipino sari-sari store context
- Privacy-focused (data stays on device)
- Sustainable for small business owners

## Connection to Existing Documentation

See existing vision in: `docs/vault/00-vision.md`
See roadmap in: `docs/vault/01-roadmap.md`

## Long-term Goals

- Become the go-to tool for sari-sari stores in the Philippines
- Expand to other similar small retail contexts
- Continue evolving based on actual store owner feedback
```

- [ ] **Step 2: Save the vision document**

Save as: `D:/giomj/Projects/sarisari/obsidian-vault/00-Vision/project-vision.md`

- [ ] **Step 3: Verify file was created correctly**

```bash
type D:/giomj/Projects/sarisari/obsidian-vault/00-Vision/project-vision.md
```

- [ ] **Step 4: Commit vision document**

```bash
git add D:/giomj/Projects/sarisari/obsidian-vault/00-Vision/project-vision.md
git commit -m "docs: add initial project vision to obsidian vault"
```

### Task 3: Create initial roadmap document

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/01-Roadmap/project-roadmap.md`
- Modify: None

**Interfaces:**

- Consumes: None
- Produces: Initial roadmap document

- [ ] **Step 1: Create project roadmap document**

```markdown
# SariSari Project Roadmap

## Q3 2026

- [ ] Complete POS performance optimization (addressing freeze issues)
- [ ] Enhanced inventory management features
- [ ] Improved reporting and analytics

## Q4 2026

- [ ] Customer loyalty program features
- [ ] Supplier management enhancements
- [ ] Advanced utang (credit) tracking features

## 2027

- [ ] Multi-store management capabilities
- [ ] Integration with popular Philippine payment systems
- [ ] Offline sync capabilities for optional cloud backup

## Ongoing

- Regular bug fixes and stability improvements
- User feedback incorporation
- Performance optimizations
- Documentation updates

## Connection to Existing Documentation

See existing roadmap in: `docs/vault/01-roadmap.md`
```

- [ ] **Step 2: Save the roadmap document**

Save as: `D:/giomj/Projects/sarisari/obsidian-vault/01-Roadmap/project-roadmap.md`

- [ ] **Step 3: Verify file was created correctly**

```bash
type D:/giomj/Projects/sarisari/obsidian-vault/01-Roadmap/project-roadmap.md
```

- [ ] **Step 4: Commit roadmap document**

```bash
git add D:/giomj/Projects/sarisari/obsidian-vault/01-Roadmap/project-roadmap.md
git commit -m "docs: add initial project roadmap to obsidian vault"
```

### Task 4: Create feature tracking template

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/02-Features/feature-template.md`
- Modify: None

**Interfaces:**

- Consumes: None
- Produces: Template for feature specification documents

- [ ] **Step 1: Create feature template**

```markdown
# Feature: [Feature Name]

## Overview

[Brief description of the feature and its purpose]

## User Stories

- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Acceptance Criteria

- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

## Technical Considerations

- [ ] Any technical constraints or considerations
- [ ] Dependencies on other features or systems
- [ ] Performance implications

## UI/UX Notes

- [ ] Wireframes or design considerations
- [ ] User flow descriptions
- [ ] Accessibility considerations

## Status

- [ ] Proposed
- [ ] Approved
- [ ] In Development
- [ ] Testing
- [ ] Completed
- [ ] Released

## Related Resources

- Links to research, discussions, or related features
- [[Related Feature Name]]
```

- [ ] **Step 2: Save the feature template**

Save as: `D:/giomj/Projects/sarisari/obsidian-vault/02-Features/feature-template.md`

- [ ] **Step 3: Verify file was created correctly**

```bash
type D:/giomj/Projects/sarisari/obsidian-vault/02-Features/feature-template.md
```

- [ ] **Step 4: Commit feature template**

```bash
git add D:/giomj/Projects/sarisari/obsidian-vault/02-Features/feature-template.md
git commit -m "docs: add feature template to obsidian vault"
```

### Task 5: Create technical notes template

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/03-Technical/tech-note-template.md`
- Modify: None

**Interfaces:**

- Consumes: None
- Produces: Template for technical documentation

- [ ] **Step 1: Create technical note template**

````markdown
# Technical Note: [Topic]

## Overview

[Brief description of what this technical note covers]

## Context

[Why this topic is important, what problem it solves]

## Details

[In-depth explanation of the technical concept, implementation, or decision]

## Code Examples

```typescript
// Example code if applicable
```
````

## References

- Links to relevant documentation, commits, or issues
- [[Related Technical Topic]]

## Date

YYYY-MM-DD

## Author

[Your name or initials]

````

- [ ] **Step 2: Save the technical note template**

Save as: `D:/giomj/Projects/sarisari/obsidian-vault/03-Technical/tech-note-template.md`

- [ ] **Step 3: Verify file was created correctly**

```bash
type D:/giomj/Projects/sarisari/obsidian-vault/03-Technical/tech-note-template.md
````

- [ ] **Step 4: Commit technical note template**

```bash
git add D:/giomj/Projects/sarisari/obsidian-vault/03-Technical/tech-note-template.md
git commit -m "docs: add technical note template to obsidian vault"
```

### Task 6: Create meeting notes template

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/04-Meetings/meeting-template.md`
- Modify: None

**Interfaces:**

- Consumes: None
- Produces: Template for meeting documentation

- [ ] **Step 1: Create meeting template**

```markdown
# Meeting: [Meeting Topic]

**Date:** YYYY-MM-DD
**Time:** [HH:MM]
**Attendees:** [List of attendees]
**Facilitator:** [Name if applicable]

## Agenda

1. [Agenda item 1]
2. [Agenda item 2]
3. [Agenda item 3]

## Discussion Notes

### [Agenda Item 1]

- [Key points discussed]
- [Decisions made]
- [Action items assigned]

### [Agenda Item 2]

- [Key points discussed]
- [Decisions made]
- [Action items assigned]

## Action Items

- [ ] [Action item 1] - Assigned to [Name] - Due [Date]
- [ ] [Action item 2] - Assigned to [Name] - Due [Date]

## Decisions Made

- [Decision 1]
- [Decision 2]

## Next Steps

- [Next meeting topics or follow-ups]

## Related Notes

- [[Related Meeting or Topic]]
```

- [ ] **Step 2: Save the meeting template**

Save as: `D:/giomj/Projects/sarisari/obsidian-vault/04-Meetings/meeting-template.md`

- [ ] **Step 3: Verify file was created correctly**

```bash
type D:/giomj/Projects/sarisari/obsidian-vault/04-Meetings/meeting-template.md
```

- [ ] **Step 4: Commit meeting template**

```bash
git add D:/giomj/Projects/sarisari/obsidian-vault/04-Meetings/meeting-template.md
git commit -m "docs: add meeting template to obsidian vault"
```

### Task 7: Create bug/issue tracking template

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/05-Bugs-Issues/bug-template.md`
- Modify: None

**Interfaces:**

- Consumes: None
- Produces: Template for bug and issue tracking

- [ ] **Step 1: Create bug/issue template**

```markdown
# Bug/Issue: [Brief Description]

## Summary

[Concise description of the issue]

## Environment

- **App Version:** [Version number]
- **Device:** [Device model if applicable]
- **OS:** [Android/iOS version]
- **Reproduction Frequency:** [Always/Sometimes/Rare]

## Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Expected result vs actual result]

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happens]

## Screenshots/Logs

[Attach or describe any relevant screenshots, error logs, or output]

## Possible Causes

- [Potential cause 1]
- [Potential cause 2]
- [Potential cause 3]

## Severity

- [ ] Low (minor annoyance)
- [ ] Medium (affects functionality but has workaround)
- [ ] High (major functionality broken)
- [ ] Critical (prevents app use)

## Related Issues

- [[Related Bug/Issue]]
- [GitHub issue link if applicable]

## Status

- [ ] Open
- [ ] Investigating
- [ ] Fix in Progress
- [ ] Ready for Testing
- [ ] Resolved
- [ ] Closed

## Resolution

[How the issue was fixed, if applicable]

## Date Reported

YYYY-MM-DD

## Reported By

[Your name or initials]
```

- [ ] **Step 2: Save the bug/issue template**

Save as: `D:/giomj/Projects/sarisari/obsidian-vault/05-Bugs-Issues/bug-template.md`

- [ ] **Step 3: Verify file was created correctly**

```bash
type D:/giomj/Projects/sarisari/obsidian-vault/05-Bugs-Issues/bug-template.md
```

- [ ] **Step 4: Commit bug/issue template**

```bash
git add D:/giomj/Projects/sarisari/obsidian-vault/05-Bugs-Issues/bug-template.md
git commit -m "docs: add bug/issue template to obsidian vault"
```

### Task 8: Create research template

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/06-Research/research-template.md`
- Modify: None

**Interfaces:**

- Consumes: None
- Produces: Template for research documentation

- [ ] **Step 1: Create research template**

```markdown
# Research: [Research Topic]

## Overview

[Brief description of what was researched and why]

## Research Questions

- [Question 1]
- [Question 2]
- [Question 3]

## Methodology

[How the research was conducted - interviews, surveys, observation, etc.]

## Findings

### Key Finding 1

[Description of finding]

- Supporting evidence or data
- Implications

### Key Finding 2

[Description of finding]

- Supporting evidence or data
- Implications

## Insights and Patterns

[Patterns observed, surprising results, or unexpected discoveries]

## Recommendations

- [Recommendation 1 based on findings]
- [Recommendation 2 based on findings]

## Sources and References

- [Source 1 with link if applicable]
- [Source 2 with link if applicable]
- [[Related Research Topic]]

## Date Conducted

YYYY-MM-DD

## Conducted By

[Your name or initials]
```

- [ ] **Step 2: Save the research template**

Save as: `D:/giomj/Projects/sarisari/obsidian-vault/06-Research/research-template.md`

- [ ] **Step 3: Verify file was created correctly**

```bash
type D:/giomj/Projects/sarisari/obsidian-vault/06-Research/research-template.md
```

- [ ] **Step 4: Commit research template**

```bash
git add D:/giomj/Projects/sarisari/obsidian-vault/06-Research/research-template.md
git commit -m "docs: add research template to obsidian vault"
```

### Task 9: Create planning template

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/07-Planning/planning-template.md`
- Modify: None

**Interfaces:**

- Consumes: None
- Produces: Template for planning documents (sprints, roadmaps, etc.)

- [ ] **Step 1: Create planning template**

```markdown
# Plan: [Plan Name - e.g., Sprint 1, Q3 Goals, etc.]

**Time Period:** [Start Date] to [End Date]
**Created:** YYYY-MM-DD

## Goals and Objectives

### Primary Goals

- [Goal 1]
- [Goal 2]

### Secondary Goals

- [Goal 3]
- [Goal 4]

## Key Results/Metrics

- [Metric 1: Target vs Current]
- [Metric 2: Target vs Current]
- [Metric 3: Target vs Current]

## Work Breakdown

### [Work Category 1]

- [Task 1] - Owner: [Name] - Estimate: [Time]
- [Task 2] - Owner: [Name] - Estimate: [Time]
- [Task 3] - Owner: [Name] - Estimate: [Time]

### [Work Category 2]

- [Task 1] - Owner: [Name] - Estimate: [Time]
- [Task 2] - Owner: [Name] - Estimate: [Time]

## Dependencies and Risks

### Dependencies

- [Dependency 1]
- [Dependency 2]

### Risks

- [Risk 1: Description + Mitigation]
- [Risk 2: Description + Mitigation]

## Review and Retrospective

[To be filled after completion]

- What went well:
- What could be improved:
- Lessons learned:

## Related Plans

- [[Previous Plan]]
- [[Related Plan]]
```

- [ ] **Step 2: Save the planning template**

Save as: `D:/giomj/Projects/sarisari/obsidian-vault/07-Planning/planning-template.md`

- [ ] **Step 3: Verify file was created correctly**

```bash
type D:/giomj/Projects/sarisari/obsidian-vault/07-Planning/planning-template.md
```

- [ ] **Step 4: Commit planning template**

```bash
git add D:/giomj/Projects/sarisari/obsidian-vault/07-Planning/planning-template.md
git commit -m "docs: add planning template to obsidian vault"
```

### Task 10: Create resources index

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/08-Resources/resources-index.md`
- Modify: None

**Interfaces:**

- Consumes: None
- Produces: Index of useful resources and references

- [ ] **Step 1: Create resources index**

```markdown
# Resources Index

## Project Documentation

- [Project Vision](00-Vision/project-vision.md)
- [Project Roadmap](01-Roadmap/project-roadmap.md)
- [[Existing docs/vault/00-vision.md]]
- [[Existing docs/vault/01-roadmap.md]]

## Technical References

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmndrs.com/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [React Hook Form Documentation](https://react-hook-form.com/)

## Development Guides

- [Getting Started Guide](<>)
- [Development Setup](<>)
- [Testing Guidelines](<>)
- [Code Review Checklist](<>)
- [Commit Message Guidelines](<>)

## Business References

- [Philippine Sari-Sari Store Association](<>)
- [DTI MSME Resources](<>)
- [Local Government Business Permits](<>)
- [BIR Tax Guidelines for Small Businesses](<>)

## Templates

- [[Feature Template|02-Features/feature-template.md]]
- [[Technical Note Template|03-Technical/tech-note-template.md]]
- [[Meeting Template|04-Meetings/meeting-template.md]]
- [[Bug/Issue Template|05-Bugs-Issues/bug-template.md]]
- [[Research Template|06-Research/research-template.md]]
- [[Planning Template|07-Planning/planning-template.md]]

## Inspiration and Examples

- [Similar Apps for Inspiration](<>)
- [UI/UX Design References](<>)
- [Offline-First Architecture Examples](<>)
- [Small Business Management Tools](<>)

## Last Updated

YYYY-MM-DD
```

- [ ] **Step 2: Save the resources index**

Save as: `D:/giomj/Projects/sarisari/obsidian-vault/08-Resources/resources-index.md`

- [ ] **Step 3: Verify file was created correctly**

```bash
type D:/giomj/Projects/sarisari/obsidian-vault/08-Resources/resources-index.md
```

- [ ] **Step 4: Commit resources index**

```bash
git add D:/giomj/Projects/sarisari/obsidian-vault/08-Resources/resources-index.md
git commit -m "docs: add resources index to obsidian vault"
```

### Task 11: Create initial note linking the obsidian vault to existing docs

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/README.md`
- Modify: None

**Interfaces:**

- Consumes: None
- Produces: README explaining the obsidian vault purpose and structure

- [ ] **Step 1: Create README for obsidian vault**

```markdown
# SariSari Obsidian Vault

This vault serves as the central knowledge base for the SariSari project, designed to combat forgetfulness and support project growth through organized storage of ideas, plans, and documentation.

## Purpose

- Store project vision, roadmap, and strategic thinking
- Track feature ideas and specifications
- Document technical decisions and architecture
- Keep meeting notes and brainstorming sessions
- Manage bugs, issues, and action items
- Store research findings and user feedback
- Maintain planning documents and sprint goals
- Collect useful resources and references

## Folder Structure
```

00-Vision/ # Project vision, mission, core values
01-Roadmap/ # Timeline, milestones, release plans
02-Features/ # Feature ideas, specifications, user stories
03-Technical/ # Architecture, code notes, tech decisions, dev setup
04-Meetings/ # Meeting notes, brainstorming sessions
05-Bugs-Issues/ # Bug tracking, issue logs, todo items
06-Research/ # Market research, user feedback, competitor analysis
07-Planning/ # Sprints, task lists, development plans
08-Resources/ # Reference materials, links, templates, assets

```

## Naming Conventions
- Files: Use kebab-case with descriptive names (e.g., `pos-fast-lane-feature.md`)
- Folder numbers: Keep two-digit numbering for consistent ordering (00, 01, 02, etc.)
- Dates: When relevant, prefix with YYYY-MM-DD (e.g., `2026-08-09-meeting-notes.md`)

## Linking Strategy
- Use Obsidian's double-bracket linking (`[[Feature Name]]`) to connect related notes
- Create MOCs (Maps of Content) for complex topics (e.g., `[[02-Features/Feature-Map.md]]`)
- Use tags sparingly for cross-cutting concerns (e.g., `#urgent`, `#backend`, `#ui`)

## Connection to Existing Documentation
This obsidian vault complements the existing documentation in the `docs/` folder:
- Strategic and planning docs live here in the vault
- Implementation-specific docs remain in `docs/` folder
- Cross-reference between vault and docs as needed

## Getting Started
1. Install Obsidian if not already installed
2. Open Obsidian and select "Open folder as vault"
3. Navigate to and select this `obsidian-vault` folder
4. Start creating notes using the templates provided in each folder
5. Use the graph view to see connections between your ideas

## Maintenance
- Weekly: Review inbox, process new notes, update links
- Monthly: Review older notes, archive or update as needed
- Quarterly: Review overall structure, adjust as project evolves

Last Updated: 2026-08-09
```

- [ ] **Step 2: Save the README**

Save as: `D:/giomj/Projects/sarisari/obsidian-vault/README.md`

- [ ] **Step 3: Verify file was created correctly**

```bash
type D:/giomj/Projects/sarisari/obsidian-vault/README.md
```

- [ ] **Step 4: Commit README**

```bash
git add D:/giomj/Projects/sarisari/obsidian-vault/README.md
git commit -m "docs: add README to obsidian vault explaining purpose and structure"
```

### Task 12: Verify complete setup and create usage guide

**Files:**

- Create: `D:/giomj/Projects/sarisari/obsidian-vault/USAGE-GUIDE.md`
- Modify: None

**Interfaces:**

- Consumes: All previously created files
- Produces: Final verification and usage instructions

- [ ] **Step 1: Verify all files were created**

```bash
tree D:/giomj/Projects/sarisari/obsidian-vault
```

Expected: Show all folders and files created

- [ ] **Step 2: Create usage guide**

```markdown
# Obsidian Vault Usage Guide for SariSari Project

## Quick Start

1. Launch Obsidian
2. Click "Open folder as vault"
3. Select the `obsidian-vault` folder in your SariSari project
4. Begin creating notes!

## Daily Workflow

### Capturing Ideas

- When you have an idea, create a new note in the appropriate folder
- Use the templates provided in each folder for consistency
- Link to related notes using `[[double brackets]]`
- Add relevant tags like `#urgent` or `#backend` when needed

### Weekly Review (Recommended)

1. Process any new notes created during the week
2. Check for broken links or notes needing updates
3. Ensure action items from meetings are captured in planning folders
4. Review the graph view to see connections between ideas

## Specific Use Cases

### Feature Planning

1. Go to `02-Features/` folder
2. Create new note from `feature-template.md`
3. Fill out overview, user stories, acceptance criteria
4. Link to related technical notes or research
5. Tag appropriately (e.g., `#pos`, `#inventory`, `#utang`)

### Meeting Notes

1. Go to `04-Meetings/` folder
2. Create new note from `meeting-template.md`
3. Fill in attendees, agenda, discussion points
4. Assign action items with owners and due dates
5. Link to related features or technical topics discussed

### Bug Tracking

1. Go to `05-Bugs-Issues/` folder
2. Create new note from `bug-template.md`
3. Clearly describe steps to reproduce
4. Include expected vs actual behavior
5. Add severity level and assign if known
6. Link to related features or technical areas

### Technical Documentation

1. Go to `03-Technical/` folder
2. Create new note from `tech-note-template.md`
3. Document architecture decisions, code explanations, or debugging sessions
4. Include code snippets when helpful
5. Link to related feature specs or meeting notes

## Tips for Effective Use

- **Link liberally**: The power of Obsidian is in connections between notes
- **Use the graph view**: Regularly check how your ideas connect
- **Search effectively**: Use Obsidian's powerful search to find past notes
- **Keep it current**: Update notes as projects evolve, don't let them go stale
- **Reference existing docs**: Link to relevant files in the `docs/` folder when appropriate
- **Use templates**: They ensure consistency and save time

## Backup and Sync

Since this vault stores plain markdown files:

- Ensure your computer is backed up regularly
- Consider using Obsidian Sync for cross-device access
- Or use a cloud folder service (Dropbox, Google Drive, etc.) with caution
- Git version control is also available for tracking changes

## Integration with Existing Workflow

- Use this vault for strategic thinking, planning, and idea capture
- Continue using `docs/` folder for implementation-specific documentation
- Reference between the two systems as needed
- Bring insights from this vault into development planning sessions

Happy note-taking! May your ideas flow freely and your forgetfulness diminish.
```

- [ ] **Step 3: Save the usage guide**

Save as: `D:/giomj/Projects/sarisari/obsidian-vault/USAGE-GUIDE.md`

- [ ] **Step 4: Verify file was created correctly**

```bash
type D:/giomj/Projects/sarisari/obsidian-vault/USAGE-GUIDE.md
```

- [ ] **Step 5: Commit usage guide**

```bash
git add D:/giomj/Projects/sarisari/obsidian-vault/USAGE-GUIDE.md
git commit -m "docs: add usage guide for obsidian vault"

echo "Obsidian vault setup complete! The vault is ready to use at D:/giomj/Projects/sarisari/obsidian-vault"
```
