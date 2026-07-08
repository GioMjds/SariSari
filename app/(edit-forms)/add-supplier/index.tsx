import { useState } from 'react';
import {
  View,
  Platform,
  TextInput,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
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

export default function AddSupplier() {
  const { t } = useTranslation('inventory');
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [focusedField, setFocusedField] = useState<
    'name' | 'contact' | 'notes' | null
  >(null);
  const { insertSupplierMutation } = useSuppliers();

  const {
    control,
    handleSubmit,
    formState: { isDirty, isValid },
  } = useForm<SupplierFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      contact: '',
      notes: '',
    },
  });

  const confirmDiscard = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      router.back();
    }
  };

  const onSubmit = (data: SupplierFormData) => {
    insertSupplierMutation.mutate(
      {
        name: data.name.trim(),
        contact: data.contact.trim() || null,
        notes: data.notes.trim() || null,
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  };

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
        {/* Header - Styled like AddProductHeader */}
        <View className="px-4 pt-3 pb-4 bg-background">
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
            <Pressable
              onPress={confirmDiscard}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
            >
              <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
            </Pressable>

            <View className="items-center">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-h2 font-stack-sans-bold"
              >
                {t('addSupplier')}
              </StyledText>
              <StyledText
                variant="medium"
                className="label-caps text-ink-400 mt-0.5"
              >
                {t('supplierDirectory', 'Supplier Directory')}
              </StyledText>
            </View>

            <View className="w-10 h-10" />
          </View>
        </View>

        {/* Content Body */}
        <View className="px-4">
          {/* Context Banner - Refined to blend with the parchment paper color palette */}
          <View className="rounded-2xl overflow-hidden shadow-paper bg-cinnamon-50 p-4 mb-4">
            <View className="flex-row items-center gap-3">
              <View className="bg-cinnamon-100 w-10 h-10 rounded-full items-center justify-center">
                <FontAwesome name="truck" size={16} color="#D49570" />
              </View>
              <View className="flex-1">
                <StyledText
                  variant="extrabold"
                  className="text-cinnamon-900 text-base"
                >
                  {t('supplierProfile', 'Supplier Profile')}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-cinnamon-700 text-xs mt-0.5 leading-relaxed"
                >
                  {t(
                    'supplierProfileSubtitle',
                    'Keep your supplier details and notes offline. Linked during product restocking.',
                  )}
                </StyledText>
              </View>
            </View>
          </View>

          <View className="my-1 border-t border-dashed border-ink-300" />

          {/* Card 1: Basic Info */}
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mt-3 mb-4">
            <View className="mb-4">
              <StyledText
                variant="black"
                className="label-caps text-cinnamon-500"
              >
                {t('supplierBasicInfo', 'Basic Info')}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-400 text-xs mt-0.5"
              >
                {t('supplierBasicInfoDesc', 'Name and primary contact details')}
              </StyledText>
            </View>

            {/* Name Field */}
            <View className="mb-4">
              <StyledText
                variant="semibold"
                className="text-ink-900 text-sm mb-2"
              >
                {t('labelName')}{' '}
                <StyledText className="text-persimmon-500">*</StyledText>
              </StyledText>
              <Controller
                control={control}
                name="name"
                rules={{ required: true }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative justify-center">
                    <View className="absolute left-4 z-10">
                      <FontAwesome
                        name="user"
                        size={16}
                        color={focusedField === 'name' ? '#E85A1F' : '#564E45'}
                      />
                    </View>
                    <TextInput
                      placeholder="e.g. Coca-Cola Representative"
                      value={value}
                      onChangeText={onChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => {
                        onBlur();
                        setFocusedField(null);
                      }}
                      className={`text-ink-900 text-base border rounded-xl pl-11 pr-11 py-3.5 font-stack-sans ${
                        focusedField === 'name'
                          ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                          : 'bg-paper-100 border-ink-200'
                      }`}
                      placeholderTextColor="#A89F90"
                    />
                    {value.length > 0 && (
                      <TouchableOpacity
                        onPress={() => onChange('')}
                        className="absolute right-4 z-10 p-1"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <FontAwesome
                          name="times-circle"
                          size={16}
                          color="#A89F90"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Contact Field */}
            <View>
              <StyledText
                variant="semibold"
                className="text-ink-900 text-sm mb-2"
              >
                {t('labelContact')}
              </StyledText>
              <Controller
                control={control}
                name="contact"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative justify-center">
                    <View className="absolute left-4 z-10">
                      <FontAwesome
                        name="phone"
                        size={16}
                        color={
                          focusedField === 'contact' ? '#E85A1F' : '#564E45'
                        }
                      />
                    </View>
                    <TextInput
                      placeholder="e.g. Phone number, email, address"
                      value={value}
                      onChangeText={onChange}
                      onFocus={() => setFocusedField('contact')}
                      onBlur={() => {
                        onBlur();
                        setFocusedField(null);
                      }}
                      className={`text-ink-900 text-base border rounded-xl pl-11 pr-11 py-3.5 font-stack-sans ${
                        focusedField === 'contact'
                          ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                          : 'bg-paper-100 border-ink-200'
                      }`}
                      placeholderTextColor="#A89F90"
                    />
                    {value.length > 0 && (
                      <TouchableOpacity
                        onPress={() => onChange('')}
                        className="absolute right-4 z-10 p-1"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <FontAwesome
                          name="times-circle"
                          size={16}
                          color="#A89F90"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            </View>
          </View>

          <View className="my-1 border-t border-dashed border-ink-300" />

          {/* Card 2: Restocking Notes */}
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mt-3 mb-4">
            <View className="mb-4">
              <StyledText
                variant="black"
                className="label-caps text-cinnamon-500"
              >
                {t('labelNotes', 'Notes')}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-400 text-xs mt-0.5"
              >
                {t(
                  'supplierNotesDesc',
                  'Schedule, delivery details, and instructions',
                )}
              </StyledText>
            </View>

            {/* Notes Field */}
            <View>
              <StyledText
                variant="semibold"
                className="text-ink-900 text-sm mb-2"
              >
                {t('labelNotes')}
              </StyledText>
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative">
                    <View className="absolute left-4 top-3.5 z-10">
                      <FontAwesome
                        name="file-text"
                        size={16}
                        color={focusedField === 'notes' ? '#E85A1F' : '#564E45'}
                      />
                    </View>
                    <TextInput
                      placeholder="e.g. Delivers every Tuesday morning"
                      value={value}
                      onChangeText={onChange}
                      onFocus={() => setFocusedField('notes')}
                      onBlur={() => {
                        onBlur();
                        setFocusedField(null);
                      }}
                      multiline
                      numberOfLines={3}
                      className={`text-ink-900 text-base border rounded-xl pl-11 pr-4 py-3.5 font-stack-sans min-h-[100px] ${
                        focusedField === 'notes'
                          ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                          : 'bg-paper-100 border-ink-200'
                      }`}
                      placeholderTextColor="#A89F90"
                      textAlignVertical="top"
                    />
                  </View>
                )}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mt-5">
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || insertSupplierMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Add supplier"
              accessibilityState={{
                disabled: !isValid,
                busy: insertSupplierMutation.isPending,
              }}
              className={`rounded-2xl py-4 flex-row items-center justify-center ${
                !isValid || insertSupplierMutation.isPending
                  ? 'bg-ink-100'
                  : 'bg-persimmon-500 shadow-persimmon-glow'
              }`}
              style={({ pressed }) => ({
                transform: [
                  {
                    scale:
                      isValid && !insertSupplierMutation.isPending && pressed
                        ? 0.98
                        : 1,
                  },
                ],
              })}
            >
              <FontAwesome
                name={insertSupplierMutation.isPending ? 'spinner' : 'plus'}
                size={16}
                color={
                  !isValid || insertSupplierMutation.isPending
                    ? '#7A7165'
                    : '#FBF7EE'
                }
              />
              <StyledText
                variant="extrabold"
                className={`text-base ml-2 ${
                  !isValid || insertSupplierMutation.isPending
                    ? 'text-ink-400'
                    : 'text-paper-50'
                }`}
              >
                {insertSupplierMutation.isPending
                  ? 'Saving Supplier…'
                  : t('addSupplier')}
              </StyledText>
            </Pressable>

            <Pressable
              onPress={confirmDiscard}
              accessibilityRole="button"
              accessibilityLabel="Cancel and go back"
              className="press-scale mt-3 rounded-2xl py-4 items-center justify-center bg-paper-100 border border-ink-200 active:opacity-70"
            >
              <StyledText variant="semibold" className="text-ink-700 text-base">
                {t('common:cancel')}
              </StyledText>
            </Pressable>
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
