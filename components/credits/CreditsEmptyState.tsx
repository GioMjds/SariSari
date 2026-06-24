import { FontAwesome } from '@expo/vector-icons';
import { Image, TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface CreditsEmptyStateProps {
  variant: 'no-customers' | 'no-search' | 'all-cleared';
  searchTerm?: string;
  onAddPress?: () => void;
  onClearSearch?: () => void;
}

const PERFORATION_COUNT = 22;
const PERFORATION_BG = '#EFE6D2';
const sariImage = require('@/assets/images/sari-emotions/sari-empty-state.png');

/**
 * CreditsEmptyState — paper receipt variant for the three "nothing
 * to do" moments on the Credits tab:
 *   - no-customers: clean slate, prompt to add a suki.
 *   - no-search: search-specific, with a clear-search action.
 *   - all-cleared: positive affirmation when everyone is paid up.
 */
export function CreditsEmptyState({
  variant,
  searchTerm = '',
  onAddPress,
  onClearSearch,
}: CreditsEmptyStateProps) {
  let title = 'No sukis yet';
  let subtitle = 'Add your first customer to start tracking utang.';
  let eyebrow = 'Empty ledger';
  let iconBg = 'bg-persimmon-50';

  if (variant === 'no-search') {
    title = `No matches for "${searchTerm}"`;
    subtitle = 'Check the spelling or try a different name or number.';
    eyebrow = 'Nothing here';
    iconBg = 'bg-paper-100';
  } else if (variant === 'all-cleared') {
    title = 'All balances cleared';
    subtitle = 'Every customer is settled — nice and clean.';
    eyebrow = 'Cleared';
    iconBg = 'bg-sage-50';
  }

  return (
    <View
      className="mx-4 mt-2 rounded-3xl overflow-hidden bg-paper-50 border border-ink-100"
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

        {variant === 'all-cleared' ? (
          <View
            className={`w-24 h-24 rounded-full ${iconBg} items-center justify-center mb-2 border border-sage-500`}
          >
            <FontAwesome name="check" size={42} color="#4F7A24" />
          </View>
        ) : (
          <Image
            source={sariImage}
            style={{ width: 180, height: 180 }}
            resizeMode="contain"
          />
        )}

        <StyledText
          variant="black"
          className="text-ink-900 text-h2 mt-4 text-center px-4"
        >
          {title}
        </StyledText>

        <StyledText
          variant="regular"
          className="text-ink-500 text-body mt-2 text-center"
        >
          {subtitle}
        </StyledText>

        {variant === 'no-customers' && onAddPress && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onAddPress}
            accessibilityRole="button"
            accessibilityLabel="Add customer"
            className="mt-5 bg-persimmon-500 rounded-pill px-7 py-3 flex-row items-center shadow-persimmon-glow"
          >
            <FontAwesome name="user-plus" size={14} color="#FBF7EE" />
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-sm ml-2"
            >
              Add Customer
            </StyledText>
          </TouchableOpacity>
        )}

        {variant === 'no-search' && onClearSearch && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClearSearch}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            className="mt-5 bg-ink-100 rounded-pill px-6 py-2.5 flex-row items-center border border-ink-200"
          >
            <StyledText
              variant="extrabold"
              className="text-ink-700 text-sm"
            >
              Clear Search
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