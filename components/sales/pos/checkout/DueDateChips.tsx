import { Pressable, View } from 'react-native';
import {
  DuePreset,
  DuePresetConfig,
  DUE_PRESETS,
  formatDueChip,
} from './useAddCreditForm';
import { StyledText } from '@/components/elements';

interface DueDateChipsProps {
  dueDate: string;
  activePreset: DuePreset;
  onPresetSelect: (preset: DuePresetConfig) => void;
}

export function DueDateChips({
  dueDate,
  activePreset,
  onPresetSelect,
}: DueDateChipsProps) {
  const dueChipLabel = formatDueChip(dueDate);

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <StyledText variant="black" className="label-caps text-ink-700">
          Due Date
        </StyledText>
        {dueChipLabel && (
          <View className="bg-cinnamon-500 rounded-pill px-2 py-0.5">
            <StyledText variant="extrabold" className="text-paper-50 text-xs">
              {dueChipLabel}
            </StyledText>
          </View>
        )}
      </View>

      <View className="flex-row gap-2">
        {DUE_PRESETS.map((preset) => {
          const active = activePreset === preset.id;
          return (
            <Pressable
              key={preset.id}
              onPress={() => onPresetSelect(preset)}
              accessibilityRole="button"
              accessibilityLabel={`Due date: ${preset.label}`}
              accessibilityState={{ selected: active }}
              className={`press-scale flex-1 items-center py-2.5 rounded-xl border ${
                active
                  ? 'bg-cinnamon-500 border-cinnamon-500'
                  : 'bg-paper-100 border-ink-100'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-sm ${
                  active ? 'text-paper-50' : 'text-ink-900'
                }`}
              >
                {preset.label}
              </StyledText>
              <StyledText
                variant="regular"
                className={`text-[10px] mt-0.5 ${
                  active ? 'text-paper-100' : 'text-ink-500'
                }`}
              >
                {preset.description}
              </StyledText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
