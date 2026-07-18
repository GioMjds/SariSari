import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { useCategories, useProducts, useBarcodeResolver } from '@/hooks';
import {
  applyBarcodeToAddProductForm,
  parsePesosInput,
  tryParsePesosInput,
} from '@/lib';
import { useToastStore } from '@/stores';

/**
 * Form values for the Add Product screen.
 *
 * Money fields (`bundleCost`, `costPerPiece`, `price`) are kept as
 * decimal strings (the user's typed value) for display math —
 * see AGENTS.md: integer-pesos invariant. We parse them to
 * integer pesos exactly once, inside `submit`, via `parsePesosInput`.
 *
 * `barcode` was added in the v5 rebuild. It is the printed machine-
 * readable identifier on the product packaging, distinct from `sku`
 * which is the store's internal identifier. The two can diverge (e.g.
 * `sku = COKE-1.5L`, `barcode = 4800016112345`) or be identical.
 */
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

/**
 * Markup presets shown on the Pricing & Profit card.
 *
 * Tapping one writes `costPerPiece * (1 + markup)` to the selling
 * price field, formatted to two decimal places. The DB parses it
 * via `parsePesosInput` on submit, so no float round-trips through
 * the money pipeline.
 */
export const MARKUP_PRESETS = [0.1, 0.2, 0.3, 0.5] as const;
export type MarkupPreset = (typeof MARKUP_PRESETS)[number];

/**
 * Stock quick-increment chips shown below the initial-stock input.
 *
 * Each tap parses the current input as an integer, adds the chip
 * amount, and writes the result back — so `10 → +5 → 15`. Empty /
 * invalid input starts from `0`.
 */
export const STOCK_PRESETS = [5, 10, 20] as const;
export type StockPreset = (typeof STOCK_PRESETS)[number];

const safeTrim = (s?: string) => (s ?? '').trim();

/**
 * `useAddProductForm()` — owns the Add Product screen's form state.
 *
 * Encapsulates react-hook-form setup, the SKU auto-generation
 * toggle, the bundle/single cost toggle, the markup-preset and
 * stock-quick-bump helpers, the live profit/markup preview math,
 * the unsaved-changes guard, the scanner integration, the
 * inline duplicate-barcode guard, and the submit pipeline.
 *
 * The screen and its components stay presentational; this hook is
 * the single place where business logic lives.
 */
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

  // A scan that arrives while `getAllProductsQuery` is still on its
  // first fetch gets `store_products_unavailable` from the resolver
  // (it refuses to trust an empty/incomplete product list for the
  // duplicate-barcode check). Previously that result was dropped on
  // the floor, the scan just silently did nothing. We now stash the
  // barcode here and replay it automatically the moment the query
  // settles, so the user never has to notice or re-scan.
  const pendingScanRef = useRef<string | null>(null);

  // Forwarded to the price TextInput so we can focus it ~250ms after
  // a successful scan (giving the scanner modal close animation time
  // to finish before the keyboard pops up).
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

  // ─── Derived display values ────────────────────────────────────

  // `isDirty` only flips after a field is touched. Combined with
  // non-empty values this suppresses the unsaved-changes guard for
  // a freshly opened form.
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

  // Live profit preview values — `0` means "empty / invalid input"
  // and the profit card hides itself in that case.
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

  // Required-field guard for the submit button.
  const isSubmitDisabled =
    insertProductMutation.isPending ||
    !safeTrim(productName) ||
    !safeTrim(sku) ||
    !price ||
    parsedPrice <= 0 ||
    isBarcodeDuplicate;

  // ─── Auto-calculate cost-per-piece when bundle values change ──

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

  // ─── SKU auto-generation ───────────────────────────────────────

  const generateSku = useCallback((name: string, currentSku: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    const prefix = parts
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');

    // Check if the current SKU prefix is already correct for the product name
    // and ends with a 4-digit timestamp. If so, return the current SKU to
    // prevent infinite updates from Date.now() recalculation.
    const skuParts = currentSku.split('-');
    const skuPrefix = skuParts.slice(0, skuParts.length - 1).join('-');
    const skuSuffix = skuParts[skuParts.length - 1];
    const isExistingValid = skuPrefix === prefix && /^\d{4}$/.test(skuSuffix);

    if (isExistingValid) return currentSku;

    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${timestamp}`;
  }, []);

  // When auto-generate is on, keep the SKU in sync with the name.
  // `useEffect` (not an inline `onChangeText` handler) so external
  // changes to the name still trigger a refresh.
  useEffect(() => {
    if (!autoGenerateSku) return;
    const generated = generateSku(productName ?? '', sku ?? '');
    // Only write if it actually changed — avoids extra re-renders on
    // unrelated form state changes.
    if (generated !== sku) {
      setValue('sku', generated, { shouldDirty: false });
    }
  }, [productName, autoGenerateSku, generateSku, setValue, sku]);

  // ─── Markup-preset handler ─────────────────────────────────────

  const applyMarkupPreset = useCallback(
    (markup: MarkupPreset) => {
      if (parsedCost <= 0) return;
      const calculated = parsedCost * (1 + markup);
      setValue('price', calculated.toFixed(2), { shouldDirty: true });
    },
    [parsedCost, setValue],
  );

  // ─── Stock quick-bump helpers ──────────────────────────────────

  const bumpStock = useCallback(
    (delta: number) => {
      const current = parseInt(initialStock ?? '0', 10);
      const base = Number.isFinite(current) ? current : 0;
      const next = Math.max(0, base + delta);
      setValue('initialStock', String(next), { shouldDirty: true });
    },
    [initialStock, setValue],
  );

  // ─── Category selection ────────────────────────────────────────

  const selectCategory = useCallback(
    (name: string) => {
      // Toggle off if the same pill is tapped again — matches the
      // behavior of the existing screen.
      setValue('category', category === name ? '' : name, {
        shouldDirty: true,
      });
    },
    [category, setValue],
  );

  // ─── Unsaved-changes guard ─────────────────────────────────────

  const confirmDiscard = useCallback(() => {
    if (!hasActualChanges) {
      router.back();
      return;
    }
    setShowDialog(true);
  }, [hasActualChanges]);

  // Wire the Android hardware-back button to the same guard.
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

  // ─── Barcode scanner ───────────────────────────────────────────

  const openScanner = useCallback(() => setIsScannerOpen(true), []);
  const closeScanner = useCallback(() => setIsScannerOpen(false), []);

  const handleScannedBarcode = useCallback(
    async (barcodeValue: string) => {
      if (__DEV__) {
        console.log('[Barcode][AddProduct] scanned:', barcodeValue);
      }
      const result = await resolve(barcodeValue);
      if (__DEV__) {
        console.log(
          '[Barcode][AddProduct] resolution kind:',
          result.kind,
          result,
        );
      }

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

        // Focus the price field after the modal close animation settles.
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
          if (__DEV__) {
            console.log(
              '[Barcode][AddProduct] products query not ready yet, queuing',
              barcodeValue,
              'for replay once it settles',
            );
          }
          pendingScanRef.current = barcodeValue;
        } else {
          if (__DEV__) {
            console.log(
              '[Barcode][AddProduct] scan swallowed, kind:',
              result.kind,
            );
          }
        }
        return;
      }
    },
    [resolve, addToast, autoGenerateSku, setValue],
  );

  // Replays a scan that arrived before `getAllProductsQuery` had
  // settled. See the comment on `pendingScanRef` above.
  useEffect(() => {
    if (!getAllProductsQuery.isSuccess || getAllProductsQuery.isFetching)
      return;
    const queued = pendingScanRef.current;
    if (!queued) return;
    pendingScanRef.current = null;
    if (__DEV__) {
      console.log(
        '[Barcode][AddProduct] products query ready, replaying queued scan',
        queued,
      );
    }
    void handleScannedBarcode(queued);
  }, [
    getAllProductsQuery.isSuccess,
    getAllProductsQuery.isFetching,
    handleScannedBarcode,
  ]);

  // ─── Prefill from route param (inventory-tab scan-to-add) ──────
  //
  // When the inventory tab's new barcode button is used, it pushes
  // this route with `?prefillBarcode=<value>` rather than opening the
  // in-form scanner. We consume the param here and run the same
  // handler so behavior is identical regardless of entry point.
  //
  // The `prefillAppliedRef` guard is required for two reasons:
  //   1. React 19 StrictMode double-mounts effects in dev. Without
  //      the guard we'd call `handleScannedBarcode` twice and the
  //      second call would race with the auto-gen-off + productName
  //      write sequence.
  //   2. After applying the prefill we clear the param with
  //      `router.setParams`. A re-entry (e.g. back-nav then forward
  //      again) would otherwise re-trigger the effect.
  const params = useLocalSearchParams<{ prefillBarcode?: string }>();
  const prefillAppliedRef = useRef(false);

  useEffect(() => {
    const prefill = params.prefillBarcode;
    if (!prefill || prefillAppliedRef.current) return;
    prefillAppliedRef.current = true;
    void handleScannedBarcode(prefill);
    // Clear the param without firing a navigation event so the URL
    // is consistent on a hard reload of this route. `router` from
    // expo-router is a stable module-scope handle and doesn't need
    // to be listed as a dep.
    router.setParams({ prefillBarcode: undefined });
  }, [params.prefillBarcode, handleScannedBarcode]);

  // ─── Submit ────────────────────────────────────────────────────

  const submit = handleSubmit((data) => {
    const priceValue = parsePesosInput(data.price);
    const stockValue = data.initialStock ? parseInt(data.initialStock, 10) : 0;
    const costPriceValue = data.costPerPiece
      ? parsePesosInput(data.costPerPiece)
      : undefined;
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
        barcode: trimmedBarcode || null,
        price: priceValue,
        quantity: Number.isFinite(stockValue) ? stockValue : 0,
        cost_price: costPriceValue,
        category: safeTrim(data.category) || undefined,
        supplier_id: data.supplierId ? data.supplierId : null,
        image_uri: data.imageUri ? safeTrim(data.imageUri) : null,
        retail_unit_name: retailUnitName,
        wholesale_unit_name: wholesaleUnitName,
        wholesale_price: wholesalePriceVal,
        wholesale_cost_price: wholesaleCostVal,
        conversion_factor:
          conversionFactorNum &&
          Number.isFinite(conversionFactorNum) &&
          conversionFactorNum >= 2
            ? conversionFactorNum
            : null,
        wholesale_barcode: wholesaleBarcodeVal,
      },
      {
        onSuccess: () => {
          router.push('/(tabs)');
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
