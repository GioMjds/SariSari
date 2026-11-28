import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import {
  useNearExpiryDays,
  useSetAppSetting,
} from '@/hooks/useAppSetting';
import { productKeys } from '@/hooks/useProducts';
import { useToastStore } from '@/stores';
import { Alert } from '@/utils';

/** Store-wide days-before-expiry at which a product shows as near expiry. */
export function NearExpiryDaysCard() {
  const { t } = useTranslation('settings');
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const days = useNearExpiryDays();
  const { mutateAsync: save, isPending } = useSetAppSetting('near_expiry_days');
  const [draft, setDraft] = useState<string>('');

  useEffect(() => {
    if (draft === '') setDraft(String(days));
  }, [days, draft]);

  const onSave = async () => {
    const trimmed = draft.trim();
    const parsed = Number.parseInt(trimmed, 10);
    if (!/^\d+$/.test(trimmed) || parsed <= 0 || parsed > 365) {
      Alert.alert(t('near_expiry.title'), t('near_expiry.invalid'));
      return;
    }
    try {
      await save(parsed.toString());
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      addToast({ message: t('saved'), variant: 'success' });
    } catch {
      Alert.alert(t('near_expiry.title'), t('save_failed'));
    }
  };

  return (
    <View className="p-4">
      <StyledText variant="semibold" className="mb-2 text-sm text-ink-800">
        {t('near_expiry.title')}
      </StyledText>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        keyboardType="number-pad"
        accessibilityLabel={t('near_expiry.title')}
        className="mb-2 rounded-xl border border-paper-300 bg-paper-50 p-3 text-base text-ink-900"
      />
      <StyledText variant="regular" className="mb-3 text-sm text-ink-600">
        {t('near_expiry.help')}
      </StyledText>
      <Pressable
        onPress={onSave}
        disabled={isPending}
        accessibilityRole="button"
        style={{ minHeight: 48 }}
        className="items-center justify-center rounded-2xl bg-cinnamon-500 active:opacity-80 disabled:opacity-50"
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <StyledText variant="extrabold" className="text-base text-paper-50">
            {t('save')}
          </StyledText>
        )}
      </Pressable>
    </View>
  );
}
