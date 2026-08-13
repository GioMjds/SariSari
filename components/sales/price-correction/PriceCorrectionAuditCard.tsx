import React from 'react';
import { TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

type PriceCorrectionAuditCardProps = {
  witness: string;
  onWitnessChange: (val: string) => void;
  note: string;
  onNoteChange: (val: string) => void;
};

export const PriceCorrectionAuditCard: React.FC<
  PriceCorrectionAuditCardProps
> = ({ witness, onWitnessChange, note, onNoteChange }) => {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-5">
      <StyledText
        variant="black"
        className="label-caps text-cinnamon-500 mb-1"
      >
        Audit Verification
      </StyledText>
      <StyledText variant="regular" className="text-ink-400 text-xs mb-3">
        Enter cashier or witness details to authorize this record
      </StyledText>

      <View className="mb-4">
        <StyledText
          variant="semibold"
          className="text-ink-800 text-xs mb-1.5"
        >
          Witness / Cashier Name *
        </StyledText>
        <View className="bg-paper-100 rounded-xl border border-ink-100 flex-row items-center px-3 py-1 focus-within:border-persimmon-500">
          <FontAwesome name="user" size={14} color="#7A7165" />
          <TextInput
            value={witness}
            onChangeText={onWitnessChange}
            placeholder="e.g., Ate Nena / Cashier Shift A"
            placeholderTextColor="#A89F90"
            className="flex-1 py-2.5 px-2.5 text-ink-900 text-sm font-medium"
          />
        </View>
      </View>

      <View>
        <StyledText
          variant="semibold"
          className="text-ink-800 text-xs mb-1.5"
        >
          Additional Note (Optional)
        </StyledText>
        <View className="bg-paper-100 rounded-xl border border-ink-100 p-3 focus-within:border-persimmon-500">
          <TextInput
            value={note}
            onChangeText={onNoteChange}
            placeholder="Notes on pricing error or approval..."
            placeholderTextColor="#A89F90"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="text-ink-900 text-sm font-medium min-h-[70px]"
          />
        </View>
      </View>
    </View>
  );
};
