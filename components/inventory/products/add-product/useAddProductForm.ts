import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Href, router, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { useCategories, useProducts, useBarcodeResolver } from '@/hooks';
import {
  applyBarcodeToAddProductForm,
  parsePesosInput,
  tryParsePesosInput,
} from '@/lib';
import { useToastStore } from '@/stores';

export interface AddProductFormData {
  productName: string;
  sku: string;
  barcode: string;
  category: string;
  bundleCost: string;
  piecesPerBundle: string;
  costPerPiece: string;
  price: string;
  initialStock: string;
  supplierId: string;
  imageUri: string;
  enableWholesale: boolean;
  retailUnitName: string;
  wholesaleUnitName: string;
  conversionFactor: string;
  wholesalePrice: string;
  wholesaleCostPrice: string;
  wholesaleBarcode: string;
}

export const MARKUP_PRESETS = [0.1, 0.2, 0.3, 0.5] as const;
export type MarkupPreset = (typeof MARKUP_PRESETS)[number];

export const STOCK_PRESETS = [5, 10, 20] as const;
export type StockPreset = (typeof STOCK_PRESETS)[number];

const safeTrim = (s?: string) => (s ?? '').trim();

export function useAddProductForm() {
  const { insertProductMutation, getAllProductsQuery } = useProducts();
  const { getAllCategoriesQuery } = useCategories();
  const { data: categories = [] } = getAllCategoriesQuery;
  const addToast = useToastStore((state) => state.addToast);
  const { resolve } = useBarcodeResolver();

  const [autoGenerateSku, setAutoGenerateSku] = useState<boolean>(true);
  const [useBundlePricing, setUseBundlePricing] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  const pendingScanRef = useRef<string | null>(null);

  const priceInputRef = useRef<TextInput | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isDirty },
  } = useForm<AddProductFormData>({
    defaultValues: {
      productName: '',
      sku: '',
      barcode: '',
      category: '',
      bundleCost: '',
      piecesPerBundle: '',
      costPerPiece: '',
      price: '',
      initialStock: '',
      supplierId: '',
      imageUri: '',
      enableWholesale: false,
      retailUnitName: 'Pc',
      wholesaleUnitName: 'Case',
      conversionFactor: '12',
      wholesalePrice: '',
      wholesaleCostPrice: '',
      wholesaleBarcode: '',
    },
  });

  const productName = useWatch({ control, name: 'productName' });
  const sku = useWatch({ control, name: 'sku' });
  const barcode = useWatch({ control, name: 'barcode' });
  const price = useWatch({ control, name: 'price' });
  const costPerPiece = useWatch({ control, name: 'costPerPiece' });
  const bundleCost = useWatch({ control, name: 'bundleCost' });
  const piecesPerBundle = useWatch({ control, name: 'piecesPerBundle' });
  const initialStock = useWatch({ control, name: 'initialStock' });
  const category = useWatch({ control, name: 'category' });
  const supplierId = useWatch({ control, name: 'supplierId' });
  const imageUri = useWatch({ control, name: 'imageUri' });
  const enableWholesale = useWatch({ control, name: 'enableWholesale' });
  const retailUnitName = useWatch({ control, name: 'retailUnitName' });
  const wholesaleUnitName = useWatch({ control, name: 'wholesaleUnitName' });
  const conversionFactor = useWatch({ control, name: 'conversionFactor' });
  const wholesalePrice = useWatch({ control, name: 'wholesalePrice' });
  const wholesaleCostPrice = useWatch({ control, name: 'wholesaleCostPrice' });
  const wholesaleBarcode = useWatch({ control, name: 'wholesaleBarcode' });

  const hasActualChanges =
    isDirty &&
    (safeTrim(productName) !== '' ||
      safeTrim(price) !== '' ||
      safeTrim(costPerPiece) !== '' ||
      safeTrim(bundleCost) !== '' ||
      safeTrim(initialStock) !== '' ||
      safeTrim(category) !== '' ||
      safeTrim(sku) !== '' ||
      safeTrim(barcode) !== '' ||
      safeTrim(supplierId) !== '' ||
      safeTrim(imageUri) !== '' ||
      enableWholesale ||
      safeTrim(retailUnitName) !== 'Pc' ||
      safeTrim(wholesaleUnitName) !== 'Case' ||
      safeTrim(conversionFactor) !== '12' ||
      safeTrim(wholesalePrice) !== '' ||
      safeTrim(wholesaleCostPrice) !== '' ||
      safeTrim(wholesaleBarcode) !== '');

  const parsedCost = costPerPiece ? tryParsePesosInput(costPerPiece) : 0;
  const parsedPrice = price ? tryParsePesosInput(price) : 0;
  const profitPerPiece = parsedPrice - parsedCost;
  const markupPercent =
    parsedCost > 0 && parsedPrice > 0
      ? ((parsedPrice - parsedCost) / parsedCost) * 100
      : 0;
  const isLossWarning =
    parsedCost > 0 && parsedPrice > 0 && parsedPrice <= parsedCost;

  const existingProducts = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const trimmedBarcode = safeTrim(barcode);

  const barcodeConflictProduct = useMemo(() => {
    if (!trimmedBarcode) return null;
    return (
      existingProducts.find(
        (p) =>
          (p.barcode != null && p.barcode === trimmedBarcode) ||
          (p.wholesale_barcode != null &&
            p.wholesale_barcode === trimmedBarcode) ||
          p.sku === trimmedBarcode,
      ) ?? null
    );
  }, [trimmedBarcode, existingProducts]);

  const isBarcodeDuplicate = barcodeConflictProduct != null;

  const isSubmitDisabled =
    insertProductMutation.isPending ||
    !safeTrim(productName) ||
    !safeTrim(sku) ||
    !price ||
    parsedPrice <= 0 ||
    isBarcodeDuplicate;

  useEffect(() => {
    if (!useBundlePricing) return;
    if (!bundleCost || !piecesPerBundle) return;
    const bundle = tryParsePesosInput(bundleCost);
    const pieces = parseInt(piecesPerBundle, 10);
    if (bundle > 0 && Number.isFinite(pieces) && pieces > 0) {
      const cost = bundle / pieces;
      setValue('costPerPiece', cost.toFixed(2));
    }
  }, [bundleCost, piecesPerBundle, useBundlePricing, setValue]);

  const generateSku = useCallback((name: string, currentSku: string) => {
    if (!name) return '';
    const safeSku = currentSku ?? '';
    const parts = name.trim().split(' ');
    const prefix = parts
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');

    const skuParts = safeSku.split('-');
    const skuPrefix = skuParts.slice(0, skuParts.length - 1).join('-');
    const skuSuffix = skuParts[skuParts.length - 1] as string;
    const isExistingValid = skuPrefix === prefix && /^\d{4}$/.test(skuSuffix);

    if (isExistingValid) return currentSku;

    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${timestamp}`;
  }, []);

  useEffect(() => {
    if (!autoGenerateSku) return;
    const generated = generateSku(productName ?? '', sku ?? '');
    if (generated !== sku) {
      setValue('sku', generated, { shouldDirty: false });
    }
  }, [productName, autoGenerateSku, generateSku, setValue, sku]);

  const applyMarkupPreset = useCallback(
    (markup: MarkupPreset) => {
      if (parsedCost <= 0) return;
      const calculated = parsedCost * (1 + markup);
      setValue('price', calculated.toFixed(2), { shouldDirty: true });
    },
    [parsedCost, setValue],
  );

  const bumpStock = useCallback(
    (delta: number) => {
      const current = parseInt(initialStock ?? '0', 10);
      const base = Number.isFinite(current) ? current : 0;
      const next = Math.max(0, base + delta);
      setValue('initialStock', String(next), { shouldDirty: true });
    },
    [initialStock, setValue],
  );

  const categoryRef = useRef(category);
  categoryRef.current = category;

  const selectCategory = useCallback(
    (name: string) => {
      const current = categoryRef.current;
      const nextCategory = current === name ? '' : name;
      setValue('category', nextCategory, {
        shouldDirty: true,
      });
    },
    [setValue],
  );

  const confirmDiscard = useCallback(() => {
    if (!hasActualChanges) {
      router.back();
      return;
    }
    setShowDialog(true);
  }, [hasActualChanges]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasActualChanges) {
          confirmDiscard();
          return true;
        }
        return false;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => backHandler.remove();
    }, [confirmDiscard, hasActualChanges]),
  );

  const openScanner = useCallback(() => setIsScannerOpen(true), []);
  const closeScanner = useCallback(() => setIsScannerOpen(false), []);

  const handleScannedBarcode = useCallback(
    async (barcodeValue: string) => {
      const result = await resolve(barcodeValue);
      if (result.kind === 'resolved') {
        setValue('barcode', safeTrim(barcodeValue), { shouldDirty: true });
        setIsScannerOpen(false);
        return;
      }

      if (result.kind === 'catalog_match' || result.kind === 'missing') {
        const patch = applyBarcodeToAddProductForm({
          resolution: result,
          autoGenerateSku,
        });

        if (patch.setAutoGenerateSku) setAutoGenerateSku(false);

        setValue('barcode', patch.barcode, { shouldDirty: true });

        if (patch.productName !== undefined) {
          setValue('productName', patch.productName, { shouldDirty: true });
        }
        if (patch.category !== undefined) {
          setValue('category', patch.category, { shouldDirty: true });
        }
        if (patch.retailUnitName !== undefined) {
          setValue('retailUnitName', patch.retailUnitName, {
            shouldDirty: true,
          });
        }

        if (patch.toast) addToast(patch.toast);

        setIsScannerOpen(false);

        if (typeof patch.productName === 'string') {
          setTimeout(() => {
            priceInputRef.current?.focus();
          }, 250);
        }
        return;
      }

      if (result.kind === 'invalid') {
        addToast({
          message:
            result.reason === 'empty'
              ? 'Barcode is empty.'
              : "That doesn't look like a barcode. Digits only, 8–14 long.",
          variant: 'warning',
        });
        setIsScannerOpen(false);
        return;
      }

      if (
        result.kind === 'duplicate' ||
        result.kind === 'superseded' ||
        result.kind === 'store_products_unavailable'
      ) {
        if (result.kind === 'store_products_unavailable') {
          pendingScanRef.current = barcodeValue;
        } else {
        }
        return;
      }
    },
    [resolve, addToast, autoGenerateSku, setValue],
  );

  useEffect(() => {
    if (!getAllProductsQuery.isSuccess || getAllProductsQuery.isFetching)
      return;
    const queued = pendingScanRef.current;
    if (!queued) return;
    pendingScanRef.current = null;
    void handleScannedBarcode(queued);
  }, [
    getAllProductsQuery.isSuccess,
    getAllProductsQuery.isFetching,
    handleScannedBarcode,
  ]);

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
    const priceValue = parsePesosInput(data.price);
    const stockValue = data.initialStock ? parseInt(data.initialStock, 10) : 0;
    const costPriceValue = data.costPerPiece
      ? parsePesosInput(data.costPerPiece)
      : null;
    const trimmedBarcode = safeTrim(data.barcode);

    const enableWholesale = data.enableWholesale;
    const retailUnitName = safeTrim(data.retailUnitName) || 'Pc';
    const wholesaleUnitName = enableWholesale
      ? safeTrim(data.wholesaleUnitName) || null
      : null;
    const conversionFactorNum =
      enableWholesale && data.conversionFactor
        ? parseInt(data.conversionFactor, 10)
        : null;
    const wholesalePriceVal =
      enableWholesale && data.wholesalePrice
        ? parsePesosInput(data.wholesalePrice)
        : null;
    const wholesaleCostVal =
      enableWholesale && data.wholesaleCostPrice
        ? parsePesosInput(data.wholesaleCostPrice)
        : null;
    const wholesaleBarcodeVal =
      enableWholesale && safeTrim(data.wholesaleBarcode)
        ? safeTrim(data.wholesaleBarcode)
        : null;

    insertProductMutation.mutate(
      {
        name: safeTrim(data.productName),
        sku: safeTrim(data.sku),
        ...(trimmedBarcode != null ? { barcode: trimmedBarcode } : {}),
        price: priceValue,
        ...(Number.isFinite(stockValue) ? { quantity: stockValue } : {}),
        ...(costPriceValue != null ? { cost_price: costPriceValue } : {}),
        ...(safeTrim(data.category) != null
          ? { category: safeTrim(data.category) as string }
          : {}),
        ...(data.supplierId != null
          ? { supplier_id: data.supplierId }
          : {}),
        ...(data.imageUri
          ? { image_uri: safeTrim(data.imageUri) }
          : {}),
        ...(retailUnitName != null ? { retail_unit_name: retailUnitName } : {}),
        ...(wholesaleUnitName != null
          ? { wholesale_unit_name: wholesaleUnitName }
          : {}),
        ...(wholesalePriceVal != null
          ? { wholesale_price: wholesalePriceVal }
          : {}),
        ...(wholesaleCostVal != null
          ? { wholesale_cost_price: wholesaleCostVal }
          : {}),
        ...(conversionFactorNum &&
        Number.isFinite(conversionFactorNum) &&
        conversionFactorNum >= 2
          ? { conversion_factor: conversionFactorNum }
          : {}),
        ...(wholesaleBarcodeVal != null
          ? { wholesale_barcode: wholesaleBarcodeVal }
          : {}),
      },
      {
        onSuccess: () => {
          router.push('/(tabs)' as Href);
        },
      },
    );
  });

  return {
    // Form wiring (passed through to RHF controllers)
    control,
    setValue,

    // Watched values — drive the live profit / markup preview
    productName,
    sku,
    barcode,
    price,
    costPerPiece,
    initialStock,
    category,
    supplierId,
    enableWholesale,
    retailUnitName,
    wholesaleUnitName,
    conversionFactor,
    wholesalePrice,
    wholesaleCostPrice,
    wholesaleBarcode,

    // Domain data
    categories,

    // Local UI state
    autoGenerateSku,
    setAutoGenerateSku,
    useBundlePricing,
    setUseBundlePricing,
    showDialog,
    setShowDialog,
    isScannerOpen,

    // Refs forwarded to text inputs so the screen can wire focus targets
    priceInputRef,

    // Derived
    hasActualChanges,
    isSubmitDisabled,
    profitPerPiece,
    markupPercent,
    isLossWarning,
    isBarcodeDuplicate,
    barcodeConflictProduct,

    // Handlers
    applyMarkupPreset,
    bumpStock,
    selectCategory,
    confirmDiscard,
    submit,

    // Scanner
    openScanner,
    closeScanner,
    handleScannedBarcode,

    // Mutation state
    insertProductMutation,
  };
}
