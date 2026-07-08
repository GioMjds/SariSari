import { useEffect, useState } from 'react';
import { View, Platform, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FontAwesome } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useSuppliers } from '@/hooks/useSuppliers';
import { StyledText } from '@/components/elements';
import { Modal } from '@/components/ui';
import { useTranslation } from 'react-i18next';

interface SupplierFormData {
  name: string;
  contact: string;
  notes: string;
}

export default function EditSupplier() {
  const { t } = useTranslation('inventory');
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  
  const { useGetSupplier, updateSupplierMutation } = useSuppliers();
  const { data: supplier, isLoading } = useGetSupplier(id);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<SupplierFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      contact: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        contact: supplier.contact || '',
        notes: supplier.notes || '',
      });
    }
  }, [supplier, reset]);

  const confirmDiscard = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      router.back();
    }
  };

  const onSubmit = (data: SupplierFormData) => {
    updateSupplierMutation.mutate(
      {
        id,
        patch: {
          name: data.name.trim(),
          contact: data.contact.trim() || null,
          notes: data.notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  };

  if (isLoading || !supplier) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#E85A1F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-ink-100 bg-paper-50">
          <TouchableOpacity onPress={confirmDiscard} className="p-2">
            <FontAwesome name="chevron-left" size={20} color="#7A7165" />
          </TouchableOpacity>
          <StyledText variant="extrabold" className="text-lg text-ink-900">
            {t('editSupplier')}
          </StyledText>
          <View className="w-10" />
        </View>

        {/* Form Body */}
        <View className="px-4 mt-6 gap-5">
          {/* Name Field */}
          <View>
            <StyledText variant="semibold" className="text-ink-700 text-sm mb-2">
              {t('labelName')} *
            </StyledText>
            <Controller
              control={control}
              name="name"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="e.g. Coca-Cola Representative"
                  value={value}
                  onChangeText={onChange}
                  className="bg-white border border-ink-200 rounded-xl px-4 py-3 font-stack-sans text-base text-ink-900 shadow-sm"
                  placeholderTextColor="#A89F90"
                />
              )}
            />
          </View>

          {/* Contact Field */}
          <View>
            <StyledText variant="semibold" className="text-ink-700 text-sm mb-2">
              {t('labelContact')}
            </StyledText>
            <Controller
              control={control}
              name="contact"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="e.g. Phone number, email, address"
                  value={value}
                  onChangeText={onChange}
                  className="bg-white border border-ink-200 rounded-xl px-4 py-3 font-stack-sans text-base text-ink-900 shadow-sm"
                  placeholderTextColor="#A89F90"
                />
              )}
            />
          </View>

          {/* Notes Field */}
          <View>
            <StyledText variant="semibold" className="text-ink-700 text-sm mb-2">
              {t('labelNotes')}
            </StyledText>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="e.g. Delivers every Tuesday morning"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  className="bg-white border border-ink-200 rounded-xl px-4 py-3 font-stack-sans text-base text-ink-900 shadow-sm min-h-[100px]"
                  placeholderTextColor="#A89F90"
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          {/* Buttons */}
          <View className="gap-3 mt-4">
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || updateSupplierMutation.isPending}
              className={`py-4 rounded-xl items-center justify-center shadow-persimmon-glow ${
                isValid && !updateSupplierMutation.isPending ? 'bg-persimmon-500' : 'bg-ink-200'
              }`}
            >
              {updateSupplierMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <StyledText variant="extrabold" className="text-white text-base">
                  {t('editSupplier')}
                </StyledText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmDiscard}
              className="bg-ink-100 border border-ink-200 rounded-xl py-4 items-center justify-center"
            >
              <StyledText variant="semibold" className="text-ink-700 text-base">
                {t('common:cancel')}
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Discard Confirmation Modal */}
      <Modal
        visible={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to discard them?"
        variant="warning"
        useNativeModal={false}  
        buttons={[
          {
            text: "Don't Leave",
            style: 'cancel',
            onPress: () => setShowDiscardDialog(false),
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setShowDiscardDialog(false);
              router.back();
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}
