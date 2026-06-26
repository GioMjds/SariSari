import { StyledText } from '@/components/elements';
import { useProfile } from '@/hooks/useProfile';
import { FontAwesome } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

/**
 * SettingsScreen — what the app actually does today, plus the shape of
 * features coming next.
 *
 * Sections:
 *   1. Store           — store name + owner name (live, from onboarding profile).
 *   2. Coming soon     — Backup / Restore / Export / Language. These are real
 *                        features that need design and a privacy review before
 *                        they ship, so they render as interactive rows that
 *                        explain what they will do and acknowledge the user
 *                        with a friendly alert. No fake success state.
 *
 * This component is rendered by both `/settings` (the regular route) and
 * `/(edit-forms)/settings` (the modal route), so the visual layer lives
 * here and the route folders decide presentation (modal vs full screen).
 */
export const SettingsScreen = () => {
  const { profile, loading: profileLoading } = useProfile();

  const stub = useCallback((label: string) => {
    Alert.alert(
      `${label} — coming soon`,
      "This feature isn't wired up yet. It's on the roadmap and will ship once the data flow and privacy story are settled.",
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-paper-200">
        {/* Header */}
        <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              {router.canGoBack() && (
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  className="w-8 h-8 items-center justify-center rounded-full bg-paper-50/15 active:opacity-70"
                >
                  <FontAwesome name="arrow-left" size={14} color="#FBF7EE" />
                </Pressable>
              )}
            </View>
          </View>
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <StyledText
                variant="extrabold"
                className="text-h1 text-paper-50 text-3xl"
                style={{ letterSpacing: -0.28 }}
              >
                Settings
              </StyledText>
              <StyledText
                variant="regular"
                className="text-sm text-paper-200 opacity-90 mt-1"
              >
                Store and upcoming features
              </StyledText>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
          {/* Section 1 — Store */}
          <SettingsSection
            title="Store"
            subtitle="From your onboarding profile"
          >
            <SettingsRow
              label="Store name"
              value={profileLoading ? 'Loading…' : (profile?.storeName ?? '—')}
              icon="home"
            />
            <SettingsRow
              label="Owner name"
              value={profileLoading ? 'Loading…' : (profile?.ownerName ?? '—')}
              icon="user"
            />
          </SettingsSection>

          {/* Section 2 — Coming soon */}
          <SettingsSection
            title="Coming soon"
            subtitle="On the roadmap — taps acknowledge the feature isn't wired up yet"
          >
            <SettingsRow
              label="Backup Data"
              value="Not yet available"
              icon="cloud-upload"
              interactive
              onPress={() => stub('Backup Data')}
            />
            <SettingsRow
              label="Restore Data"
              value="Not yet available"
              icon="cloud-download"
              interactive
              onPress={() => stub('Restore Data')}
            />
            <SettingsRow
              label="Export Store Data"
              value="Not yet available"
              icon="share-square-o"
              interactive
              onPress={() => stub('Export Store Data')}
            />
            <SettingsRow
              label="Language"
              value="English (more coming)"
              icon="globe"
              interactive
              onPress={() => stub('Language')}
            />
            <SettingsRow
              label="Export Backup"
              value="Not yet available"
              icon="archive"
              interactive
              onPress={() => stub('Export Backup')}
            />
          </SettingsSection>

          <View className="px-6 pt-2 pb-6">
            <StyledText
              variant="regular"
              className="text-xs text-ink-400 text-center"
            >
              SariSari — a working prototype.
            </StyledText>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

type SettingsSectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

function SettingsSection({ title, subtitle, children }: SettingsSectionProps) {
  return (
    <View className="px-5 mt-6">
      <StyledText
        variant="extrabold"
        className="text-xs uppercase text-ink-400 mb-1"
        style={{ letterSpacing: 1.2 }}
      >
        {title}
      </StyledText>
      {subtitle ? (
        <StyledText variant="regular" className="text-xs text-ink-400 mb-2">
          {subtitle}
        </StyledText>
      ) : null}
      <View className="bg-paper-50 rounded-2xl border border-warm-100 overflow-hidden">
        {children}
      </View>
    </View>
  );
}

type SettingsRowProps = {
  label: string;
  value: string;
  subtitle?: string;
  icon?: string;
  interactive?: boolean;
  onPress?: () => void;
};

function SettingsRow({
  label,
  value,
  subtitle,
  icon,
  interactive,
  onPress,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      className="px-4 py-3 border-b border-warm-100 last:border-b-0 flex-row items-center active:opacity-80"
    >
      {icon ? (
        <View className="w-9 h-9 rounded-full bg-warm-100 items-center justify-center mr-3">
          <FontAwesome name={icon as any} size={15} color="#623418" />
        </View>
      ) : null}
      <View className="flex-1">
        <StyledText variant="semibold" className="text-sm text-ink-700">
          {label}
        </StyledText>
        <StyledText variant="regular" className="text-sm text-ink-500 mt-0.5">
          {value}
        </StyledText>
        {subtitle ? (
          <StyledText variant="regular" className="text-xs text-ink-400 mt-1">
            {subtitle}
          </StyledText>
        ) : null}
      </View>
      {interactive ? (
        <FontAwesome name="chevron-right" size={14} color="#9C8E7E" />
      ) : null}
    </Pressable>
  );
}
