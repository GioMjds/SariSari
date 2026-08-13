import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import * as Haptics from 'expo-haptics';
import { useCorrectSalePrice, useGetSale, useProfile } from '@/hooks';
import { tryParsePesosInput } from '@/lib/money';
import type { PriceCorrectionReasonCode } from '@/types/corrections.types';

export interface PriceCorrectionFormData {
  reason: PriceCorrectionReasonCode;
  witness: string;
  note: string;
}

export function usePriceCorrectionForm(saleId: number) {
  const router = useRouter();

  const saleQuery = useGetSale(saleId);
  const { data: sale, isLoading } = saleQuery;
  const { profile } = useProfile();
  const correctSalePriceMutation = useCorrectSalePrice();

  const [edits, setEdits] = useState<Record<number, string>>({});
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const {
    control,
    handleSubmit: rhfHandleSubmit,
    setError,
    clearErrors,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PriceCorrectionFormData>({
    mode: 'onChange',
    defaultValues: {
      reason: 'misprinted_price',
      witness: '',
      note: '',
    },
  });

  const reason = watch('reason');
  const witness = watch('witness');
  const note = watch('note');

  const setWitness = useCallback(
    (val: string) => {
      clearErrors('witness');
      setValue('witness', val, { shouldDirty: true });
    },
    [clearErrors, setValue],
  );

  const setNote = useCallback(
    (val: string) => {
      setValue('note', val, { shouldDirty: true });
    },
    [setValue],
  );

  const handleReasonSelect = useCallback(
    (val: PriceCorrectionReasonCode) => {
      Haptics.selectionAsync().catch(() => {});
      clearErrors('reason');
      setValue('reason', val, { shouldDirty: true });
    },
    [clearErrors, setValue],
  );

  const handleEditChange = useCallback((saleItemId: number, value: string) => {
    clearErrors('root');
    setEdits((prev) => ({
      ...prev,
      [saleItemId]: value,
    }));
  }, [clearErrors]);

  const handleResetItem = useCallback((saleItemId: number) => {
    Haptics.selectionAsync().catch(() => {});
    clearErrors('root');
    setEdits((prev) => {
      const next = { ...prev };
      delete next[saleItemId];
      return next;
    });
  }, [clearErrors]);

  const handleResetAll = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    clearErrors();
    setEdits({});
    setValue('witness', '');
    setValue('note', '');
    setValue('reason', 'misprinted_price');
  }, [clearErrors, setValue]);

  const originalTotal = sale?.total ?? 0;

  const calculateUpdatedTotal = useCallback(() => {
    if (!sale?.items) return 0;
    return sale.items.reduce((sum, item) => {
      const editVal = edits[item.id];
      let unitPrice = item.price;
      if (editVal !== undefined && editVal.trim() !== '') {
        const parsed = tryParsePesosInput(editVal);
        if (parsed > 0) {
          unitPrice = parsed;
        }
      }
      return sum + unitPrice * item.quantity;
    }, 0);
  }, [sale?.items, edits]);

  const updatedTotal = calculateUpdatedTotal();
  const totalDelta = updatedTotal - originalTotal;

  const hasEdits = Object.values(edits).some((v) => v !== undefined && v.trim() !== '');
  const isDirty =
    hasEdits ||
    witness.trim().length > 0 ||
    note.trim().length > 0 ||
    reason !== 'misprinted_price';

  const handleBack = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      router.back();
    }
  }, [isDirty, router]);

  const onSubmit = rhfHandleSubmit(async (data) => {
    clearErrors();
    let hasValidationError = false;

    if (!data.witness.trim()) {
      setError('witness', {
        type: 'manual',
        message: 'Witness / Cashier name is required',
      });
      hasValidationError = true;
    }

    if (!data.reason) {
      setError('reason', {
        type: 'manual',
        message: 'Reason code is required',
      });
      hasValidationError = true;
    }

    if (hasValidationError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      return;
    }

    const priceChanges: { saleItemId: number; newPrice: number }[] = [];
    const invalidItems: string[] = [];

    if (sale?.items) {
      for (const item of sale.items) {
        const editVal = edits[item.id];
        if (editVal !== undefined && editVal.trim() !== '') {
          const parsedPrice = tryParsePesosInput(editVal);
          if (!(parsedPrice > 0)) {
            invalidItems.push(item.product_name);
          } else if (parsedPrice !== item.price) {
            priceChanges.push({ saleItemId: item.id, newPrice: parsedPrice });
          }
        }
      }
    }

    if (invalidItems.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      setError('root', {
        type: 'manual',
        message: `Invalid price for: ${invalidItems.join(', ')}`,
      });
      return;
    }

    if (priceChanges.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
      setError('root', {
        type: 'manual',
        message: 'No price changes were made',
      });
      return;
    }

    const actorUser = profile?.ownerName?.trim() || 'owner';
    const noteTrimmed = data.note.trim();

    try {
      await correctSalePriceMutation.mutateAsync({
        saleId,
        actorUser,
        witnessUser: data.witness.trim(),
        reasonCode: data.reason,
        priceChanges,
        ...(noteTrimmed ? { note: noteTrimmed } : {}),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      router.back();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      setError('root', {
        type: 'manual',
        message: err?.message || 'Failed to record price correction',
      });
    }
  });

  return {
    control,
    errors,
    sale,
    isLoading,
    edits,
    reason,
    witness,
    note,
    isSubmitting,
    showDiscardModal,
    setShowDiscardModal,
    originalTotal,
    updatedTotal,
    totalDelta,
    isDirty,
    hasEdits,
    setWitness,
    setNote,
    handleReasonSelect,
    handleEditChange,
    handleResetItem,
    handleResetAll,
    handleBack,
    handleSubmit: onSubmit,
  };
}
