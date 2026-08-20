import type { ReactNode } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

export type SettingsSectionProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export function SettingsSection({
  title,
  subtitle,
  children,
}: SettingsSectionProps) {
  return (
    <View className="px-5 mt-6">
      {title ? (
        <StyledText
          variant="extrabold"
          className="text-xs uppercase text-ink-400 mb-1"
          style={{ letterSpacing: 1.2 }}
        >
          {title}
        </StyledText>
      ) : null}
      {subtitle ? (
        <StyledText variant="regular" className="text-xs text-ink-500 mb-2">
          {subtitle}
        </StyledText>
      ) : null}
      <View className="bg-paper-50 rounded-2xl border border-paper-300 overflow-hidden">
        {children}
      </View>
    </View>
  );
}

export type SettingsRowProps = {
  label: string;
  value: string;
  subtitle?: string;
  icon?: keyof typeof FontAwesome.glyphMap;
  accessibilityHint?: string;
  interactive?: boolean;
  onPress?: () => void;
};

export function SettingsRow({
  label,
  value,
  subtitle,
  icon,
  accessibilityHint,
  interactive = false,
  onPress,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={interactive ? label : undefined}
      accessibilityHint={interactive ? accessibilityHint : undefined}
      style={{ minHeight: 48 }}
      className="px-4 py-3 border-b border-paper-300 last:border-b-0 flex-row items-center active:opacity-80"
    >
      {icon ? (
        <View className="w-10 h-10 rounded-full bg-paper-100 items-center justify-center mr-3">
          <FontAwesome name={icon} size={16} color="#564E45" />
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
          <StyledText variant="regular" className="text-xs text-ink-500 mt-1">
            {subtitle}
          </StyledText>
        ) : null}
      </View>
      {interactive ? (
        <FontAwesome name="chevron-right" size={14} color="#7A7165" />
      ) : null}
    </Pressable>
  );
}
