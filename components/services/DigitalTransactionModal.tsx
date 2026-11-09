import { FC, useEffect, useMemo, useState } from 'react';
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
import { computeDigitalEffect, suggestServiceFee } from '@/lib/digitalServices';
import { formatPesos, tryParsePesosInput } from '@/lib/money';
import type {
  DigitalTransactionType,
  DigitalWallet,
  NewDigitalTransaction,
} from '@/types/digitalServices.types';

interface Props {
  visible: boolean;
  wallets: DigitalWallet[];
  initialType?: DigitalTransactionType;
  onClose: () => void;
  onSubmit: (data: NewDigitalTransaction) => Promise<void>;
}

const TYPE_OPTIONS: { value: DigitalTransactionType; label: string }[] = [
  { value: 'cash_in', label: 'Cash-in' },
  { value: 'cash_out', label: 'Cash-out' },
  { value: 'eload', label: 'E-load' },
  { value: 'replenish', label: 'Add float' },
  { value: 'adjustment', label: 'Adjust' },
];

const AMOUNT_LABEL: Record<DigitalTransactionType, string> = {
  cash_in: 'Amount sent to customer',
  cash_out: 'Amount customer sent',
  eload: 'Load amount',
  replenish: 'Float to add',
  adjustment: 'Amount to correct',
};

const Chip: FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    style={{ minHeight: 44 }}
    className={`px-4 rounded-xl border justify-center mr-2 mb-2 ${
      selected
        ? 'bg-persimmon-600 border-persimmon-600'
        : 'bg-paper-50 border-paper-300'
    }`}
  >
    <StyledText
      variant="semibold"
      className={selected ? 'text-paper-50' : 'text-ink-900'}
    >
      {label}
    </StyledText>
  </Pressable>
);

export const DigitalTransactionModal: FC<Props> = ({
  visible,
  wallets,
  initialType = 'cash_in',
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<DigitalTransactionType>(initialType);
  const [walletId, setWalletId] = useState<number | null>(null);
  const [amountStr, setAmountStr] = useState('');
  const [feeStr, setFeeStr] = useState('');
  const [feeTouched, setFeeTouched] = useState(false);
  const [fromDrawer, setFromDrawer] = useState(true);
  const [removeFloat, setRemoveFloat] = useState(false);
  const [phone, setPhone] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setType(initialType);
    setWalletId(wallets[0]?.id ?? null);
    setAmountStr('');
    setFeeStr('');
    setFeeTouched(false);
    setFromDrawer(true);
    setRemoveFloat(false);
    setPhone('');
    setReference('');
    setNote('');
    setError(null);
    setLoading(false);
  }, [visible, initialType, wallets]);

  const amount = Math.round(tryParsePesosInput(amountStr));
  const showFee = type !== 'replenish' && type !== 'adjustment';

  const handleAmountChange = (value: string) => {
    setAmountStr(value);
    if (!feeTouched) {
      const suggested = suggestServiceFee(
        type,
        Math.round(tryParsePesosInput(value)),
      );
      setFeeStr(suggested > 0 ? String(suggested) : '');
    }
  };

  const handleTypeChange = (next: DigitalTransactionType) => {
    setType(next);
    setError(null);
    if (!feeTouched) {
      const suggested = suggestServiceFee(next, amount);
      setFeeStr(suggested > 0 ? String(suggested) : '');
    }
  };

  const draft = useMemo((): NewDigitalTransaction | null => {
    if (walletId === null || amount <= 0) return null;
    const base: NewDigitalTransaction = {
      walletId,
      transactionType: type,
      principalAmount: amount as NewDigitalTransaction['principalAmount'],
      referenceNumber: reference,
      customerPhone: phone,
      note,
    };
    if (type === 'adjustment') {
      return { ...base, adjustmentDelta: removeFloat ? -amount : amount };
    }
    if (type === 'replenish') return { ...base, fundedFromDrawer: fromDrawer };
    return {
      ...base,
      serviceFee: Math.round(
        tryParsePesosInput(feeStr),
      ) as NewDigitalTransaction['principalAmount'],
    };
  }, [walletId, amount, type, reference, phone, note, removeFloat, fromDrawer, feeStr]);

  const preview = useMemo(() => {
    if (!draft) return null;
    try {
      return computeDigitalEffect(draft);
    } catch {
      return null;
    }
  }, [draft]);

  const handleSubmit = async () => {
    if (walletId === null) {
      setError('Add a wallet first.');
      return;
    }
    if (!draft) {
      setError('Enter an amount greater than zero.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(draft);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const drawerLine = preview
    ? preview.cashDrawerDelta === 0
      ? 'No change to drawer cash'
      : `${preview.cashDrawerDelta > 0 ? 'Drawer gets' : 'Drawer gives'} ${formatPesos(Math.abs(preview.cashDrawerDelta))}`
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/40"
      >
        <View className="bg-paper-100 rounded-t-3xl max-h-[90%]">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          >
            <StyledText variant="extrabold" className="text-xl text-ink-900">
              Record e-service
            </StyledText>

            <View className="flex-row flex-wrap mt-4">
              {TYPE_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={type === o.value}
                  onPress={() => handleTypeChange(o.value)}
                />
              ))}
            </View>

            <StyledText variant="semibold" className="text-sm text-ink-700 mt-3">
              Wallet
            </StyledText>
            <View className="flex-row flex-wrap mt-2">
              {wallets.map((w) => (
                <Chip
                  key={w.id}
                  label={w.name}
                  selected={walletId === w.id}
                  onPress={() => setWalletId(w.id)}
                />
              ))}
            </View>

            <StyledText variant="semibold" className="text-sm text-ink-700 mt-3">
              {AMOUNT_LABEL[type]}
            </StyledText>
            <TextInput
              value={amountStr}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0"
              accessibilityLabel={AMOUNT_LABEL[type]}
              className="mt-2 bg-paper-50 border border-paper-300 rounded-xl px-4 text-lg text-ink-900"
              style={{ minHeight: 52 }}
            />

            {showFee ? (
              <>
                <StyledText
                  variant="semibold"
                  className="text-sm text-ink-700 mt-3"
                >
                  Service fee (patong)
                </StyledText>
                <TextInput
                  value={feeStr}
                  onChangeText={(v) => {
                    setFeeTouched(true);
                    setFeeStr(v);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  accessibilityLabel="Service fee"
                  className="mt-2 bg-paper-50 border border-paper-300 rounded-xl px-4 text-lg text-ink-900"
                  style={{ minHeight: 52 }}
                />
              </>
            ) : null}

            {type === 'replenish' ? (
              <View className="flex-row flex-wrap mt-3">
                <Chip
                  label="From drawer cash"
                  selected={fromDrawer}
                  onPress={() => setFromDrawer(true)}
                />
                <Chip
                  label="From bank or other"
                  selected={!fromDrawer}
                  onPress={() => setFromDrawer(false)}
                />
              </View>
            ) : null}

            {type === 'adjustment' ? (
              <View className="flex-row flex-wrap mt-3">
                <Chip
                  label="Add to balance"
                  selected={!removeFloat}
                  onPress={() => setRemoveFloat(false)}
                />
                <Chip
                  label="Remove from balance"
                  selected={removeFloat}
                  onPress={() => setRemoveFloat(true)}
                />
              </View>
            ) : null}

            {showFee ? (
              <>
                <StyledText
                  variant="semibold"
                  className="text-sm text-ink-700 mt-3"
                >
                  Customer phone (optional)
                </StyledText>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  className="mt-2 bg-paper-50 border border-paper-300 rounded-xl px-4 text-base text-ink-900"
                  style={{ minHeight: 48 }}
                />
                <StyledText
                  variant="semibold"
                  className="text-sm text-ink-700 mt-3"
                >
                  Reference number (optional)
                </StyledText>
                <TextInput
                  value={reference}
                  onChangeText={setReference}
                  autoCapitalize="characters"
                  className="mt-2 bg-paper-50 border border-paper-300 rounded-xl px-4 text-base text-ink-900"
                  style={{ minHeight: 48 }}
                />
              </>
            ) : null}

            <StyledText variant="semibold" className="text-sm text-ink-700 mt-3">
              Note (optional)
            </StyledText>
            <TextInput
              value={note}
              onChangeText={setNote}
              className="mt-2 bg-paper-50 border border-paper-300 rounded-xl px-4 text-base text-ink-900"
              style={{ minHeight: 48 }}
            />

            {preview ? (
              <View className="mt-4 bg-paper-50 border border-paper-300 rounded-xl p-3">
                <StyledText variant="regular" className="text-sm text-ink-700">
                  Wallet {preview.walletDelta >= 0 ? '+' : '-'}
                  {formatPesos(Math.abs(preview.walletDelta))}
                </StyledText>
                <StyledText variant="regular" className="text-sm text-ink-700">
                  {drawerLine}
                </StyledText>
                {preview.serviceFee > 0 ? (
                  <StyledText
                    variant="semibold"
                    className="text-sm text-ink-900"
                  >
                    Your income: {formatPesos(preview.serviceFee)}
                  </StyledText>
                ) : null}
              </View>
            ) : null}

            {error ? (
              <StyledText variant="semibold" className="text-sm text-red-700 mt-3">
                {error}
              </StyledText>
            ) : null}

            <View className="flex-row gap-3 mt-5">
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                style={{ minHeight: 48 }}
                className="flex-1 items-center justify-center rounded-xl bg-paper-50 border border-paper-300 active:opacity-70"
              >
                <StyledText variant="extrabold" className="text-ink-900">
                  Cancel
                </StyledText>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                accessibilityRole="button"
                style={{ minHeight: 48 }}
                className="flex-1 items-center justify-center rounded-xl bg-persimmon-600 active:opacity-80"
              >
                <StyledText variant="extrabold" className="text-paper-50">
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
