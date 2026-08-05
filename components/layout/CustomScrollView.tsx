import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  Animated,
  LayoutChangeEvent,
  ScrollViewProps,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

export type ScrollbarVariant = 'paper' | 'persimmon' | 'cinnamon' | 'minimal';

export interface CustomScrollViewProps extends ScrollViewProps {
  trackClassName?: string;
  thumbClassName?: string;
  variant?: ScrollbarVariant;
  barWidth?: string;
  autoHide?: boolean;
  minThumbHeight?: number;
  rightOffset?: number;
  onContent: (width: number, height: number) => void;
}

type VariantStyle = {
  track: string;
  thumb: string;
};

const VARIANT_STYLES = {
  paper: {
    track: 'bg-ink-100/60 rounded-full',
    thumb: 'bg-ink-400 rounded-full',
  },
  persimmon: {
    track: 'bg-persimmon-100/70 rounded-full',
    thumb: 'bg-persimmon-500 rounded-full',
  },
  cinnamon: {
    track: 'bg-cinnamon-100/60 rounded-full',
    thumb: 'bg-cinnamon-500 rounded-full',
  },
  minimal: {
    track: 'bg-transparent',
    thumb: 'bg-ink-300/70 rounded-full',
  },
} satisfies Record<ScrollbarVariant, VariantStyle>;

export const CustomScrollView: React.FC<CustomScrollViewProps> = ({
  children,
  trackClassName,
  thumbClassName,
  variant = 'paper',
  barWidth = 'w-1.5',
  autoHide = true,
  minThumbHeight = 36,
  rightOffset = 3,
  onScroll: userOnScroll,
  onContent: userOnContentSizeChange,
  ...scrollViewProps
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(autoHide ? 0 : 0.85)).current;
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Container height & content height
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  // Trigger smooth fade-in and set auto-hide timeout
  const triggerFade = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0.9,
      duration: 150,
      useNativeDriver: true,
    }).start();

    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    if (autoHide) {
      fadeTimeoutRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start();
      }, 900);
    }
  }, [autoHide, opacity]);

  // Capture container size
  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  // Capture total scrollable content height
  const onContentSizeChange = useCallback((width: number, height: number) => {
    setContentHeight(height);
    userOnContentSizeChange?.(width, height);
  }, [userOnContentSizeChange]);

  // Preserve latest reference to userOnScroll prop
  const userOnScrollRef = useRef(userOnScroll);
  useEffect(() => {
    userOnScrollRef.current = userOnScroll;
  }, [userOnScroll]);

  // Native animated event driver with scroll listener
  const scrollHandler = useRef(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: true,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        triggerFade();
        if (userOnScrollRef.current) {
          userOnScrollRef.current(e);
        }
      },
    }),
  ).current;

  // Determine if scrolling is required
  const isScrollable = contentHeight > containerHeight && containerHeight > 0;

  // Calculate proportional thumb height with minimum clamp protection
  const rawThumbHeight = isScrollable
    ? (containerHeight / contentHeight) * containerHeight
    : 0;
  const thumbHeight = isScrollable
    ? Math.max(rawThumbHeight, minThumbHeight)
    : 0;

  // Max translate boundary based on clamped thumb height
  const maxThumbTranslate = Math.max(0, containerHeight - thumbHeight);
  const maxScrollOffset = Math.max(1, contentHeight - containerHeight);

  // Map scrollY to thumb translation
  const thumbTranslateY = scrollY.interpolate({
    inputRange: [0, maxScrollOffset],
    outputRange: [0, maxThumbTranslate],
    extrapolate: 'clamp',
  });

  // Resolve palette defaults or custom overrides
  const selectedVariant = VARIANT_STYLES[variant] || VARIANT_STYLES.paper;
  const finalTrackClass = trackClassName || selectedVariant.track;
  const finalThumbClass = thumbClassName || selectedVariant.thumb;

  return (
    <View className="flex-1 relative" onLayout={onContainerLayout}>
      {/* ScrollView with default indicator hidden */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onContentSizeChange={onContentSizeChange}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>

      {/* Custom scrollbar – hardware-accelerated hardware animated overlay */}
      {isScrollable && (
        <Animated.View
          className={`absolute top-0 bottom-0 ${barWidth} ${finalTrackClass}`}
          style={{
            right: rightOffset,
            height: containerHeight,
            opacity: opacity,
          }}
          pointerEvents="none"
        >
          <Animated.View
            className={`absolute w-full ${finalThumbClass}`}
            style={{
              height: thumbHeight,
              transform: [{ translateY: thumbTranslateY }],
            }}
          />
        </Animated.View>
      )}
    </View>
  );
};
