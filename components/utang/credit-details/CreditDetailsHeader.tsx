import { memo, type ReactNode } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { CustomerAvatar } from '@/components/customers/CustomerAvatar';

interface CreditDetailsHeaderProps {
  name: string;
  photoUri?: string | undefined;
  subtitle?: string | undefined;
  onBack: () => void;
  /** Trailing action slot, used for the statement share button. */
  action?: ReactNode;
}

// Fixed app bar that keeps the suki's identity in view while lists scroll.
export const CreditDetailsHeader = memo(function CreditDetailsHeader({
  name,
  photoUri,
  subtitle,
  onBack,
  action,
}: CreditDetailsHeaderProps) {
  const { t } = useTranslation('utang');

  return (
    <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-ink-100">
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('detailBack')}
        className="press-scale w-11 h-11 items-center justify-center rounded-full bg-paper-50 border border-ink-100 active:opacity-70"
      >
        <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
      </Pressable>

      <View className="flex-1 flex-row items-center ml-3 mr-2">
        <CustomerAvatar name={name} photoUri={photoUri} size={40} />
        <View className="flex-1 ml-2.5">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-lg"
            numberOfLines={1}
            accessibilityRole="header"
          >
            {name}
          </StyledText>
          <StyledText
            variant="medium"
            className="text-mono text-ink-500"
            numberOfLines={1}
          >
            {subtitle || t('detailNoContact')}
          </StyledText>
        </View>
      </View>

      {action}
    </View>
  );
});
