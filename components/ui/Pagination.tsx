import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Kept for API stability — not consumed at runtime. */
  totalItems?: number;
  /** Kept for API stability — not consumed at runtime. */
  itemsPerPage?: number;
}

/**
 * Pagination — floating pill at the bottom of a list. Uses the safe-area
 * inset so it sits above the home indicator on iOS and the gesture bar
 * on Android. The page number fades in on swap so the counter feels
 * alive without distracting from the list above.
 */
export function Pagination ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const insets = useSafeAreaInsets();

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  if (totalPages <= 1) return null;

  const prevDisabled = currentPage === 1;
  const nextDisabled = currentPage === totalPages;

  return (
    <View
      className="absolute inset-x-0 items-center justify-center z-[1000]"
      style={{ bottom: insets.bottom + 12 }}
    >
      <View className="flex-row items-center gap-4 bg-persimmon-500 py-2.5 px-5 rounded-pill shadow-persimmon-glow">
        <Pressable
          hitSlop={10}
          onPress={handlePrevious}
          disabled={prevDisabled}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityState={{ disabled: prevDisabled }}
          className={`p-1.5 press-scale active:opacity-70 ${
            prevDisabled ? 'opacity-40' : 'opacity-100'
          }`}
        >
          <FontAwesome name="chevron-left" size={16} color="#fff" />
        </Pressable>

        <MotiView
          key={`${currentPage}/${totalPages}`}
          from={{ opacity: 0, translateY: 4 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <StyledText
            variant="semibold"
            className="text-white text-md min-w-[50px] text-center"
          >
            {currentPage} / {totalPages}
          </StyledText>
        </MotiView>

        <Pressable
          hitSlop={10}
          onPress={handleNext}
          disabled={nextDisabled}
          accessibilityRole="button"
          accessibilityLabel="Next page"
          accessibilityState={{ disabled: nextDisabled }}
          className={`p-1.5 press-scale active:opacity-70 ${
            nextDisabled ? 'opacity-40' : 'opacity-100'
          }`}
        >
          <FontAwesome name="chevron-right" size={16} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
};