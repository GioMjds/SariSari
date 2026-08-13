import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCorrectSalePrice, useGetSale, useProfile } from '@/hooks';
import { tryParsePesosInput } from '@/lib/money';
import { useToastStore } from '@/stores';
import type { PriceCorrectionReasonCode } from '@/types/corrections.types';

export function usePriceCorrectionForm(saleId: number) {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const saleQuery = useGetSale(saleId);
  const { data: sale, isLoading } = saleQuery;
  const { profile } = useProfile();
  const correctSalePriceMutation = useCorrectSalePrice();

  const [edits, setEdits] = useState<Record<number, string>>({});
  const [reason, setReason] =
    useState<PriceCorrectionReasonCode>('misprinted_price');
  const [witness, setWitness] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const handleEditChange = useCallback((saleItemId: number, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [saleItemId]: value,
    }));
  }, []);

  const handleResetItem = useCallback((saleItemId: number) => {
    Haptics.selectionAsync().catch(() => {});
    setEdits((prev) => {
      const next = { ...prev };
      delete next[saleItemId];
      return next;
    });
  }, []);

  const handleResetAll = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setEdits({});
    setWitness('');
    setNote('');
    setReason('misprinted_price');
  }, []);

  const handleReasonSelect = useCallback((val: PriceCorrectionReasonCode) => {
    Haptics.selectionAsync().catch(() => {});
    setReason(val);
  }, []);

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

  const handleSubmit = async () => {
    if (!reason || !witness.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      addToast({
        message: 'Reason code and witness name are required',
        variant: 'danger',
      });
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
      addToast({
        message: `Invalid price for: ${invalidItems.join(', ')}`,
        variant: 'danger',
      });
      return;
    }

    if (priceChanges.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
      addToast({
        message: 'No price changes were made',
        variant: 'danger',
      });
      return;
    }

    setIsSubmitting(true);
    const actorUser = profile?.ownerName?.trim() || 'owner';
    const noteTrimmed = note.trim();

    try {
      await correctSalePriceMutation.mutateAsync({
        saleId,
        actorUser,
        witnessUser: witness.trim(),
        reasonCode: reason,
        priceChanges,
        ...(noteTrimmed ? { note: noteTrimmed } : {}),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      addToast({ message: 'Price correction recorded', variant: 'success' });
      router.back();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      addToast({
        message: err?.message || 'Failed to record price correction',
        variant: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
    handleSubmit,
  };
}
