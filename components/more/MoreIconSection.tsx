import { View } from 'react-native';
import type { ReactNode } from 'react';
import { StyledText } from '@/components/elements';

export type MoreIconSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function MoreIconSection({
  title,
  subtitle,
  children,
}: MoreIconSectionProps) {
  return (
    <View className="px-5 mt-6">
      <StyledText
        variant="extrabold"
        className="text-xs uppercase text-ink-500 mb-2"
        style={{ letterSpacing: 1.6 }}
      >
        {title}
      </StyledText>
      {subtitle ? (
        <StyledText variant="regular" className="text-xs text-ink-400 mb-3">
          {subtitle}
        </StyledText>
      ) : null}
      <View className="bg-paper-50 rounded-2xl border border-warm-100 p-4">
        {children}
      </View>
    </View>
  );
}
