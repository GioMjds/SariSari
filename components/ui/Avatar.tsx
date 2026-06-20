import React from 'react';
import { View, Text } from 'react-native';

type AvatarProps = {
	name: string;
	size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
	sm: { width: 32, height: 32, text: 12 },
	md: { width: 44, height: 44, text: 16 },
	lg: { width: 52, height: 52, text: 22 },
};

export default function Avatar({
	name,
	size = 'md'
}: AvatarProps) {
	const initials = name
		.split(' ')
		.map((s) => s[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();

	const dims = sizeMap[size];

	return (
		<View
			style={{ width: dims.width, height: dims.height }}
			className="rounded-full bg-surface-warm items-center justify-center border border-primary-500/10"
		>
			<Text
				style={{ fontSize: dims.text }}
				className="text-primary-500 font-extrabold"
			>
				{initials}
			</Text>
		</View>
	);
}

export { Avatar };
