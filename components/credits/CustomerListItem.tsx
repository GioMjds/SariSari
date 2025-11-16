import { Customer } from '@/types/credits.types';
import { FontAwesome } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import StyledText from '../elements/StyledText';

interface CustomerListItemProps {
	customer: Customer;
	onPress: (customer: Customer) => void;
}

export default function CustomerListItem({ customer, onPress }: CustomerListItemProps) {
	const getTagColor = (tag: Customer['tag']) => {
		switch (tag) {
			case 'good_payer':
				return 'bg-green-100 text-green-700';
			case 'frequent_borrower':
				return 'bg-blue-100 text-blue-700';
			case 'overdue':
				return 'bg-red-100 text-red-700';
			default:
				return 'bg-gray-100 text-gray-700';
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

	const formatCurrency = (amount: number) => {
		return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	return (
		<TouchableOpacity
			activeOpacity={0.7}
			onPress={() => onPress(customer)}
			className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
		>
			<View className="flex-row items-start justify-between mb-2">
				<View className="flex-1 mr-3">
					<StyledText variant="semibold" className="text-primary text-base mb-1">
						{customer.name}
					</StyledText>

					{customer.phone && (
						<StyledText variant="regular" className="text-gray-500 text-xs mb-1">
							{customer.phone}
						</StyledText>
					)}

					{customer.last_transaction_date && (
						<StyledText variant="regular" className="text-gray-400 text-xs">
							Last: {formatDistanceToNow(new Date(customer.last_transaction_date), { addSuffix: true })}
						</StyledText>
					)}
				</View>

				<View className="items-end">
					<StyledText
						variant="extrabold"
						className={`text-lg mb-1 ${customer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}
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

			<View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
				<View className="flex-row items-center">
					<FontAwesome name="credit-card" size={12} color="#9ca3af" />
					<StyledText variant="regular" className="text-gray-500 text-xs ml-1">
						Total: {formatCurrency(customer.total_credits)}
					</StyledText>
				</View>

				<FontAwesome name="chevron-right" size={14} color="#7A1CAC" />
			</View>
		</TouchableOpacity>
	);
}
