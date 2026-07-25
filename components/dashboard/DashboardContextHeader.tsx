import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';

export interface DashboardContextHeaderProps {
  subtitle?: string;
  hasStockRisk: boolean;
  cashSession: { status: 'open' | 'closed'; variance: number | null } | null;
  totalPesos: number;
  transactionCount: number;
  sessionStartTime?: string;
  onOpenSettings: () => void;
  onOpenCashSession: () => void;
}

export const DashboardContextHeader = memo(function DashboardContextHeader({
  subtitle,
  hasStockRisk,
  cashSession,
  totalPesos,
  transactionCount,
  sessionStartTime,
  onOpenSettings,
  onOpenCashSession,
}: DashboardContextHeaderProps) {
  const { t } = useTranslation();

  const eyebrow = t('common:dashboardEyebrow', {
    defaultValue: 'GOOD MORNING',
  });
  const title = t('common:dashboardTitle', { defaultValue: 'Counter Command' });
  const defaultSubtitle = t('common:dashboardSubtitle', {
    defaultValue: 'Daily sales & store counter overview',
  });

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 320 }}
    >
      <View className="bg-cinnamon-500 px-5 pt-3 pb-5">
        {/* Row 1: Canonical Monogram dot + Eyebrow */}
        <View className="flex-row items-center mb-3">
          <View
            className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center mr-2"
            style={{
              shadowColor: '#564E45',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <StyledText
              variant="black"
              className="text-paper-50 text-lg font-extrabold"
            >
              ₱
            </StyledText>
          </View>
          <StyledText
            variant="extrabold"
            className="label-caps text-paper-100 tracking-[0.14em]"
          >
            {eyebrow}
          </StyledText>
        </View>

        {/* Row 2: Title + Subtitle + Drawer Status Badge + Settings Action */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center flex-wrap gap-2">
              <StyledText
                variant="extrabold"
                className="text-h1 text-paper-50 text-3xl tracking-tight"
              >
                {title}
              </StyledText>
              {cashSession && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    cashSession.status === 'open'
                      ? t('common:cashSession.open', { defaultValue: 'Drawer Open' })
                      : t('common:cashSession.closed', { defaultValue: 'Drawer Closed' })
                  }
                  onPress={onOpenCashSession}
                  className={`flex-row items-center px-2.5 py-1 rounded-full ${
                    cashSession.status === 'open'
                      ? 'bg-sage-500/25 border border-sage-400/50'
                      : 'bg-persimmon-500/20 border border-persimmon-400/40'
                  } active:opacity-75`}
                >
                  <View
                    className={`w-2 h-2 rounded-full mr-1.5 ${
                      cashSession.status === 'open' ? 'bg-sage-300' : 'bg-persimmon-400'
                    }`}
                  />
                  <StyledText variant="extrabold" className="text-paper-100 text-xs">
                    {cashSession.status === 'open'
                      ? t('common:cashSession.open', { defaultValue: 'Drawer Open' })
                      : t('common:cashSession.closed', { defaultValue: 'Drawer Closed' })}
                  </StyledText>
                </Pressable>
              )}
            </View>
            <StyledText
              variant="regular"
              className="text-sm text-paper-200 mt-1"
            >
              {subtitle || defaultSubtitle}
            </StyledText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common:settingsTitle', {
              defaultValue: 'Settings',
            })}
            onPress={onOpenSettings}
            className="w-14 h-14 rounded-full items-center justify-center bg-paper-50/15 active:bg-paper-50/25"
          >
            <FontAwesome name="cog" size={22} color="#FBF7EE" />
          </Pressable>
        </View>

        {/* Row 3: Cohesive Twin Metric Paper Cards (Revenue + Transactions) */}
        <View className="flex-row gap-3 pt-3">
          {/* Card 1: Today's Revenue */}
          <View
            accessibilityLabel="Today's Revenue"
            className="flex-1 bg-paper-50 rounded-2xl p-3.5 border border-paper-300 shadow-sm"
          >
            <View className="flex-row items-center mb-1">
              <View className="w-1.5 h-1.5 rounded-full bg-persimmon-500 mr-1.5" />
              <StyledText
                variant="extrabold"
                className="text-cinnamon-800 text-[10px] tracking-wider"
              >
                {t('common:dashboard.pulse.todayRevenue', {
                  defaultValue: "TODAY'S REVENUE",
                }).toUpperCase()}
              </StyledText>
            </View>
            <StyledText
              variant="black"
              className="text-cinnamon-950 text-2xl sm:text-3xl tracking-tight"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPesos(totalPesos)}
            </StyledText>
            {hasStockRisk ? (
              <View className="flex-row items-center mt-1.5">
                <FontAwesome name="arrow-up" size={9} color="#4F7A24" />
                <StyledText
                  variant="semibold"
                  className="text-sage-700 text-xs ml-1"
                >
                  {t('common:dashboard.header.sinceYesterday', {
                    defaultValue: 'vs yesterday',
                  })}
                </StyledText>
              </View>
            ) : (
              <StyledText variant="regular" className="text-ink-500 text-xs mt-1.5">
                {t('common:dashboard.header.today', { defaultValue: 'today' })}
              </StyledText>
            )}
          </View>

          {/* Card 2: Transactions / Today's Sales */}
          <View
            accessibilityLabel="Today's Sales"
            className="flex-1 bg-paper-50 rounded-2xl p-3.5 border border-paper-300 shadow-sm"
          >
            <View className="flex-row items-center mb-1">
              <View className="w-1.5 h-1.5 rounded-full bg-sage-500 mr-1.5" />
              <StyledText
                variant="extrabold"
                className="text-cinnamon-800 text-[10px] tracking-wider"
              >
                {t('common:dashboard.pulse.todaySales', {
                  defaultValue: 'TRANSACTIONS',
                }).toUpperCase()}
              </StyledText>
            </View>
            <StyledText
              variant="black"
              className="text-cinnamon-950 text-2xl sm:text-3xl tracking-tight"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {transactionCount}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-ink-500 text-xs mt-1.5"
              numberOfLines={1}
            >
              {sessionStartTime
                ? t('common:dashboard.header.since', {
                    defaultValue: 'since {{time}}',
                    time: sessionStartTime,
                  })
                : t('common:dashboard.header.today', { defaultValue: 'today' })}
            </StyledText>
          </View>
        </View>
      </View>
    </MotiView>
  );
});
