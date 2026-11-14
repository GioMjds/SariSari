import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { ONBOARDING_COLORS } from '@/components/onboarding/palette';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Props = { label: string };

export function SuccessCheck({ label }: Props) {
  const reducedMotion = useReducedMotion();
  return (
    <MotiView
      from={{ opacity: 0, scale: reducedMotion ? 1 : 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reducedMotion
          ? { type: 'timing', duration: 150 }
          : { type: 'spring', damping: 14 }
      }
    >
      <View className="flex-row items-center gap-1">
        <Ionicons
          name="checkmark-circle"
          size={18}
          color={ONBOARDING_COLORS.success}
        />
        <StyledText variant="semibold" className="text-sage-700 text-caption">
          {label}
        </StyledText>
      </View>
    </MotiView>
  );
}
