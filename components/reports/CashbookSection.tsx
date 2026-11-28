import { StyledText } from '@/components/elements';
import { useCashEntries, useCashSessions } from '@/hooks';
import { formatPesos } from '@/lib/money';
import type { DateRange } from '@/types';
import type { CashSession } from '@/types/cash.types';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { SessionsSkeleton } from './ReportsSkeletons';

const EMPTY_SESSIONS: CashSession[] = [];

// Cash drawer history for the selected range; mounts only while its section is open.
export const CashbookBody = memo(function CashbookBody({
  dateRange,
}: {
  dateRange: DateRange;
}) {
  const { t } = useTranslation();
  const sessionsQuery = useCashSessions();
  const sessions =
    (sessionsQuery.data as CashSession[] | undefined) ?? EMPTY_SESSIONS;

  const filteredSessions = useMemo(() => {
    const start = format(dateRange.startDate, 'yyyy-MM-dd');
    const end = format(dateRange.endDate, 'yyyy-MM-dd');
    return sessions.filter(
      (s) =>
        !!s.businessDate && s.businessDate >= start && s.businessDate <= end,
    );
  }, [sessions, dateRange]);

  if (sessionsQuery.isLoading) return <SessionsSkeleton />;

  if (filteredSessions.length === 0) {
    return (
      <View className="bg-paper-50 rounded-xl border border-dashed border-ink-200 p-6 items-center">
        <StyledText variant="regular" className="text-ink-500 text-sm">
          {t('common:reports.cashbook.empty')}
        </StyledText>
      </View>
    );
  }

  return (
    <View>
      {filteredSessions.map((session) => (
        <CashSessionRow key={session.id} session={session} />
      ))}
    </View>
  );
});

function CashSessionRow({ session }: { session: CashSession }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: entries = [], isLoading } = useCashEntries(
    isExpanded ? session.id : undefined,
  );

  return (
    <View className="mb-3 border border-ink-200 rounded-xl bg-paper-50 p-4">
      <Pressable
        onPress={() => setIsExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={t('common:reports.cashbook.sessionA11y', {
          date: session.businessDate,
        })}
        accessibilityState={{ expanded: isExpanded }}
        className="flex-row justify-between items-center"
      >
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-2">
            <StyledText variant="extrabold" className="text-ink-900 text-sm">
              {session.businessDate}
            </StyledText>
            <View
              className={`px-2 py-0.5 rounded-full ${
                session.status === 'open' ? 'bg-sage-700' : 'bg-ink-600'
              }`}
            >
              <StyledText variant="semibold" className="text-xs text-white">
                {t(`common:reports.cashbook.status.${session.status}`)}
              </StyledText>
            </View>
          </View>
          <View className="flex-row mt-1.5 gap-x-3 gap-y-1 flex-wrap">
            <StyledText variant="regular" className="text-xs text-ink-500">
              {t('common:reports.cashbook.opened', {
                amount: formatPesos(session.openingCash),
              })}
            </StyledText>
            {session.actualCash !== null && (
              <StyledText variant="regular" className="text-xs text-ink-500">
                {t('common:reports.cashbook.counted', {
                  amount: formatPesos(session.actualCash),
                })}
              </StyledText>
            )}
            {session.expectedCash !== null && (
              <StyledText variant="regular" className="text-xs text-ink-500">
                {t('common:reports.cashbook.expected', {
                  amount: formatPesos(session.expectedCash),
                })}
              </StyledText>
            )}
          </View>
        </View>

        <View className="items-end mr-4">
          {session.variance !== null && (
            <StyledText
              variant="semibold"
              className={`text-xs ${session.variance >= 0 ? 'text-sage-600' : 'text-semantic-danger'}`}
            >
              {t('common:reports.cashbook.variance', {
                amount: `${session.variance >= 0 ? '+' : ''}${formatPesos(session.variance)}`,
              })}
            </StyledText>
          )}
        </View>

        <FontAwesome
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#564E45"
        />
      </Pressable>

      {isExpanded && (
        <View className="mt-4 pt-3 border-t border-dashed border-ink-200">
          <StyledText variant="semibold" className="text-ink-600 text-xs mb-2">
            {t('common:reports.cashbook.movements', { count: entries.length })}
          </StyledText>
          {isLoading ? (
            <SessionsSkeleton />
          ) : entries.length === 0 ? (
            <StyledText
              variant="regular"
              className="text-ink-500 text-xs italic py-1"
            >
              {t('common:reports.cashbook.noMovements')}
            </StyledText>
          ) : (
            <View className="gap-y-1.5">
              {entries.map((entry) => {
                const isIn = entry.type === 'owner_addition';
                const tone = isIn ? 'text-sage-600' : 'text-semantic-danger';
                return (
                  <View
                    key={entry.id}
                    className="flex-row justify-between items-center py-1"
                  >
                    <View className="flex-1 mr-2 flex-row items-center gap-1.5 flex-wrap">
                      <StyledText
                        variant="semibold"
                        className={`text-xs ${tone}`}
                      >
                        {t(`common:reports.cashbook.type.${entry.type}`)}
                      </StyledText>
                      <StyledText
                        variant="regular"
                        className="text-xs text-ink-500"
                      >
                        {entry.notes}
                      </StyledText>
                    </View>
                    <StyledText variant="medium" className={`text-xs ${tone}`}>
                      {isIn ? '+' : '-'}
                      {formatPesos(entry.amount)}
                    </StyledText>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
