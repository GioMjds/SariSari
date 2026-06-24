# Implementation Plan: Modal Performance & UI/UX Optimization

## Overview

Decompose the implementation of the dual-mode custom modal component, transitioning the global modal alert system to a high-performance JS absolute overlay using `AnimatePresence` for smooth entrance/exit transitions, and preserving the native `RNModal` container fallback for inline modals.

## Architecture Decisions

- **AnimatePresence Integration**: We wrap the modal rendering iteration inside `GlobalModal.tsx` with `AnimatePresence` from `moti` to maintain modal elements in the React tree during fade-out and scale-out exit transitions.
- **Root JS Overlay**: Global modals will render an absolute fill screen-sized `View` placed in the root tree layout. This avoids the heavy performance cost of React Native's `<RNModal>` native window creation.
- **Native Modal Fallback**: Inline modals rendered directly within specific screens will default to `useNativeModal={true}` to prevent rendering and clipping issues in nested parent views.

---

## Task List

### Phase 1: Custom Modal Component Refactoring

- [ ] **Task 1**: Refactor `components/ui/Modal.tsx` to support conditional rendering of a JS absolute overlay when `useNativeModal` is `false`. Define exit animations in the `MotiView` containers.
- [ ] **Task 2**: Update `components/ui/GlobalModal.tsx` to import `<AnimatePresence>` from `moti`, wrap the modal rendering iteration with it, and pass `useNativeModal={false}` to the `<Modal>` instances.

### Checkpoint 1: Foundations & Rendering Flow

- [ ] Code builds without compilation errors
- [ ] Global modals render and unmount cleanly through store calls
- [ ] Inline native modals render correctly

### Phase 2: Polish & Verification

- [ ] **Task 3**: Run Jest test suites to ensure that mock setups and modal lifecycle interactions continue to pass.
- [ ] **Task 4**: Perform manual verification of exit animations and backdrop tap gestures.

### Checkpoint 2: Polish

- [ ] Both entrance and exit transitions run smoothly at full frame rate
- [ ] All tests pass: `pnpm test`

---

## Detail Breakdown of Tasks

### Task 1: Refactor `components/ui/Modal.tsx`

- **Description**: Add `useNativeModal?: boolean` to `CustomModalProps`. Define modal rendering layout inside a unified `ModalContent` container. Render it directly as a JS layout when `useNativeModal={false}` (positioning it absolutely with high zIndex and elevation). Otherwise, wrap it in `<RNModal>` as it was originally. Add `exit` animations to both the backdrop and card Moti views.
- **Acceptance criteria**:
  - `useNativeModal` defaults to `false` when `id` is present (global store), and `true` when `visible` is controlled manually.
  - Backdrop and card container contain entry (`from`), layout (`animate`), and exit (`exit`) animations.
- **Verification**:
  - Code compiles without TypeScript errors.
- **Files likely touched**:
  - `components/ui/Modal.tsx`
- **Estimated scope**: Small (1 file)

### Task 2: Update `components/ui/GlobalModal.tsx`

- **Description**: Import `<AnimatePresence>` from `moti`. Wrap the `modals.map` iteration with `<AnimatePresence>` so that unmounted modals can finish their scale-out/fade-out animations. Pass `useNativeModal={false}` to each mapped `<Modal>` instance.
- **Acceptance criteria**:
  - Global modals are mapped inside `<AnimatePresence>`.
  - Global modals are explicitly configured with `useNativeModal={false}`.
- **Verification**:
  - Code compiles cleanly.
- **Files likely touched**:
  - `components/ui/GlobalModal.tsx`
- **Estimated scope**: Small (1 file)

### Task 3: Test Verification

- **Description**: Run the existing Jest test suite to check that the modal store and overlay rendering mocks behave correctly.
- **Acceptance criteria**:
  - All Jest tests pass.
- **Verification**:
  - Run `pnpm test` and verify that the tests complete with 0 failures.
- **Estimated scope**: XS (Config / commands)

### Task 4: Polish & Manual check

- **Description**: Verify the visual and touch behavior of the modal transitions. Ensure backdrop tap cancels/closes the modal, and the loading indicator behaves as expected.
- **Acceptance criteria**:
  - Scale-in entrance is spring-based and smooth.
  - Fade-out/scale-out exit triggers when confirming or canceling a modal.
- **Verification**:
  - Manual verification.
- **Estimated scope**: XS

---

## Risks and Mitigations

| Risk                            | Impact | Mitigation                                                                                                                                                                |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parent clipping for JS overlay  | Low    | Root rendering for global modals (`GlobalModal` is placed at the very bottom of the layout inside `_layout.tsx`) ensures no parent clipping can happen for global modals. |
| Z-index / elevation overlapping | Low    | Assign a large zIndex (e.g. `zIndex: 50` or higher) and elevation to match the stack overlay order.                                                                       |
