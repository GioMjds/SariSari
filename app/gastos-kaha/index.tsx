import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import {
  useCreateFinancialEntry,
  useDeleteFinancialEntry,
  useFinancialEntries,
  useFinancialTotals,
} from '@/hooks/useFinancial';
import { FinancialEntryType, FinancialEntry } from '@/types/financial.types';
import { DateRangeType } from '@/types/reports.types';
import { formatPesos } from '@/lib/money';
import { getDateRangeFromType } from '@/utils';
import { RecordEntryModal } from '@/components/financial/RecordEntryModal';

const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatCategoryLabel = (category?: string | null): string => {
  if (!category) return 'General Expense';
  switch (category) {
    case 'transport':
      return 'Transport';
    case 'utilities':
      return 'Utilities';
    case 'supplies_packaging':
      return 'Supplies & Packaging';
    case 'rent':
      return 'Rent';
    case 'repairs':
      return 'Repairs';
    case 'other':
      return 'Other Expense';
    default:
      return category
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
};

export default function GastosKahaScreen() {
  const todayStr = formatDateString(new Date());
  const [activePreset, setActivePreset] = useState<DateRangeType>('today');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const { data: entries } = useFinancialEntries(startDate, endDate);
  const { data: totals } = useFinancialTotals(startDate, endDate);

  const createMutation = useCreateFinancialEntry();
  const deleteMutation = useDeleteFinancialEntry();

  const [modalType, setModalType] = useState<FinancialEntryType | null>(null);

  const handlePresetChange = useCallback((type: DateRangeType) => {
    setActivePreset(type);
    if (type !== 'custom') {
      const range = getDateRangeFromType(type);
      setStartDate(formatDateString(range.startDate));
      setEndDate(formatDateString(range.endDate));
    }
  }, []);

  const handleDelete = (item: FinancialEntry) => {
    const entryTypeName =
      item.type === 'expense' ? 'operating expense' : 'owner drawing';
    Alert.alert(
      'Delete Financial Entry?',
      `Are you sure you want to delete this ${entryTypeName} of ${formatPesos(
        item.amount,
      )}? This action cannot be undone and will recalculate your net profit.`,
      [
        { text: 'Keep Entry', style: 'cancel' },
        {
          text: 'Delete Entry',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(item.id),
        },
      ],
    );
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/reports');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-paper-200">
        {/* Header Bar */}
        <View className="bg-cinnamon-500 px-4 pt-3 pb-4 shadow-sm">
          <View className="flex-row items-center mb-1">
            <Pressable
              onPress={handleBack}
              testID="back-button"
              accessibilityRole="button"
              accessibilityLabel="Go back to reports almanac"
              className="w-9 h-9 rounded-full bg-paper-50/20 active:bg-paper-50/30 items-center justify-center mr-3"
            >
              <FontAwesome5 name="arrow-left" size={14} color="#FBF7EE" />
            </Pressable>
            <StyledText variant="extrabold" className="text-paper-50 text-xl flex-1">
              Gastos & Kaha Ledger
            </StyledText>
          </View>
          <StyledText variant="medium" className="text-paper-200/80 text-xs pl-12">
            Daily store operating expenses & owner cash withdrawals audit log
          </StyledText>
        </View>

        <View className="flex-1 p-4">
          {/* Date Range Filter Card */}
          <View className="bg-paper-50 p-4 rounded-xl mb-4 border border-ink-200">
            <View className="flex-row justify-between items-center mb-2.5">
              <StyledText
                variant="extrabold"
                className="text-label text-ink-500"
                style={{ letterSpacing: 1.2 }}
              >
                DATE RANGE FILTER
              </StyledText>
              <StyledText variant="regular" className="text-[11px] text-ink-400">
                Tap preset or set custom dates
              </StyledText>
            </View>

            {/* Quick Filter Preset Pills */}
            <View className="flex-row flex-wrap gap-1.5 mb-3">
              {[
                { label: 'Today', type: 'today' },
                { label: 'Yesterday', type: 'yesterday' },
                { label: '7 Days', type: 'last7days' },
                { label: 'This Month', type: 'thisMonth' },
                { label: 'Custom', type: 'custom' },
              ].map((pill) => {
                const isActive = activePreset === pill.type;
                return (
                  <Pressable
                    key={pill.type}
                    onPress={() => handlePresetChange(pill.type as DateRangeType)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${pill.label}`}
                    className={`px-3 py-1.5 rounded-full border ${
                      isActive
                        ? 'bg-cinnamon-500 border-cinnamon-500'
                        : 'bg-paper-50 border-ink-200 active:bg-paper-100'
                    }`}
                  >
                    <StyledText
                      variant="semibold"
                      className={`text-xs ${
                        isActive ? 'text-paper-50' : 'text-ink-700'
                      }`}
                    >
                      {pill.label}
                    </StyledText>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Input Fields */}
            <View className="flex-row space-x-2 gap-2 pt-2.5 border-t border-dashed border-ink-200">
              <View className="flex-1">
                <StyledText
                  variant="medium"
                  className="text-[10px] text-ink-500 mb-1"
                >
                  Start Date (YYYY-MM-DD)
                </StyledText>
                <TextInput
                  testID="start-date-filter"
                  value={startDate}
                  onChangeText={(text) => {
                    setStartDate(text);
                    setActivePreset('custom');
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#A8A29E"
                  className="border border-ink-200 bg-paper-50 rounded-lg p-2.5 text-xs text-ink-900"
                />
              </View>
              <View className="flex-1">
                <StyledText
                  variant="medium"
                  className="text-[10px] text-ink-500 mb-1"
                >
                  End Date (YYYY-MM-DD)
                </StyledText>
                <TextInput
                  testID="end-date-filter"
                  value={endDate}
                  onChangeText={(text) => {
                    setEndDate(text);
                    setActivePreset('custom');
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#A8A29E"
                  className="border border-ink-200 bg-paper-50 rounded-lg p-2.5 text-xs text-ink-900"
                />
              </View>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View className="flex-row mb-4 gap-3">
            <Pressable
              onPress={() => setModalType('expense')}
              accessibilityRole="button"
              accessibilityLabel="Record store operating expense"
              className="flex-1 bg-persimmon-500 active:bg-persimmon-600 p-3.5 rounded-xl items-center justify-center shadow-sm"
            >
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                Record Expense
              </StyledText>
              <StyledText variant="medium" className="text-paper-50/80 text-[10px] mt-0.5">
                Store Operating Gastos
              </StyledText>
            </Pressable>
            <Pressable
              onPress={() => setModalType('owner_drawing')}
              accessibilityRole="button"
              accessibilityLabel="Record owner cash drawing"
              className="flex-1 bg-cinnamon-600 active:bg-cinnamon-700 p-3.5 rounded-xl items-center justify-center shadow-sm"
            >
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                Record Drawing
              </StyledText>
              <StyledText variant="medium" className="text-paper-50/80 text-[10px] mt-0.5">
                Owner Cash Take-out
              </StyledText>
            </Pressable>
          </View>

          {/* Ledger Totals Overview Card */}
          <View className="bg-paper-50 p-4 rounded-xl mb-4 flex-row justify-between border border-ink-200">
            <View className="flex-1 border-r border-dashed border-ink-200 pr-3">
              <StyledText
                variant="extrabold"
                className="text-label text-semantic-danger mb-0.5"
                style={{ letterSpacing: 1.2 }}
              >
                PAID GASTOS
              </StyledText>
              <MoneyText
                value={totals?.paidExpenses ?? 0}
                size="md"
                variant="danger"
              />
              <StyledText variant="regular" className="text-ink-400 text-[10px] mt-1">
                Deducted from gross profit
              </StyledText>
            </View>
            <View className="flex-1 pl-4">
              <StyledText
                variant="extrabold"
                className="text-label text-cinnamon-700 mb-0.5"
                style={{ letterSpacing: 1.2 }}
              >
                OWNER DRAWINGS
              </StyledText>
              <MoneyText
                value={totals?.ownerDrawings ?? 0}
                size="md"
                variant="default"
                className="text-cinnamon-700"
              />
              <StyledText variant="regular" className="text-ink-400 text-[10px] mt-1">
                Excluded from operating profit
              </StyledText>
            </View>
          </View>

          {/* Ledger Entries List */}
          <FlatList
            data={entries ?? []}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="bg-paper-50 rounded-xl border border-dashed border-ink-200 p-8 items-center justify-center my-4">
                <FontAwesome5 name="receipt" size={24} color="#A8A29E" />
                <StyledText
                  variant="extrabold"
                  className="text-ink-700 text-sm text-center mt-3"
                >
                  No Entries Recorded
                </StyledText>
                <StyledText
                  variant="medium"
                  className="text-ink-400 text-xs text-center mt-1 px-4"
                >
                  No gastos or owner drawings found for this period. Tap 'Record Expense' or 'Record Drawing' above to add your first entry.
                </StyledText>
              </View>
            }
            renderItem={({ item }) => (
              <View className="bg-paper-50 p-3.5 rounded-xl mb-2.5 flex-row justify-between items-center border border-ink-200">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <View
                      className={`px-2 py-0.5 rounded-md border ${
                        item.type === 'expense'
                          ? 'bg-rose-50/80 border-rose-200/80'
                          : 'bg-cinnamon-50/80 border-cinnamon-200/80'
                      }`}
                    >
                      <StyledText
                        variant="extrabold"
                        className={`text-[10px] uppercase ${
                          item.type === 'expense'
                            ? 'text-semantic-danger'
                            : 'text-cinnamon-800'
                        }`}
                        style={{ letterSpacing: 0.8 }}
                      >
                        {item.type === 'expense'
                          ? formatCategoryLabel(item.expenseCategory)
                          : 'Owner Drawing'}
                      </StyledText>
                    </View>
                  </View>

                  {item.note ? (
                    <StyledText
                      variant="medium"
                      className="text-xs text-ink-700 mb-1"
                    >
                      {item.note}
                    </StyledText>
                  ) : null}

                  <StyledText
                    variant="regular"
                    className="text-[10px] text-ink-400"
                  >
                    {item.businessDate}
                  </StyledText>
                </View>

                <View className="flex-row items-center gap-3">
                  <MoneyText
                    value={item.amount}
                    size="sm"
                    variant={item.type === 'expense' ? 'danger' : 'default'}
                  />
                  <Pressable
                    onPress={() => handleDelete(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete entry ${item.id}`}
                    className="p-1.5 active:opacity-60"
                  >
                    <StyledText
                      variant="semibold"
                      className="text-xs text-semantic-danger"
                    >
                      Delete
                    </StyledText>
                  </Pressable>
                </View>
              </View>
            )}
          />
        </View>

        {modalType !== null && (
          <RecordEntryModal
            visible={modalType !== null}
            type={modalType}
            initialBusinessDate={startDate}
            onClose={() => setModalType(null)}
            onSubmit={async (data) => {
              await createMutation.mutateAsync(data);
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}



