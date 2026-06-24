import { CreditFilter } from '@/types';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';

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

interface Filters {
	key: CreditFilter;
	label: 'All' | 'With Balance' | 'Paid' | 'Overdue';
}

const filters: Filters[] = [
	{ key: 'all', label: 'All' },
	{ key: 'with_balance', label: 'With Balance' },
	{ key: 'paid', label: 'Paid' },
	{ key: 'overdue', label: 'Overdue' },
];

export function FilterBar({
	activeFilter,
	onFilterChange,
	counts,
}: FilterBarProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			className="mb-4"
			contentContainerStyle={{ paddingHorizontal: 16 }}
		>
			{filters.map((filter) => {
				const isActive = activeFilter === filter.key;
				const count = counts?.[filter.key];

				return (
					<TouchableOpacity
						key={filter.key}
						activeOpacity={0.7}
						onPress={() => onFilterChange(filter.key)}
						className={`px-4 py-2 rounded-full mr-2 ${
							isActive
								? 'bg-secondary-500'
								: 'bg-white border border-warm-200'
						}`}
					>
						<View className="flex-row items-center">
							<StyledText
								variant={isActive ? 'semibold' : 'medium'}
								className={
									isActive ? 'text-white' : 'text-warm-700'
								}
							>
								{filter.label}
							</StyledText>
							<StyledText
								variant="semibold"
								className={`ml-1.5 text-xs ${isActive ? 'text-white/80' : 'text-warm-500'}`}
							>
								{" "}({count})
							</StyledText>
						</View>
					</TouchableOpacity>
				);
			})}
		</ScrollView>
	);
}
