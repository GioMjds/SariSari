// Node stand-in for react-native-reanimated: shared values hold their initial value, so every style is the rest pose.
import { View } from './react-native';

export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
} as const;
type Extrapolate = (typeof Extrapolation)[keyof typeof Extrapolation];

export function interpolate(
  x: number,
  input: number[],
  output: number[],
  extrapolate: Extrapolate = Extrapolation.EXTEND,
): number {
  const last = input.length - 1;
  const segment = (i: number) =>
    output[i]! +
    ((x - input[i]!) / (input[i + 1]! - input[i]!)) *
      (output[i + 1]! - output[i]!);

  if (x <= input[0]!) {
    if (extrapolate === Extrapolation.CLAMP) return output[0]!;
    if (extrapolate === Extrapolation.IDENTITY) return x;
    return segment(0);
  }
  if (x >= input[last]!) {
    if (extrapolate === Extrapolation.CLAMP) return output[last]!;
    if (extrapolate === Extrapolation.IDENTITY) return x;
    return segment(last - 1);
  }
  let i = 0;
  while (x > input[i + 1]!) i++;
  return segment(i);
}

export const useSharedValue = <T,>(value: T) => ({ value });
export const useAnimatedStyle = <T,>(factory: () => T) => factory();
export const withTiming = <T,>(value: T) => value;
export const withRepeat = <T,>(value: T) => value;
export const cancelAnimation = () => {};
const identity = (t: number) => t;
export const Easing = {
  linear: identity,
  ease: identity,
  inOut: () => identity,
};

export default { View };
