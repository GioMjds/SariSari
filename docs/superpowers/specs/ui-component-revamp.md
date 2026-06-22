# Context

The SariSari UI library has a strong Filipino resibo (receipt) identity already wired into the brand tokens — cream paper surfaces, persimmon primary, sage accent, Stack Sans typography, and dotted/dashed dividers. But the 14 components in components/ui/ execute that identity inconsistently:

- 4 components are dead (Avatar, Dialog, EmptyState, ScreenHeader) — zero call sites in the app, screens reimplement the same primitives inline.
- 4 live components have hardcoded hex colors scattered through the source (Toast.tsx, Modal.tsx, Skeleton.tsx, ReceiptHero.tsx), drifting away from the central palette in tailwind.config.js. Two components use different green hex codes for the "success" tone (Toast = #3D5E1B, Modal = #65A30D).
- Variant naming is inconsistent — Toast has {default, success, error, info, warning}; Modal has {default, success, warning, danger}. error ≠ danger.
- Almost no animation. Only Toast and Skeleton have motion. There are no press states, no focus rings, no entrance choreography on Modal/StatusPill/Pagination/SearchBar/StatusStamp.
- Inconsistent text primitive — some use StyledText (font-stack aware), some use raw Text (bypasses fonts).
- No accessibility roles/labels on icon-only or rotated elements. StatusStamp's transform: rotate confuses VoiceOver; Skeleton has no accessibilityRole="progressbar".
- API drift: Pagination declares totalItems/itemsPerPage but doesn't read them; StatusPill has unused info/neutral/md variants; StatusStamp has unused cinnamon/ink/lg/icon props; MoneyText has unused compact flag and fromPesos is universally passed.

The product is offline-first, used by Filipino sari-sari store owners at the counter, often in airplane mode. Visual identity must remain warm and tactile — the receipt metaphor is the brand. This revamp is a refinement, not a redesign: keep the resibo aesthetic, fix the inconsistencies, add motion and a11y, delete what's dead, and prep tokens for future dark mode without flipping the app dark today.

Goal

Deliver a UI library that feels alive, cohesive, and intentional:

- One unified tone set across Toast, Modal, StatusPill, StatusStamp: {default, success, warning, danger, info}.
- Comprehensive motion (Moti spring entrances, press scales, focus rings) honoring prefers-reduced-motion.
- Zero hardcoded hex in the live components — every color resolves through tailwind.config.js tokens.
- A11y coverage: labels, roles, hit-slop, contrast.
- Dark-mode-ready token palette in tailwind.config.js and global.css; app stays light (no userInterfaceStyle flip).
- 4 dead files deleted. Live components shed dead props and gain a single type-safe API.

Critical files to modify

Token / foundation layer (no consumer changes):

- tailwind.config.js — add dark variants of brand palettes (darkPersimmon-_, darkPaper-_, etc.), expand boxShadow and borderRadius if needed, add new motion-friendly tokens.
- global.css — add dark token CSS variables, add paper-texture-deep and paper-texture-edge variants, add a press-scale utility class and focus-ring utility.

Components to refactor (live, in order):

1. components/ui/Toast.tsx — centralize variant tokens, rename error → danger in the store-driven type, add scale-in entrance via MotiView (already has Moti), wire expo-haptics for the missing variants, replace \* Pressable with Pressable from RN that has active:opacity-70 + active:scale-95, swap hardcoded hex for token classes, add a11y accessibilityRole="alert".
2. components/ui/Modal.tsx — same tone unification, fix the success green to match Toast's sage-600, replace hex icon colors with token classes, add MotiView scale+fade entrance, change TouchableWithoutFeedback to Pressable for the overlay (which already has onPress), add accessibilityViewIsModal and accessibilityLabel, fix the × glyph to use a FontAwesome icon (not font-stack glyph), add a loading button border highlight, allow loading to be set per-button.
3. components/ui/ReceiptHero.tsx — keep the perforation + paper-texture body; replace inline '#EFE6D2' perforations with a bg-paper-200 token, add a Moti mount fade-in, drop the cinnamon tone (unused), expose the Header via a new ReceiptHeroHeader named export so call sites that pass children only (e.g. sale-details) can use it instead of double-rendering the banner. Also update components/sales/SaleRow.tsx to import a shared PerforationRow instead of reimplementing the same 22 circles inline — this is the only consumer change.
4. components/ui/StatusStamp.tsx — drop unused cinnamon and ink tones (they're un-typed) — actually, keep them but stop using bg-paper-100 for the ink tone (use bg-paper-50 or a new bg-ink-50); add a MotiView mount bounce (rotate-in from 0 → final rotate), add accessibilityRole="text" and accessibilityLabel, fix the icon prop to actually render (currently declared, never shown, but is a useful API), keep the asymmetric -8/+6 rotations as-is (they're brand).
5. components/ui/StatusPill.tsx — switch the bg/text/border palettes from stock Tailwind (red-50, amber-50, sky-50) to the unified tone tokens: bg-sage-50/text-sage-700/border-sage-500 for success, bg-cinnamon-50/text-cinnamon-700/border-cinnamon-500 for warning, bg-red-50/text-semantic-danger/border-semantic-danger for danger (or new bg-danger-50/text-danger-700/border-danger-500 if we add a 50/100 to semantic-danger), bg-sky-50/text-semantic-info/border-semantic-info for info, bg-ink-100/text-ink-700/border-ink-300 for neutral. Add Pressable variant via an optional onPress prop, raw Text → StyledText, add a leading dot icon when dot prop is true.
6. components/ui/MoneyText.tsx — drop fromPesos (every call passes it; cents are the AGENTS.md invariant, callers should pass cents directly), drop compact (unused), drop style: any in favor of style?: TextStyle, add fontVariant: ['tabular-nums'] so figures don't jitter when updating, add a currency?: string prop (defaults to '₱') and a smaller currency prefix, broaden the size map to include a true hero (56px) tier, add a MotiView-style fade-in for the display size when value changes.
7. components/ui/Pagination.tsx — drop dead totalItems/itemsPerPage props from the destructuring (keep in type for back-compat but no-op), replace TouchableOpacity with Pressable + active:opacity-70 active:scale-95, add accessibilityLabel="Previous page" / "Next page", animate page-number swap with MotiView key transitions, raise z-[999] to z-[1000] and add useSafeAreaInsets for the bottom offset, change bg-primary-500 to bg-persimmon-500 (token-name consistency) and add a soft persimmon-glow shadow.
8. components/ui/SearchBar.tsx — add a focus state (border-persimmon-300 ring-2 ring-persimmon-100 via focus listener), replace the bare TextInput with one wrapped in Pressable-style focusable container, add accessibilityLabel, add a MotiView micro-fade for the clear button, expose a debounceMs prop with useDeferredValue-style debounce (callsite opt-in, default 0 = no debounce).
9. components/ui/Skeleton.tsx — replace hardcoded '#D2CCC1' with bg-ink-200 (NativeWind class), add an optional shimmer prop (default false) that uses a Reanimated useSharedValue linear gradient sweep (already have RNR 4 wired), add accessibilityRole="progressbar" and accessibilityLabel="Loading", support a circle?: boolean shorthand (sets borderRadius = width / 2).
10. components/ui/GlobalModal.tsx — no visual changes; just verify it still works after Modal's animation upgrades.

Components to delete (4 files, no API consumer in app):

- components/ui/Avatar.tsx
- components/ui/Dialog.tsx
- components/ui/EmptyState.tsx
- components/ui/ScreenHeader.tsx

Also update components/ui/index.ts to remove the four export \* lines.

Type updates (no runtime impact):

- types/ui/Toast.types.ts — rename ToastVariant = 'default' | 'success' | 'error' | 'info' | 'warning' to 'default' | 'success' | 'danger' | 'info' | 'warning'. Update all addToast callers that pass variant: 'error' to pass 'danger' instead. Production call sites identified during exploration: app/onboarding/index.tsx:45 & 65. The test tests/components/ui/Toast.test.tsx will need to update its test.each table ('error' → 'danger', eyebrow 'ERROR' stays 'ERROR', icon 'exclamation-circle' stays).

Root layout:

- app/\_layout.tsx — wrap the children in GestureHandlerRootView from react-native-gesture-handler (already installed at ~2.28.0, never mounted). Required for any future gesture-driven UI and for some Moti/Reanimated integrations.

Reuse: existing utilities and patterns to lean on

- StyledText from @/components/elements — all text nodes in the refactored components should use it. Currently 4 components bypass it with raw Text.
- Perforation pattern in components/sales/SaleRow.tsx:21-41 — extract this into a shared PerforationRow subcomponent (could live in components/ui/ReceiptHero.tsx as an export) and have SaleRow import it. Removes the duplicated PERFORATION_COUNT = 22 and PERFORATION_BG = '#EFE6D2' constants.
- Moti entrance pattern — app/(edit-forms)/sale-details/[id].tsx:142-145 and app/(tabs)/sales/index.tsx:282-285 already use MotiView from={{opacity:0, translateY:18}} animate={{opacity:1, translateY:0}} transition={{type:'timing', duration:480}}. The same idiom is in components/inventory/InventoryRow.tsx:22-29. Codify this as a Moti entranceFadeUp prop on Modal/ReceiptHero/StatusStamp — or just copy the pattern (3 props, 5 lines — too small to abstract).
- useSafeAreaInsets — already used in Toast.tsx:217. Reuse in Pagination.tsx (currently absolute bottom-5 is hard-coded).
- AccessibilityInfo.isReduceMotionEnabled + addEventListener('reduceMotionChanged') — already wired in Toast.tsx:81-98. Reuse the same pattern in Modal and StatusStamp.
- expo-haptics — already a dep at ~15.0.7, mocked in tests/components/ui/Toast.test.tsx:8-18. Add a hapticFor(variant) helper in a new components/ui/\_lib/haptics.ts (so it can be unit-tested like the Toast test does), and call it from Modal/StatusPill/StatusStamp on press.

Token / config changes (the foundation)

In tailwind.config.js:

- Add a dark: companion for each brand color: darkPersimmon-500: '#FF8B5A' (brighter persimmon for dark surfaces), darkSage-500: '#92B662', darkPaper-50: '#28231D', darkInk-900: '#FBF7EE'. (Don't add darkMode: 'class' to the config — just define the tokens for future use. The app stays light.)
- Extend semantic-danger with a 50 and 100: 'semantic-danger-50': '#FDECEC', 'semantic-danger-100': '#FAD8D8'. Same for semantic-warning, semantic-info. This lets StatusPill use the token system rather than stock Tailwind reds.
- Add a font-variant-numeric extension with a tabular value (so MoneyText can add font-tabular-nums).
- Add boxShadow.glow-persimmon (already named persimmon-glow) and boxShadow.glow-sage for symmetry.

In global.css:

- Add CSS variables for the dark-mode tokens: --color-dark-persimmon-500, etc.
- Add a new utility class .press-scale that on :active applies transform: scale(0.97) with a 120ms transition. Use it on the Pagination, StatusPill, SearchBar.
- Add a .focus-ring utility: outline: 2px solid var(--color-persimmon-300); outline-offset: 2px; applied to TextInput when focused.

Sequencing (sequential by component, as you chose)

Phase 1 — Token foundation (single config commit, no consumer edits):

- Edit tailwind.config.js (add dark tokens, semantic 50/100 ramps, font-variant-numeric).
- Edit global.css (dark CSS vars, press-scale, focus-ring).
- Edit app/\_layout.tsx (wrap in GestureHandlerRootView).
- Update types/ui/Toast.types.ts (error → danger).
- Edit all addToast({ variant: 'error' }) call sites to use 'danger'.
- Update tests/components/ui/Toast.test.tsx test.each table accordingly.

Phase 2 — Delete dead code (single commit, easy review):

- Delete Avatar.tsx, Dialog.tsx, EmptyState.tsx, ScreenHeader.tsx.
- Update components/ui/index.ts to drop their export \* lines.
- Run pnpm tsc --noEmit and pnpm test to confirm nothing else imports them.

Phase 3 — Refactor live components (one component per commit, in risk order: least-locked first):

1. Skeleton.tsx — token swap + a11y + circle prop.
2. SearchBar.tsx — focus ring + a11y + optional debounce.
3. StatusPill.tsx — tone unification + dot prop + Pressable.
4. StatusStamp.tsx — token swap + entrance bounce + a11y.
5. MoneyText.tsx — token swap + tabular-nums + drop dead props.
6. Pagination.tsx — Pressable + safe-area + a11y.
7. Modal.tsx — tone unification + token swap + Moti entrance + a11y.
8. Toast.tsx — tone unification + token swap + scale-in + a11y (this is the most-tested component; do last so we have the test patterns from the prior commits).
9. ReceiptHero.tsx — token swap + new PerforationRow export + new ReceiptHeroHeader named export. Update components/sales/SaleRow.tsx to import PerforationRow from ReceiptHero.

Each component commit must include: the source file edit, a tests/components/ui/<Name>.test.tsx (new file for Skeleton, StatusPill, StatusStamp, MoneyText, Pagination, SearchBar, ReceiptHero; updated file for Toast; new file for Modal), and verification of all live call sites via pnpm tsc --noEmit.

Verification

End-to-end checks before declaring done:

1. Type-check: pnpm tsc --noEmit must be clean.
2. Tests: pnpm test must pass, including:

- The existing tests/components/ui/Toast.test.tsx (updated to danger).
- New per-component tests that assert: a11y labels are present, the variant-tone table is consistent, prefers-reduced-motion collapses entrances, the deleted components are not referenced.

3. Lint: pnpm lint.
4. Visual smoke (manual, on simulator): run npx expo start and walk through these flows:

- Inventory tab → load → see Skeleton → see InventoryRow with new StatusPill tones.
- Products tab → type in SearchBar → see focus ring → clear via X button.
- Sales tab → see ReceiptHero hero → see pagination pill at the bottom → flip pages.
- Sale detail screen → see ReceiptHero with StatusStamp rotating in → see ReceiptHeroTotal rendering correctly.
- Delete a product → see Modal with variant="danger", buttons press-scale, Moti entrance.
- Add a product → see success toast appear top-center, auto-dismiss after 4s.
- Add a credit sale → see error-style toast (now danger variant).
- Trigger a destructive confirm → see Modal variant="danger" with persimmon-glow icon chip.

5. Offline check: turn on airplane mode and re-run the smoke list. (No network calls in components/ui/, so this is just a safety net.)
6. Accessibility check: in simulator, enable VoiceOver (Cmd+F5 on iOS) and tab through each screen — every touchable should announce its role and label, every status indicator should be readable.
7. Reduce-motion check: enable Reduce Motion in simulator settings (iOS: Settings → Accessibility → Motion) and reload — toasts, modal, status stamp should all collapse to opacity-only (no translate/scale/rotate).

What we are NOT doing in this revamp

- No dark-mode flip. Tokens are ready; userInterfaceStyle: "light" stays.
- No new font. Stack Sans Text is the only family; we polish usage, we don't add a serif.
- No icon library migration. FontAwesome stays.
- No new components. We refine what's there; we don't add a Tooltip or SegmentedControl etc.
- No breaking changes to public APIs beyond removing documented-dead props (Pagination.totalItems/itemsPerPage are kept in the type but ignored at runtime for back-compat with current call sites).
- No redesign of the receipt metaphor. Receipts stay cream and perforated; the editorial paper-craft direction is a deepening of the existing identity, not a departure.
