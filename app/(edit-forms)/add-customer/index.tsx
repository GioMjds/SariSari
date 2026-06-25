import { StyledText } from '@/components/elements';
import { useCredits } from '@/hooks';
import { tryParsePesosInput } from '@/lib/money';
import { NewCustomer } from '@/types';
import { Alert } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddCustomerFormData {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  credit_limit?: string;
}

export default function AddCustomer() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid, isDirty },
  } = useForm<AddCustomerFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      notes: '',
      credit_limit: '',
    },
  });

  const formValues = watch();

  const safeTrim = (s?: string) => (s ?? '').trim();

  const hasActualChanges =
    isDirty &&
    (safeTrim(formValues?.name) !== '' ||
      safeTrim(formValues?.phone) !== '' ||
      safeTrim(formValues?.address) !== '' ||
      safeTrim(formValues?.notes) !== '' ||
      safeTrim(formValues?.credit_limit) !== '');

  const { useInsertCustomer } = useCredits();

  const insertCustomer = useInsertCustomer();

  const onSubmit = (data: AddCustomerFormData) => {
    let creditLimit: number | undefined;
    if (
      typeof data.credit_limit === 'string' &&
      data.credit_limit.trim() !== ''
    ) {
      // Optional field — tryParsePesosInput returns 0 on empty input,
      // which the form treats as "no credit limit set" (undefined).
      const parsed = tryParsePesosInput(data.credit_limit);
      creditLimit = parsed > 0 ? parsed : undefined;
    }

    const payload: NewCustomer = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      credit_limit: creditLimit,
    };

    return insertCustomer.mutate(payload);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasActualChanges) {
          Alert.alert(
            'Unsaved Changes',
            'You have unsaved changes. Are you sure you want to discard them?',
            [
              { text: "Don't Leave", style: 'cancel', onPress: () => {} },
              {
                text: 'Discard',
                style: 'destructive',
                onPress: () => router.back(),
              },
            ],
          );
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => backHandler.remove();
    }, [hasActualChanges]),
  );

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
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (hasActualChanges) {
                  Alert.alert(
                    'Unsaved Changes',
                    'You have unsaved changes. Are you sure you want to discard them?',
                    [
                      {
                        text: "Don't Leave",
                        style: 'cancel',
                        onPress: () => {},
                      },
                      {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => router.back(),
                      },
                    ],
                  );
                } else {
                  router.back();
                }
              }}
            >
              <FontAwesome name="arrow-left" size={24} color="#B45309" />
            </TouchableOpacity>

            <StyledText variant="extrabold" className="text-warm-900 text-xl">
              Add Customer
            </StyledText>

            <View className="w-6" />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
        >
          <View className="pb-32">
            {/* Name */}
            <View className="mb-4">
              <StyledText
                variant="semibold"
                className="text-warm-900 text-sm mb-2"
              >
                Customer Name *
              </StyledText>
              <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-warm-100">
                <Controller
                  control={control}
                  name="name"
                  rules={{
                    required: 'Customer name is required',
                  }}
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter customer name"
                      placeholderTextColor="#9ca3af"
                      className="text-warm-900 font-stack-sans text-base"
                    />
                  )}
                />
              </View>
            </View>

            {/* Phone */}
            <View className="mb-4">
              <StyledText
                variant="semibold"
                className="text-warm-900 text-sm mb-2"
              >
                Phone Number
              </StyledText>
              <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-warm-100 flex-row items-center">
                <FontAwesome name="phone" size={16} color="#B45309" />
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
                      className="flex-1 ml-3 text-warm-900 font-stack-sans text-base"
                    />
                  )}
                />
              </View>
            </View>

            {/* Address */}
            <View className="mb-4">
              <StyledText
                variant="semibold"
                className="text-warm-900 text-sm mb-2"
              >
                Address
              </StyledText>
              <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-warm-100 flex-row items-start">
                <FontAwesome
                  name="map-marker"
                  size={16}
                  color="#B45309"
                  className="mt-1"
                />
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
                      className="flex-1 ml-3 text-warm-900 font-stack-sans text-base"
                    />
                  )}
                />
              </View>
            </View>

            {/* Credit Limit */}
            <View className="mb-4">
              <StyledText
                variant="semibold"
                className="text-warm-900 text-sm mb-2"
              >
                Credit Limit (Optional)
              </StyledText>
              <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-warm-100 flex-row items-center">
                <StyledText variant="medium" className="text-secondary-600">
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
                      className="flex-1 ml-2 text-warm-900 font-stack-sans text-base"
                    />
                  )}
                />
              </View>
              <StyledText
                variant="regular"
                className="text-warm-500 text-xs mt-1"
              >
                Set a maximum credit limit for this customer
              </StyledText>
            </View>

            {/* Notes */}
            <View className="mb-6">
              <StyledText
                variant="semibold"
                className="text-warm-900 text-sm mb-2"
              >
                Notes
              </StyledText>
              <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-warm-100">
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
                      className="text-warm-900 font-stack-sans text-base"
                    />
                  )}
                />
              </View>
            </View>

            {/* Info Card */}
            <View className="bg-secondary-500/10 border border-secondary-500 rounded-xl p-4 mb-6">
              <View className="flex-row items-start">
                <FontAwesome
                  name="info-circle"
                  size={16}
                  color="#B45309"
                  className="mt-0.5"
                />
                <View className="flex-1 ml-3">
                  <StyledText
                    variant="semibold"
                    className="text-secondary-600 mb-1"
                  >
                    Customer Information
                  </StyledText>
                  <StyledText
                    variant="regular"
                    className="text-warm-600 text-xs"
                  >
                    Add customer details to track credits and payments. Only the
                    name is required to get started.
                  </StyledText>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSubmit(onSubmit)}
              disabled={insertCustomer.isPending || !isValid}
              className={`rounded-xl py-4 ${
                insertCustomer.isPending || !isValid
                  ? 'bg-gray-300'
                  : 'bg-secondary-500'
              }`}
            >
              <StyledText
                variant="semibold"
                className="text-white text-center text-base"
              >
                {insertCustomer.isPending
                  ? 'Adding Customer...'
                  : 'Add Customer'}
              </StyledText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
