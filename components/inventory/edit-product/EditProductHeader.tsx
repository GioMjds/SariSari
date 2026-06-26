import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface EditProductHeaderProps {
  onBack: () => void;
}

/**
 * EditProductHeader — paper-card header with back button and
 * "Edit Product" title. Matches the `AddProductHeader` visual
 * rhythm so the screen feels native to the inventory flow.
 */
export function EditProductHeader({ onBack }: EditProductHeaderProps) {
  return (
    <View className="px-5 pt-3 pb-4 bg-background">
      <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <View className="flex-1 px-3 items-center">
          <StyledText
            variant="extrabold"
            className="label-caps text-ink-400"
            style={{ fontSize: 10 }}
          >
            Inventory
          </StyledText>
          <StyledText variant="black" className="text-ink-900 text-lg mt-0.5">
            Edit Product
          </StyledText>
        </View>

        {/* Spacer to optically balance the layout. */}
        <View className="w-10 h-10" />
      </View>
    </View>
  );
}