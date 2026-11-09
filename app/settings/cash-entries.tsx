import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
import { goBackToMore, MoreDetailHeader } from '@/components/more';
import { DateRangeSelector } from '@/components/reports';
import { RecordEntryModal } from '@/components/financial/RecordEntryModal';
import { MoneyText } from '@/components/ui';
import {
  useCreateFinancialEntry,
  useDeleteFinancialEntry,
  useFinancialEntries,
  useFinancialTotals,
} from '@/hooks';
import { useToastStore } from '@/stores';
import { FinancialEntry, FinancialEntryType } from '@/types/financial.types';
import { DateRangeType } from '@/types/reports.types';
import { formatPesos } from '@/lib/money';
import { Alert, getDateRangeFromType } from '@/utils';

const CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transport',
  utilities: 'Utilities',
  supplies_packaging: 'Supplies & packaging',
  rent: 'Rent',
  repairs: 'Repairs',
  other: 'Other expense',
};

const formatCategoryLabel = (category?: string | null): string => {
  if (!category) return 'Expense';
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ');
};

const formatEntryDate = (businessDate: string): string => {
  try {
    return format(parseISO(businessDate), 'MMM d, yyyy');
  } catch {
    return businessDate;
  }
};

export default function CashEntriesScreen() {
  const { t } = useTranslation();
  const bottomOffset = useTabBarBottomOffset();
  const addToast = useToastStore((state) => state.addToast);

  const [preset, setPreset] = useState<DateRangeType>('today');
  const [modalType, setModalType] = useState<FinancialEntryType | null>(null);

  const { startDate, endDate } = useMemo(() => {
    const range = getDateRangeFromType(preset);
    return {
      startDate: format(range.startDate, 'yyyy-MM-dd'),
      endDate: format(range.endDate, 'yyyy-MM-dd'),
    };
  }, [preset]);

  const entriesQuery = useFinancialEntries(startDate, endDate);
  const totalsQuery = useFinancialTotals(startDate, endDate);
  const createMutation = useCreateFinancialEntry();
  const deleteMutation = useDeleteFinancialEntry();

  const entries = entriesQuery.data ?? [];
  const paidExpenses = totalsQuery.data?.paidExpenses ?? 0;
  const ownerDrawings = totalsQuery.data?.ownerDrawings ?? 0;

  const periodLabel =
    startDate === endDate
      ? formatEntryDate(startDate)
      : `${formatEntryDate(startDate)} to ${formatEntryDate(endDate)}`;

  const handleDelete = (item: FinancialEntry) => {
    const what = item.type === 'expense' ? 'expense' : 'owner draw';
    Alert.alert(
      `Delete this ${what}?`,
      `${formatPesos(item.amount)} will be removed and your profit will be recalculated. This cannot be undone.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteMutation.mutate(item.id, {
              onError: () =>
                addToast({
                  message: 'Could not delete the entry. Try again.',
                  variant: 'danger',
                }),
            }),
        },
      ],
    );
  };

  const refetchAll = () => {
    void entriesQuery.refetch();
    void totalsQuery.refetch();
  };

  const header = (
    <View>
      <View className="mt-5">
        <DateRangeSelector activeRange={preset} onRangeChange={setPreset} />
      </View>
      <StyledText variant="regular" className="text-sm text-ink-600 mt-3">
        {periodLabel}
      </StyledText>

      <View className="mt-3 bg-paper-50 rounded-2xl border border-paper-300 p-4 flex-row">
        <View className="flex-1 pr-3 border-r border-paper-300">
          <StyledText variant="semibold" className="text-sm text-ink-700">
            Expenses
          </StyledText>
          <MoneyText
            value={paidExpenses}
            size="md"
            variant="danger"
            className="mt-1"
          />
          <StyledText variant="regular" className="text-sm text-ink-600 mt-1">
            Taken off your profit
          </StyledText>
        </View>
        <View className="flex-1 pl-4">
          <StyledText variant="semibold" className="text-sm text-ink-700">
            Owner draws
          </StyledText>
          <MoneyText
            value={ownerDrawings}
            size="md"
            variant="default"
            className="mt-1"
          />
          <StyledText variant="regular" className="text-sm text-ink-600 mt-1">
            Cash you took out
          </StyledText>
        </View>
      </View>

      <View className="flex-row gap-3 mt-4">
        <Pressable
          onPress={() => setModalType('expense')}
          accessibilityRole="button"
          accessibilityLabel="Record an expense"
          style={{ minHeight: 48 }}
          className="flex-1 bg-persimmon-600 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-80"
        >
          <FontAwesome name="plus" size={14} color="#FFFFFF" />
          <StyledText variant="extrabold" className="text-base text-white">
            Expense
          </StyledText>
        </Pressable>
        <Pressable
          onPress={() => setModalType('owner_drawing')}
          accessibilityRole="button"
          accessibilityLabel="Record an owner draw"
          style={{ minHeight: 48 }}
          className="flex-1 bg-paper-50 border border-persimmon-500 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-70"
        >
          <FontAwesome name="arrow-down" size={14} color="#A1370C" />
          <StyledText
            variant="extrabold"
            className="text-base text-persimmon-700"
          >
            Owner draw
          </StyledText>
        </Pressable>
      </View>

      <View className="flex-row items-center mt-6 mb-2 px-1">
        <View className="w-1 h-4 rounded-full bg-persimmon-600 mr-2" />
        <StyledText
          variant="extrabold"
          className="text-xs text-ink-700 uppercase"
          style={{ letterSpacing: 1.2 }}
        >
          {`Entries (${entries.length})`}
        </StyledText>
      </View>
    </View>
  );

  const empty = entriesQuery.isLoading ? (
    <View className="py-10 items-center">
      <ActivityIndicator color="#623418" />
    </View>
  ) : entriesQuery.isError ? (
    <View className="bg-paper-50 rounded-2xl border border-paper-300 p-6 items-center">
      <StyledText
        variant="semibold"
        className="text-base text-ink-900 text-center"
      >
        Could not load your entries
      </StyledText>
      <Pressable
        onPress={refetchAll}
        accessibilityRole="button"
        style={{ minHeight: 48 }}
        className="mt-3 px-6 rounded-2xl bg-persimmon-600 items-center justify-center active:opacity-80"
      >
        <StyledText variant="semibold" className="text-white">
          Try again
        </StyledText>
      </Pressable>
    </View>
  ) : (
    <View className="bg-paper-50 rounded-2xl border border-dashed border-ink-200 p-6 items-center">
      <StyledText
        variant="semibold"
        className="text-base text-ink-900 text-center"
      >
        Nothing recorded for this period
      </StyledText>
      <StyledText
        variant="regular"
        className="text-sm text-ink-600 text-center mt-1"
      >
        Tap Expense for gastos like ice or transport. Tap Owner draw when you
        take cash for yourself.
      </StyledText>
    </View>
  );

  return (
    <View className="flex-1 bg-paper-200">
      <MoreDetailHeader
        title={t('common:moreHomeCashLabel')}
        onBack={goBackToMore}
        backAccessibilityLabel={t('common:moreBackA11y')}
      />

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: bottomOffset + 24,
        }}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        renderItem={({ item }) => {
          const isExpense = item.type === 'expense';
          return (
            <View className="bg-paper-50 rounded-2xl border border-paper-300 pl-4 pr-1 mb-2 flex-row items-center">
              <View className="flex-1 py-3 pr-3">
                <StyledText
                  variant="semibold"
                  className="text-base text-ink-900"
                >
                  {isExpense
                    ? formatCategoryLabel(item.expenseCategory)
                    : 'Owner draw'}
                </StyledText>
                {item.note ? (
                  <StyledText
                    variant="regular"
                    className="text-sm text-ink-700 mt-0.5"
                  >
                    {item.note}
                  </StyledText>
                ) : null}
                <StyledText
                  variant="regular"
                  className="text-sm text-ink-600 mt-0.5"
                >
                  {formatEntryDate(item.businessDate)}
                </StyledText>
              </View>
              <MoneyText
                value={item.amount}
                size="sm"
                variant={isExpense ? 'danger' : 'default'}
              />
              <Pressable
                onPress={() => handleDelete(item)}
                disabled={deleteMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${
                  isExpense ? 'expense' : 'owner draw'
                } of ${formatPesos(item.amount)}`}
                style={{ minWidth: 48, minHeight: 48 }}
                className="items-center justify-center active:opacity-60"
              >
                <FontAwesome name="trash-o" size={18} color="#564E45" />
              </Pressable>
            </View>
          );
        }}
      />

      {modalType !== null && (
        <RecordEntryModal
          visible
          type={modalType}
          onClose={() => setModalType(null)}
          onSubmit={async (entry, receiptUris) => {
            const { failedReceipts } = await createMutation.mutateAsync({
              entry,
              receiptUris,
            });
            addToast({
              message:
                failedReceipts > 0
                  ? `Saved, but ${failedReceipts} receipt photo(s) could not be stored.`
                  : `Saved to ${formatEntryDate(entry.businessDate)}`,
              variant: failedReceipts > 0 ? 'warning' : 'success',
            });
          }}
        />
      )}
    </View>
  );
}
