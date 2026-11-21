import { useModalStore } from '@/stores/ModalStore';
import { Modal, ModalButton } from '@/types/ui/Modal.types';
import { AlertButton, AlertOptions } from 'react-native';

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

  const hasDestructive = modalButtons.some((b) => b.style === 'destructive');
  const variant = hasDestructive ? 'danger' : 'info';

  const modalPayload = {
    title,
    buttons: modalButtons,
    variant,
    closeOnOverlay: options?.cancelable ?? true,
    closeOnEscape: options?.cancelable ?? true,
  } as Omit<Modal, 'id'>;

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
