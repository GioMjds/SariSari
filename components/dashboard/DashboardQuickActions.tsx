import { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useTranslation } from 'react-i18next';

interface DashboardQuickActionsProps {
  onNewSale: () => void;
  onAddStock: () => void;
  onRecordPayment: () => void;
}

/**
 * DashboardQuickActions — three large, thumb-friendly buttons.
 *
 * New Sale is the primary persimmon CTA; Add Stock and Record Payment
 * sit alongside as secondary paper cards. They sit just under the
 * hero so the store owner's "what do I do next?" moment resolves in
 * a single tap.
 */
export const DashboardQuickActions = memo(function DashboardQuickActions({
  onNewSale,
  onAddStock,
  onRecordPayment,
}: DashboardQuickActionsProps) {
  const { t } = useTranslation();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay: 160 }}
    >
      <View className="px-4 mb-4">
        {/* Row 1: primary New Sale — full width, persimmon */}
        <TouchableOpacity
          onPress={onNewSale}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={t('common:qaNewSale')}
          className="bg-persimmon-500 rounded-xl py-4 flex-row items-center justify-center press-scale"
        >
          <FontAwesome name="plus-circle" size={20} color="#FBF7EE" />
          <StyledText
            variant="black"
            className="text-paper-50 text-lg ml-2"
            style={{ letterSpacing: 0.3 }}
          >
            {t('common:qaNewSale')}
          </StyledText>
        </TouchableOpacity>

        {/* Row 2: two-up secondary actions */}
        <View className="flex-row gap-2.5 mt-2.5">
          <SecondaryAction
            label={t('common:qaAddStock')}
            icon="cube"
            onPress={onAddStock}
            accessibilityLabel={t('common:qaAddStock')}
          />
          <SecondaryAction
            label={t('common:qaRecordPayment')}
            icon="money"
            onPress={onRecordPayment}
            accessibilityLabel={t('common:qaRecordPayment')}
          />
        </View>
      </View>
    </MotiView>
  );
});

function SecondaryAction({
  label,
  icon,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="flex-1 bg-paper-50 rounded-xl py-4 px-3 flex-row items-center justify-center border border-ink-100 press-scale"
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center mr-2 bg-cinnamon-50"
      >
        <FontAwesome name={icon} size={16} color="#623418" />
      </View>
      <StyledText
        variant="extrabold"
        className="text-ink-900 text-sm"
      >
        {label}
      </StyledText>
    </TouchableOpacity>
  );
}
