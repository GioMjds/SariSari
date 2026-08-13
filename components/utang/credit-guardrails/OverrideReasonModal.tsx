import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
import type { OverrideReasonCode } from '@/types/credits.types';

export interface OverrideReasonResult {
  code: OverrideReasonCode;
  note: string | null;
}

export interface OverrideReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (result: OverrideReasonResult) => void;
}

type ReasonLabels = {
  label: string;
  description: string;
};

export const OVERRIDE_REASON_LABELS = {
  regular_customer: {
    label: 'Regular Customer',
    description: 'Trusted suki with consistent payment history.',
  },
  long_term_suki: {
    label: 'Long-term Suki',
    description: 'Customer has been buying for a long time.',
  },
  partial_payment_promised: {
    label: 'Partial Payment Promised',
    description: 'Customer committed to pay part of the balance today.',
  },
  owner_discretion: {
    label: 'Owner Discretion',
    description: 'Owner approves this credit on their own judgment.',
  },
  other: {
    label: 'Other',
    description: 'Explain the reason below.',
  },
} satisfies Record<OverrideReasonCode, ReasonLabels>;

const REASON_CODES = [
  'regular_customer',
  'long_term_suki',
  'partial_payment_promised',
  'owner_discretion',
  'other',
] satisfies OverrideReasonCode[];

export function OverrideReasonModal({
  visible,
  onClose,
  onSubmit,
}: OverrideReasonModalProps) {
  const [selectedCode, setSelectedCode] = useState<OverrideReasonCode | null>(
    null,
  );
  const { runWithPinGuard } = useOwnerPinGuard();
  const [note, setNote] = useState('');

  if (!visible) return null;

  const handleSelect = (code: OverrideReasonCode) => {
    if (code !== 'other') {
      runWithPinGuard({
        title: 'Authorize Credit Override',
        actionDescription: `Credit limit override (${OVERRIDE_REASON_LABELS[code].label})`,
        onApproved: () => {
          setSelectedCode(null);
          setNote('');
          onSubmit({ code, note: null });
        },
      });
    } else {
      setSelectedCode(code);
    }
  };

  const handleSubmitOther = () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    runWithPinGuard({
      title: 'Authorize Credit Override',
      actionDescription: 'Credit limit override (Other reason)',
      onApproved: () => {
        onSubmit({ code: 'other', note: trimmed });
        setSelectedCode(null);
        setNote('');
      },
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-paper-50 rounded-t-2xl p-4 gap-4">
          <View className="flex-row items-center justify-between">
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              Override Reason
            </StyledText>
            <Pressable onPress={onClose} hitSlop={8}>
              <StyledText variant="medium" className="text-ink-500 text-sm">
                Cancel
              </StyledText>
            </Pressable>
          </View>

          {REASON_CODES.map((code) => {
            const { label, description } = OVERRIDE_REASON_LABELS[code];
            return (
              <Pressable
                key={code}
                onPress={() => handleSelect(code)}
                className="border border-ink-150 rounded-xl p-3 gap-1"
              >
                <StyledText variant="semibold" className="text-ink-900 text-sm">
                  {label}
                </StyledText>
                <StyledText variant="regular" className="text-ink-500 text-xs">
                  {description}
                </StyledText>
              </Pressable>
            );
          })}

          {selectedCode === 'other' && (
            <View className="gap-2">
              <TextInput
                placeholder="Add a note"
                value={note}
                onChangeText={setNote}
                multiline
                className="border border-ink-200 rounded-xl p-3 text-ink-900 min-h-20"
              />
              <Pressable
                onPress={handleSubmitOther}
                disabled={!note.trim()}
                className={`rounded-xl px-4 py-3 items-center ${note.trim() ? 'bg-primary-600' : 'bg-ink-200'}`}
              >
                <StyledText
                  variant="semibold"
                  className={
                    note.trim() ? 'text-white text-sm' : 'text-ink-400 text-sm'
                  }
                >
                  Submit
                </StyledText>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
