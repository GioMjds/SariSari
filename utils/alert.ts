import { useModalStore } from '@/stores/ModalStore';
import { AlertButton, AlertOptions } from 'react-native';
import { ModalButton } from '@/types/ui/Modal.types';

/**
 * This is to replace the default React Native Alert with our custom modal implementation.
 * It uses the same API as the default Alert, but shows a custom modal instead.
 *
 * Alert utility - maps to Modal component which now uses design system tokens
 * Default variant changed from 'default' to 'info' for better semantic meaning
 * Button styling is handled entirely by the Modal component for consistency
 */
const alert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
) => {
  const { openModal } = useModalStore.getState();

  const modalButtons: ModalButton[] = buttons
    ? buttons.map((btn) => ({
        text: btn.text || 'OK',
        style: btn.style,
        onPress: btn.onPress,
      }))
    : [{ text: 'OK', style: 'default' }];

  // Determine variant based on buttons or content
  // If there is a destructive button, set variant to danger
  const hasDestructive = modalButtons.some((b) => b.style === 'destructive');
  const variant = hasDestructive ? 'danger' : 'info';

  openModal({
    title,
    description: message,
    buttons: modalButtons,
    variant,
    closeOnOverlay: options?.cancelable ?? true,
    closeOnEscape: options?.cancelable ?? true,
    onClose: options?.onDismiss,
  });
};

export const Alert = {
  alert,
};
