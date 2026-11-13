import { FC } from 'react';
import { View, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';

interface CustomersEmptyStateProps {
  onAddCustomer?: () => void;
  title?: string;
  description?: string;
}

export const CustomersEmptyState: FC<CustomersEmptyStateProps> = ({
  onAddCustomer,
  title,
  description,
}) => {
  const { t } = useTranslation('utang');

  return (
    <View className="items-center justify-center p-8 mt-4">
      <SariMascot state="utang" size={130} />
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="text-ink-800 text-lg mt-4 text-center"
      >
        {title ?? t('emptyTitle')}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm mt-1.5 text-center leading-5 px-4"
      >
        {description ?? t('emptyDescription')}
      </StyledText>

      {onAddCustomer && (
        <Pressable
          onPress={onAddCustomer}
          accessibilityRole="button"
          className="mt-5 min-h-12 px-6 bg-persimmon-600 rounded-full flex-row items-center justify-center active:bg-persimmon-700"
        >
          <FontAwesome
            name="user-plus"
            size={14}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <StyledText variant="extrabold" className="text-white text-sm">
            {t('emptyAddButton')}
          </StyledText>
        </Pressable>
      )}
    </View>
  );
};
