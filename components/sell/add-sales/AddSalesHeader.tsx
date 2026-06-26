import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface AddSalesHeaderProps {
  /** Total number of items in the cart. Used to decide whether the
   * back button should trigger the discard-sale dialog. */
  itemCount: number;
  /** Called when the user taps the back button. Receives `true` when
   * the cart has items so the parent can decide between a confirm
   * dialog and a clean back. */
  onBack: () => void;
}

/**
 * AddSalesHeader — top bar for the Add Sales modal screen.
 *
 * Mirrors `AddCreditHeader`: circular back button on the left,
 * centered title ("New Resibo") with a label-caps eyebrow
 * ("POS Register"), a 40×40 spacer on the right to keep the title
 * optically centered.
 *
 * The header sits on the cream page background (`bg-background`)
 * above the product catalog.
 */
export function AddSalesHeader({ itemCount, onBack }: AddSalesHeaderProps) {
  return (
    <View className="px-5 pt-3 pb-4 bg-background">
      <View className="flex-row items-center justify-between mb-3">
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={itemCount > 0 ? 'Discard sale' : 'Go back'}
          className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <View className="items-center">
          <StyledText variant="extrabold" className="text-ink-900 text-h2">
            New Resibo
          </StyledText>
          <StyledText
            variant="medium"
            className="label-caps text-ink-400 mt-0.5"
          >
            POS Register
          </StyledText>
        </View>

        <View className="w-10 h-10" />
      </View>

      {itemCount > 0 && (
        <StyledText
          variant="medium"
          className="label-caps text-ink-400 text-center"
        >
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
        </StyledText>
      )}
    </View>
  );
}
