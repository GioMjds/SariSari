import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

interface StepperStampProps {
  quantity: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

/**
 * StepperStamp — "void / validate" stamp-style quantity stepper.
 * Visual: a single rounded paper-100 pill containing −, qty, +,
 * styled to read as a tiny rubber stamp rather than a generic
 * counter. The + button is disabled (paper-100 fill) when at max.
 */
export function StepperStamp({
  quantity,
  max,
  onDecrement,
  onIncrement,
}: StepperStampProps) {
  const atMax = quantity >= max;
  return (
    <View className="flex-row items-center bg-paper-100 border border-ink-200 rounded-pill px-1.5 py-1">
      <Pressable
        onPress={onDecrement}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        className="w-8 h-8 items-center justify-center rounded-full bg-paper-50 border border-ink-200 active:opacity-60"
      >
        <FontAwesome name="minus" size={12} color="#28231D" />
      </Pressable>
      <View className="min-w-[36px] items-center justify-center px-2">
        <StyledText
          variant="black"
          className="text-ink-900 text-base font-stack-sans-bold"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {quantity}
        </StyledText>
      </View>
      <Pressable
        onPress={onIncrement}
        disabled={atMax}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        className={`w-8 h-8 items-center justify-center rounded-full border ${
          atMax
            ? 'bg-paper-100 border-ink-200 opacity-50'
            : 'bg-persimmon-500 border-persimmon-600 active:opacity-80'
        }`}
      >
        <FontAwesome
          name="plus"
          size={12}
          color={atMax ? '#7A7165' : '#FBF7EE'}
        />
      </Pressable>
    </View>
  );
}
