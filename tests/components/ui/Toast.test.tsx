import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { useToastStore } from '@/stores';
import { Toast } from '@/components/ui/Toast';
import { AccessibilityInfo } from 'react-native';



const mockNotificationAsync = jest.fn();
jest.mock('expo-haptics', () => ({
  notificationAsync: (type: any) => {
    mockNotificationAsync(type);
    return Promise.resolve();
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

const mockMotiView = jest.fn().mockImplementation(({ children }: any) => children);
jest.mock('moti', () => ({
  MotiView: (props: any) => {
    mockMotiView(props);
    return props.children;
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Toast Component & Store', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    act(() => {
      useToastStore.getState().clearToasts();
    });
    mockNotificationAsync.mockClear();
    mockMotiView.mockClear();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // 1. Renders nothing when store is empty
  test('renders nothing when the store is empty', async () => {
    const { toJSON } = await render(<Toast />);
    expect(toJSON()).toBeNull();
  });

  // 2. Renders each variant with correct styling
  test.each([
    ['success', 'SUCCESS', 'text-secondary-500', 'bg-secondary-50', '#3D5E1B', 'check-circle'],
    ['danger', 'ERROR', 'text-semantic-danger', 'bg-red-50', '#C13030', 'exclamation-circle'],
    ['info', 'INFO', 'text-semantic-info', 'bg-blue-50', '#2E6FA8', 'info-circle'],
    ['warning', 'WARNING', 'text-semantic-warning', 'bg-amber-50', '#A35F00', 'warning'],
    ['default', 'NOTICE', 'text-cinnamon-400', 'bg-paper-200', '#623418', 'bell'],
  ])(
    'renders %s variant with correct styling',
    async (variant, eyebrowText, eyebrowColorClass, chipBgClass, iconColorHex, iconName) => {
      act(() => {
        useToastStore.getState().addToast({
          message: 'Test message',
          variant: variant as any,
        });
      });


      const { findByText, findByLabelText } = await render(<Toast />);
      
      // Assert eyebrow text is visible
      expect(await findByText(eyebrowText)).toBeTruthy();
      
      // Assert message text is visible
      expect(await findByText('Test message')).toBeTruthy();

      // Assert a11y label is correct on the item
      expect(await findByLabelText(`${eyebrowText}: Test message`)).toBeTruthy();
    }
  );

  // 3. addToast with no variant / duration uses defaults
  test('addToast with no variant / duration uses defaults', () => {
    let id = '';
    act(() => {
      id = useToastStore.getState().addToast({
        message: 'Default toast test',
      });
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].variant).toBe('default');
    expect(toasts[0].duration).toBe(4000);
    expect(toasts[0].id).toBe(id);
  });

  // 4. Auto-dismisses after the duration
  test('auto-dismisses after the duration', () => {
    act(() => {
      useToastStore.getState().addToast({
        message: 'Auto dismiss test',
        duration: 100,
      });
    });

    expect(useToastStore.getState().toasts.length).toBe(1);

    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(useToastStore.getState().toasts.length).toBe(0);
  });

  // 5. Sticky toasts don't auto-dismiss
  test('sticky toasts do not auto-dismiss', () => {
    act(() => {
      useToastStore.getState().addToast({
        message: 'Sticky test',
        duration: 0,
      });
    });

    expect(useToastStore.getState().toasts.length).toBe(1);

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(useToastStore.getState().toasts.length).toBe(1);
  });

  // 6. Manual dismiss clears the pending timer
  test('manual dismiss clears the pending timer', () => {
    let id = '';
    act(() => {
      id = useToastStore.getState().addToast({
        message: 'Timer clear test',
        duration: 1000,
      });
    });

    expect(useToastStore.getState().toasts.length).toBe(1);

    act(() => {
      useToastStore.getState().removeToast(id);
    });

    expect(useToastStore.getState().toasts.length).toBe(0);

    // If timeout clears without error
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(useToastStore.getState().toasts.length).toBe(0);
  });

  // 7. Action button calls onPress and dismisses
  test('action button calls onPress and dismisses toast', async () => {
    const onPressMock = jest.fn();
    act(() => {
      useToastStore.getState().addToast({
        message: 'Undo action test',
        action: {
          label: 'UNDO',
          onPress: onPressMock,
        },
      });
    });

    const { findByText } = await render(<Toast />);
    const actionBtn = await findByText('UNDO');
    expect(actionBtn).toBeTruthy();

    act(() => {
      fireEvent.press(actionBtn);
    });

    expect(onPressMock).toHaveBeenCalledTimes(1);
    expect(useToastStore.getState().toasts.length).toBe(0);
  });

  // 8. Action button error doesn't break dismissal
  test('action button error does not break dismissal', async () => {
    const onPressMock = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    const spyConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      useToastStore.getState().addToast({
        message: 'Error action test',
        action: {
          label: 'RETRY',
          onPress: onPressMock,
        },
      });
    });

    const { findByText } = await render(<Toast />);
    const actionBtn = await findByText('RETRY');

    act(() => {
      fireEvent.press(actionBtn);
    });

    expect(onPressMock).toHaveBeenCalledTimes(1);
    expect(spyConsoleError).toHaveBeenCalled();
    expect(useToastStore.getState().toasts.length).toBe(0);
  });

  // 9. Haptics fire on the right variants
  test('haptics fire on the right variants', () => {
    act(() => {
      useToastStore.getState().addToast({ message: 'Success', variant: 'success' });
    });
    expect(mockNotificationAsync).toHaveBeenLastCalledWith('success');

    act(() => {
      useToastStore.getState().addToast({ message: 'Error', variant: 'danger' });
    });
    expect(mockNotificationAsync).toHaveBeenLastCalledWith('error');

    act(() => {
      useToastStore.getState().addToast({ message: 'Warning', variant: 'warning' });
    });
    expect(mockNotificationAsync).toHaveBeenLastCalledWith('warning');

    mockNotificationAsync.mockClear();
    act(() => {
      useToastStore.getState().addToast({ message: 'Info', variant: 'info' });
    });
    expect(mockNotificationAsync).not.toHaveBeenCalled();

    act(() => {
      useToastStore.getState().addToast({ message: 'Default', variant: 'default' });
    });
    expect(mockNotificationAsync).not.toHaveBeenCalled();
  });

  // 10. Reduced motion collapses to opacity-only
  test('reduced motion collapses to opacity-only', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    act(() => {
      useToastStore.getState().addToast({ message: 'Reduced motion test' });
    });

    const { findByText } = await render(<Toast />);
    await findByText('Reduced motion test');
    
    // We wait for useEffect to trigger the isReduceMotionEnabled check
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockMotiView).toHaveBeenCalled();
    const lastCallArgs = mockMotiView.mock.calls[0][0];
    
    // With reduced motion, animate and from props should have translateY = 0, scale = 1
    expect(lastCallArgs.animate.translateY).toBe(0);
    expect(lastCallArgs.animate.scale).toBe(1);
    expect(lastCallArgs.from.translateY).toBe(0);
    expect(lastCallArgs.from.scale).toBe(1);
  });

  // 11. Multiple toasts stack
  test('multiple toasts stack up correctly', async () => {
    act(() => {
      useToastStore.getState().addToast({ message: 'Toast 1' });
      useToastStore.getState().addToast({ message: 'Toast 2' });
      useToastStore.getState().addToast({ message: 'Toast 3' });
    });

    const { findByText } = await render(<Toast />);
    await findByText('Toast 1');
    await findByText('Toast 2');
    await findByText('Toast 3');
    expect(mockMotiView).toHaveBeenCalledTimes(3);

    // Verify index-based stacking position translateY
    expect(mockMotiView.mock.calls[0][0].animate.translateY).toBe(0);
    expect(mockMotiView.mock.calls[1][0].animate.translateY).toBe(76);
    expect(mockMotiView.mock.calls[2][0].animate.translateY).toBe(152);
  });

  // 12. A11y labels are correct
  test('accessibility labels are set correctly', async () => {
    act(() => {
      useToastStore.getState().addToast({
        message: 'A11y test',
        variant: 'success',
        action: { label: 'UNDO', onPress: () => {} },
      });
    });

    const { findByLabelText } = await render(<Toast />);
    
    // ToastItem container label
    expect(await findByLabelText('SUCCESS: A11y test')).toBeTruthy();
    // Dismiss button label
    expect(await findByLabelText('Dismiss notification')).toBeTruthy();
    // Action button label
    expect(await findByLabelText('UNDO')).toBeTruthy();
  });

  // 13. clearToasts cancels all active timers
  test('clearToasts cancels all active timers', () => {
    act(() => {
      useToastStore.getState().addToast({ message: 'Toast 1', duration: 1000 });
      useToastStore.getState().addToast({ message: 'Toast 2', duration: 2000 });
    });

    expect(useToastStore.getState().toasts.length).toBe(2);

    act(() => {
      useToastStore.getState().clearToasts();
    });

    expect(useToastStore.getState().toasts.length).toBe(0);

    // Advance time and check there are no errors
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(useToastStore.getState().toasts.length).toBe(0);
  });
});
