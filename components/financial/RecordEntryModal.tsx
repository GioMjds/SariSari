import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable } from 'react-native';
import {
  ExpenseCategory,
  FinancialEntryType,
  NewFinancialEntry,
} from '@/types/financial.types';
import { parsePesosInput } from '@/lib/money';
import { Alert } from '@/utils';
import { ReceiptPicker } from './ReceiptPicker';

interface Props {
  visible: boolean;
  type: FinancialEntryType;
  initialBusinessDate?: string;
  onClose: () => void;
  onSubmit: (data: NewFinancialEntry) => Promise<void>;
}

interface CategoryOption {
  label: string;
  value: ExpenseCategory;
}

const CATEGORIES = [
  { label: 'Transport', value: 'transport' },
  { label: 'Utilities', value: 'utilities' },
  { label: 'Supplies & Packaging', value: 'supplies_packaging' },
  { label: 'Rent', value: 'rent' },
  { label: 'Repairs', value: 'repairs' },
  { label: 'Other', value: 'other' },
] satisfies CategoryOption[];

export const RecordEntryModal: React.FC<Props> = ({
  visible,
  type,
  initialBusinessDate,
  onClose,
  onSubmit,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [note, setNote] = useState('');
  const [stagedReceiptUris, setStagedReceiptUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDate = initialBusinessDate || todayStr;
  const [businessDate, setBusinessDate] = useState(defaultDate);


  const handleSave = async () => {
    try {
      const parsedAmount = parsePesosInput(amountStr);
      if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
        Alert.alert(
          'Invalid Amount',
          'Please enter a positive whole peso amount.',
        );
        return;
      }

      const formattedDate = businessDate.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
        Alert.alert(
          'Invalid Date',
          'Please enter a valid date in YYYY-MM-DD format.',
        );
        return;
      }

      setLoading(true);
      await onSubmit({
        type,
        amount: parsedAmount,
        businessDate: formattedDate,
        expenseCategory: type === 'expense' ? category : null,
        note: note.trim() || undefined,
      });

      setAmountStr('');
      setNote('');
      setBusinessDate(defaultDate);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white dark:bg-gray-800 p-5 rounded-t-3xl">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {type === 'expense'
              ? 'Record Operating Expense'
              : 'Record Owner Drawing'}
          </Text>

          {type === 'expense' && category === 'supplies_packaging' && (
            <View className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl mb-3 border border-blue-200 dark:border-blue-800">
              <Text className="text-xs text-blue-800 dark:text-blue-300">
                Note: Inventory bought for resale is not an operating expense.
                Use Restock in Inventory for store stock.
              </Text>
            </View>
          )}

          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Amount (Whole Pesos)
          </Text>
          <TextInput
            testID="amount-input"
            keyboardType="number-pad"
            value={amountStr}
            onChangeText={setAmountStr}
            placeholder="0"
            className="border border-gray-300 dark:border-gray-600 rounded-xl p-3 mb-3 text-base text-gray-900 dark:text-white"
          />

          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Date (YYYY-MM-DD)
          </Text>
          <TextInput
            testID="date-input"
            value={businessDate}
            onChangeText={setBusinessDate}
            placeholder="YYYY-MM-DD"
            className="border border-gray-300 dark:border-gray-600 rounded-xl p-3 mb-3 text-base text-gray-900 dark:text-white"
          />

          {type === 'expense' && (
            <>
              <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {CATEGORIES.map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => setCategory(c.value)}
                    className={`px-3 py-2 rounded-xl border ${
                      category === c.value
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        category === c.value
                          ? 'text-white'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Note / Description
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note"
            className="border border-gray-300 dark:border-gray-600 rounded-xl p-3 mb-4 text-sm text-gray-900 dark:text-white"
          />

          {type === 'expense' && (
            <ReceiptPicker
              receipts={stagedReceiptUris.map((uri, index) => ({
                id: `staged-${index}`,
                financialEntryId: '',
                relativePath: uri,
                slot: index,
                createdAt: Date.now(),
              }))}
              onAddReceipt={async (uri) => {
                if (stagedReceiptUris.length < 5) {
                  setStagedReceiptUris([...stagedReceiptUris, uri]);
                }
              }}
              onDeleteReceipt={async (id) => {
                const index = parseInt(id.replace('staged-', ''), 10);
                if (!isNaN(index)) {
                  setStagedReceiptUris(stagedReceiptUris.filter((_, i) => i !== index));
                }
              }}
            />
          )}


          <View className="flex-row justify-end space-x-3">
            <Pressable
              onPress={onClose}
              className="px-5 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 mr-2"
            >
              <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-emerald-600"
            >
              <Text className="text-sm font-semibold text-white">
                {loading ? 'Saving...' : 'Save Entry'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
