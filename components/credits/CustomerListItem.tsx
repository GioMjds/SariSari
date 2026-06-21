import React from 'react';
import { Customer } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { TouchableOpacity, View } from 'react-native';
import { formatCurrency } from '@/utils';
import { StyledText } from '@/components/elements';

interface CustomerListItemProps {
	customer: Customer;
	onPress: (customer: Customer) => void;
}

export default function CustomerListItem({ customer, onPress }: CustomerListItemProps) {
	const getTagColor = (tag: Customer['tag']) => {
		switch (tag) {
			case 'good_payer':
				return 'bg-secondary-50 text-secondary-600';
			case 'frequent_borrower':
				return 'bg-sky-50 text-sky-700';
			case 'overdue':
				return 'bg-red-50 text-red-700';
			default:
				return 'bg-warm-100 text-warm-700';
		}
	};

	const getTagLabel = (tag: Customer['tag']) => {
		switch (tag) {
			case 'good_payer':
				return 'Good Payer';
			case 'frequent_borrower':
				return 'Frequent';
			case 'overdue':
				return 'Overdue';
			default:
				return null;
		}
	};

	return (
		<TouchableOpacity
			activeOpacity={0.7}
			onPress={() => onPress(customer)}
			className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-warm-100"
		>
			<View className="flex-row items-start justify-between mb-2">
				<View className="flex-1 mr-3">
					<StyledText variant="semibold" className="text-primary-500 text-base mb-1">
						{customer.name}
					</StyledText>

					{customer.phone && (
						<StyledText variant="regular" className="text-warm-600 text-xs mb-1">
							{customer.phone}
						</StyledText>
					)}

					{customer.last_transaction_date && (
						<StyledText variant="regular" className="text-warm-500 text-xs">
							Last: {formatDistanceToNow(new Date(customer.last_transaction_date), { addSuffix: true })}
						</StyledText>
					)}
				</View>

				<View className="items-end">
					<StyledText
						variant="extrabold"
						className={`text-lg mb-1 ${customer.outstanding_balance > 0 ? 'text-semantic-danger' : 'text-semantic-success'}`}
					>
						{formatCurrency(customer.outstanding_balance)}
					</StyledText>

					{customer.tag && (
						<View className={`px-2 py-1 rounded-full ${getTagColor(customer.tag)}`}>
							<StyledText variant="medium" className={`text-xs ${getTagColor(customer.tag).split(' ')[1]}`}>
								{getTagLabel(customer.tag)}
							</StyledText>
						</View>
					)}
				</View>
			</View>

			<View className="flex-row items-center justify-between pt-2 border-t border-warm-100">
				<View className="flex-row items-center">
					<FontAwesome name="credit-card" size={12} color="#A8A29E" />
					<StyledText variant="regular" className="text-warm-600 text-xs ml-1">
						Total: {formatCurrency(customer.total_credits)}
					</StyledText>
				</View>

				<FontAwesome name="chevron-right" size={14} color="#B45309" />
			</View>
		</TouchableOpacity>
	);
}
