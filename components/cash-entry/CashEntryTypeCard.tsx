import React from 'react';
import { View, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { StyledText } from '@/components/elements';
import {
  CashEntryFormData,
  ENTRY_TYPES,
} from './useCashEntryForm';

interface CashEntryTypeCardProps {
  control: Control<CashEntryFormData>;
}

export function CashEntryTypeCard({ control }: CashEntryTypeCardProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
      <StyledText
        variant="black"
        className="label-caps text-cinnamon-500 mb-3"
      >
        1. Select Type
      </StyledText>

      <Controller
        control={control}
        name="type"
        rules={{ required: true }}
        render={({ field: { value, onChange } }) => (
          <View className="space-y-3">
            {ENTRY_TYPES.map((typeOption) => {
              const isSelected = value === typeOption.value;
              return (
                <Pressable
                  key={typeOption.value}
                  onPress={() => onChange(typeOption.value)}
                  className={`flex-row items-center p-3.5 rounded-xl border-2 active:opacity-70 ${
                    isSelected
                      ? `${typeOption.bg} ${typeOption.border}`
                      : 'bg-paper-100 border-transparent'
                  }`}
                >
                  <View className="mr-3">
                    <FontAwesome
                      name={typeOption.icon}
                      size={20}
                      className={
                        isSelected ? typeOption.color : 'text-ink-400'
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <StyledText
                      variant="semibold"
                      className={`text-sm ${isSelected ? 'text-ink-900' : 'text-ink-700'}`}
                    >
                      {typeOption.label}
                    </StyledText>
                    <StyledText
                      variant="regular"
                      className="text-ink-400 text-xs mt-0.5"
                    >
                      {typeOption.sub}
                    </StyledText>
                  </View>
                  <View className="ml-2">
                    <View
                      className={`w-5 h-5 rounded-full border items-center justify-center ${
                        isSelected
                          ? 'bg-persimmon-500 border-persimmon-600'
                          : 'border-ink-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <FontAwesome
                          name="check"
                          size={10}
                          color="#FBF7EE"
                        />
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      />
    </View>
  );
}
