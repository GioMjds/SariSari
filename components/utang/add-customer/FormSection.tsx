import { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface FormSectionProps {
  icon: ComponentProps<typeof FontAwesome>['name'];
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** FormSection — flat paper card that groups related add-customer fields. */
export function FormSection({ icon, title, subtitle, children }: FormSectionProps) {
  return (
    <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4">
      <View
        className="flex-row items-center mb-4"
        accessible
        accessibilityRole="header"
        accessibilityLabel={`${title}. ${subtitle}`}
      >
        <View className="w-9 h-9 rounded-full bg-paper-100 border border-ink-100 items-center justify-center">
          <FontAwesome name={icon} size={15} color="#564E45" />
        </View>
        <View className="flex-1 ml-3">
          <StyledText variant="extrabold" className="text-ink-900 text-base">
            {title}
          </StyledText>
          <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
            {subtitle}
          </StyledText>
        </View>
      </View>
      <View className="gap-y-4">{children}</View>
    </View>
  );
}
