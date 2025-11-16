import { CreditFilter } from '@/types/credits.types';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import StyledText from '../elements/StyledText';

interface FilterBarProps {
	activeFilter: CreditFilter;
	onFilterChange: (filter: CreditFilter) => void;
	counts?: {
		all: number;
		with_balance: number;
		paid: number;
		overdue: number;
	};
}

const filters: { key: CreditFilter; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'with_balance', label: 'With Balance' },
	{ key: 'paid', label: 'Paid' },
	{ key: 'overdue', label: 'Overdue' },
];

export default function FilterBar({ activeFilter, onFilterChange, counts }: FilterBarProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			className="mb-4"
			contentContainerStyle={{ paddingHorizontal: 16 }}
		>
			{filters.map((filter, index) => {
				const isActive = activeFilter === filter.key;
				const count = counts?.[filter.key];

				return (
					<TouchableOpacity
						key={filter.key}
						activeOpacity={0.7}
						onPress={() => onFilterChange(filter.key)}
						className={`px-4 py-2 rounded-full mr-2 ${
							isActive ? 'bg-secondary' : 'bg-white border border-gray-200'
						}`}
					>
						<View className="flex-row items-center">
							<StyledText
								variant={isActive ? 'semibold' : 'medium'}
								className={isActive ? 'text-white' : 'text-gray-700'}
							>
								{filter.label}
							</StyledText>
							{count !== undefined && (
								<StyledText
									variant="semibold"
									className={`ml-1.5 text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}
								>
									({count})
								</StyledText>
							)}
						</View>
					</TouchableOpacity>
				);
			})}
		</ScrollView>
	);
}
