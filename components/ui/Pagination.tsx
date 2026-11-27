import React from 'react';
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
  /**
   * Distance (in px) from the screen bottom that the pill must clear,
   * such as `useTabBarBottomOffset()`. It already counts the safe-area
   * inset; the pill sits at whichever of the two is larger. Default 0.
   */
  bottomOffset?: number;
}

/**
 * Pagination — floating receipt-style stepper at the bottom of a list.
 *
 * Sits above the safe-area inset (home indicator / gesture bar) and
 * reads like a torn receipt edge: paper-50 surface, dashed top/bottom
 * border, ink-900 page counter, persimmon chevrons. The page number
 * fades in on swap so the counter feels alive without distracting
 * from the list above.
 *
 * The z-index is set above the floating tab bar (`StyledTab`) so the
 * pill never gets covered when a screen needs pagination. When the
 * consumer also passes `bottomOffset`, the pill lifts above the tab
 * bar's footprint instead of overlapping it.
 */
export const Pagination = React.memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  bottomOffset = 0,
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
      className="absolute inset-x-0 items-center justify-center"
      style={{
        // z-1100 wins against StyledTab's z-1000 even when both are
        // siblings rendered at the same parent level.
        zIndex: 1100,
        // A caller offset such as the tab bar already includes the safe-area inset, so take the larger one.
        bottom: Math.max(insets.bottom, bottomOffset) + 10,
      }}
      pointerEvents="box-none"
    >
      <View
        className="flex-row items-center bg-paper-50 rounded-pill border border-dashed border-ink-300 shadow-paper"
        // Receipt-edge feel: 1px hairline, 4px padding-y, no glow.
        // No `overflow-hidden` — it clips dashed borders on Android
        // (and isn't needed since the rounded-pill already contains
        // the children).
        style={{ paddingVertical: 4, paddingHorizontal: 4 }}
      >
        <Pressable
          hitSlop={10}
          onPress={handlePrevious}
          disabled={prevDisabled}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityState={{ disabled: prevDisabled }}
          className={`w-9 h-9 rounded-full items-center justify-center active:scale-[0.94] ${
            prevDisabled ? 'opacity-30' : 'opacity-100'
          }`}
        >
          <FontAwesome name="chevron-left" size={14} color="#E85A1F" />
        </Pressable>

        {/* Receipt-style page count with hairline dividers */}
        <MotiView
          key={`${currentPage}/${totalPages}`}
          from={{ opacity: 0, translateY: 3 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 180 }}
          accessible
          accessibilityLabel={`Page ${currentPage} of ${totalPages}`}
          className="flex-row items-center px-3 border-x border-dashed border-ink-200"
        >
          <StyledText
            variant="black"
            className="text-ink-900 text-sm"
            style={{ letterSpacing: 0.4, fontVariant: ['tabular-nums'] }}
          >
            {currentPage}
          </StyledText>
          <StyledText
            variant="medium"
            className="text-ink-400 text-xs mx-1.5"
          >
            /
          </StyledText>
          <StyledText
            variant="semibold"
            className="text-ink-500 text-sm"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {totalPages}
          </StyledText>
        </MotiView>

        <Pressable
          hitSlop={10}
          onPress={handleNext}
          disabled={nextDisabled}
          accessibilityRole="button"
          accessibilityLabel="Next page"
          accessibilityState={{ disabled: nextDisabled }}
          className={`w-9 h-9 rounded-full items-center justify-center active:scale-[0.94] ${
            nextDisabled ? 'opacity-30' : 'opacity-100'
          }`}
        >
          <FontAwesome name="chevron-right" size={14} color="#E85A1F" />
        </Pressable>
      </View>
    </View>
  );
});
