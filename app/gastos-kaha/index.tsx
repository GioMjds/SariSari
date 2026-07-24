import { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useCreateFinancialEntry,
  useDeleteFinancialEntry,
  useFinancialEntries,
  useFinancialTotals,
} from '@/hooks/useFinancial';
import { FinancialEntryType } from '@/types/financial.types';
import { formatPesos } from '@/lib/money';
import { RecordEntryModal } from '@/components/financial/RecordEntryModal';

export default function GastosKahaScreen() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const { data: entries } = useFinancialEntries(startDate, endDate);
  const { data: totals } = useFinancialTotals(startDate, endDate);

  const createMutation = useCreateFinancialEntry();
  const deleteMutation = useDeleteFinancialEntry();

  const [modalType, setModalType] = useState<FinancialEntryType | null>(null);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this financial entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Gastos & Kaha Ledger
      </Text>

      <View className="bg-white dark:bg-gray-800 p-3 rounded-2xl mb-4 border border-gray-100 dark:border-gray-700">
        <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Date Range Filter
        </Text>
        <View className="flex-row space-x-2">
          <View className="flex-1 mr-2">
            <Text className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
              Start Date
            </Text>
            <TextInput
              testID="start-date-filter"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-2 text-xs text-gray-900 dark:text-white"
            />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
              End Date
            </Text>
            <TextInput
              testID="end-date-filter"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-2 text-xs text-gray-900 dark:text-white"
            />
          </View>
        </View>
      </View>

      <View className="flex-row space-x-3 mb-4">
        <Pressable
          onPress={() => setModalType('expense')}
          className="flex-1 bg-emerald-600 p-3 rounded-2xl align-center justify-center mr-2"
        >
          <Text className="text-center text-white font-bold text-sm">
            Record Expense
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setModalType('owner_drawing')}
          className="flex-1 bg-amber-600 p-3 rounded-2xl align-center justify-center"
        >
          <Text className="text-center text-white font-bold text-sm">
            Record Drawing
          </Text>
        </Pressable>
      </View>

      <View className="bg-white dark:bg-gray-800 p-4 rounded-2xl mb-4 flex-row justify-between border border-gray-100 dark:border-gray-700">
        <View>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Paid Gastos
          </Text>
          <Text className="text-base font-bold text-rose-600 dark:text-rose-400">
            {formatPesos(totals?.paidExpenses ?? 0)}
          </Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Owner Drawings
          </Text>
          <Text className="text-base font-bold text-amber-600 dark:text-amber-400">
            {formatPesos(totals?.ownerDrawings ?? 0)}
          </Text>
        </View>
      </View>

      <FlatList
        data={entries ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white dark:bg-gray-800 p-4 rounded-2xl mb-2 flex-row justify-between items-center border border-gray-100 dark:border-gray-700">
            <View>
              <Text className="text-sm font-bold text-gray-900 dark:text-white">
                {item.type === 'expense'
                  ? `Expense: ${item.expenseCategory}`
                  : 'Owner Drawing'}
              </Text>
              {item.note ? (
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {item.note}
                </Text>
              ) : null}
              <Text className="text-[10px] text-gray-400">
                {item.businessDate}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-sm font-bold text-gray-900 dark:text-white mr-3">
                {formatPesos(item.amount)}
              </Text>
              <Pressable onPress={() => handleDelete(item.id)}>
                <Text className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />

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
    </SafeAreaView>
  );
}
