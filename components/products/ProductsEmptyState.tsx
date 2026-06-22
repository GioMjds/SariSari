import { FontAwesome } from '@expo/vector-icons';
import { Image, TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface ProductsEmptyStateProps {
  variant: 'no-products' | 'no-search' | 'no-filter';
  searchTerm?: string;
  onAddPress?: () => void;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
}

const PERFORATION_COUNT = 22;
const PERFORATION_BG = '#EFE6D2';
const sariImage = require('@/assets/images/sari-emotions/sari-empty-state.png');

export function ProductsEmptyState({
  variant,
  searchTerm = '',
  onAddPress,
  onClearSearch,
  onClearFilters,
}: ProductsEmptyStateProps) {
  let title = 'Wala pang tinda';
  let subtitle = 'Start by adding your first product to the catalog.';
  let eyebrow = 'Empty catalog';

  if (variant === 'no-search') {
    title = `No results for "${searchTerm}"`;
    subtitle = 'Try checking the spelling or search for another item.';
    eyebrow = 'No matches';
  } else if (variant === 'no-filter') {
    title = 'No matches for filters';
    subtitle = 'Adjust your low stock or category filters to find products.';
    eyebrow = 'Filters active';
  }

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

        {/* Sari Mascot Image */}
        <Image
          source={sariImage}
          style={{ width: 180, height: 180 }}
          resizeMode="contain"
        />

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

        {/* Call to action buttons */}
        {variant === 'no-products' && onAddPress && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onAddPress}
            className="mt-5 bg-persimmon-500 rounded-pill px-7 py-3 flex-row items-center shadow-persimmon-glow"
          >
            <FontAwesome name="plus" size={14} color="#FBF7EE" />
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-sm ml-2"
            >
              Add Product
            </StyledText>
          </TouchableOpacity>
        )}

        {variant === 'no-search' && onClearSearch && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClearSearch}
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

        {variant === 'no-filter' && onClearFilters && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClearFilters}
            className="mt-5 bg-ink-100 rounded-pill px-6 py-2.5 flex-row items-center border border-ink-200"
          >
            <StyledText
              variant="extrabold"
              className="text-ink-700 text-sm"
            >
              Clear Filters
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
