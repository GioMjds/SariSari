import { Text as RNText, TextProps as RNTextProps } from 'react-native';

type FontVariant =
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'extrabold'
  | 'black'
  | 'light'
  | 'extralight';

interface StyledTextProps extends RNTextProps {
  variant: FontVariant;
}

const FONT_MAP = {
  regular: 'StackSansText-Regular',
  medium: 'StackSansText-Medium',
  semibold: 'StackSansText-SemiBold',
  extrabold: 'StackSansText-Bold',
  black: 'StackSansText-Bold',
  light: 'StackSansText-Light',
  extralight: 'StackSansText-ExtraLight',
} satisfies Record<FontVariant, string>;

export function StyledText({
  variant = 'regular',
  style,
  children,
  ...rest
}: StyledTextProps) {
  return (
    <RNText {...rest} style={[{ fontFamily: FONT_MAP[variant] }, style]}>
      {children}
    </RNText>
  );
}
