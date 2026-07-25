import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';

export interface DashboardContextHeaderProps {
  hasStockRisk: boolean;
  cashSession: { status: 'open' | 'closed'; variance: number | null } | null;
  totalPesos: number;
  transactionCount: number;
  sessionStartTime?: string;
  onOpenSettings: () => void;
  onOpenCashSession: () => void;
}

export const DashboardContextHeader = memo(function DashboardContextHeader({
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
              className="text-paper-50 text-xl font-extrabold"
            >
              ₱
            </StyledText>
          </View>
          <StyledText
            variant="extrabold"
            className="label-caps text-paper-200 opacity-80"
            style={{ letterSpacing: 1.4 }}
          >
            {eyebrow}
          </StyledText>
        </View>

        {/* Row 2: Title + Settings Action */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 mr-3">
            <StyledText
              variant="extrabold"
              className="text-h1 text-paper-50 text-3xl"
              style={{ letterSpacing: -0.28 }}
            >
              {title}
            </StyledText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common:settingsTitle', {
              defaultValue: 'Settings',
            })}
            onPress={onOpenSettings}
            className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15 active:opacity-70"
          >
            <FontAwesome name="cog" size={18} color="#FBF7EE" />
          </Pressable>
        </View>

        {/* Row 3: Metric blocks (revenue + transactions) */}
        <View className="flex-row pt-3 border-t border-cinnamon-400/40">
          {/* Today's Revenue */}
          <View
            accessibilityLabel="Today's Revenue"
            className="flex-1 mr-4 active:opacity-80"
          >
            <StyledText
              variant="extrabold"
              className="text-paper-300 opacity-80"
              style={{ fontSize: 10, letterSpacing: 1.2 }}
            >
              {t('common:dashboard.pulse.todayRevenue', {
                defaultValue: "TODAY'S REVENUE",
              }).toUpperCase()}
            </StyledText>
            <StyledText
              variant="black"
              className="text-paper-50 text-3xl mt-0.5"
              style={{ letterSpacing: -0.5 }}
              numberOfLines={1}
            >
              {formatPesos(totalPesos)}
            </StyledText>
            {hasStockRisk && (
              <View className="flex-row items-center mt-1">
                <FontAwesome name="arrow-up" size={9} color="#92B662" />
                <StyledText
                  variant="semibold"
                  className="text-sage-300 text-xs ml-1"
                >
                  {t('common:dashboard.header.sinceYesterday', {
                    defaultValue: 'vs yesterday',
                  })}
                </StyledText>
              </View>
            )}
          </View>

          {/* Transactions */}
          <View className="flex-1">
            <StyledText
              variant="extrabold"
              className="text-paper-300 opacity-80"
              style={{ fontSize: 10, letterSpacing: 1.2 }}
            >
              {t('common:dashboard.pulse.todaySales', {
                defaultValue: 'TRANSACTIONS',
              }).toUpperCase()}
            </StyledText>
            <StyledText
              variant="black"
              className="text-paper-50 text-3xl mt-0.5"
              style={{ letterSpacing: -0.5 }}
            >
              {transactionCount}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-paper-300 opacity-70 text-xs mt-1"
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
