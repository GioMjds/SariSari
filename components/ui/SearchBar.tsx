import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type SearchBarProps = {
	value: string;
	onChange: (s: string) => void;
	placeholder?: string;
} & TextInput.Props;

export default function SearchBar({
	value,
	onChange,
	placeholder = 'Search...',
	...props
}: SearchBarProps) {
	return (
		<View className="relative flex-row items-center">
			<FontAwesome
				name="search"
				size={14}
				className="absolute left-3 text-primary-500"
			/>
			<TextInput
				value={value}
				onChangeText={onChange}
				placeholder={placeholder}
				className="w-full bg-surface-subtle border border-warm-100 rounded-xl px-4 py-3 pl-11 text-warm-900 placeholder-warm-500"
				{...props}
			/>
			{value.length > 0 && (
				<TouchableOpacity
					onPress={() => onChange('')}
					className="absolute right-3"
				>
					<FontAwesome name="times" size={12} className="text-warm-500" />
				</TouchableOpacity>
			)}
		</View>
	);
}

export { SearchBar };
