import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { FontAwesome } from '@expo/vector-icons';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/inventory/modals/_shared';
import { DeliveryLineRow } from '@/components/receiving/DeliveryLineRow';
import { ProductPickerSheet } from '@/components/receiving/ProductPickerSheet';
import { deliveryErrorMessage } from '@/components/receiving/deliveryErrors';
import {
  lineFormFromReceiptLine,
  mergeSeededLines,
} from '@/components/receiving/lineForms';
import { Modal } from '@/components/ui';
import {
  DraftAlreadyExistsError,
  useCommitDeliveryReceipt,
  useDeliveryReceipt,
  useDiscardDeliveryDraft,
  useOpenDraftForSupplier,
  useSaveDeliveryDraft,
  useVoidDeliveryReceipt,
} from '@/hooks/useDeliveryReceipts';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
import { useProducts } from '@/hooks/useProducts';
import { usePalengkeRestockPlan } from '@/hooks/useStockIntelligence';
import { useSuppliers } from '@/hooks/useSuppliers';
import {
  isLineComplete,
  seedLinesFromPlan,
  toLineInput,
  type DraftLineForm,
} from '@/lib/deliveryForm';
import { convertDeliveryLine, costChange } from '@/lib/deliveryReceipt';
import { formatPesos } from '@/lib/money';
import { useToastStore } from '@/stores';
import type {
  DeliveryLineInput,
  DeliveryReceiptDetail,
  SaveDeliveryDraftInput,
} from '@/types/deliveries.types';
import type { Product } from '@/types/products.types';
import type { Supplier } from '@/types/suppliers.types';

const LIST_ROUTE = '/(edit-forms)/delivery-receipts' as Href;
const editorRoute = (id: number) =>
  `/(edit-forms)/delivery-receipt/${id}` as Href;

interface CostChangeRow {
  key: string;
  name: string;
  change: number;
}

export default function DeliveryReceiptEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('receiving');
  const addToast = useToastStore((s) => s.addToast);
  const { runWithPinGuard } = useOwnerPinGuard();

  // `new` means no receipt row yet; the draft is created on first save.
  const receiptId = id && /^\d+$/.test(id) ? Number(id) : null;

  const detailQuery = useDeliveryReceipt(receiptId);
  const detail = detailQuery.data ?? null;
  const status = detail?.status ?? 'draft';
  const isDraft = status === 'draft';

  const { getAllSuppliersQuery } = useSuppliers();
  const suppliers = useMemo(
    () => (getAllSuppliersQuery.data as Supplier[] | undefined) ?? [],
    [getAllSuppliersQuery.data],
  );
  const { getAllProductsQuery } = useProducts();

  const saveMutation = useSaveDeliveryDraft();
  const commitMutation = useCommitDeliveryReceipt();
  const voidMutation = useVoidDeliveryReceipt();
  const discardMutation = useDiscardDeliveryDraft();

  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<DraftLineForm[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [voidSheetOpen, setVoidSheetOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [discardOpen, setDiscardOpen] = useState(false);

  // Which receipt the local form was loaded from, so a refetch never
  // overwrites what the owner is typing.
  const hydratedFor = useRef<number | null>(null);
  // The id this screen just created, so its own open-draft refetch is not
  // mistaken for another draft of the same supplier.
  const createdId = useRef<number | null>(null);
  // Double-tap guards on top of the disabled buttons and the DB guard.
  const committing = useRef(false);
  const voiding = useRef(false);

  useEffect(() => {
    if (!detail || hydratedFor.current === detail.id) return;
    if (getAllProductsQuery.isLoading) return;
    const products = (getAllProductsQuery.data as Product[] | undefined) ?? [];
    const byId = new Map(products.map((p) => [p.id, p]));
    setSupplierId(detail.supplierId);
    setInvoiceNo(detail.invoiceNo ?? '');
    setPhotoUri(detail.invoicePhotoUri);
    setNote(detail.note ?? '');
    setLines(
      detail.lines.map((l) =>
        lineFormFromReceiptLine(
          l,
          l.productId !== null ? (byId.get(l.productId) ?? null) : null,
        ),
      ),
    );
    hydratedFor.current = detail.id;
  }, [detail, getAllProductsQuery.isLoading, getAllProductsQuery.data]);

  // A receipt deleted elsewhere (for example a discarded draft) has no detail.
  useEffect(() => {
    if (receiptId !== null && detailQuery.isSuccess && detail === null) {
      router.replace(LIST_ROUTE);
    }
  }, [receiptId, detailQuery.isSuccess, detail, router]);

  // Choosing a supplier that already has an open draft resumes that draft.
  const openDraftQuery = useOpenDraftForSupplier(
    receiptId === null ? supplierId : null,
  );
  const openDraftId = openDraftQuery.data ?? null;
  useEffect(() => {
    if (receiptId !== null || openDraftId === null) return;
    if (openDraftId === createdId.current) return;
    addToast({ message: t('errorDraftExists'), variant: 'info' });
    router.replace(editorRoute(openDraftId));
  }, [receiptId, openDraftId, addToast, router, t]);

  const planQuery = usePalengkeRestockPlan({ supplierId });
  const planItems =
    supplierId !== null && isDraft ? (planQuery.data?.items ?? []) : [];

  const allComplete = lines.length > 0 && lines.every(isLineComplete);
  const isSaving = saveMutation.isPending;
  const isCommitting = commitMutation.isPending || isSaving;

  const review = useMemo(() => {
    let totalCost = 0;
    let shortageValue = 0;
    const changes: CostChangeRow[] = [];
    for (const form of lines) {
      try {
        const input = toLineInput(form);
        const c = convertDeliveryLine({
          enteredUnit: input.enteredUnit,
          enteredExpectedQty: input.enteredExpectedQty,
          enteredReceivedQty: input.enteredReceivedQty,
          enteredUnitCost: input.enteredUnitCost,
          conversionFactor: form.conversionFactor,
        });
        totalCost += c.receivedQty * c.actualUnitCost;
        // Same basis as the shortage report: last cost, else actual cost.
        shortageValue +=
          c.shortageQty * (form.lastCostPrice ?? c.actualUnitCost);
        const change = costChange(c.actualUnitCost, form.lastCostPrice);
        if (change !== null && change !== 0) {
          changes.push({ key: form.key, name: form.productName, change });
        }
      } catch {
        // Incomplete or invalid line; the review step is gated on allComplete.
      }
    }
    return { totalCost, shortageValue, changes };
  }, [lines]);

  const goBack = () => {
    Haptics.selectionAsync().catch(() => {});
    if (router.canGoBack()) router.back();
    else router.replace(LIST_ROUTE);
  };

  const toastError = (err: unknown) =>
    addToast({ message: deliveryErrorMessage(err, t), variant: 'danger' });

  const updateLine = (key: string, next: DraftLineForm) =>
    setLines((prev) => prev.map((l) => (l.key === key ? next : l)));
  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l.key !== key));

  const handleFillFromPlan = () => {
    if (planItems.length === 0) return;
    Haptics.selectionAsync().catch(() => {});
    setLines((prev) => mergeSeededLines(prev, seedLinesFromPlan(planItems)));
  };

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      if (asset) setPhotoUri(asset.uri);
    } catch (err) {
      toastError(err);
    }
  };

  /**
   * Saves the draft and returns its id, or null if nothing was saved. A new
   * draft moves the screen to its numeric id unless the caller navigates.
   */
  const persist = async (navigateOnCreate = true): Promise<number | null> => {
    if (supplierId === null) {
      addToast({ message: t('pickSupplierFirst'), variant: 'warning' });
      return null;
    }
    // Stored lines need whole numbers, so a draft is saved only once every
    // line has received qty and cost.
    if (!lines.every(isLineComplete)) {
      addToast({ message: t('reviewIncomplete'), variant: 'warning' });
      return null;
    }
    let lineInputs: DeliveryLineInput[];
    try {
      lineInputs = lines.map(toLineInput);
    } catch (err) {
      toastError(err);
      return null;
    }
    const input: SaveDeliveryDraftInput = {
      ...(receiptId !== null ? { receiptId } : {}),
      supplierId,
      invoiceNo: invoiceNo.trim() || null,
      invoicePhotoUri: photoUri,
      note: note.trim() || null,
      lines: lineInputs,
    };
    try {
      const savedId = await saveMutation.mutateAsync(input);
      if (receiptId === null) {
        createdId.current = savedId;
        hydratedFor.current = savedId;
        if (navigateOnCreate) router.replace(editorRoute(savedId));
      }
      return savedId;
    } catch (err) {
      if (err instanceof DraftAlreadyExistsError) {
        addToast({ message: t('errorDraftExists'), variant: 'info' });
        router.replace(editorRoute(err.existingReceiptId));
        return null;
      }
      toastError(err);
      return null;
    }
  };

  const handleSaveDraft = async () => {
    const savedId = await persist();
    if (savedId !== null) {
      addToast({ message: t('draftSaved'), variant: 'success' });
    }
  };

  const handleOpenReview = () => {
    if (!allComplete) {
      addToast({ message: t('reviewIncomplete'), variant: 'warning' });
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    setReviewOpen(true);
  };

  const handleCommit = async () => {
    if (committing.current || isCommitting) return;
    committing.current = true;
    let savedId: number | null = null;
    try {
      savedId = await persist(false);
      if (savedId === null) return;
      await commitMutation.mutateAsync(savedId);
      addToast({ message: t('committedToast'), variant: 'success' });
      router.replace(LIST_ROUTE);
    } catch (err) {
      toastError(err);
      // The draft was created but not committed: continue on its own id.
      if (receiptId === null && savedId !== null) {
        router.replace(editorRoute(savedId));
      }
    } finally {
      committing.current = false;
    }
  };

  const handleDiscard = async () => {
    setDiscardOpen(false);
    if (receiptId === null) {
      goBack();
      return;
    }
    try {
      await discardMutation.mutateAsync(receiptId);
      addToast({ message: t('discardedToast'), variant: 'success' });
      router.replace(LIST_ROUTE);
    } catch (err) {
      toastError(err);
    }
  };

  const handleVoid = async () => {
    const reason = voidReason.trim();
    if (reason === '' || receiptId === null) return;
    if (voiding.current || voidMutation.isPending) return;
    setVoidSheetOpen(false);
    voiding.current = true;
    try {
      await runWithPinGuard({
        title: t('voidPinTitle'),
        actionDescription: `Void delivery receipt #${receiptId}`,
        onApproved: async () => {
          try {
            await voidMutation.mutateAsync({ receiptId, reason });
            setVoidReason('');
            addToast({ message: t('voidedToast'), variant: 'success' });
          } catch (err) {
            toastError(err);
          }
        },
      });
    } finally {
      voiding.current = false;
    }
  };

  const selectedSupplierName =
    detail?.supplierName ??
    suppliers.find((s) => s.id === supplierId)?.name ??
    null;

  const isLoadingDetail =
    receiptId !== null &&
    (detailQuery.isLoading ||
      (detail !== null && hydratedFor.current !== detail.id));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="px-4 pt-3 pb-2 bg-background z-10">
        <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
          <Pressable
            onPress={goBack}
            hitSlop={{ top: 16, bottom: 16, left: 20, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>

          <View className="flex-1 px-3 items-center">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-h2 font-stack-sans-bold"
            >
              {t('editorTitle')}
            </StyledText>
            {selectedSupplierName ? (
              <StyledText
                variant="medium"
                className="label-caps text-ink-400 mt-0.5"
                numberOfLines={1}
              >
                {selectedSupplierName}
              </StyledText>
            ) : null}
          </View>

          <StatusBadge status={status} receiptId={receiptId} t={t} />
        </View>
      </View>

      {isLoadingDetail ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E85A1F" />
        </View>
      ) : !isDraft && detail ? (
        <ReadOnlyReceipt
          detail={detail}
          t={t}
          voidPending={voidMutation.isPending}
          onVoid={() => setVoidSheetOpen(true)}
        />
      ) : (
        <>
          <KeyboardAwareScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            bottomOffset={64}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <View className="px-4 mt-2">
              {reviewOpen && allComplete ? (
                <ReviewCard
                  totalCost={review.totalCost}
                  shortageValue={review.shortageValue}
                  changes={review.changes}
                  t={t}
                />
              ) : (
                <>
                  {/* Supplier */}
                  <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
                    <StyledText
                      variant="black"
                      className="label-caps text-cinnamon-500 mb-3"
                    >
                      {t('supplier')}
                    </StyledText>
                    {receiptId !== null ? (
                      <View className="flex-row items-center gap-2">
                        <FontAwesome name="truck" size={14} color="#623418" />
                        <StyledText
                          variant="semibold"
                          className="text-ink-900 text-base"
                        >
                          {selectedSupplierName}
                        </StyledText>
                      </View>
                    ) : suppliers.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                      >
                        {suppliers.map((s) => {
                          const isActive = supplierId === s.id;
                          return (
                            <Pressable
                              key={s.id}
                              onPress={() => setSupplierId(s.id)}
                              accessibilityRole="button"
                              accessibilityState={{ selected: isActive }}
                              accessibilityLabel={`${t('pickSupplier')}: ${s.name}`}
                              className={`px-3 py-2 rounded-xl border ${
                                isActive
                                  ? 'bg-cinnamon-500 border-cinnamon-500'
                                  : 'bg-paper-100 border-paper-300'
                              }`}
                            >
                              <StyledText
                                variant="semibold"
                                className={`text-xs ${
                                  isActive ? 'text-paper-50' : 'text-ink-700'
                                }`}
                              >
                                {s.name}
                              </StyledText>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <StyledText
                        variant="regular"
                        className="text-xs text-ink-400 py-1"
                      >
                        {t('noSuppliers')}
                      </StyledText>
                    )}
                  </View>

                  {/* Invoice header */}
                  <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4 gap-y-3">
                    <View className="gap-y-1">
                      <StyledText
                        variant="semibold"
                        className="text-ink-900 text-sm"
                      >
                        {t('invoiceNo')}
                      </StyledText>
                      <TextInput
                        value={invoiceNo}
                        onChangeText={setInvoiceNo}
                        autoCapitalize="characters"
                        accessibilityLabel={t('invoiceNo')}
                        placeholderTextColor="#A89F90"
                        className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-3 text-ink-900 text-base font-stack-sans"
                      />
                    </View>

                    <View className="gap-y-1">
                      <StyledText
                        variant="semibold"
                        className="text-ink-900 text-sm"
                      >
                        {t('invoicePhoto')}
                      </StyledText>
                      {photoUri ? (
                        <View className="flex-row items-center gap-3">
                          <Image
                            source={{ uri: photoUri }}
                            className="w-16 h-16 rounded-xl bg-paper-200"
                            accessibilityIgnoresInvertColors
                          />
                          <Pressable
                            onPress={() => setPhotoUri(null)}
                            accessibilityRole="button"
                            accessibilityLabel={t('removePhoto')}
                            className="px-3 py-2 bg-paper-200 border border-ink-200 rounded-xl active:bg-paper-300"
                          >
                            <StyledText
                              variant="semibold"
                              className="text-xs text-ink-700"
                            >
                              {t('removePhoto')}
                            </StyledText>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => {
                            void handlePickPhoto();
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={t('addPhoto')}
                          className="self-start px-3 py-2 bg-paper-200 border border-ink-200 rounded-xl flex-row items-center gap-1.5 active:bg-paper-300"
                        >
                          <FontAwesome
                            name="camera"
                            size={12}
                            color="#564E45"
                          />
                          <StyledText
                            variant="semibold"
                            className="text-xs text-ink-700"
                          >
                            {t('addPhoto')}
                          </StyledText>
                        </Pressable>
                      )}
                    </View>

                    <View className="gap-y-1">
                      <StyledText
                        variant="semibold"
                        className="text-ink-900 text-sm"
                      >
                        {t('note')}
                      </StyledText>
                      <TextInput
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                        accessibilityLabel={t('note')}
                        className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-3 text-ink-900 text-base font-stack-sans min-h-[64px]"
                      />
                    </View>
                  </View>

                  {/* Lines */}
                  <View className="flex-row items-center justify-between mb-3">
                    <StyledText
                      variant="black"
                      className="label-caps text-cinnamon-500"
                    >
                      {t('lineCount', { count: lines.length })}
                    </StyledText>
                    {planItems.length > 0 ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleFillFromPlan}
                        accessibilityRole="button"
                        accessibilityLabel={t('fillFromPlan')}
                        className="px-3 py-2 bg-paper-200 border border-ink-200 rounded-xl flex-row items-center gap-1.5 active:bg-paper-300"
                      >
                        <FontAwesome name="magic" size={11} color="#564E45" />
                        <StyledText
                          variant="semibold"
                          className="text-xs text-ink-700"
                        >
                          {t('fillFromPlan')}
                        </StyledText>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {lines.length === 0 ? (
                    <View className="bg-paper-50 p-6 rounded-2xl border border-ink-100 items-center justify-center mb-3 shadow-paper">
                      <FontAwesome name="dropbox" size={24} color="#A89F90" />
                      <StyledText
                        variant="regular"
                        className="text-ink-500 text-xs text-center mt-2"
                      >
                        {t('noLines')}
                      </StyledText>
                    </View>
                  ) : (
                    lines.map((form) => (
                      <DeliveryLineRow
                        key={form.key}
                        form={form}
                        onChange={(next) => updateLine(form.key, next)}
                        onRemove={() => removeLine(form.key)}
                      />
                    ))
                  )}

                  <Pressable
                    onPress={() => {
                      if (supplierId === null) {
                        addToast({
                          message: t('pickSupplierFirst'),
                          variant: 'warning',
                        });
                        return;
                      }
                      setPickerOpen(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t('addLine')}
                    className="py-3 rounded-xl border border-dashed border-persimmon-300 bg-persimmon-50 flex-row items-center justify-center gap-2 active:opacity-80"
                  >
                    <FontAwesome name="plus" size={12} color="#E85A1F" />
                    <StyledText
                      variant="semibold"
                      className="text-persimmon-700 text-sm"
                    >
                      {t('addLine')}
                    </StyledText>
                  </Pressable>

                  {receiptId !== null ? (
                    <Pressable
                      onPress={() => setDiscardOpen(true)}
                      disabled={discardMutation.isPending}
                      accessibilityRole="button"
                      accessibilityLabel={t('discard')}
                      className="mt-6 py-3 items-center justify-center rounded-xl active:opacity-70"
                    >
                      <StyledText
                        variant="semibold"
                        className="text-semantic-danger text-sm"
                      >
                        {t('discard')}
                      </StyledText>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          </KeyboardAwareScrollView>

          {/* Bottom action bar */}
          <View className="p-4 bg-paper-50 border-t border-ink-100 shadow-paper flex-row gap-x-3">
            {reviewOpen && allComplete ? (
              <>
                <TouchableOpacity
                  onPress={() => setReviewOpen(false)}
                  disabled={isCommitting}
                  accessibilityRole="button"
                  accessibilityLabel="Back to edit"
                  className="w-14 min-h-[52px] rounded-xl items-center justify-center border border-ink-200 bg-paper-100"
                >
                  <FontAwesome name="pencil" size={16} color="#564E45" />
                </TouchableOpacity>
                <PrimaryButton
                  label={t('commit')}
                  icon="check-circle"
                  busy={isCommitting}
                  onPress={() => {
                    void handleCommit();
                  }}
                />
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    void handleSaveDraft();
                  }}
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel={t('saveDraft')}
                  accessibilityState={{ busy: isSaving }}
                  className="flex-1 min-h-[52px] rounded-xl items-center justify-center border border-ink-200 bg-paper-100"
                >
                  <StyledText
                    variant="extrabold"
                    className="text-ink-700 text-sm"
                  >
                    {t('saveDraft')}
                  </StyledText>
                </TouchableOpacity>
                <PrimaryButton
                  label={t('review')}
                  icon="list-alt"
                  busy={false}
                  onPress={handleOpenReview}
                />
              </>
            )}
          </View>
        </>
      )}

      <ProductPickerSheet
        visible={pickerOpen}
        supplierId={supplierId}
        onClose={() => setPickerOpen(false)}
        onPick={(form) => setLines((prev) => [...prev, form])}
      />

      {/* Void reason, then owner PIN */}
      <Sheet visible={voidSheetOpen} onClose={() => setVoidSheetOpen(false)}>
        <StyledText variant="black" className="text-ink-900 text-base">
          {t('voidReason')}
        </StyledText>
        <TextInput
          value={voidReason}
          onChangeText={setVoidReason}
          placeholder={t('voidReasonPlaceholder')}
          placeholderTextColor="#A89F90"
          accessibilityLabel={t('voidReason')}
          multiline
          textAlignVertical="top"
          className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900 min-h-[72px]"
        />
        <View className="flex-row gap-x-3">
          <TouchableOpacity
            onPress={() => setVoidSheetOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('cancel')}
            className="flex-1 min-h-[44px] rounded-xl items-center justify-center border border-ink-200 bg-paper-100"
          >
            <StyledText variant="extrabold" className="text-ink-700 text-sm">
              {t('cancel')}
            </StyledText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              void handleVoid();
            }}
            disabled={voidReason.trim() === '' || voidMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel={t('voidContinue')}
            accessibilityState={{ disabled: voidReason.trim() === '' }}
            className={`flex-1 min-h-[44px] rounded-xl items-center justify-center ${
              voidReason.trim() === '' || voidMutation.isPending
                ? 'bg-paper-300'
                : 'bg-rose-700'
            }`}
          >
            <StyledText variant="extrabold" className="text-paper-50 text-sm">
              {t('voidContinue')}
            </StyledText>
          </TouchableOpacity>
        </View>
      </Sheet>

      <Modal
        visible={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title={t('discard')}
        description={t('discardConfirm')}
        variant="warning"
        buttons={[
          {
            text: t('cancel'),
            style: 'cancel',
            onPress: () => setDiscardOpen(false),
          },
          {
            text: t('discard'),
            style: 'destructive',
            onPress: () => {
              void handleDiscard();
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}

type TFn = ReturnType<typeof useTranslation>['t'];

function StatusBadge({
  status,
  receiptId,
  t,
}: {
  status: DeliveryReceiptDetail['status'];
  receiptId: number | null;
  t: TFn;
}) {
  const meta =
    status === 'committed'
      ? {
          label: t('tabCommitted'),
          className: 'bg-sage-50 border-sage-200',
          textClass: 'text-sage-700',
        }
      : status === 'voided'
        ? {
            label: t('tabVoided'),
            className: 'bg-semantic-danger-50 border-semantic-danger/25',
            textClass: 'text-semantic-danger',
          }
        : {
            label: t('statusDraft'),
            className: 'bg-paper-100 border-ink-100',
            textClass: 'text-ink-700',
          };
  return (
    <View
      className={`px-2.5 py-1 rounded-full border flex-row items-center gap-1 ${meta.className}`}
    >
      <StyledText variant="extrabold" className={`text-xs ${meta.textClass}`}>
        {receiptId !== null ? `${meta.label} #${receiptId}` : meta.label}
      </StyledText>
    </View>
  );
}

function PrimaryButton({
  label,
  icon,
  busy,
  onPress,
}: {
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy, busy }}
      className={`flex-1 min-h-[52px] rounded-xl flex-row items-center justify-center gap-2 active:opacity-90 ${
        busy ? 'bg-ink-100 opacity-60' : 'bg-persimmon-500 shadow-paper'
      }`}
    >
      {busy ? (
        <ActivityIndicator size="small" color="#7A7165" />
      ) : (
        <FontAwesome name={icon} size={15} color="#FBF7EE" />
      )}
      <StyledText
        variant="extrabold"
        className={`text-base font-stack-sans-bold ${
          busy ? 'text-ink-400' : 'text-paper-50'
        }`}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}

function ReviewCard({
  totalCost,
  shortageValue,
  changes,
  t,
}: {
  totalCost: number;
  shortageValue: number;
  changes: CostChangeRow[];
  t: TFn;
}) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
      <StyledText variant="black" className="label-caps text-cinnamon-500 mb-3">
        {t('review')}
      </StyledText>

      <View className="flex-row justify-between items-center mb-2">
        <StyledText variant="regular" className="text-ink-500 text-sm">
          {t('reviewTotalCost')}
        </StyledText>
        <StyledText
          variant="black"
          className="text-cinnamon-600 text-2xl"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatPesos(totalCost)}
        </StyledText>
      </View>
      <View className="flex-row justify-between items-center pb-3 border-b border-ink-100">
        <StyledText variant="regular" className="text-ink-500 text-sm">
          {t('reviewTotalShortage')}
        </StyledText>
        <StyledText
          variant="extrabold"
          className={`text-base ${
            shortageValue > 0 ? 'text-semantic-danger' : 'text-ink-700'
          }`}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatPesos(shortageValue)}
        </StyledText>
      </View>

      <StyledText
        variant="semibold"
        className="text-ink-400 text-[10px] label-caps mt-3 mb-2"
      >
        {t('reviewCostChanges')}
      </StyledText>
      {changes.length === 0 ? (
        <StyledText variant="regular" className="text-ink-500 text-xs">
          {t('reviewNoCostChanges')}
        </StyledText>
      ) : (
        <View className="gap-2">
          {changes.map((c) => (
            <View
              key={c.key}
              className="flex-row justify-between items-center bg-paper-100/70 p-2.5 rounded-xl border border-ink-100"
            >
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-xs flex-1 mr-2"
                numberOfLines={1}
              >
                {c.name}
              </StyledText>
              <StyledText
                variant="semibold"
                className={`text-xs ${
                  c.change > 0 ? 'text-semantic-warning' : 'text-sage-700'
                }`}
              >
                {c.change > 0
                  ? t('costUpChip', { amount: formatPesos(c.change) })
                  : t('costDownChip', {
                      amount: formatPesos(Math.abs(c.change)),
                    })}
              </StyledText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ReadOnlyReceipt({
  detail,
  t,
  voidPending,
  onVoid,
}: {
  detail: DeliveryReceiptDetail;
  t: TFn;
  voidPending: boolean;
  onVoid: () => void;
}) {
  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4 gap-2.5">
        <View className="flex-row justify-between items-center">
          <StyledText variant="regular" className="text-ink-500 text-sm">
            {t('invoiceNo')}
          </StyledText>
          <StyledText variant="semibold" className="text-ink-800 text-sm">
            {detail.invoiceNo ?? t('noInvoice')}
          </StyledText>
        </View>
        {detail.note ? (
          <View className="flex-row justify-between items-start">
            <StyledText variant="regular" className="text-ink-500 text-sm">
              {t('note')}
            </StyledText>
            <StyledText
              variant="semibold"
              className="text-ink-800 text-sm flex-1 text-right ml-3"
            >
              {detail.note}
            </StyledText>
          </View>
        ) : null}
        {detail.invoicePhotoUri ? (
          <Image
            source={{ uri: detail.invoicePhotoUri }}
            className="w-24 h-24 rounded-xl bg-paper-200"
            accessibilityLabel={t('invoicePhoto')}
          />
        ) : null}
        {detail.status === 'voided' && detail.voidReason ? (
          <View className="mt-1 p-3 rounded-xl bg-semantic-danger-50 border border-semantic-danger/25">
            <StyledText
              variant="extrabold"
              className="text-semantic-danger text-[10px] label-caps mb-0.5"
            >
              {t('voidReasonLabel')}
            </StyledText>
            <StyledText variant="regular" className="text-ink-800 text-xs">
              {detail.voidReason}
            </StyledText>
          </View>
        ) : null}
        <View className="flex-row justify-between items-center pt-3 border-t border-ink-200 mt-1">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-sm uppercase tracking-wider"
          >
            {t('reviewTotalCost')}
          </StyledText>
          <StyledText variant="black" className="text-cinnamon-600 text-2xl">
            {formatPesos(detail.totalCost)}
          </StyledText>
        </View>
      </View>

      <StyledText variant="black" className="label-caps text-cinnamon-500 mb-3">
        {t('lineCount', { count: detail.lines.length })}
      </StyledText>
      {detail.lines.map((line) => {
        const unit =
          line.enteredUnit === 'wholesale'
            ? t('unitWholesale')
            : t('unitRetail');
        return (
          <View
            key={line.id}
            className="bg-paper-50 rounded-2xl border border-ink-100 p-4 mb-3 shadow-paper"
          >
            <StyledText
              variant="semibold"
              className="text-base text-ink-900"
              numberOfLines={1}
            >
              {line.productName}
            </StyledText>
            <View className="bg-paper-100 rounded-xl p-3 flex-row justify-between items-center mt-2">
              <ReadOnlyStat
                label={t('expected')}
                value={`${line.enteredExpectedQty} ${unit}`}
              />
              <ReadOnlyStat
                label={t('received')}
                value={`${line.enteredReceivedQty} ${unit}`}
              />
              <ReadOnlyStat
                label={t('unitCost')}
                value={formatPesos(line.enteredUnitCost)}
              />
            </View>
            {line.shortageQty > 0 ? (
              <View className="self-start mt-2 px-2 py-0.5 rounded-full bg-semantic-danger-50">
                <StyledText
                  variant="semibold"
                  className="text-xs text-semantic-danger"
                >
                  {t('shortageChip', { count: line.shortageQty })}
                </StyledText>
              </View>
            ) : null}
          </View>
        );
      })}

      {detail.status === 'committed' ? (
        <Pressable
          onPress={onVoid}
          disabled={voidPending}
          accessibilityRole="button"
          accessibilityLabel={t('void')}
          accessibilityState={{ disabled: voidPending, busy: voidPending }}
          className={`mt-3 rounded-2xl py-4 flex-row items-center justify-center press-scale active:opacity-80 ${
            voidPending ? 'bg-ink-100 shadow-none' : 'bg-rose-700 shadow-paper'
          }`}
        >
          <FontAwesome
            name={voidPending ? 'spinner' : 'ban'}
            size={16}
            color={voidPending ? '#7A7165' : '#FBF7EE'}
          />
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-base ml-2"
          >
            {t('void')}
          </StyledText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function ReadOnlyStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <StyledText variant="regular" className="text-xs text-ink-600">
        {label}
      </StyledText>
      <StyledText
        variant="semibold"
        className="text-sm text-ink-700 mt-0.5"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </StyledText>
    </View>
  );
}
