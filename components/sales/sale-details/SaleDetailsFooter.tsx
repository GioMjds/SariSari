import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Pressable, View } from 'react-native';

interface SaleDetailsFooterProps {
  bottomInset: number;
  onVoid: () => void;
  onRefund: () => void;
  onPriceCorrection: () => void;
}

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

function ActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: IconName;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-1 min-h-12 rounded-xl bg-paper-50 border border-paper-400 flex-row items-center justify-center gap-2 px-2 active:bg-paper-100"
    >
      <FontAwesome name={icon} size={14} color={color} />
      <StyledText variant="extrabold" className="text-sm" style={{ color }} numberOfLines={1}>
        {label}
      </StyledText>
    </Pressable>
  );
}

// Sticky correction bar pinned above the home indicator; hidden once a sale is cancelled.
export function SaleDetailsFooter({
  bottomInset,
  onVoid,
  onRefund,
  onPriceCorrection,
}: SaleDetailsFooterProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 240, delay: 120 }}
      className="absolute bottom-0 left-0 right-0 bg-paper-200 border-t border-paper-300 px-4 pt-3"
      style={{ paddingBottom: bottomInset + 12 }}
    >
      <View className="flex-row gap-2.5">
        <ActionButton icon="ban" label="Void" color="#C13030" onPress={onVoid} />
        <ActionButton icon="undo" label="Refund" color="#623418" onPress={onRefund} />
        <ActionButton icon="pencil" label="Edit price" color="#0E0C0A" onPress={onPriceCorrection} />
      </View>
    </MotiView>
  );
}
