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
  /** Override the default 'Search' accessibility label. */
  accessibilityLabel?: string;
  /**
   * Debounce window for the upstream onChange callback. Local value
   * stays in sync immediately; the parent only learns about typing
   * after this many ms of quiet. Default 0 = no debounce.
   */
  debounceMs?: number;
} & Omit<TextInputProps, 'onChange'>;

/**
 * SearchBar — a focusable, debounceable text input framed by a search
 * icon and a clear button. Used by the Products and Inventory tabs.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  accessibilityLabel = 'Search',
  debounceMs = 0,
  ...props
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  // Local value is what the TextInput reads from so that we can
  // apply debouncing to the upstream onChange without losing
  // responsive feedback while typing.
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
        className="absolute left-3 text-primary-500 z-10"
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
            className="absolute right-3"
          >
            <TouchableOpacity
              onPress={() => {
                setLocal('');
                onChange('');
              }}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              hitSlop={8}
              className="press-scale active:opacity-70"
            >
              <FontAwesome name="times" size={12} className="text-warm-500" />
            </TouchableOpacity>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}
