import { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, type View } from 'react-native';

export function useScreenHeadingFocus() {
  const headingRef = useRef<View>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const reactTag = findNodeHandle(headingRef.current);
      if (reactTag) AccessibilityInfo.setAccessibilityFocus(reactTag);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return headingRef;
}
