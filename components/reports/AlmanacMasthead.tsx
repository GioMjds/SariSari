import { DateRange } from '@/types';
import { Pressable, View } from 'react-native';
import { StyledText } from '../elements';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useScreenHeadingFocus } from '@/components/more/useScreenHeadingFocus';

export function AlmanacMasthead({
  dateRange,
  onBack,
  onRefresh,
  isRefreshing,
}: {
  dateRange: DateRange;
  onBack: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const { t } = useTranslation();
  const headingRef = useScreenHeadingFocus();
  const today = new Date();
  const issueDate = today
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase();

  return (
    <View className="px-5 pt-3 pb-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t('common:moreBackA11y')}
            style={{ minWidth: 48, minHeight: 48 }}
            className="items-center justify-center rounded-full bg-paper-50/15 active:opacity-70"
          >
            <FontAwesome name="arrow-left" size={16} color="#FAFAF7" />
          </Pressable>

          <View
            className="ml-2 flex-row items-center"
            style={{ flexShrink: 1, minWidth: 0 }}
          >
            <View className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center mr-2 shadow-paper">
              <StyledText variant="black" className="text-paper-50 text-lg">
                ₱
              </StyledText>
            </View>
            <StyledText
              variant="extrabold"
              className="text-label text-paper-200 opacity-80"
              style={{ letterSpacing: 1.4 }}
            >
              GENERAL REPORTS
            </StyledText>
          </View>
        </View>

        <Pressable
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh reports"
          style={{ minWidth: 48, minHeight: 48 }}
          className="rounded-full bg-paper-50/15 items-center justify-center active:opacity-70"
        >
          <MotiView
            animate={{ rotate: isRefreshing ? '360deg' : '0deg' }}
            transition={{
              type: 'timing',
              duration: 800,
              loop: isRefreshing,
            }}
          >
            <FontAwesome name="refresh" size={14} color="#FBF7EE" />
          </MotiView>
        </Pressable>
      </View>

      <View className="flex-row items-end justify-between">
        <View className="flex-1 mr-3">
          <View ref={headingRef} accessible accessibilityRole="header">
            <StyledText
              variant="black"
              className="text-paper-50"
              style={{
                fontSize: 40,
                lineHeight: 42,
                letterSpacing: -1.1,
              }}
            >
              General Reports
            </StyledText>
          </View>
          <StyledText
            variant="regular"
            className="text-paper-200 text-sm mt-1 opacity-90"
          >
            {dateRange.label === 'Custom'
              ? 'Custom date range'
              : `${dateRange.label} · Offline Store Analytics`}
          </StyledText>
        </View>
      </View>

      <View className="mt-4 flex-row items-center">
        <StyledText
          variant="extrabold"
          className="text-label text-paper-200 opacity-80 mr-2"
          style={{ letterSpacing: 1.4 }}
        >
          PUBLISHED
        </StyledText>
        <StyledText
          variant="medium"
          className="text-mono text-paper-100 opacity-90"
        >
          {issueDate}
        </StyledText>
      </View>
    </View>
  );
}
