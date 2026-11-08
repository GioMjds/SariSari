import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';

type Props = { label: string };

export function SuccessCheck({ label }: Props) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 14 }}
    >
      <View className="flex-row items-center gap-1">
        <Ionicons name="checkmark-circle" size={18} color="#4F7A4B" />
        <StyledText variant="semibold" className="text-sage-700 text-caption">
          {label}
        </StyledText>
      </View>
    </MotiView>
  );
}
