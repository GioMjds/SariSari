# Sari Character System

## Overview

**Sari** is the mascot and interactive assistant of the application.

She is an anthropomorphic interpretation of a traditional Filipino **garapon** (glass candy or biscuit jar), the iconic glass container commonly found on the counter of every sari-sari store.

Sari serves as both:

- A visual brand character
- A contextual UI assistant
- A system status indicator
- A feature-specific guide

Her appearance adapts dynamically based on the user's current workflow, making her a functional part of the product experience rather than a decorative mascot.

---

# Character Anatomy

## Core Concept

Sari is designed as a minimalist glass jar with expressive features and subtle personality traits that communicate friendliness, reliability, and local familiarity.

### Silhouette

- Rounded cylindrical glass body
- Large border radius inspired by application card components
- Clean, recognizable shape that remains readable at small sizes

### Facial Features

- Large minimalist eyes
- Simple curved or dot-based expressions
- Cheerful smile using `warm-900`
- Highly expressive without requiring complex illustration

### Lid (Hair)

The jar lid functions as Sari's hair or hat.

**Color:**

```css
primary-600 (Terracotta)
```

This visually anchors her to the application's primary brand identity.

### Glass Body

The transparent jar body serves as a dynamic information surface.

Depending on the active feature, the contents inside the jar change to visually communicate context and application state.

### Limbs

- Thin vector-style arms and legs
- Rounded stroke endings
- Minimal visual complexity

**Color:**

```css
warm-700
```

The limbs allow Sari to:

- Hold tools
- Gesture
- React to system events
- Convey emotional feedback

---

# Dynamic Feature States

Sari changes appearance based on the user's current task.

---

## 📦 Inventory Management

### Context

When users are:

- Tracking inventory
- Managing stock
- Organizing products
- Reviewing categories

### Visual Behavior

Sari becomes organized and analytical.

#### Appearance

- Tiny glasses
- Small clipboard
- Focused expression

#### Body Contents

The jar contains neatly stacked inventory blocks.

**Colors:**

```css
primary-200 (Peach)
secondary-50
```

These communicate:

- Organization
- Stability
- Healthy stock levels

### Low Stock State

#### Appearance

- Standing beside an empty crate
- Alert expression

#### Visual Indicator

A warning symbol appears inside the jar.

**Color:**

```css
semantic-warning (#D97706)
```

---

## 🛒 Fast POS / Sales

### Context

When users are:

- Processing transactions
- Entering products
- Calculating purchases
- Operating the checkout flow

### Visual Behavior

Sari becomes energetic and fast-paced.

#### Appearance

- Jumping
- Waving
- Dynamic movement
- Holding a large coin

#### Body Contents

The jar fills with circular coin-like elements.

**Colors:**

```css
secondary-600 (Sage Green)
semantic-success
```

These communicate:

- Active sales
- Cash flow
- Business growth
- Positive momentum

---

## 📝 Utang Tracking

### Context

When users are:

- Managing customer balances
- Tracking debts
- Reviewing payment histories

### Visual Behavior

Sari becomes supportive and protective.

#### Appearance

- Holding a traditional ledger
- Calm expression
- Helpful posture

#### Body Contents

A minimalist balance chart appears inside the jar.

---

### Outstanding Balance State

#### Colors

```css
primary-500
warm-700
```

#### Design Goal

The visual treatment should remain informative without appearing punitive or alarming.

---

### Cleared Balance State

#### Appearance

- Celebratory pose
- Raised arms
- Positive expression

#### Body Contents

The interior glows with a clean success state.

**Color:**

```css
secondary-50
```

---

# Offline-First System State

One of Sari's most important responsibilities is communicating application reliability.

Because the platform is designed to be **offline-first**, Sari acts as a reassurance mechanism whenever internet connectivity is unavailable.

---

## 🌐 No Internet? Walang Problema!

### Context

When:

- Internet connection is unavailable
- The application continues operating locally

### Visual Behavior

Sari appears calm and confident.

#### Appearance

- Sitting comfortably
- Hugging a database disk
- Hugging a secure storage box

#### Visual Indicators

Large success checkmark.

**Color:**

```css
semantic-success
```

#### Background Surface

```css
surface-subtle (#FFFBEB)
```

### Emotional Message

Sari's expression should communicate:

> "Everything is safe. Your business data is stored locally."

The goal is to reassure store owners that:

- Data remains secure
- Transactions continue working
- Internet outages do not interrupt operations

---

# Visual Design System

## Illustration Style

### Stroke Treatment

Use:

- Clean vector lines
- Consistent stroke widths
- Rounded line caps

**Color:**

```css
warm-900
```

Avoid:

- Complex gradients
- Heavy shadows
- Excessive detail

Favor flat illustration principles that align with the application's design tokens.

---

## Corner Radius

Sari's body should mirror the application's component language.

**Reference:**

```css
borderRadius.card = 16px
```

This ensures visual consistency between:

- UI containers
- Cards
- Modals
- Character design

---

## Color Philosophy

The jar's contents act as a dynamic state display.

Instead of changing Sari's core structure, communicate feature context through:

- Interior shapes
- Fill patterns
- Icons
- Color states

This preserves character recognition while maximizing utility.

---

# Speech & Communication

Whenever Sari speaks through tooltips, onboarding flows, empty states, or system guidance:

## Headers

```css
fontFamily.stack-sans-medium
```

## Body Text

```css
fontFamily.stack-sans
```

### Recommended Sizes

```css
body: 14px
caption: 12px
```

The tone should balance:

- Neighborhood friendliness
- Professional utility
- Technical clarity

---

# Design Principles

Sari should always embody the following traits:

1. **Approachable** - Friendly and welcoming.
2. **Reliable** - Inspires confidence in data safety.
3. **Helpful** - Guides users through workflows.
4. **Efficient** - Reflects fast day-to-day operations.
5. **Offline-First** - Reinforces trust during connectivity issues.
6. **Locally Familiar** - Rooted in Filipino sari-sari store culture.
7. **Minimalist** - Simple enough for small UI placements and scalable across devices.

---

## Character Summary

| Attribute     | Description                           |
| ------------- | ------------------------------------- |
| Name          | Sari                                  |
| Archetype     | Neighborhood Shop Assistant           |
| Base Form     | Traditional Filipino Garapon          |
| Personality   | Friendly, Reliable, Helpful           |
| Core Function | Context-Aware UI Companion            |
| Brand Role    | Mascot + Assistant + Status Indicator |
| Primary Color | Terracotta (`primary-600`)            |
| Design Style  | Minimalist Flat Vector                |
| Key Message   | "Your store is under control."        |
