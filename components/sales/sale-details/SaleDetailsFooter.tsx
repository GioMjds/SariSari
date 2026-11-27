import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

interface SaleDetailsFooterProps {
  bottomInset: number;
  onShare: () => void;
  sharing?: boolean;
  /** Omitted for cancelled sales, which hides the Fix sale button. */
  onFix?: (() => void) | undefined;
}

// Sticky bar pinned above the home indicator: share is primary, fixing the sale is secondary.
export function SaleDetailsFooter({ bottomInset, onShare, sharing, onFix }: SaleDetailsFooterProps) {
  const reduceMotion = useReducedMotion();

  return (
    <MotiView
      from={{ opacity: 0, translateY: reduceMotion ? 0 : 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: reduceMotion ? 120 : 240, delay: 120 }}
      className="absolute bottom-0 left-0 right-0 bg-paper-200 border-t border-paper-300 px-4 pt-3"
      style={{ paddingBottom: bottomInset + 12 }}
    >
      <View className="flex-row gap-2.5">
        {onFix && (
          <Pressable
            onPress={onFix}
            accessibilityRole="button"
            accessibilityLabel="Fix sale"
            accessibilityHint="Void, refund, or correct a price"
            className="flex-1 min-h-12 rounded-xl bg-paper-50 border border-paper-400 flex-row items-center justify-center gap-2 px-3 active:bg-paper-100"
          >
            <FontAwesome name="wrench" size={14} color="#0E0C0A" />
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              Fix sale
            </StyledText>
          </Pressable>
        )}
        <Pressable
          onPress={onShare}
          disabled={sharing}
          accessibilityRole="button"
          accessibilityLabel="Share resibo"
          accessibilityState={{ busy: !!sharing, disabled: !!sharing }}
          className={`${onFix ? 'flex-[1.4]' : 'flex-1'} min-h-12 rounded-xl bg-persimmon-600 flex-row items-center justify-center gap-2 px-3 active:bg-persimmon-700 ${
            sharing ? 'opacity-60' : ''
          }`}
        >
          {sharing ? (
            <ActivityIndicator size="small" color="#FBF7EE" />
          ) : (
            <FontAwesome name="share-square-o" size={15} color="#FBF7EE" />
          )}
          <StyledText variant="extrabold" className="text-paper-50 text-base">
            Share resibo
          </StyledText>
        </Pressable>
      </View>
    </MotiView>
  );
}
