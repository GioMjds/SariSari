import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';

/**
 * SalesEmptyState — Sari mascot on a torn paper card. Lives where the
 * receipt list would be. Title flips between "no sales yet" and
 * "no matches" depending on whether the user has any sales at all.
 */

interface SalesEmptyStateProps {
  onNewSale: () => void;
  hasSales: boolean;
}

const PERFORATION_COUNT = 22;
const PERFORATION_BG = '#EFE6D2';

export function SalesEmptyState({ onNewSale, hasSales }: SalesEmptyStateProps) {
  const title = hasSales ? 'Walang nagmamatch' : 'Wala pang resibo';
  const subtitle = hasSales
    ? 'Try adjusting your filters to see more sales.'
    : 'Start by recording your first transaction.';
  const eyebrow = hasSales ? 'No matches' : 'Empty ledger';

  return (
    <View
      className="mx-4 mt-6 rounded-3xl overflow-hidden bg-paper-50 border border-ink-100"
      style={{
        shadowColor: '#564E45',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      {/* Top perforation */}
      <View className="relative h-0">
        <View
          className="absolute left-0 right-0 h-3 flex-row justify-between"
          style={{ bottom: -6 }}
        >
          {Array.from({ length: PERFORATION_COUNT }).map((_, i) => (
            <View
              key={`e-top-${i}`}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PERFORATION_BG }}
            />
          ))}
        </View>
      </View>
      <View className="h-3" />

      <View className="paper-texture items-center px-6 pt-2 pb-8">
        <StyledText
          variant="extrabold"
          className="label-caps text-persimmon-600 mb-4"
        >
          {eyebrow}
        </StyledText>

        {/* Sari error state image */}
        {/* <Image
					source={sariImage}
					style={{ width: 180, height: 180 }}
					resizeMode="contain"
				/> */}

        <StyledText
          variant="black"
          className="text-ink-900 text-h2 mt-2 text-center"
        >
          {title}
        </StyledText>

        <StyledText
          variant="regular"
          className="text-ink-500 text-body mt-1.5 text-center"
        >
          {subtitle}
        </StyledText>

        {!hasSales && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNewSale}
            className="mt-5 bg-persimmon-500 rounded-pill px-7 py-3 flex-row items-center shadow-persimmon-glow"
          >
            <FontAwesome name="plus" size={14} color="#FBF7EE" />
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-sm ml-2"
            >
              New Sale
            </StyledText>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom perforation */}
      <View className="relative h-0">
        <View
          className="absolute left-0 right-0 h-3 flex-row justify-between"
          style={{ top: -6 }}
        >
          {Array.from({ length: PERFORATION_COUNT }).map((_, i) => (
            <View
              key={`e-bot-${i}`}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PERFORATION_BG }}
            />
          ))}
        </View>
      </View>
      <View className="h-3" />
    </View>
  );
}
