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
    <View className="border-t border-dashed border-paper-400 pt-4">
      <TouchableOpacity
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete product"
        accessibilityHint="Asks for confirmation before deleting"
        className="press-scale min-h-[52px] rounded-xl border border-semantic-danger-100 bg-semantic-danger-50 flex-row items-center justify-center"
      >
        <FontAwesome name="trash" size={16} color="#C13030" style={{ marginRight: 8 }} />
        <StyledText variant="semibold" className="text-semantic-danger text-base">
          Delete product
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}