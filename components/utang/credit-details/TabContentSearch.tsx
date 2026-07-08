import { useState, useEffect } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface TabContentSearchProps {
  value: string;
  onChange: (next: string) => void;
  resultCount: number;
  /** Total items in the unfiltered list (denominator for the count line). */
  totalCount: number;
  /** Label for the active list, e.g. "credits", "payments". */
  noun: string;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * TabContentSearch — a compact filter row that lives at the top of
 * each tab list (Credits / Payments). The result count below the
 * input tells the user whether their query matched anything so they
 * don't keep typing into an empty list.
 *
 * Pure presentation — the parent owns the actual filtering and the
 * `resultCount` calculation.
 */
export function TabContentSearch({
  value,
  onChange,
  resultCount,
  totalCount,
  noun,
  placeholder = 'Search…',
  debounceMs = 200,
}: TabContentSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync with parent value (e.g. if the parent resets search, or switches tabs)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced propagation
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);
    return () => clearTimeout(handler);
  }, [localValue, onChange, value, debounceMs]);

  const trimmed = localValue.trim();
  const hasQuery = trimmed.length > 0;

  return (
    <View className="mb-3">
      <View className="flex-row items-center bg-paper-50 border border-ink-200 rounded-xl px-3 py-2.5 focus-within:border-persimmon-500">
        <FontAwesome name="search" size={12} color="#7A7165" />
        <StyledText
          variant="medium"
          className="text-ink-700 text-sm ml-2 mr-1"
        >
          {noun}
        </StyledText>
        <View className="flex-1 ml-2">
          <TextInput
            value={localValue}
            onChangeText={setLocalValue}
            placeholder={placeholder}
            placeholderTextColor="#A89F90"
            accessibilityLabel="Search this tab"
            className="text-ink-900 text-sm py-0 px-0"
            returnKeyType="search"
          />
        </View>
        {hasQuery && (
          <ClearButton
            onClear={() => {
              setLocalValue('');
              onChange('');
            }}
          />
        )}
      </View>

      {hasQuery && (
        <StyledText
          variant="medium"
          className="text-mono text-ink-500 mt-1.5 ml-1"
        >
          {resultCount} of {totalCount} {totalCount === 1 ? noun : `${noun}s`}
        </StyledText>
      )}
    </View>
  );
}

/* ─── Inline clear button ────────────────────────────────────── */

function ClearButton({ onClear }: { onClear: () => void }) {
  return (
    <Pressable
      onPress={onClear}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Clear search"
      className="press-scale ml-1 w-6 h-6 items-center justify-center rounded-full bg-paper-200"
    >
      <FontAwesome name="times" size={10} color="#564E45" />
    </Pressable>
  );
}
