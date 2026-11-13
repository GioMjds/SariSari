import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { CustomersSubTab } from '@/constants/tabs';
import { formatPesos } from '@/lib';

export type { CustomersSubTab };

export interface CustomersHeaderProps {
  /** Sum of all unpaid utang, in pesos. */
  totalCredit?: number;
  /** Number of suki with an unpaid balance. */
  debtorCount?: number;
  /** Number of suki with utang past its due date. */
  overdueCount?: number;
  /** Payments recorded today, in pesos. */
  collectedToday?: number;
  /** Tapping the Overdue stat jumps to the collection list. */
  onOverduePress?: () => void;
}

interface SummaryStatProps {
  label: string;
  value: string;
  alert?: boolean;
  onPress?: (() => void) | undefined;
  hint?: string;
}

function SummaryStat({
  label,
  value,
  alert = false,
  onPress,
  hint,
}: SummaryStatProps) {
  const body = (
    <>
      <View className="flex-row items-center">
        {alert ? (
          <FontAwesome
            name="exclamation-circle"
            size={14}
            color="#FF9E76"
            style={{ marginRight: 5 }}
          />
        ) : null}
        <StyledText
          variant="extrabold"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          maxFontSizeMultiplier={1.3}
          className={`text-lg ${alert ? 'text-persimmon-300' : 'text-white'}`}
        >
          {value}
        </StyledText>
      </View>
      <View className="flex-row items-center mt-0.5">
        <StyledText
          variant="medium"
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
          className="text-cinnamon-50 text-xs"
        >
          {label}
        </StyledText>
        {onPress ? (
          <FontAwesome
            name="chevron-right"
            size={9}
            color="#F6E3D6"
            style={{ marginLeft: 4 }}
          />
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return <View className="flex-1">{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      {...(hint ? { accessibilityHint: hint } : {})}
      className="flex-1 min-h-11 justify-center active:opacity-70"
    >
      {body}
    </Pressable>
  );
}

export function CustomersHeader({
  totalCredit = 0,
  debtorCount = 0,
  overdueCount = 0,
  collectedToday = 0,
  onOverduePress,
}: CustomersHeaderProps) {
  const { t } = useTranslation('utang');

  return (
    <View className="px-4 pt-1 pb-2">
      <View className="bg-cinnamon-500 rounded-2xl px-4 py-3 shadow-paper">
        <StyledText
          variant="semibold"
          maxFontSizeMultiplier={1.3}
          className="text-cinnamon-50 text-sm"
        >
          {t('summaryTotalLabel')}
        </StyledText>
        <StyledText
          variant="extrabold"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          maxFontSizeMultiplier={1.2}
          className="text-white text-3xl"
        >
          {formatPesos(totalCredit)}
        </StyledText>

        <View className="flex-row gap-3 mt-2 pt-2 border-t border-white/20">
          <SummaryStat
            label={t('summaryWithUtang')}
            value={String(debtorCount)}
          />
          <SummaryStat
            label={t('summaryOverdue')}
            value={String(overdueCount)}
            alert={overdueCount > 0}
            onPress={overdueCount > 0 ? onOverduePress : undefined}
            hint={t('overdueShortcutHint')}
          />
          <SummaryStat
            label={t('summaryCollectedToday')}
            value={formatPesos(collectedToday)}
          />
        </View>
      </View>
    </View>
  );
}
