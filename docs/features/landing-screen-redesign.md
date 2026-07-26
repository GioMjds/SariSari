# SariSari - Home / Landing Screen Design Philosophy

## Core Vision

The Home screen should not be treated as a traditional dashboard.

Instead, it should act as a **Store Assistant** that helps sari-sari store owners know what to do next, complete common tasks quickly, and keep the business running efficiently.

The design should feel like a **premium business companion**, not just an inventory management application.

---

# Primary Design Goals

The Home screen should accomplish four objectives:

1. Guide the user toward the next important action.
2. Reduce the number of taps for frequent workflows.
3. Personalize the experience based on usage.
4. Help first-time users get started without confusion.

---

# Landing Screen Concept

The Home screen combines four UI/UX concepts:

## 1. Goal-Oriented Landing

Focus on what the owner should do **right now**.

Examples:

- Continue Inventory Count
- Open Store
- Resume Today's Sales
- Review Low Stock
- Finish Product Setup
- Generate End-of-Day Report

Instead of asking:

> "What do you want to do?"

The app answers:

> "Here's what you should probably do next."

---

## 2. Quick Actions Hub

Provide one-tap access to the most common daily actions.

Suggested actions:

- New Sale
- Scan Product
- Add Product
- Add Stock
- Record Credit
- Inventory
- Reports

Only include the highest-frequency actions.

---

## 3. Personalized Landing

The Home screen adapts based on user behavior.

Possible personalization:

- Frequently used features
- Frequently sold products
- Recently visited screens
- Favorite actions
- Time of day
- Business habits

Example:

Morning

- Open Store
- Check Low Stock

Afternoon

- Continue Selling
- Scan Product

Evening

- Generate Sales Report
- Backup Data

The app should feel like it understands the owner's workflow.

---

## 4. Empty-State Landing

Every empty state should guide the user toward the next meaningful action.

Examples:

### First Launch

- Welcome
- Add your first product

### No Inventory

- Import products
- Create product manually

### No Sales Today

- Start your first sale

Avoid showing empty charts or blank pages.

---

# Home Screen Architecture

```
Home Screen
│
├── Context Header
├── Goal Card
├── Quick Actions
├── Personalized Section
├── Insights
├── Recent Activity
└── Empty State Controller
```

---

# Section Breakdown

## Context Header

Shows the current business status.

Examples:

- Store Name
- Open / Closed
- Offline Mode
- Last Sync Time

---

## Goal Card (Highest Priority)

Shows the single most important recommendation.

Examples:

- Continue Yesterday's Inventory
- Review Low Stock
- Resume Pending Sales
- Complete Product Setup

This section changes dynamically based on the current business state.

---

## Quick Actions

Persistent shortcuts for daily workflows.

Examples:

- New Sale
- Scan Product
- Add Stock
- Products
- Credits
- Reports

These remain consistent for muscle memory.

---

## Personalized Section

Displays information tailored to the owner's habits.

Examples:

- Frequently Used
- Continue Where You Left Off
- Favorite Products
- Most Used Features

This section evolves over time.

---

## Insights

Provides concise business insights.

Examples:

- Today's Revenue
- Sales Count
- Best Seller
- Low Stock Products
- Pending Credits

Insights should remain actionable rather than purely analytical.

---

## Recent Activity

Allows quick continuation of recent work.

Examples:

- Last Sale
- Recently Edited Product
- Recent Stock Update
- Latest Credit Record

Each activity should be tappable.

---

## Empty State Controller

Determines what the user sees when there is insufficient data.

Examples:

- No Products
- No Sales
- No Reports
- First-Time Setup

Each empty state should include a clear call-to-action.

---

# Information Priority

```
Critical
│
├── Low Stock
├── Sync Problems
├── Backup Errors
│
High
│
├── Goal Card
├── Quick Actions
│
Medium
│
├── Personalized Suggestions
├── Business Insights
│
Low
│
└── Recent Activity
```

Critical business information should always appear before analytics.

---

# Progressive Disclosure

Keep the Home screen lightweight.

Example:

Revenue Today

₱3,450

View Details →

Detailed analytics belong on dedicated pages.

The Home screen should emphasize quick decision-making rather than displaying every available metric.

---

# Design Principles

- Prioritize actions over information.
- Surface only what is immediately useful.
- Reduce cognitive load.
- Minimize taps for common workflows.
- Provide contextual recommendations instead of static shortcuts.
- Personalize the experience through real usage patterns.
- Always guide the user when no data exists.
- Keep insights concise and actionable.

---

# Overall Experience

The Home screen should feel like an intelligent assistant rather than a dashboard.

Instead of merely presenting information, it should continuously answer:

- What should I do next?
- What needs my attention?
- What do I use most often?
- How can I complete this task faster?

The goal is to make SariSari feel like a premium business companion that actively supports sari-sari store owners throughout their daily operations.
