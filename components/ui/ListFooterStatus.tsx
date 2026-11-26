import { memo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface ListFooterStatusProps {
  itemCount: number;
  hasNextPage?: boolean | undefined;
  isFetchingNextPage?: boolean | undefined;
  isFetchNextPageError?: boolean | undefined;
  onRetry?: (() => void) | undefined;
  endLabel: string;
}

/** Infinite-list footer: one fixed-height slot for loading, retry, and end states. */
export const ListFooterStatus = memo(function ListFooterStatus({
  itemCount,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onRetry,
  endLabel,
}: ListFooterStatusProps) {
  if (itemCount === 0) return null;

  if (isFetchNextPageError && !isFetchingNextPage && onRetry) {
    return (
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Could not load more. Tap to retry."
        className="h-14 items-center justify-center active:opacity-60"
      >
        <StyledText variant="semibold" className="text-semantic-danger text-xs">
          Could not load more. Tap to retry.
        </StyledText>
      </Pressable>
    );
  }

  // More pages exist: keep the spinner up so the list never shows a false end.
  if (hasNextPage || isFetchingNextPage) {
    return (
      <View className="h-14 items-center justify-center">
        <ActivityIndicator
          size="small"
          color="#623418"
          accessibilityLabel="Loading more"
        />
      </View>
    );
  }

  return (
    <View className="h-14 items-center justify-center">
      <StyledText variant="medium" className="text-ink-400 text-xs">
        {endLabel}
      </StyledText>
    </View>
  );
});
