// Node stand-in for react-native: renders View as an absolutely-positionable div for static markup.
import { createElement, type CSSProperties, type ReactNode } from 'react';

type RNStyle = Record<string, unknown> | null | undefined | false | RNStyle[];

const TRANSLATE = new Set(['translateX', 'translateY']);

// Flattens RN style arrays and converts transform arrays and transformOrigin to CSS strings.
export function toCss(style: RNStyle): CSSProperties {
  const flat: Record<string, unknown> = {};
  const walk = (s: RNStyle) => {
    if (Array.isArray(s)) s.forEach(walk);
    else if (s) Object.assign(flat, s);
  };
  walk(style);

  if (Array.isArray(flat.transform)) {
    flat.transform = (flat.transform as Record<string, number | string>[])
      .map((t) => {
        const [key, value] = Object.entries(t)[0]!;
        const unit =
          TRANSLATE.has(key) && typeof value === 'number' ? 'px' : '';
        return `${key}(${value}${unit})`;
      })
      .join(' ');
  }
  if (Array.isArray(flat.transformOrigin)) {
    flat.transformOrigin = (flat.transformOrigin as number[])
      .map((n) => `${n}px`)
      .join(' ');
  }
  return flat as CSSProperties;
}

export const StyleSheet = {
  absoluteFill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
  create: <T,>(styles: T) => styles,
};

export function View({
  style,
  children,
}: {
  style?: RNStyle;
  children?: ReactNode;
}) {
  return createElement('div', { style: toCss(style) }, children);
}
