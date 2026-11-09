import { FC, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { StyledText } from '@/components/elements';
import { tryParsePesosInput } from '@/lib/money';
import type {
  DigitalWalletType,
  NewDigitalWallet,
} from '@/types/digitalServices.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: NewDigitalWallet) => Promise<void>;
}

const WALLET_TYPES: { value: DigitalWalletType; label: string }[] = [
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'telco_load', label: 'Load' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
];

export const WalletModal: FC<Props> = ({ visible, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [walletType, setWalletType] = useState<DigitalWalletType>('gcash');
  const [balanceStr, setBalanceStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setWalletType('gcash');
    setBalanceStr('');
    setError(null);
    setLoading(false);
  }, [visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Enter a wallet name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name,
        walletType,
        openingBalance: Math.round(
          tryParsePesosInput(balanceStr),
        ) as NewDigitalWallet['openingBalance'],
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <View className="bg-paper-100 rounded-t-3xl p-5 pb-8">
          <StyledText variant="extrabold" className="text-xl text-ink-900">
            New wallet
          </StyledText>

          <View className="flex-row flex-wrap mt-4">
            {WALLET_TYPES.map((o) => {
              const selected = walletType === o.value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    setWalletType(o.value);
                    if (!name.trim()) setName(o.label);
                  }}
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
                    {o.label}
                  </StyledText>
                </Pressable>
              );
            })}
          </View>

          <StyledText variant="semibold" className="text-sm text-ink-700 mt-3">
            Name
          </StyledText>
          <TextInput
            value={name}
            onChangeText={setName}
            accessibilityLabel="Wallet name"
            className="mt-2 bg-paper-50 border border-paper-300 rounded-xl px-4 text-base text-ink-900"
            style={{ minHeight: 48 }}
          />

          <StyledText variant="semibold" className="text-sm text-ink-700 mt-3">
            Starting balance
          </StyledText>
          <TextInput
            value={balanceStr}
            onChangeText={setBalanceStr}
            keyboardType="decimal-pad"
            placeholder="0"
            accessibilityLabel="Starting balance"
            className="mt-2 bg-paper-50 border border-paper-300 rounded-xl px-4 text-lg text-ink-900"
            style={{ minHeight: 52 }}
          />

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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
