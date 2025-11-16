import { CreditSort } from '@/types/credits.types';
import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, TouchableOpacity, View } from 'react-native';
import StyledText from '../elements/StyledText';

interface SortDropdownProps {
	activeSort: CreditSort;
	onSortChange: (sort: CreditSort) => void;
}

const sortOptions: { key: CreditSort; label: string; icon: keyof typeof FontAwesome.glyphMap }[] = [
	{ key: 'balance_desc', label: 'Highest Balance', icon: 'arrow-down' },
	{ key: 'balance_asc', label: 'Lowest Balance', icon: 'arrow-up' },
	{ key: 'recent', label: 'Most Recent', icon: 'clock-o' },
	{ key: 'name_asc', label: 'Name A-Z', icon: 'sort-alpha-asc' },
	{ key: 'name_desc', label: 'Name Z-A', icon: 'sort-alpha-desc' },
];

export default function SortDropdown({ activeSort, onSortChange }: SortDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const activeOption = sortOptions.find((opt) => opt.key === activeSort);

	return (
		<View>
			<TouchableOpacity
				activeOpacity={0.7}
				onPress={() => setIsOpen(true)}
				className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-2"
			>
				<FontAwesome name="sort" size={14} color="#7A1CAC" />
				<StyledText variant="medium" className="text-primary text-sm ml-2 mr-1">
					{activeOption?.label}
				</StyledText>
				<FontAwesome name="chevron-down" size={12} color="#7A1CAC" />
			</TouchableOpacity>

			<Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
				<Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setIsOpen(false)}>
					<Pressable className="bg-white rounded-t-3xl p-4" onPress={(e) => e.stopPropagation()}>
						<View className="items-center mb-4">
							<View className="w-12 h-1 bg-gray-300 rounded-full" />
						</View>

						<StyledText variant="semibold" className="text-primary text-lg mb-4 px-2">
							Sort By
						</StyledText>

						{sortOptions.map((option) => {
							const isActive = activeSort === option.key;

							return (
								<TouchableOpacity
									key={option.key}
									activeOpacity={0.7}
									onPress={() => {
										onSortChange(option.key);
										setIsOpen(false);
									}}
									className={`flex-row items-center justify-between p-4 rounded-xl mb-2 ${
										isActive ? 'bg-accent/10' : 'bg-gray-50'
									}`}
								>
									<View className="flex-row items-center">
										<FontAwesome name={option.icon} size={16} color={isActive ? '#7A1CAC' : '#6b7280'} />
										<StyledText
											variant={isActive ? 'semibold' : 'medium'}
											className={`ml-3 ${isActive ? 'text-secondary' : 'text-gray-700'}`}
										>
											{option.label}
										</StyledText>
									</View>

									{isActive && <FontAwesome name="check" size={16} color="#7A1CAC" />}
								</TouchableOpacity>
							);
						})}

						<TouchableOpacity
							activeOpacity={0.7}
							onPress={() => setIsOpen(false)}
							className="bg-gray-200 p-4 rounded-xl mt-2"
						>
							<StyledText variant="semibold" className="text-gray-700 text-center">
								Cancel
							</StyledText>
						</TouchableOpacity>
					</Pressable>
				</Pressable>
			</Modal>
		</View>
	);
}
