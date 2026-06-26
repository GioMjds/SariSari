import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface EditDangerZoneProps {
  onDelete: () => void;
}

/**
 * EditDangerZone — the destructive "Delete Product" tile, isolated
 * under a "DANGER ZONE" eyebrow so it's visually separate from the
 * primary Save / Cancel flow.
 */
export function EditDangerZone({ onDelete }: EditDangerZoneProps) {
  return (
    <View className="mt-4 border-t border-ink-100 pt-4">
      <StyledText variant="extrabold" className="label-caps text-ink-400 text-xs mb-2">
        Danger Zone
      </StyledText>
      <TouchableOpacity
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete product"
        className="press-scale bg-semantic-danger rounded-pill py-4 items-center"
      >
        <View className="flex-row items-center">
          <FontAwesome
            name="trash"
            size={16}
            color="#FBF7EE"
            style={{ marginRight: 8 }}
          />
          <StyledText variant="extrabold" className="text-paper-50 text-base">
            Delete Product
          </StyledText>
        </View>
      </TouchableOpacity>
    </View>
  );
}