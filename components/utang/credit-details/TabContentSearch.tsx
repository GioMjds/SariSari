import { useState, useEffect } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

/** Lists shorter than this skip the search box; scanning is faster. */
export const SEARCH_MIN_ITEMS = 7;

interface TabContentSearchProps {
  value: string;
  onChange: (next: string) => void;
  resultCount: number;
  totalCount: number;
  placeholder: string;
  debounceMs?: number;
}

export function TabContentSearch({
  value,
  onChange,
  resultCount,
  totalCount,
  placeholder,
  debounceMs = 200,
}: TabContentSearchProps) {
  const { t } = useTranslation('utang');
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);
    return () => clearTimeout(handler);
  }, [localValue, onChange, value, debounceMs]);

  const hasQuery = localValue.trim().length > 0;

  return (
    <View className="mb-3">
      <View className="flex-row items-center bg-paper-50 border border-ink-200 rounded-xl px-3 min-h-[44px]">
        <FontAwesome name="search" size={13} color="#7A7165" />
        <TextInput
          value={localValue}
          onChangeText={setLocalValue}
          placeholder={placeholder}
          placeholderTextColor="#7A7165"
          accessibilityLabel={t('detailSearchA11y')}
          className="flex-1 ml-2.5 text-ink-900 text-sm py-2.5 px-0"
          returnKeyType="search"
        />
        {hasQuery && (
          <Pressable
            onPress={() => {
              setLocalValue('');
              onChange('');
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('detailSearchClear')}
            className="press-scale ml-1 w-8 h-8 items-center justify-center rounded-full bg-paper-200"
          >
            <FontAwesome name="times" size={12} color="#564E45" />
          </Pressable>
        )}
      </View>

      {hasQuery && (
        <StyledText
          variant="medium"
          className="text-mono text-ink-500 mt-1.5 ml-1"
          accessibilityLiveRegion="polite"
        >
          {t('detailSearchCount', { shown: resultCount, total: totalCount })}
        </StyledText>
      )}
    </View>
  );
}
