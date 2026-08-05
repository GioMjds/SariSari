import React from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export interface SegmentedOption<V extends string> {
  label: string;
  value: V;
  icon?: keyof typeof FontAwesome.glyphMap;
}

interface Props<V extends string> {
  value: V;
  onChange: (next: V) => void;
  options: SegmentedOption<V>[];
}

export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
}: Props<V>) {
  return (
    <View className="bg-paper-100 rounded-full p-1 flex-row">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: active }}
            className={`flex-1 min-h-[36px] rounded-full flex-row items-center justify-center gap-x-1.5 ${
              active ? 'bg-paper-50 shadow-paper' : 'bg-transparent'
            }`}
          >
            {opt.icon ? (
              <FontAwesome
                name={opt.icon}
                size={12}
                color={active ? '#0E0C0A' : '#736B63'}
              />
            ) : null}
            <StyledText
              variant="extrabold"
              className={`text-xs ${active ? 'text-ink-900' : 'text-ink-500'}`}
            >
              {opt.label}
            </StyledText>
          </Pressable>
        );
      })}
    </View>
  );
}
