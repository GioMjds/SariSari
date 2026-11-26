import { useCallback, useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PRODUCT_FORM_SECTIONS, type ProductFormSectionKey } from './types';

/** Tracks section offsets so the header strip can jump to and highlight the visible section. */
export function useSectionNav() {
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Partial<Record<ProductFormSectionKey, number>>>({});
  const [active, setActive] = useState<ProductFormSectionKey>('details');
  const reducedMotion = useReducedMotion();

  const register = useCallback(
    (key: ProductFormSectionKey) => (e: LayoutChangeEvent) => {
      offsets.current[key] = e.nativeEvent.layout.y;
    },
    [],
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    // The last section may never reach the top, so treat the scroll end as reaching it.
    const atEnd = contentOffset.y + layoutMeasurement.height >= contentSize.height - 24;
    let current: ProductFormSectionKey = PRODUCT_FORM_SECTIONS[0].key;
    for (const { key } of PRODUCT_FORM_SECTIONS) {
      if ((offsets.current[key] ?? Infinity) <= contentOffset.y + 48) current = key;
    }
    if (atEnd) current = PRODUCT_FORM_SECTIONS.at(-1)?.key ?? current;
    setActive((prev) => (prev === current ? prev : current));
  }, []);

  const jumpTo = useCallback(
    (key: ProductFormSectionKey) => {
      setActive(key);
      scrollRef.current?.scrollTo({
        y: Math.max(0, (offsets.current[key] ?? 0) - 12),
        animated: !reducedMotion,
      });
    },
    [reducedMotion],
  );

  return { scrollRef, register, onScroll, active, jumpTo };
}
