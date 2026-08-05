import { StyledText } from '@/components/elements';
import { ReactNode } from 'react';
import { View } from 'react-native';

type MoreGroupSectionProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export function MoreGroupSection({
  title,
  subtitle,
  children,
}: MoreGroupSectionProps) {
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
