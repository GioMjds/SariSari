import { Pressable, ScrollView, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { PRODUCT_FORM_SECTIONS, type ProductFormSectionKey } from './types';

interface ProductFormHeaderProps {
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  active: ProductFormSectionKey;
  onJump: (key: ProductFormSectionKey) => void;
}

/** Back button, title, and a jump strip for the form sections. */
export function ProductFormHeader({ title, subtitle, onBack, active, onJump }: ProductFormHeaderProps) {
  return (
    <View className="bg-background border-b border-paper-300">
      <View className="flex-row items-center px-2 pt-1 pb-2">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-12 h-12 rounded-full items-center justify-center active:bg-paper-100"
        >
          <FontAwesome name="arrow-left" size={18} color="#0E0C0A" />
        </Pressable>
        <View className="flex-1 ml-1">
          <StyledText variant="extrabold" accessibilityRole="header" className="text-ink-900 text-h2">
            {title}
          </StyledText>
          {subtitle ? (
            <StyledText variant="regular" numberOfLines={1} className="text-ink-500 text-xs">
              {subtitle}
            </StyledText>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
      >
        {PRODUCT_FORM_SECTIONS.map(({ key, label }) => {
          const isActive = key === active;
          return (
            <Pressable
              key={key}
              onPress={() => onJump(key)}
              hitSlop={4}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Jump to ${label}`}
              className={`h-9 px-4 rounded-pill justify-center border ${
                isActive ? 'bg-ink-900 border-ink-900' : 'bg-paper-50 border-paper-300 active:bg-paper-100'
              }`}
            >
              <StyledText
                variant="semibold"
                className={`text-sm ${isActive ? 'text-paper-50' : 'text-ink-600'}`}
              >
                {label}
              </StyledText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
