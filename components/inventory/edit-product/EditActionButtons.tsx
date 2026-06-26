import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface EditActionButtonsProps {
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * EditActionButtons — primary Save CTA (persimmon) and secondary
 * Cancel (parchment). The Save button swaps its label for an
 * ActivityIndicator while the update mutation is pending.
 */
export function EditActionButtons({
  onSubmit,
  onCancel,
  isSubmitting,
}: EditActionButtonsProps) {
  return (
    <View className="gap-3 mb-8">
      {/* Save Changes */}
      <TouchableOpacity
        onPress={onSubmit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Save changes"
        className={`bg-persimmon-500 rounded-pill py-4 items-center shadow-persimmon-glow ${
          isSubmitting ? 'opacity-70' : ''
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FBF7EE" />
        ) : (
          <StyledText variant="extrabold" className="text-paper-50 text-base">
            Save Changes
          </StyledText>
        )}
      </TouchableOpacity>

      {/* Cancel */}
      <TouchableOpacity
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel edits"
        className="bg-paper-100 border border-ink-200 rounded-pill py-4 items-center"
      >
        <StyledText variant="semibold" className="text-ink-900 text-base">
          Cancel
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}