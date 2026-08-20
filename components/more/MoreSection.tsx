import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';

export type MoreSectionProps = {
  label?: string;
  children: ReactNode;
};

export function MoreSection({ label, children }: MoreSectionProps) {
  return (
    <View className="mt-6">
      {label ? (
        <StyledText
          variant="extrabold"
          className="mb-2 text-xs uppercase text-ink-500"
          style={{ letterSpacing: 1.2 }}
        >
          {label}
        </StyledText>
      ) : null}
      <View className="gap-2">{children}</View>
    </View>
  );
}
