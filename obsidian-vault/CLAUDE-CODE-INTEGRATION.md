# Claude Code ↔ Obsidian Integration Guide

This guide shows how to use Claude Code's file operations to interact with your SariSari Obsidian vault. Since your vault is just a folder of markdown files, you can use Claude Code's built-in tools for full CRUD operations.

## Quick Reference: Claude Code Tools for Obsidian

| Action             | Claude Code Tool     | Example                                                                                       |
| ------------------ | -------------------- | --------------------------------------------------------------------------------------------- |
| **Read a note**    | `Read`               | `Read({file_path: "D:/giomj/Projects/sarisari/obsidian-vault/02-Features/pos-fast-lane.md"})` |
| **Create a note**  | `Write`              | `Write({file_path: "...", content: "# New Feature..."})`                                      |
| **Update a note**  | `Edit`               | `Edit({file_path: "...", old_string: "...", new_string: "..."})`                              |
| **Search content** | `Grep`               | `Grep({pattern: "offline sync", glob: "**/*.md"})`                                            |
| **List notes**     | `Glob`               | `Glob({pattern: "02-Features/**/*.md"})`                                                      |
| **Get file info**  | `Read` (with limits) | Read first 50 lines to preview                                                                |

## Common Workflows

### 1. Creating a New Feature Note from Template

#### **Step 1: Read the template**

```python
template = Read({
    "file_path": "D:/giomj/Projects/sarisari/obsidian-vault/02-Features/feature-template.md"
})
```

#### **Step 2: Customize the template**

```python
# Replace placeholders with actual values
content = template.replace("[Feature Name]", "Offline-First Inventory Sync")
content = content.replace("[Brief description of the feature and its purpose]",
                         "Enable automatic synchronization of inventory counts when internet connectivity is restored")
content = content.replace("- As a [user type], I want to [action] so that [benefit]",
                         "- As a store owner, I want inventory counts to sync automatically when online so that I never lose sales data\n- As a cashier, I want to see sync status indicators so I know when data is current")
```

#### **Step 3: Create the new note**

```python
Write({
    "file_path": "D:/giomj/Projects/sarisari/obsidian-vault/02-Features/offline-inventory-sync.md",
    "content": content
})
```

### 2. Researching Existing Information

**Search for all notes about "offline" functionality:**

```python
results = Grep({
    "pattern": "offline",
    "glob": "**/*.md",
    "-i": True  # case insensitive
})
```

**Find all meetings where inventory was discussed:**

```python
results = Grep({
    "pattern": "inventory",
    "glob": "04-Meetings/**/*.md",
    "-i": True
})
```

### 3. Updating Project Documentation

**Add a decision to the technical architecture notes:**

```python
# First read the existing file
current = Read({
    "file_path": "D:/giomj/Projects/sarisari/obsidian-vault/03-Technical/architecture-decisions.md"
})

# Append new decision
updated = current + "\n\n## Decision: Use Local-First Approach for Store State\n\n**Date:** 2026-08-09\n\nWe chose to implement a local-first architecture where all store state is maintained locally and synchronized when possible, rather than a cloud-first approach. This ensures the system works reliably in areas with poor connectivity which is common for sari-sari stores.\n\n**Consequences:**\n- Better offline experience\n- More complex sync logic\n- Need conflict resolution strategies\n"

Write({
    "file_path": "D:/giomj/Projects/sarisari/obsidian-vault/03-Technical/architecture-decisions.md",
    "content": updated
})
```

### 4. Creating Meeting Notes from Template

```python
# Read meeting template
template = Read({
    "file_path": "D:/giomj/Projects/sarisari/obsidian-vault/04-Meetings/meeting-template.md"
})

# Fill in specific meeting details
meeting_note = template.replace("[Meeting Topic]", "Sprint Planning - Inventory Features")
meeting_note = meeting_note.replace("**Date:** YYYY-MM-DD", "**Date:** 2026-08-09")
meeting_note = meeting_note.replace("**Time:** [HH:MM]", "**Time:** 14:00")
meeting_note = meeting_note.replace("**Attendees:** [List of attendees]", "**Attendees:** Gio (Developer), Maria (Store Owner Consultant)")
meeting_note = meeting_note.replace("**Facilitator:** [Name if applicable]", "**Facilitator:** Gio")
meeting_note = meeting_note.replace("1. [Agenda item 1]", "1. Review inventory sync requirements")
meeting_note = meeting_note.replace("2. [Agenda item 2]", "2. Plan offline-first implementation")
meeting_note = meeting_note.replace("3. [Agenda item 3]", "3. Define API contracts for sync service")

# Create the meeting note
Write({
    "file_path": "D:/giomj/Projects/sarisari/obsidian-vault/04-Meetings/2026-08-09-sprint-planning-inventory.md",
    "content": meeting_note
})
```

### 5. Linking Between Notes (Obsidian's Superpower)

When creating content, add links to related notes:

```python
# In a feature note, link to related technical documentation
content = """
# Feature: Smart Restocking Recommendations

## Overview
This feature provides intelligent reorder suggestions based on sales velocity, lead times, and current stock levels.

See the technical implementation: [[03-Technical/smart-restocking-algorithm.md]]
See related inventory features: [[02-Features/inventory-dashboard.md]]
"""

Write({
    "file_path": "D:/giomj/Projects/sarisari/obsidian-vault/02-Features/smart-restocking.md",
    "content": content
})
```

### 6. Getting Project Context Before Coding

Before implementing a feature, read relevant notes:

```python
# Get feature specification
feature_spec = Read({
    "file_path": "D:/giomj/Projects/sarisari/obsidian-vault/02-Features/offline-inventory-sync.md"
})

# Get technical constraints
tech_notes = Read({
    "file_path": "D:/giomj/Projects/sarisari/obsidian-vault/03-Technical/offline-sync-constraints.md"
})

# Get related decisions
decisions = Read({
    "file_path": "D:/giomj/Projects/sarisari/obsidian-vault/03-Technical/architecture-decisions.md"
})

# Now you have full context to implement the feature!
```

### 7. Bulk Operations

**Update all TODO items in a specific area:**

```python
# Find all notes with TODO in Features folder
todo_files = Glob({
    "pattern": "02-Features/**/*.md"
})

for file in todo_files:
    content = Read({"file_path": file})
    if "TODO" in content or "[ ]" in content:
        # Process the file - maybe send summary or update status
        pass
```

**Generate a report of all open bugs:**

```python
bug_files = Glob({
    "pattern": "05-Bugs-Issues/**/*.md"
})

open_bugs = []
for file in bug_files:
    content = Read({"file_path": file})
    if "- [ ] Open" in content or "- [ ] Investigating" in content:
        # Extract bug summary and add to report
        pass
```

## Best Practices for Claude Code-Obsidian Workflow

### 1. Always Read Before Writing

When updating existing notes, always read them first to avoid overwriting content:

```python
# GOOD: Read first, then update
current = Read({"file_path": "path/to/note.md"})
updated = current.replace("old text", "new text")
Write({"file_path": "path/to/note.md", "content": updated})

# BAD: Overwriting without reading
# Write({"file_path": "path/to/note.md", "content": "new content only"})  # Loses existing content!
```

### 2. Use Relative Paths from Project Root

For consistency, you can use paths relative to your project root:

```python
# Instead of full paths, use relative from D:/giomj/Projects/sarisari/
Read({"file_path": "obsidian-vault/02-Features/feature-name.md"})
```

### 3. Leverage Obsidian's Linking System

When creating content, think about connections:

- What existing notes should this link TO?
- What future notes might link FROM this?
- Use `[[Note Title]]` format for Obsidian links
- Use `#tag` for categorization that works across the vault

### 4. Use Templates Effectively

Keep your template files in each folder and:

- Read them as starting points
- Replace placeholders systematically
- Save them with meaningful names in the appropriate folder
- Consider creating a master template library in `08-Resources/Templates/`

### 5. Combine with Existing Documentation

Remember that your Obsidian vault complements the existing `docs/` folder:

- Use Obsidian for: planning, ideas, meeting notes, feature specs, brainstorming
- Keep in `docs/`: implementation-specific docs, API references, user guides, technical specs
- Link between systems when appropriate: `[[../docs/api-reference.md]]`

## Example Session Flow

Here's how a typical Claude Code + Obsidian session might work:

1. **Start with context gathering**

   ```python
   # Read current project vision
   vision = Read({"file_path": "obsidian-vault/00-Vision/project-vision.md"})

   # Check current roadmap
   roadmap = Read({"file_path": "obsidian-vault/01-Roadmap/project-roadmap.md"})
   ```

2. **Plan your work**

   ```python
   # Create a planning note for today's work
   planning_note = f"""# Today's Work: {date}

   ## Goals
   - Implement offline inventory sync feature
   - Update architecture documentation

   ## Context from Vision
   {vision['Core Purpose']}
   """

   Write({"file_path": f"obsidian-vault/07-Planning/{date}-daily-planning.md",
          "content": planning_note})
   ```

3. **Implement and document**

   ```python
   # After writing some code, document what you did
   dev_log = f"""## Development Log - {timestamp}

   ### What I built:
   - Created sync queue mechanism
   - Added conflict detection for inventory updates

   ### Files changed:
   - src/sync/SyncQueue.ts
   - src/services/InventoryService.ts

   ### Next steps:
   - Write unit tests for sync logic
   - Test with simulated connectivity loss
   """

   # Append to technical notes or create new dev log
   current_log = Read({"file_path": "obsidian-vault/03-Technical/dev-log-August.md"})
   Write({
       "file_path": "obsidian-vault/03-Technical/dev-log-August.md",
       "content": current_log + "\n\n" + dev_log
   })
   ```

4. **Review and link**

   ```python
   # Ensure your new feature links to related concepts
   feature_note = Read({"file_path": "obsidian-vault/02-Features/offline-inventory-sync.md"})
   if "[[03-Technical/sync-mechanism.md]]" not in feature_note:
       updated = feature_note + "\n\n## Technical Details\nSee implementation: [[03-Technical/sync-mechanism.md]]"
       Write({"file_path": "obsidian-vault/02-Features/offline-inventory-sync.md",
              "content": updated})
   ```

## Troubleshooting

**Problem:** "File not found" errors
**Solution:** Double-check your file paths. Remember that paths are case-sensitive on some systems. Use `Glob()` to find files if you're unsure of the exact name.

**Problem:** Accidentally overwriting files
**Solution:** Always `Read()` before `Write()` or `Edit()` when modifying existing files. Consider making backups before major changes.

**Problem:** Want to see what's in a folder
**Solution:** Use `Glob({"pattern": "path/to/folder/**"})` to list all files recursively.

---

**Remember:** Your Obsidian vault is just a folder of markdown files. Claude Code's file operations give you complete control to read, create, update, search, and organize your knowledge base programmatically. The power comes from combining these operations to automate your knowledge workflow while leveraging Obsidian's excellent linking and visualization capabilities when you open the vault manually.

Happy coding and note-taking! �� 🚀
