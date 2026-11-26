import { useCallback, useRef } from 'react';

/**
 * Gates FlatList onEndReached to real user scrolls.
 * FlatList also fires onEndReached on mount, layout and content-size changes,
 * which loads pages before the user reaches the last item.
 */
export function useUserScrollEndReached(onEndReached: () => void) {
  const userScrolled = useRef(false);

  const onScrollBeginDrag = useCallback(() => {
    userScrolled.current = true;
  }, []);

  const handleEndReached = useCallback(() => {
    if (!userScrolled.current) return;
    // One page per drag; the next drag re-arms it.
    userScrolled.current = false;
    onEndReached();
  }, [onEndReached]);

  return { onEndReached: handleEndReached, onScrollBeginDrag };
}
