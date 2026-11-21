// Node stand-in for react-native-svg: maps each primitive to its DOM SVG element.
import { createElement, type ReactNode } from 'react';

type Props = Record<string, unknown> & { children?: ReactNode };

const tag = (name: string) =>
  function SvgElement({ children, ...props }: Props) {
    return createElement(name, props, children);
  };

export default function Svg({ children, ...props }: Props) {
  return createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', ...props },
    children,
  );
}

export const G = tag('g');
export const Path = tag('path');
export const Circle = tag('circle');
export const Ellipse = tag('ellipse');
export const Rect = tag('rect');
