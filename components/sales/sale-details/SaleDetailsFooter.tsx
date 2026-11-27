import { StyledText } from '@/components/elements';
import { ICON_COLOR } from '@/lib/theme';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { ActivityIndicator, Pressable, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

interface SaleDetailsFooterProps {
  bottomInset: number;
  onShare: () => void;
  sharing?: boolean;
  /** Omitted for cancelled sales, which hides the Fix sale button. */
  onFix?: (() => void) | undefined;
  /** Reports the bar's full height so the scroll content can clear it at any text size. */
  onLayout?: (height: number) => void;
}

// Above this font scale the two buttons stack so their labels never clip.
const STACK_FONT_SCALE = 1.3;

// Sticky bar pinned above the home indicator: share is primary, fixing the sale is secondary.
export function SaleDetailsFooter({ bottomInset, onShare, sharing, onFix, onLayout }: SaleDetailsFooterProps) {
  const reduceMotion = useReducedMotion();
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale > STACK_FONT_SCALE;
  const button = stacked ? 'w-full' : 'flex-1';

  return (
    <MotiView
      from={{ opacity: 0, translateY: reduceMotion ? 0 : 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: reduceMotion ? 120 : 240, delay: 120 }}
      className="absolute bottom-0 left-0 right-0 bg-paper-200 border-t border-paper-300 px-4 pt-3"
      style={{ paddingBottom: bottomInset + 12 }}
      onLayout={(e) => onLayout?.(e.nativeEvent.layout.height)}
    >
      <View
        className={`w-full self-center gap-2.5 ${stacked ? 'flex-col' : 'flex-row'}`}
        style={{ maxWidth: 480 }}
      >
        {onFix && (
          <Pressable
            onPress={onFix}
            accessibilityRole="button"
            accessibilityLabel="Fix sale"
            accessibilityHint="Void, refund, or correct a price"
            className={`${button} min-h-12 rounded-xl bg-paper-50 border border-paper-400 flex-row items-center justify-center gap-2 px-3 py-2 active:bg-paper-100`}
          >
            <FontAwesome name="wrench" size={14} color={ICON_COLOR.ink} />
            <StyledText variant="extrabold" className="text-ink-900 text-base shrink text-center">
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
          className={`${onFix && !stacked ? 'flex-[1.4]' : button} min-h-12 rounded-xl bg-persimmon-600 flex-row items-center justify-center gap-2 px-3 py-2 active:bg-persimmon-700 ${
            sharing ? 'opacity-60' : ''
          }`}
        >
          {sharing ? (
            <ActivityIndicator size="small" color={ICON_COLOR.paper} />
          ) : (
            <FontAwesome name="share-square-o" size={15} color={ICON_COLOR.paper} />
          )}
          <StyledText variant="extrabold" className="text-paper-50 text-base shrink text-center">
            Share resibo
          </StyledText>
        </Pressable>
      </View>
    </MotiView>
  );
}
