import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { type NavigationAction, useNavigation, usePreventRemove } from '@react-navigation/native';
import { Href, router, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { useProducts, useBarcodeResolver } from '@/hooks';
import { applyBarcodeToAddProductForm, parsePesosInput, tryParsePesosInput } from '@/lib';
import { validateBarcode } from '@/lib/barcodes/format';
import { useToastStore } from '@/stores';
import {
  PRODUCT_FORM_DEFAULTS,
  type ProductFormData,
  findBarcodeConflict,
  generateSku,
  safeTrim,
} from '../form';

export type ScanTarget = 'barcode' | 'wholesaleBarcode';

export function useAddProductForm() {
  const { insertProductMutation, getAllProductsQuery } = useProducts();
  const addToast = useToastStore((state) => state.addToast);
  const { resolve } = useBarcodeResolver();

  const [autoGenerateSku, setAutoGenerateSku] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const pendingScanRef = useRef<string | null>(null);
  const priceInputRef = useRef<TextInput | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isDirty },
  } = useForm<ProductFormData>({ defaultValues: PRODUCT_FORM_DEFAULTS });

  const [productName, sku, barcode, price] = useWatch({
    control,
    name: ['productName', 'sku', 'barcode', 'price'],
  });

  const barcodeConflictProduct = useMemo(
    () => findBarcodeConflict(getAllProductsQuery.data ?? [], barcode),
    [getAllProductsQuery.data, barcode],
  );

  // First unmet requirement, shown in the footer so a disabled save is never a mystery.
  const blocker = !safeTrim(productName)
    ? 'Add a product name to save'
    : !(tryParsePesosInput(price) > 0)
      ? 'Add a selling price to save'
      : barcodeConflictProduct
        ? 'That barcode belongs to another product'
        : !autoGenerateSku && !safeTrim(sku)
          ? 'Add a SKU or turn on auto-generate'
          : null;

  useEffect(() => {
    if (!autoGenerateSku) return;
    const next = generateSku(productName, sku);
    if (next !== sku) setValue('sku', next, { shouldDirty: false });
  }, [productName, autoGenerateSku, setValue, sku]);

  const navigation = useNavigation();
  const saved = useRef(false);
  const pendingLeave = useRef<NavigationAction | null>(null);

  // Guards every exit path: header back, Android back, and the iOS edge swipe.
  usePreventRemove(isDirty, ({ data }) => {
    if (saved.current) {
      navigation.dispatch(data.action);
      return;
    }
    pendingLeave.current = data.action;
    setShowDialog(true);
  });

  const discard = useCallback(() => {
    setShowDialog(false);
    if (pendingLeave.current) navigation.dispatch(pendingLeave.current);
  }, [navigation]);

  const closeScanner = useCallback(() => setScanTarget(null), []);

  // Scans only ever land in a barcode field; the SKU is never touched here.
  const handleScannedBarcode = useCallback(
    async (value: string) => {
      if (scanTarget === 'wholesaleBarcode') {
        const check = validateBarcode(value);
        if (check.ok) setValue('wholesaleBarcode', check.barcode, { shouldDirty: true });
        else addToast({ message: 'Barcodes are 8 to 14 digits.', variant: 'warning' });
        setScanTarget(null);
        return;
      }

      const result = await resolve(value);
      switch (result.kind) {
        case 'resolved':
          // Already owned by another product; the conflict card explains next steps.
          setValue('barcode', safeTrim(value), { shouldDirty: true });
          setScanTarget(null);
          return;
        case 'catalog_match':
        case 'missing': {
          const patch = applyBarcodeToAddProductForm({ resolution: result });
          setValue('barcode', patch.barcode, { shouldDirty: true });
          if (patch.productName !== undefined) setValue('productName', patch.productName, { shouldDirty: true });
          if (patch.category !== undefined) setValue('category', patch.category, { shouldDirty: true });
          if (patch.retailUnitName !== undefined) setValue('retailUnitName', patch.retailUnitName, { shouldDirty: true });
          if (patch.toast) addToast(patch.toast);
          setScanTarget(null);
          if (patch.productName !== undefined) setTimeout(() => priceInputRef.current?.focus(), 250);
          return;
        }
        case 'invalid':
          addToast({
            message: result.reason === 'empty' ? 'Barcode is empty.' : 'Barcodes are 8 to 14 digits.',
            variant: 'warning',
          });
          setScanTarget(null);
          return;
        case 'store_products_unavailable':
          // Retried once the product list finishes loading.
          pendingScanRef.current = value;
          return;
        default:
          return;
      }
    },
    [resolve, addToast, setValue, scanTarget],
  );

  useEffect(() => {
    if (!getAllProductsQuery.isSuccess || getAllProductsQuery.isFetching) return;
    const queued = pendingScanRef.current;
    if (!queued) return;
    pendingScanRef.current = null;
    void handleScannedBarcode(queued);
  }, [getAllProductsQuery.isSuccess, getAllProductsQuery.isFetching, handleScannedBarcode]);

  const params = useLocalSearchParams<{ prefillBarcode?: string }>();
  const prefillAppliedRef = useRef(false);

  useEffect(() => {
    const prefill = params.prefillBarcode;
    if (!prefill || prefillAppliedRef.current) return;
    prefillAppliedRef.current = true;
    void handleScannedBarcode(prefill);
    router.setParams({ prefillBarcode: undefined });
  }, [params.prefillBarcode, handleScannedBarcode]);

  const submit = handleSubmit((data) => {
    const stock = parseInt(data.initialStock || '0', 10);
    const wholesale = data.enableWholesale;
    const factor = parseInt(data.conversionFactor, 10);

    insertProductMutation.mutate(
      {
        name: safeTrim(data.productName),
        // Barcode is never reused as the SKU; an empty SKU falls back to a generated one.
        sku: safeTrim(data.sku) || generateSku(data.productName),
        barcode: safeTrim(data.barcode) || null,
        price: parsePesosInput(data.price),
        quantity: Number.isFinite(stock) ? stock : 0,
        ...(data.costPerPiece ? { cost_price: parsePesosInput(data.costPerPiece) } : {}),
        ...(safeTrim(data.category) ? { category: safeTrim(data.category) } : {}),
        supplier_id: safeTrim(data.supplierId) || null,
        image_uri: safeTrim(data.imageUri) || null,
        retail_unit_name: safeTrim(data.retailUnitName) || 'Pc',
        wholesale_unit_name: wholesale ? safeTrim(data.wholesaleUnitName) || null : null,
        wholesale_price: wholesale && data.wholesalePrice ? parsePesosInput(data.wholesalePrice) : null,
        wholesale_cost_price:
          wholesale && data.wholesaleCostPrice ? parsePesosInput(data.wholesaleCostPrice) : null,
        conversion_factor: wholesale && Number.isFinite(factor) && factor >= 2 ? factor : null,
        wholesale_barcode: wholesale ? safeTrim(data.wholesaleBarcode) || null : null,
      },
      {
        onSuccess: () => {
          saved.current = true;
          router.replace('/(tabs)/inventory/products' as Href);
        },
      },
    );
  });

  return {
    control,
    setValue,
    autoGenerateSku,
    // Turning auto off keeps the generated code as an editable starting point.
    setAutoGenerateSku,
    showDialog,
    setShowDialog,
    isScannerOpen: scanTarget !== null,
    openScanner: setScanTarget,
    closeScanner,
    handleScannedBarcode,
    priceInputRef,
    barcodeConflictProduct,
    blocker,
    handleBack: router.back,
    discard,
    submit,
    insertProductMutation,
  };
}
