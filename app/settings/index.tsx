import { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Alert } from '@/utils';
import { useTranslation } from 'react-i18next';
import { FontAwesome } from '@expo/vector-icons';
import { useAppSetting, useSetAppSetting } from '@/hooks/useAppSetting';
import { isOwnerAuthorized } from '@/database/settings';
import { useToastStore } from '@/stores';
import { StyledText } from '@/components/elements';

export default function SettingsScreen() {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const addToast = useToastStore((s) => s.addToast);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

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

  const { value, isLoading } = useAppSetting('void_window_hours');
  const { mutateAsync: save, isPending } =
    useSetAppSetting('void_window_hours');
  const [draft, setDraft] = useState<string>('');

  useEffect(() => {
    if (value !== null && draft === '') {
      setDraft(value);
    }
  }, [value, draft]);

  const onSave = async () => {
    if (!isOwner) {
      Alert.alert(t('title'), t('owner_auth_required'));
      return;
    }
    const trimmed = draft.trim();
    const parsed = Number.parseInt(trimmed, 10);
    if (!/^\d+$/.test(trimmed) || !Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert(t('title'), t('invalid_hours'));
      return;
    }
    try {
      await save(parsed.toString());
      addToast({ message: t('saved'), variant: 'success' });
    } catch {
      Alert.alert(t('title'), t('save_failed'));
    }
  };

  if (authLoading || isLoading) {
    return (
      <View className="flex-1 bg-paper-200 items-center justify-center">
        <ActivityIndicator size="large" color="#623418" />
      </View>
    );
  }

  if (!isOwner) {
    return (
      <View className="flex-1 bg-paper-200 items-center justify-center p-6">
        <StyledText
          variant="semibold"
          className="text-ink-500 text-base text-center"
        >
          {t('owner_auth_required')}
        </StyledText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-paper-200">
      {/* Cinnamon Header */}
      <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
        <View className="flex-row items-center justify-between mb-3">
          {router.canGoBack() ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={tCommon('settingsGoBackA11y')}
              className="w-8 h-8 items-center justify-center rounded-full bg-paper-50/15 active:opacity-70"
            >
              <FontAwesome name="arrow-left" size={14} color="#FBF7EE" />
            </Pressable>
          ) : (
            <View />
          )}
        </View>
        <StyledText
          variant="extrabold"
          className="text-h1 text-paper-50 text-3xl"
          style={{ letterSpacing: -0.28 }}
        >
          {t('title')}
        </StyledText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="bg-paper-50 p-4 rounded-2xl border border-warm-100 mb-6">
          <StyledText variant="semibold" className="text-sm text-ink-700 mb-1">
            {t('void_window_hours')}
          </StyledText>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            keyboardType="number-pad"
            className="border border-warm-200 rounded-xl p-3 bg-paper-50 text-ink-700 text-base mb-2 font-medium"
            accessibilityLabel={t('void_window_hours')}
          />
          <StyledText variant="regular" className="text-xs text-ink-400">
            {t('void_window_help')}
          </StyledText>
        </View>

        <Pressable
          onPress={onSave}
          disabled={isPending}
          className="bg-cinnamon-500 p-4 rounded-2xl items-center active:opacity-80 disabled:opacity-50"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-base">
            {t('save')}
          </StyledText>
        </Pressable>
      </ScrollView>
    </View>
  );
}
