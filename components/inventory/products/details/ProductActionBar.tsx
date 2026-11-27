import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

interface ProductActionBarProps {
  onRestock: () => void;
  onAdjust: () => void;
  onDamaged: () => void;
}

// Pinned under every tab so the daily stock actions stay in thumb reach.
export const ProductActionBar = memo(function ProductActionBar({
  onRestock,
  onAdjust,
  onDamaged,
}: ProductActionBarProps) {
  const { t } = useTranslation('inventory');

  return (
    <View className="flex-row items-stretch gap-2 px-4 pt-3 pb-3">
      <Pressable
        onPress={onRestock}
        accessibilityRole="button"
        className="flex-[2] min-h-[52px] rounded-xl bg-persimmon-500 flex-row items-center justify-center active:bg-persimmon-700"
      >
        <Ionicons name="add-circle" size={20} className="text-paper-50" />
        <StyledText
          variant="extrabold"
          className="text-paper-50 text-base ml-2"
          numberOfLines={1}
        >
          {t('logTitle_restock')}
        </StyledText>
      </Pressable>
      <SecondaryAction
        icon="swap-vertical"
        label={t('adjustStock')}
        onPress={onAdjust}
      />
      <SecondaryAction
        icon="warning-outline"
        label={t('movementFilterDamaged')}
        onPress={onDamaged}
        danger
      />
    </View>
  );
});

function SecondaryAction({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-1 min-h-[52px] rounded-xl border border-ink-200 bg-paper-100 items-center justify-center px-1 active:opacity-80"
    >
      <Ionicons
        name={icon}
        size={18}
        className={danger ? 'text-semantic-danger' : 'text-cinnamon-500'}
      />
      <StyledText
        variant="extrabold"
        className={`text-xs mt-0.5 ${danger ? 'text-semantic-danger' : 'text-ink-900'}`}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </StyledText>
    </Pressable>
  );
}
