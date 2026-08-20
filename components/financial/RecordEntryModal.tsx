import { FC, useState } from 'react';
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
  initialBusinessDate: string;
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

export const RecordEntryModal: FC<Props> = ({
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
  const fallbackDate = initialBusinessDate ?? todayStr;
  const [businessDate, setBusinessDate] = useState<string>(fallbackDate);

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
        note: note.trim() || null,
      });

      setAmountStr('');
      setNote('');
      setBusinessDate(fallbackDate);
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
        <View className="bg-paper-50 p-5 rounded-t-2xl">
          <Text className="text-lg font-bold text-ink-900 mb-4">
            {type === 'expense'
              ? 'Record Operating Expense'
              : 'Record Owner Drawing'}
          </Text>

          {type === 'expense' && category === 'supplies_packaging' && (
            <View className="bg-semantic-info-50 p-3 rounded-xl mb-3 border border-semantic-info-200">
              <Text className="text-xs text-semantic-info-800">
                Note: Inventory bought for resale is not an operating expense.
                Use Restock in Inventory for store stock.
              </Text>
            </View>
          )}

          <Text className="text-xs font-semibold text-ink-700 mb-1">
            Amount (Whole Pesos)
          </Text>
          <TextInput
            testID="amount-input"
            keyboardType="number-pad"
            value={amountStr}
            onChangeText={setAmountStr}
            placeholder="0"
            className="border border-paper-300 bg-paper-100 rounded-xl p-3 mb-3 text-base text-ink-900"
          />

          <Text className="text-xs font-semibold text-ink-700 mb-1">
            Date (YYYY-MM-DD)
          </Text>
          <TextInput
            testID="date-input"
            value={businessDate}
            onChangeText={setBusinessDate}
            placeholder="YYYY-MM-DD"
            className="border border-paper-300 bg-paper-100 rounded-xl p-3 mb-3 text-base text-ink-900"
          />

          {type === 'expense' && (
            <>
              <Text className="text-xs font-semibold text-ink-700 mb-1">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {CATEGORIES.map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => setCategory(c.value)}
                    className={`px-3 py-2 rounded-xl border ${
                      category === c.value
                        ? 'bg-sage-600 border-sage-600'
                        : 'bg-paper-100 border-paper-300'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        category === c.value
                          ? 'text-white'
                          : 'text-ink-800'
                      }`}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Text className="text-xs font-semibold text-ink-700 mb-1">
            Note / Description
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note"
            className="border border-paper-300 bg-paper-100 rounded-xl p-3 mb-4 text-sm text-ink-900"
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
                  setStagedReceiptUris(
                    stagedReceiptUris.filter((_, i) => i !== index),
                  );
                }
              }}
            />
          )}

          <View className="flex-row justify-end space-x-3">
            <Pressable
              onPress={onClose}
              className="px-5 py-3 rounded-xl bg-paper-200 mr-2"
            >
              <Text className="text-sm font-semibold text-ink-800">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              testID="save-entry-button"
              onPress={handleSave}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-sage-600"
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
