import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import StyledText from '../elements/StyledText';
import { FontAwesome } from '@expo/vector-icons';
import { dateRangeOptions, paymentTypeOptions, SalesFilterState } from '@/constants/filters';

interface SalesFilterModalProps {
	visible: boolean;
	onClose: () => void;
	currentFilters: SalesFilterState;
	onApplyFilters: (filters: SalesFilterState) => void;
}

export default function SalesFilterModal({
	visible,
	onClose,
	currentFilters,
	onApplyFilters,
}: SalesFilterModalProps) {
	const [tempFilters, setTempFilters] = useState<SalesFilterState>(currentFilters);

	const handleApply = () => {
		onApplyFilters(tempFilters);
		onClose();
	};

	const handleReset = () => {
		const resetFilters: SalesFilterState = {
			paymentType: 'all',
			dateRange: 'all',
		};
		setTempFilters(resetFilters);
		onApplyFilters(resetFilters);
		onClose();
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			statusBarTranslucent
			onRequestClose={onClose}
		>
			<View className="flex-1 justify-end bg-black/50">
				<TouchableOpacity
					className="flex-1"
					activeOpacity={1}
					onPress={onClose}
				/>
				<View className="w-full bg-white rounded-t-3xl p-6 shadow-xl">
					{/* Header */}
					<View className="flex-row justify-between items-center mb-4">
						<StyledText
							variant="extrabold"
							className="text-primary text-2xl"
						>
							Filter Sales
						</StyledText>
						<TouchableOpacity
							onPress={onClose}
							className="w-8 h-8 justify-center items-center rounded-full bg-gray-100"
						>
							<FontAwesome
								name="times"
								size={16}
								color="#2E073F"
							/>
						</TouchableOpacity>
					</View>

					<ScrollView
						className="max-h-96"
						showsVerticalScrollIndicator={false}
					>
						{/* Payment Type Filter */}
						<View className="mb-6">
							<StyledText
								variant="semibold"
								className="text-primary text-base mb-3"
							>
								Payment Type
							</StyledText>
							<View className="gap-2">
								{paymentTypeOptions.map((option) => {
									const isSelected =
										tempFilters.paymentType ===
										option.value;
									return (
										<TouchableOpacity
											key={option.value}
											onPress={() =>
												setTempFilters({
													...tempFilters,
													paymentType: option.value,
												})
											}
											className={`flex-row items-center p-4 rounded-xl border-2 ${
												isSelected
													? 'bg-secondary/10 border-secondary'
													: 'bg-white border-gray-200'
											}`}
										>
											<View
												className={`w-10 h-10 rounded-full items-center justify-center ${
													isSelected
														? 'bg-secondary'
														: 'bg-gray-100'
												}`}
											>
												<FontAwesome
													name={option.icon}
													size={18}
													color={
														isSelected
															? '#fff'
															: '#7A1CAC'
													}
												/>
											</View>
											<StyledText
												variant={
													isSelected
														? 'semibold'
														: 'medium'
												}
												className={`ml-3 flex-1 ${
													isSelected
														? 'text-secondary'
														: 'text-text-primary'
												}`}
											>
												{option.label}
											</StyledText>
											{isSelected && (
												<FontAwesome
													name="check-circle"
													size={20}
													color="#7A1CAC"
												/>
											)}
										</TouchableOpacity>
									);
								})}
							</View>
						</View>

						{/* Date Range Filter */}
						<View className="mb-4">
							<StyledText
								variant="semibold"
								className="text-primary text-base mb-3"
							>
								Date Range
							</StyledText>
							<View className="gap-2">
								{dateRangeOptions.map((option) => {
									const isSelected =
										tempFilters.dateRange === option.value;
									return (
										<TouchableOpacity
											key={option.value}
											onPress={() =>
												setTempFilters({
													...tempFilters,
													dateRange: option.value,
												})
											}
											className={`flex-row items-center justify-between p-4 rounded-xl border-2 ${
												isSelected
													? 'bg-secondary/10 border-secondary'
													: 'bg-white border-gray-200'
											}`}
										>
											<StyledText
												variant={
													isSelected
														? 'semibold'
														: 'medium'
												}
												className={
													isSelected
														? 'text-secondary'
														: 'text-text-primary'
												}
											>
												{option.label}
											</StyledText>
											{isSelected && (
												<FontAwesome
													name="check-circle"
													size={20}
													color="#7A1CAC"
												/>
											)}
										</TouchableOpacity>
									);
								})}
							</View>
						</View>
					</ScrollView>

					{/* Action Buttons */}
					<View className="flex-row gap-3 mt-4 pt-4 border-t border-gray-200">
						<TouchableOpacity
							onPress={handleReset}
							className="flex-1 bg-gray-200 rounded-xl py-3 active:opacity-70"
						>
							<StyledText
								variant="semibold"
								className="text-text-primary text-center text-base"
							>
								Reset
							</StyledText>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={handleApply}
							className="flex-1 bg-secondary rounded-xl py-3 active:opacity-70"
						>
							<StyledText
								variant="extrabold"
								className="text-white text-center text-base"
							>
								Apply Filters
							</StyledText>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}
