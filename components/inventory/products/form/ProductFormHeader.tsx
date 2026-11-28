import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ICON_COLOR } from '@/lib/theme';
import { StyledText } from '@/components/elements';

interface ProductFormHeaderProps {
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
}

export function ProductFormHeader({
  title,
  subtitle,
  onBack,
}: ProductFormHeaderProps) {
  const { t } = useTranslation('common');
  return (
    <View className="bg-background border-b border-paper-300">
      <View className="flex-row items-center px-2 pt-1 pb-2">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('goBackA11y')}
          className="w-12 h-12 rounded-full items-center justify-center active:bg-paper-100"
        >
          <FontAwesome name="arrow-left" size={18} color={ICON_COLOR.ink} />
        </Pressable>
        <View className="flex-1 ml-1">
          <StyledText
            variant="extrabold"
            accessibilityRole="header"
            className="text-ink-900 text-h2"
          >
            {title}
          </StyledText>
          {subtitle ? (
            <StyledText
              variant="regular"
              numberOfLines={1}
              className="text-ink-500 text-xs"
            >
              {subtitle}
            </StyledText>
          ) : null}
        </View>
      </View>
    </View>
  );
}
