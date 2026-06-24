# Design Document: Modal Performance & UI/UX Optimization

## Objective

Optimize the performance and user experience of `Alert.alert` and the custom `<Modal>` component in SariSari. Address the laggy entrance feel, lack of exit animations, and heavyweight native overhead.

## The Problem

1. **Native Overlay Instantiation Overhead**: React Native's `<RNModal>` (native `Modal`) creates a completely separate native window hierarchy on the main thread when mounted. Toggling it results in frame drops and transition lag.
2. **Missing Exit Animations**: Since the global store immediately removes modal definitions from state on `closeModal()`, the custom modal components instantly unmount. This cuts off any transitions and makes modals blink out of existence.
3. **Sluggish Reduce-Motion Checks**: Querying `AccessibilityInfo.isReduceMotionEnabled()` asynchronously on every component mount triggers secondary state updates and adds delay to layout transitions.

## Proposed Solution (Approach 1: Unified Dual-Mode Modal)

We will introduce a dual-mode mechanism inside `components/ui/Modal.tsx`.

1. **JS Absolute Overlay (Default for Global Modals)**:
   - For global modals (managed by `useModalStore` and rendered via `GlobalModal.tsx`), we bypass `<RNModal>` entirely.
   - We render a full-screen React Native `View` using `StyleSheet.absoluteFillObject` with high `zIndex` and `elevation` positioned at the root layout context.
   - This eliminates all native controller instantiation lag.
2. **Native Modal Fallback (For Inline/Contained Modals)**:
   - Keep `<RNModal>` wrap capability for inline modals (e.g., `<Modal visible={...}>` in local screen code) that might be clipped by parent layouts. Controlled via `useNativeModal={true}`.
3. **Smooth Transitions with `AnimatePresence`**:
   - Wrap the mapping loop inside `GlobalModal.tsx` in `<AnimatePresence>` from `moti`.
   - Update the overlay backdrop and modal content container to use explicit `from`, `animate`, and `exit` states in `MotiView` for hardware-accelerated fade-in/fade-out and scale transitions.

---

## Technical Specifications

### 1. `components/ui/Modal.tsx` Prop Additions

```typescript
interface CustomModalProps extends Omit<
  RNModalProps,
  'visible' | 'onRequestClose'
> {
  // ... existing props
  useNativeModal?: boolean; // Defaults to true when visible is used inline, false when id (global store) is used.
}
```

### 2. Layout Structure (Conditional wrapper)

```tsx
const ModalContent = (
  <View
    style={StyleSheet.absoluteFill}
    className="justify-center items-center px-6"
  >
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'timing', duration: 200 }}
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: 'rgba(0, 0, 0, 0.4)' },
      ]}
    >
      <Pressable onPress={handleOverlayPress} className="absolute inset-0" />
    </MotiView>
    <MotiView
      from={{ opacity: 0, scale: reducedMotion ? 1 : 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.95 }}
      transition={
        reducedMotion
          ? { type: 'timing', duration: 160 }
          : { type: 'spring', damping: 18, stiffness: 220 }
      }
      className={`bg-white rounded-2xl p-6 ${getSizeClasses()}`}
    >
      {/* Header, title, custom children, and buttons */}
    </MotiView>
  </View>
);

if (finalUseNativeModal) {
  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      {...rest}
    >
      {ModalContent}
    </RNModal>
  );
}

return isVisible ? ModalContent : null;
```

### 3. `components/ui/GlobalModal.tsx` Wrapping

```tsx
import { AnimatePresence } from 'moti';
import { useModalStore } from '@/stores';
import { Modal } from './Modal';

export function GlobalModal() {
  const { modals } = useModalStore();

  return (
    <AnimatePresence>
      {modals.map((modal) => (
        <Modal key={modal.id} id={modal.id} useNativeModal={false} />
      ))}
    </AnimatePresence>
  );
}
```

---

## Verification & Testing Plan

1. **Verification**:
   - Check that calling `Alert.alert(...)` opens and closes with smooth entrance scale-in and exit scale-out transitions without lag.
   - Verify that tapping the backdrop closes the modal safely when `closeOnOverlay` is enabled.
2. **Jest Test Verification**:
   - Run `pnpm test` to ensure that modal store mutations, close events, and rendering do not break.
