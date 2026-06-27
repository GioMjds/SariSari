// components/settings/backup/RestoreConfirmDialog.tsx
// Two-step confirm for the destructive restore. Rendered inside the
// RestorePickerModal flow so the user has to tap Confirm twice —
// spec §8 ("⚠ Restoring replaces all current data.").

import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';

type RestoreConfirmDialogProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RestoreConfirmDialog({
  visible,
  onCancel,
  onConfirm,
}: RestoreConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title={t('common:restorePickerConfirmTitle')}
      description={t('common:restorePickerConfirmMessage')}
      icon="exclamation-triangle"
      variant="danger"
      size="sm"
      buttons={[
        {
          text: t('common:cancel'),
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: t('common:restorePickerConfirmAction'),
          style: 'destructive',
          onPress: onConfirm,
        },
      ]}
    />
  );
}
