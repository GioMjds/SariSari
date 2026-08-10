import { Alert } from '@/utils/alert';
import { useModalStore } from '@/stores/ModalStore';

describe('Alert utility', () => {
  beforeEach(() => {
    useModalStore.getState().closeAllModals();
  });

  it('opens modal with default OK button and info variant', () => {
    Alert.alert('Test Title', 'Test Message');

    const modals = useModalStore.getState().modals;
    expect(modals).toHaveLength(1);
    expect(modals[0]).toMatchObject({
      title: 'Test Title',
      description: 'Test Message',
      variant: 'info',
      buttons: [{ text: 'OK', style: 'default' }],
      closeOnOverlay: true,
      closeOnEscape: true,
    });
  });

  it('sets danger variant when destructive button is present', () => {
    const onPressMock = jest.fn();
    Alert.alert(
      'Delete Item',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onPressMock },
      ]
    );

    const modals = useModalStore.getState().modals;
    expect(modals).toHaveLength(1);
    expect(modals[0]?.variant).toBe('danger');
    expect(modals[0]?.buttons).toHaveLength(2);
    expect(modals[0]?.buttons?.[0]).toEqual({ text: 'Cancel', style: 'cancel' });
    expect(modals[0]?.buttons?.[1]?.text).toBe('Delete');
    expect(modals[0]?.buttons?.[1]?.style).toBe('destructive');

    // Test calling onPress
    modals[0]?.buttons?.[1]?.onPress?.();
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('respects cancelable and onDismiss options', () => {
    const onDismissMock = jest.fn();
    Alert.alert(
      'Notice',
      'Non-cancelable notice',
      [{ text: 'OK' }],
      { cancelable: false, onDismiss: onDismissMock }
    );

    const modals = useModalStore.getState().modals;
    expect(modals).toHaveLength(1);
    expect(modals[0]?.closeOnOverlay).toBe(false);
    expect(modals[0]?.closeOnEscape).toBe(false);
    expect(modals[0]?.onClose).toBe(onDismissMock);
  });
});
