import { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { AnimatePresence, MotiView } from 'moti';

type SearchBarProps = {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  debounceMs?: number;
} & Omit<TextInputProps, 'onChange' | 'onChangeText'>;

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  accessibilityLabel = 'Search',
  debounceMs = 0,
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

  return (
    <View className="relative flex-row items-center">
      <FontAwesome
        name="search"
        size={14}
        color="#E85A1F"
        style={{ position: 'absolute', left: 12, zIndex: 10 }}
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
        } rounded-xl px-4 py-3 pl-11 text-warm-900 placeholder-warm-500`}
        {...props}
      />
      <AnimatePresence>
        {local.length > 0 && (
          <MotiView
            from={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'timing', duration: 140 }}
            className="absolute right-2"
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
    </View>
  );
}
