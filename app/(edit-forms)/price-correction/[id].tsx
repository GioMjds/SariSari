import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Modal } from '@/components/ui';
import {
  usePriceCorrectionForm,
  PriceCorrectionHeader,
  PriceCorrectionInfoBanner,
  PriceCorrectionItemList,
  PriceCorrectionSummaryCard,
  PriceCorrectionReasonCard,
  PriceCorrectionAuditCard,
  PriceCorrectionActionBar,
} from '@/components/sales/price-correction';

export default function PriceCorrectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);

  const form = usePriceCorrectionForm(numericId);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PriceCorrectionHeader
        saleId={numericId}
        onBack={form.handleBack}
      />

      <KeyboardAwareScrollView
        className="flex-1 px-4 pt-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={64}
      >
        {/* Info / Impact Callout Card */}
        <PriceCorrectionInfoBanner />

        {/* Adjust Unit Prices Line Items Editor */}
        <PriceCorrectionItemList
          items={form.sale?.items}
          isLoading={form.isLoading}
          edits={form.edits}
          onChangeEdit={form.handleEditChange}
          onResetItem={form.handleResetItem}
        />

        {/* Recalculation Summary */}
        <PriceCorrectionSummaryCard
          originalTotal={form.originalTotal}
          updatedTotal={form.updatedTotal}
          totalDelta={form.totalDelta}
        />

        {/* Reason Code Selection */}
        <PriceCorrectionReasonCard
          selectedReason={form.reason}
          onSelectReason={form.handleReasonSelect}
          error={form.errors.reason?.message}
        />

        {/* Audit Verification */}
        <PriceCorrectionAuditCard
          witness={form.witness}
          onWitnessChange={form.setWitness}
          note={form.note}
          onNoteChange={form.setNote}
          error={form.errors.witness?.message}
        />

        {/* Primary Action Submit Button */}
        <PriceCorrectionActionBar
          onSubmit={form.handleSubmit}
          isSubmitting={form.isSubmitting}
          isLoading={form.isLoading}
          error={form.errors.root?.message}
        />
      </KeyboardAwareScrollView>

      {/* Unsaved Changes Confirmation Modal */}
      <Modal
        visible={form.showDiscardModal}
        useNativeModal={false}
        onClose={() => form.setShowDiscardModal(false)}
        title="Discard Unsaved Changes?"
        description="You have modified price inputs or details that haven't been saved yet. Are you sure you want to discard them?"
        variant="warning"
        buttons={[
          {
            text: 'Keep Editing',
            style: 'cancel',
            onPress: () => form.setShowDiscardModal(false),
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              form.setShowDiscardModal(false);
              router.back();
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}
