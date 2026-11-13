import { FC, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { StyledText } from '@/components/elements';
import {
  ExpenseCategory,
  FinancialEntryType,
  NewFinancialEntry,
} from '@/types/financial.types';
import { tryParsePesosInput } from '@/lib/money';
import { getTodayDateString } from '@/utils/timezone';
import { ReceiptPicker } from './ReceiptPicker';

interface Props {
  visible: boolean;
  type: FinancialEntryType;
  onClose: () => void;
  onSubmit: (data: NewFinancialEntry, receiptUris: string[]) => Promise<void>;
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

const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toDateString(date);
};

/** True for a real calendar date written as YYYY-MM-DD, not in the future. */
const isValidBusinessDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const parsed = new Date(Number(y), Number(m) - 1, Number(d));
  const roundTrips =
    parsed.getFullYear() === Number(y) &&
    parsed.getMonth() === Number(m) - 1 &&
    parsed.getDate() === Number(d);
  return roundTrips && value <= getTodayDateString();
};

export const RecordEntryModal: FC<Props> = ({
  visible,
  type,
  onClose,
  onSubmit,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [note, setNote] = useState('');
  const [stagedReceiptUris, setStagedReceiptUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessDate, setBusinessDate] =
    useState<string>(getTodayDateString());

  const isExpense = type === 'expense';
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const handleSave = async () => {
    if (loading) return;

    const parsedAmount = tryParsePesosInput(amountStr);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a whole peso amount above zero.');
      return;
    }

    const formattedDate = businessDate.trim();
    if (!isValidBusinessDate(formattedDate)) {
      setError('Enter a real date that is not in the future, like 2026-11-08.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit(
        {
          type,
          amount: parsedAmount,
          businessDate: formattedDate,
          expenseCategory: isExpense ? category : null,
          note: note.trim() || null,
        },
        isExpense ? stagedReceiptUris : [],
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not save this entry. Try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-paper-50 rounded-t-3xl max-h-[92%]">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
          >
            <StyledText variant="extrabold" className="text-xl text-ink-900">
              {isExpense ? 'Record an expense' : 'Record owner draw'}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-sm text-ink-600 mt-1 mb-4"
            >
              {isExpense
                ? 'Gastos for running the store. Comes out of your profit.'
                : 'Cash you take out for yourself. Not counted as an expense.'}
            </StyledText>

            {isExpense && category === 'supplies_packaging' && (
              <View className="bg-semantic-info-50 p-3 rounded-xl mb-4 border border-semantic-info-200">
                <StyledText
                  variant="regular"
                  className="text-sm text-semantic-info-800"
                >
                  Stock you buy to resell is not an expense. Record it with
                  Restock in Inventory.
                </StyledText>
              </View>
            )}

            <StyledText
              variant="semibold"
              className="text-sm text-ink-700 mb-1"
            >
              Amount (whole pesos)
            </StyledText>
            <TextInput
              testID="amount-input"
              keyboardType="number-pad"
              value={amountStr}
              onChangeText={(text) => {
                setAmountStr(text);
                setError(null);
              }}
              placeholder="0"
              placeholderTextColor="#7A7165"
              accessibilityLabel="Amount in pesos"
              style={{ minHeight: 48 }}
              className="border border-paper-300 bg-paper-100 rounded-xl px-3 mb-4 text-base text-ink-900"
            />

            <StyledText
              variant="semibold"
              className="text-sm text-ink-700 mb-1"
            >
              Date
            </StyledText>
            <View className="flex-row gap-2 mb-2">
              {[
                { label: 'Today', value: todayStr },
                { label: 'Yesterday', value: yesterdayStr },
              ].map((option) => {
                const active = businessDate === option.value;
                return (
                  <Pressable
                    key={option.label}
                    onPress={() => {
                      setBusinessDate(option.value);
                      setError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{ minHeight: 40 }}
                    className={`px-4 rounded-full border items-center justify-center ${
                      active
                        ? 'bg-ink-900 border-ink-900'
                        : 'bg-paper-50 border-ink-200'
                    }`}
                  >
                    <StyledText
                      variant="semibold"
                      className={`text-sm ${
                        active ? 'text-paper-50' : 'text-ink-700'
                      }`}
                    >
                      {option.label}
                    </StyledText>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              testID="date-input"
              value={businessDate}
              onChangeText={(text) => {
                setBusinessDate(text);
                setError(null);
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#7A7165"
              accessibilityLabel="Date, year-month-day"
              autoCapitalize="none"
              style={{ minHeight: 48 }}
              className="border border-paper-300 bg-paper-100 rounded-xl px-3 mb-4 text-base text-ink-900"
            />

            {isExpense && (
              <>
                <StyledText
                  variant="semibold"
                  className="text-sm text-ink-700 mb-2"
                >
                  Category
                </StyledText>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {CATEGORIES.map((c) => {
                    const active = category === c.value;
                    return (
                      <Pressable
                        key={c.value}
                        onPress={() => setCategory(c.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={{ minHeight: 40 }}
                        className={`px-3 rounded-xl border items-center justify-center ${
                          active
                            ? 'bg-ink-900 border-ink-900'
                            : 'bg-paper-100 border-paper-300'
                        }`}
                      >
                        <StyledText
                          variant="semibold"
                          className={`text-sm ${
                            active ? 'text-paper-50' : 'text-ink-800'
                          }`}
                        >
                          {c.label}
                        </StyledText>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <StyledText
              variant="semibold"
              className="text-sm text-ink-700 mb-1"
            >
              Note (optional)
            </StyledText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. ice, tricycle fare"
              placeholderTextColor="#7A7165"
              accessibilityLabel="Note"
              style={{ minHeight: 48 }}
              className="border border-paper-300 bg-paper-100 rounded-xl px-3 mb-4 text-base text-ink-900"
            />

            {isExpense && (
              <ReceiptPicker
                receipts={stagedReceiptUris.map((uri, index) => ({
                  id: `staged-${index}`,
                  financialEntryId: '',
                  relativePath: uri,
                  slot: index,
                  createdAt: Date.now(),
                }))}
                onAddReceipt={async (uri) => {
                  setStagedReceiptUris((prev) =>
                    prev.length < 5 ? [...prev, uri] : prev,
                  );
                }}
                onDeleteReceipt={async (id) => {
                  const index = Number.parseInt(id.replace('staged-', ''), 10);
                  if (!Number.isNaN(index)) {
                    setStagedReceiptUris((prev) =>
                      prev.filter((_, i) => i !== index),
                    );
                  }
                }}
              />
            )}

            {error ? (
              <StyledText
                variant="semibold"
                accessibilityRole="alert"
                className="text-sm text-semantic-danger mb-3"
              >
                {error}
              </StyledText>
            ) : null}

            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                style={{ minHeight: 48 }}
                className="flex-1 rounded-2xl bg-paper-200 border border-paper-300 items-center justify-center active:opacity-70"
              >
                <StyledText
                  variant="semibold"
                  className="text-base text-ink-800"
                >
                  Cancel
                </StyledText>
              </Pressable>
              <Pressable
                testID="save-entry-button"
                onPress={handleSave}
                disabled={loading}
                accessibilityRole="button"
                accessibilityState={{ disabled: loading }}
                style={{ minHeight: 48 }}
                className={`flex-1 rounded-2xl bg-persimmon-600 items-center justify-center active:opacity-80 ${
                  loading ? 'opacity-60' : ''
                }`}
              >
                <StyledText
                  variant="extrabold"
                  className="text-base text-white"
                >
                  {loading ? 'Saving...' : 'Save'}
                </StyledText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
