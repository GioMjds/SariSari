import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { useAppSetting, useSetAppSetting } from '@/hooks/useAppSetting';
import { isOwnerAuthorized } from '@/database/settings';
import { useToastStore } from '@/stores';
import { Alert } from '@/utils';

/**
 * Owner-only control for how long a sale can still be voided or corrected.
 * Lives inside Settings so the only settings route is the one More links to.
 */
export function VoidWindowCard() {
  const { t } = useTranslation('settings');
  const addToast = useToastStore((s) => s.addToast);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const { value, isLoading } = useAppSetting('void_window_hours');
  const { mutateAsync: save, isPending } =
    useSetAppSetting('void_window_hours');
  const [draft, setDraft] = useState<string>('');

  useEffect(() => {
    let active = true;
    isOwnerAuthorized().then((authorized) => {
      if (!active) return;
      setIsOwner(authorized);
      setAuthLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (value !== null && draft === '') setDraft(value);
  }, [value, draft]);

  const onSave = async () => {
    const trimmed = draft.trim();
    const parsed = Number.parseInt(trimmed, 10);
    if (!/^\d+$/.test(trimmed) || !Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert(t('void_window_hours'), t('invalid_hours'));
      return;
    }
    try {
      await save(parsed.toString());
      addToast({ message: t('saved'), variant: 'success' });
    } catch {
      Alert.alert(t('void_window_hours'), t('save_failed'));
    }
  };

  if (authLoading || isLoading) {
    return (
      <View className="items-center p-4">
        <ActivityIndicator color="#623418" />
      </View>
    );
  }

  if (!isOwner) {
    return (
      <View className="p-4">
        <StyledText variant="medium" className="text-sm text-ink-600">
          {t('owner_auth_required')}
        </StyledText>
      </View>
    );
  }

  return (
    <View className="p-4">
      <StyledText variant="semibold" className="mb-2 text-sm text-ink-800">
        {t('void_window_hours')}
      </StyledText>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        keyboardType="number-pad"
        accessibilityLabel={t('void_window_hours')}
        className="mb-2 rounded-xl border border-paper-300 bg-paper-50 p-3 text-base text-ink-900"
      />
      <StyledText variant="regular" className="mb-3 text-sm text-ink-600">
        {t('void_window_help')}
      </StyledText>
      <Pressable
        onPress={onSave}
        disabled={isPending}
        accessibilityRole="button"
        style={{ minHeight: 48 }}
        className="items-center justify-center rounded-2xl bg-cinnamon-500 active:opacity-80 disabled:opacity-50"
      >
        <StyledText variant="extrabold" className="text-base text-paper-50">
          {t('save')}
        </StyledText>
      </Pressable>
    </View>
  );
}
