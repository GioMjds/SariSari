import React from 'react';
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
	variant?: FontVariant;
}

const FONT_MAP: Record<FontVariant, string> = {
	regular: 'StackSansText-Regular',
	medium: 'StackSansText-Medium',
	semibold: 'StackSansText-SemiBold',
	extrabold: 'StackSansText-Bold',
	black: 'StackSansText-Bold',
	light: 'StackSansText-Light',
	extralight: 'StackSansText-ExtraLight',
};

export default function StyledText({
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