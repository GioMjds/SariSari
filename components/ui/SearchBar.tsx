import { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { AnimatePresence, MotiView } from 'moti';
import { StyledText } from '../elements';

type SearchBarProps = {
  value?: string;
  onChange: (s: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  debounceMs?: number;
  onFilterPress?: (() => void) | undefined;
  activeFilterCount?: number | undefined;
} & Omit<TextInputProps, 'onChange' | 'onChangeText'>;

export function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  accessibilityLabel = 'Search',
  debounceMs = 0,
  onFilterPress,
  activeFilterCount,
  ...props
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (debounceMs <= 0) return;
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [local, debounceMs, onChange, value]);

  const hasContent = local.length > 0;
  const hasFilter = Boolean(onFilterPress);

  const rightPaddingClass =
    hasContent && hasFilter
      ? 'pr-20'
      : hasContent || hasFilter
      ? 'pr-11'
      : 'pr-4';

  return (
    <View className="relative flex-row items-center">
      <FontAwesome
        name="search"
        size={20}
        color="#E85A1F"
        style={{ position: 'absolute', left: 16, zIndex: 10 }}
      />
      <TextInput
        value={local}
        onChangeText={(t) => {
          setLocal(t);
          if (debounceMs <= 0) onChange(t);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="search"
        returnKeyType="search"
        className={`w-full bg-surface-subtle border ${
          focused ? 'border-persimmon-300' : 'border-warm-100'
        } rounded-xl px-4 py-5 pl-12 ${rightPaddingClass} text-warm-900 placeholder-warm-500`}
        {...props}
      />
      <View className="absolute right-2 flex-row items-center gap-1 z-10">
        <AnimatePresence>
          {hasContent && (
            <MotiView
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'timing', duration: 140 }}
            >
              <TouchableOpacity
                onPress={() => {
                  setLocal('');
                  onChange('');
                }}
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                hitSlop={10}
                className="press-scale active:opacity-70 w-8 h-8 items-center justify-center rounded-full bg-paper-200"
              >
                <FontAwesome name="times" size={12} color="#564E45" />
              </TouchableOpacity>
            </MotiView>
          )}
        </AnimatePresence>
        {onFilterPress && (
          <TouchableOpacity
            onPress={onFilterPress}
            accessibilityLabel="Filter items"
            accessibilityRole="button"
            hitSlop={8}
            className="press-scale active:opacity-70 w-8 h-8 items-center justify-center rounded-full bg-paper-200 relative"
          >
            <FontAwesome name="sliders" size={20} color="#564E45" />
            {Boolean(activeFilterCount && activeFilterCount > 0) && (
              <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-persimmon-500 items-center justify-center border border-paper-50">
                <StyledText
                  variant="extrabold"
                  className="text-[9px] font-extrabold text-paper-50"
                >
                  {activeFilterCount}
                </StyledText>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

