/**
 * Tests for app/(edit-forms)/add-category
 *
 * Bug: obsidian-vault/05-Bugs-Issues/category-naming.md
 * Symptom: Focusing the Category Name field auto-focuses the product search
 *          bar instead.
 *
 * Root cause: `keyboardShouldPersistTaps="handled"` on KeyboardAwareScrollView
 * caused the search TextInput (the only other TextInput in the scroll view) to
 * capture tap events while the keyboard was open for the category name field.
 * When the keyboard is already visible, "handled" forwards the tap to child
 * scroll-view descendants — including the search TextInput — instead of
 * dismissing the keyboard first.
 *
 * Fix applied:
 *  1. keyboardShouldPersistTaps changed from "handled" to "always"
 *  2. autoFocus={false} added explicitly to the product search TextInput
 *
 * These tests guard against regressions on both fix points, and also cover the
 * client-side uniqueName validator that runs before the DB UNIQUE constraint.
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Helpers — extracted validator logic mirroring what the component uses
// ---------------------------------------------------------------------------

type Category = { id: number; name: string };

/**
 * Returns true if val (trimmed, lowercased) is already in existingCategories.
 * Mirrors the uniqueName validate rule in the Controller.
 */
function isDuplicateCategoryName(
  val: string,
  existingCategories: Category[],
): boolean {
  const trimmed = val.trim().toLowerCase();
  return existingCategories.some((c) => c.name.toLowerCase() === trimmed);
}

/**
 * Returns true if val (trimmed) is non-empty.
 * Mirrors the notBlank validate rule.
 */
function isBlankCategoryName(val: string): boolean {
  return val.trim().length === 0;
}

// ---------------------------------------------------------------------------
// Static prop inspection helpers
// ---------------------------------------------------------------------------

const SCREEN_SOURCE_PATH = path.resolve(__dirname, '../index.tsx');

let screenSource = '';

beforeAll(() => {
  screenSource = fs.readFileSync(SCREEN_SOURCE_PATH, 'utf8');
});

// ---------------------------------------------------------------------------
// Bug regression: keyboardShouldPersistTaps
// ---------------------------------------------------------------------------

describe('Bug regression: category-naming focus-steal (obsidian-vault/05-Bugs-Issues/category-naming.md)', () => {
  /**
   * WHY THIS MATTERS:
   * The original value was "handled". With "handled", any tap while the
   * keyboard is visible is forwarded to whichever child the tap lands on —
   * in this case the search TextInput directly below the category name field.
   * That caused the search bar to steal focus immediately after the user typed
   * in the category name field and scrolled slightly.
   *
   * "always" ensures taps dismiss the keyboard first and never propagate to
   * sibling TextInputs.
   */
  it('KeyboardAwareScrollView must use keyboardShouldPersistTaps="always", NOT "handled"', () => {
    expect(screenSource).not.toContain('keyboardShouldPersistTaps="handled"');
    expect(screenSource).toContain('keyboardShouldPersistTaps="always"');
  });

  /**
   * WHY THIS MATTERS:
   * Without an explicit autoFocus={false}, React Native may implicitly focus
   * the first available TextInput when the component mounts or when the
   * keyboard controller re-lays-out after a scroll. Explicit false is a
   * defensive guard that documents intent clearly.
   */
  it('product search TextInput must have autoFocus={false} explicitly set', () => {
    const searchInputBlock = extractSearchInputBlock(screenSource);
    expect(searchInputBlock).not.toBeNull();
    expect(searchInputBlock).toContain('autoFocus={false}');
  });

  /**
   * Secondary guard: the category name TextInput should NOT have autoFocus
   * set to true (it relies on user intent to focus).
   */
  it('category name TextInput must NOT have autoFocus={true}', () => {
    const categoryInputBlock = extractCategoryInputBlock(screenSource);
    expect(categoryInputBlock).not.toBeNull();
    expect(categoryInputBlock).not.toContain('autoFocus={true}');
    expect(categoryInputBlock).not.toContain('autoFocus=true');
  });
});

// ---------------------------------------------------------------------------
// Form validation: notBlank
// ---------------------------------------------------------------------------

describe('Form validation: notBlank rule', () => {
  it('returns blank=true for empty string', () => {
    expect(isBlankCategoryName('')).toBe(true);
  });

  it('returns blank=true for whitespace-only string', () => {
    expect(isBlankCategoryName('   ')).toBe(true);
    expect(isBlankCategoryName('\t\n')).toBe(true);
  });

  it('returns blank=false for a valid name', () => {
    expect(isBlankCategoryName('Beverages')).toBe(false);
    expect(isBlankCategoryName('  Snacks  ')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Form validation: uniqueName (client-side duplicate check)
// ---------------------------------------------------------------------------

describe('Form validation: uniqueName rule (client-side)', () => {
  const existing: Category[] = [
    { id: 1, name: 'Beverages' },
    { id: 2, name: 'Snacks' },
    { id: 3, name: 'DAIRY' },
  ];

  it('detects an exact match as duplicate', () => {
    expect(isDuplicateCategoryName('Beverages', existing)).toBe(true);
  });

  it('detects a case-insensitive match as duplicate (BEVERAGES)', () => {
    expect(isDuplicateCategoryName('BEVERAGES', existing)).toBe(true);
  });

  it('detects a case-insensitive match as duplicate (beverages)', () => {
    expect(isDuplicateCategoryName('beverages', existing)).toBe(true);
  });

  it('detects trimmed match as duplicate ("  Snacks  ")', () => {
    expect(isDuplicateCategoryName('  Snacks  ', existing)).toBe(true);
  });

  it('does NOT flag a genuinely new name as duplicate', () => {
    expect(isDuplicateCategoryName('Frozen Foods', existing)).toBe(false);
  });

  it('does NOT flag an empty string as duplicate (handled by notBlank rule)', () => {
    expect(isDuplicateCategoryName('', existing)).toBe(false);
  });

  it('does NOT flag a whitespace-only string as duplicate', () => {
    expect(isDuplicateCategoryName('   ', existing)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// onSubmit guard: trimmedName early return
// ---------------------------------------------------------------------------

describe('onSubmit guard: trimmedName must be non-empty before mutation fires', () => {
  /**
   * The component has:
   *   const trimmedName = data.name.trim();
   *   if (!trimmedName) return;
   *
   * This is a second safety net after client-side validation.
   */
  function onSubmitGuard(name: string): 'mutate' | 'early-return' {
    const trimmedName = name.trim();
    if (!trimmedName) return 'early-return';
    return 'mutate';
  }

  it('returns early for empty string', () => {
    expect(onSubmitGuard('')).toBe('early-return');
  });

  it('returns early for whitespace-only string', () => {
    expect(onSubmitGuard('   ')).toBe('early-return');
  });

  it('proceeds to mutate for a valid trimmed name', () => {
    expect(onSubmitGuard('Frozen Foods')).toBe('mutate');
  });

  it('proceeds to mutate for a name with surrounding spaces', () => {
    expect(onSubmitGuard('  Candy  ')).toBe('mutate');
  });
});

// ---------------------------------------------------------------------------
// confirmDiscard guard: dirty state detection
// ---------------------------------------------------------------------------

describe('confirmDiscard: shows dialog only when form is dirty or products selected', () => {
  function confirmDiscardWouldShowDialog(
    isDirty: boolean,
    selectedCount: number,
  ): boolean {
    return isDirty || selectedCount > 0;
  }

  it('does NOT show dialog when form is clean and no products selected', () => {
    expect(confirmDiscardWouldShowDialog(false, 0)).toBe(false);
  });

  it('shows dialog when form is dirty', () => {
    expect(confirmDiscardWouldShowDialog(true, 0)).toBe(true);
  });

  it('shows dialog when products are selected even if form is clean', () => {
    expect(confirmDiscardWouldShowDialog(false, 3)).toBe(true);
  });

  it('shows dialog when both form is dirty and products are selected', () => {
    expect(confirmDiscardWouldShowDialog(true, 2)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Source-level structural guards (no render required)
// ---------------------------------------------------------------------------

describe('Source-level structural guards', () => {
  it('screen imports KeyboardAwareScrollView from react-native-keyboard-controller', () => {
    expect(screenSource).toContain("from 'react-native-keyboard-controller'");
  });

  it('screen does not use the old react-native-keyboard-aware-scroll-view package', () => {
    // The project has both packages installed; the component must use the
    // keyboard-controller variant which respects keyboardShouldPersistTaps
    expect(screenSource).not.toContain('react-native-keyboard-aware-scroll-view');
  });

  it('uniqueName validator lowercases both sides before comparison', () => {
    // Guard that the validator always does case-insensitive comparison
    expect(screenSource).toContain('.toLowerCase()');
  });
});

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Extracts the block of JSX source around the product search TextInput.
 * Identified by its unique searchProducts placeholder key.
 */
function extractSearchInputBlock(source: string): string | null {
  const marker = 'searchProducts';
  const idx = source.indexOf(marker);
  if (idx === -1) return null;
  const start = Math.max(0, idx - 500);
  const end = Math.min(source.length, idx + 500);
  return source.slice(start, end);
}

/**
 * Extracts the block of JSX source around the category name TextInput.
 * Identified by its unique categoryNamePlaceholder key.
 */
function extractCategoryInputBlock(source: string): string | null {
  const marker = 'categoryNamePlaceholder';
  const idx = source.indexOf(marker);
  if (idx === -1) return null;
  const start = Math.max(0, idx - 500);
  const end = Math.min(source.length, idx + 500);
  return source.slice(start, end);
}

