import type { ReactNode } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { StyledText } from '@/components/elements';

/** Shared input surface; error swaps the border to danger. */
export const inputClass = (error?: boolean) =>
  `min-h-[48px] bg-paper-100 border rounded-xl px-4 flex-row items-center ${
    error ? 'border-semantic-danger bg-semantic-danger-50' : 'border-paper-300'
  }`;

export const INPUT_TEXT_CLASS = 'flex-1 py-3 text-ink-900 text-base';
export const PLACEHOLDER_COLOR = '#7A7165';

interface SectionCardProps {
  title: string;
  hint?: string;
  aside?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, hint, aside, children }: SectionCardProps) {
  return (
    <View className="bg-paper-50 rounded-2xl border border-paper-300 p-4 gap-y-4">
      <View className="flex-row items-start">
        <View className="flex-1 pr-3">
          <StyledText
            variant="extrabold"
            accessibilityRole="header"
            className="text-ink-900 text-base"
          >
            {title}
          </StyledText>
          {hint ? (
            <StyledText variant="regular" className="text-ink-500 text-xs mt-0.5">
              {hint}
            </StyledText>
          ) : null}
        </View>
        {aside}
      </View>
      {children}
    </View>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  aside?: ReactNode;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}

/** Label, control, then either the error or the helper text below it. */
export function Field({ label, required, aside, hint, error, children }: FieldProps) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-1.5">
        <StyledText variant="semibold" className="text-ink-700 text-sm">
          {label}
          {required ? (
            <StyledText variant="semibold" className="text-persimmon-600">
              {' *'}
            </StyledText>
          ) : null}
        </StyledText>
        {aside}
      </View>
      {children}
      {error ? (
        <StyledText
          variant="medium"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="text-semantic-danger text-xs mt-1.5"
        >
          {error}
        </StyledText>
      ) : hint ? (
        <StyledText variant="regular" className="text-ink-500 text-xs mt-1.5">
          {hint}
        </StyledText>
      ) : null}
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

/** Full-width tappable switch row so the whole line is the touch target. */
export function ToggleRow({ label, hint, value, onChange }: ToggleRowProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      className="min-h-[48px] flex-row items-center active:opacity-80"
    >
      <View className="flex-1 pr-3">
        <StyledText variant="semibold" className="text-ink-900 text-sm">
          {label}
        </StyledText>
        {hint ? (
          <StyledText variant="regular" className="text-ink-500 text-xs mt-0.5">
            {hint}
          </StyledText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        importantForAccessibility="no"
        trackColor={{ false: '#D8D4C7', true: '#FFC4A8' }}
        thumbColor={value ? '#E85A1F' : '#FAFAF7'}
      />
    </Pressable>
  );
}
