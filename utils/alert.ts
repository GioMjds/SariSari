import { useModalStore } from '@/stores/ModalStore';
import { AlertButton, AlertOptions } from 'react-native';
import { Modal, ModalButton } from '@/types/ui/Modal.types';

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
    ? buttons.map((btn) => {
        const item: ModalButton = {
          text: btn.text || 'OK',
          style: btn.style ?? 'default',
        };
        if (btn.onPress) {
          item.onPress = () => btn.onPress?.();
        }
        return item;
      })
    : [{ text: 'OK', style: 'default' }];

  // Determine variant based on buttons or content
  // If there is a destructive button, set variant to danger
  const hasDestructive = modalButtons.some((b) => b.style === 'destructive');
  const variant = hasDestructive ? 'danger' : 'info';

  const modalPayload: Omit<Modal, 'id'> = {
    title,
    buttons: modalButtons,
    variant,
    closeOnOverlay: options?.cancelable ?? true,
    closeOnEscape: options?.cancelable ?? true,
  };

  if (message !== undefined) {
    modalPayload.description = message;
  }
  if (options?.onDismiss) {
    modalPayload.onClose = options.onDismiss;
  }

  openModal(modalPayload);
};

export const Alert = {
  alert,
};
