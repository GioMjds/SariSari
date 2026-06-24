import { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface CreditsHeaderProps {
  subtitle: string;
  onAddCustomer: () => void;
}

/**
 * CreditsHeader — cinnamon-baked ledger banner. Mirrors the
 * ProductsHeader / InventoryHeader typography so the tab strip
 * reads like one publication across the app.
 *
 * The monogram dot carries the ₱ glyph (a brand cue — money lives
 * here), the eyebrow reads "UTANG LEDGER" in spaced caps, and the
 * subtitle is dynamic so it surfaces follow-up urgency first.
 */
export const CreditsHeader = memo(function CreditsHeader({
  subtitle,
  onAddCustomer,
}: CreditsHeaderProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 320 }}
    >
      <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
        {/* Monogram dot and Eyebrow */}
        <View className="flex-row items-center mb-3">
          <View
            className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center mr-2"
            style={{
              shadowColor: '#564E45',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <StyledText
              variant="black"
              className="text-paper-50 text-xl font-extrabold"
            >
              ₱
            </StyledText>
          </View>
          <StyledText
            variant="extrabold"
            className="text-label text-paper-200 opacity-80"
            style={{ letterSpacing: 1.4 }}
          >
            UTANG LEDGER
          </StyledText>
        </View>

        {/* Title + Subtitle + Action */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <StyledText
              variant="extrabold"
              className="text-h1 text-paper-50 text-3xl"
              style={{ letterSpacing: -0.28 }}
            >
              Credits
            </StyledText>
            <StyledText
              variant="regular"
              className="text-sm text-paper-200 opacity-90 mt-1"
            >
              {subtitle}
            </StyledText>
          </View>

          {/* Add Customer */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAddCustomer}
            accessibilityRole="button"
            accessibilityLabel="Add customer"
            className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15 press-scale"
          >
            <FontAwesome name="user-plus" size={18} color="#FBF7EE" />
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );
});