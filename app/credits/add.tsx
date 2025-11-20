import StyledText from '@/components/elements/StyledText';
import { insertCustomer } from '@/db/credits';
import { NewCustomer } from '@/types/credits.types';
import { Alert } from '@/utils/alert';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddCustomerFormData {
	name: string;
	phone?: string;
	address?: string;
	notes?: string;
	credit_limit?: string;
}

export default function AddCustomer() {
	const { control, handleSubmit, formState: { isValid } } = useForm<AddCustomerFormData>({
		mode: 'onBlur',
		defaultValues: {
			name: '',
			phone: '',
			address: '',
			notes: '',
			credit_limit: '',
		},
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (data: AddCustomerFormData) => {
			const newCustomer: NewCustomer = {
				name: data.name.trim(),
				phone: data.phone?.trim() || undefined,
				address: data.address?.trim() || undefined,
				notes: data.notes?.trim() || undefined,
				credit_limit: data.credit_limit ? parseFloat(data.credit_limit) : undefined,
			};

			return insertCustomer(newCustomer);
		},
		onSuccess: () => {
			Alert.alert('Success', 'Customer added successfully', [
				{
					text: 'OK',
					onPress: () => router.back(),
				},
			]);
		},
		onError: (error) => {
			console.error('Error adding customer:', error);
			Alert.alert('Error', 'Failed to add customer. Please try again.');
		},
	});

	const handleFormSubmit = handleSubmit((data) => {
		mutate(data);
	});

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
			>
				{/* Header */}
				<View className="px-4 pt-4 pb-2 bg-background">
					<View className="flex-row items-center justify-between mb-4">
						<TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
							<FontAwesome name="arrow-left" size={24} color="#2E073F" />
						</TouchableOpacity>

						<StyledText variant="extrabold" className="text-primary text-xl">
							Add Customer
						</StyledText>

						<View className="w-6" />
					</View>
				</View>

				<ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
					<View className="pb-32">
						{/* Name */}
						<View className="mb-4">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Customer Name *
							</StyledText>
							<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
								<Controller
									control={control}
									name="name"
									rules={{ required: 'Customer name is required' }}
									render={({ field: { value, onChange } }) => (
										<TextInput
											value={value}
											onChangeText={onChange}
											placeholder="Enter customer name"
											placeholderTextColor="#9ca3af"
											className="text-primary font-stack-sans text-base"
										/>
									)}
								/>
							</View>
						</View>

						{/* Phone */}
						<View className="mb-4">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Phone Number
							</StyledText>
							<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 flex-row items-center">
								<FontAwesome name="phone" size={16} color="#7A1CAC" />
								<Controller
									control={control}
									name="phone"
									render={({ field: { value, onChange } }) => (
										<TextInput
											value={value}
											onChangeText={onChange}
											placeholder="09XX XXX XXXX"
											placeholderTextColor="#9ca3af"
											keyboardType="phone-pad"
											className="flex-1 ml-3 text-primary font-stack-sans text-base"
										/>
									)}
								/>
							</View>
						</View>

						{/* Address */}
						<View className="mb-4">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Address
							</StyledText>
							<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 flex-row items-start">
								<FontAwesome name="map-marker" size={16} color="#7A1CAC" className="mt-1" />
								<Controller
									control={control}
									name="address"
									render={({ field: { value, onChange } }) => (
										<TextInput
											value={value}
											onChangeText={onChange}
											placeholder="Enter address"
											placeholderTextColor="#9ca3af"
											multiline
											numberOfLines={2}
											className="flex-1 ml-3 text-primary font-stack-sans text-base"
										/>
									)}
								/>
							</View>
						</View>

						{/* Credit Limit */}
						<View className="mb-4">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Credit Limit (Optional)
							</StyledText>
							<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 flex-row items-center">
								<StyledText variant="medium" className="text-secondary">
									₱
								</StyledText>
								<Controller
									control={control}
									name="credit_limit"
									render={({ field: { value, onChange } }) => (
										<TextInput
											value={value}
											onChangeText={onChange}
											placeholder="0.00"
											placeholderTextColor="#9ca3af"
											keyboardType="decimal-pad"
											className="flex-1 ml-2 text-primary font-stack-sans text-base"
										/>
									)}
								/>
							</View>
							<StyledText variant="regular" className="text-gray-500 text-xs mt-1">
								Set a maximum credit limit for this customer
							</StyledText>
						</View>

						{/* Notes */}
						<View className="mb-6">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Notes
							</StyledText>
							<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
								<Controller
									control={control}
									name="notes"
									render={({ field: { value, onChange } }) => (
										<TextInput
											value={value}
											onChangeText={onChange}
											placeholder="Add any notes about this customer..."
											placeholderTextColor="#9ca3af"
											multiline
											numberOfLines={4}
											textAlignVertical="top"
											className="text-primary font-stack-sans text-base"
										/>
									)}
								/>
							</View>
						</View>

						{/* Info Card */}
						<View className="bg-accent/10 border border-accent rounded-xl p-4 mb-6">
							<View className="flex-row items-start">
								<FontAwesome name="info-circle" size={16} color="#7A1CAC" className="mt-0.5" />
								<View className="flex-1 ml-3">
									<StyledText variant="semibold" className="text-secondary mb-1">
										Customer Information
									</StyledText>
									<StyledText variant="regular" className="text-gray-600 text-xs">
										Add customer details to track credits and payments. Only the name is required to get started.
									</StyledText>
								</View>
							</View>
						</View>

						{/* Submit Button */}
						<TouchableOpacity
							activeOpacity={0.7}
							onPress={handleFormSubmit}
							disabled={isPending || !isValid}
							className={`rounded-xl py-4 ${
								isPending || !isValid ? 'bg-gray-300' : 'bg-secondary'
							}`}
						>
							<StyledText variant="semibold" className="text-white text-center text-base">
								{isPending ? 'Adding Customer...' : 'Add Customer'}
							</StyledText>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}