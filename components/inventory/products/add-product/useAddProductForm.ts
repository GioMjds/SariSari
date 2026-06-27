import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useCategories, useProducts } from '@/hooks';
import { lookupOfflineBarcode } from '@/constants/barcodes';
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
 */
export interface AddProductFormData {
  productName: string;
  sku: string;
  category: string;
  bundleCost: string;
  piecesPerBundle: string;
  costPerPiece: string;
  price: string;
  initialStock: string;
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
 * the unsaved-changes guard, and the submit pipeline.
 *
 * The screen and its components stay presentational; this hook is
 * the single place where business logic lives.
 */
export function useAddProductForm() {
  const { insertProductMutation } = useProducts();
  const { getAllCategoriesQuery } = useCategories();
  const { data: categories = [] } = getAllCategoriesQuery;
  const addToast = useToastStore((state) => state.addToast);

  const [autoGenerateSku, setAutoGenerateSku] = useState<boolean>(true);
  const [useBundlePricing, setUseBundlePricing] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Forwarded to the price TextInput so we can focus it ~250ms after
  // a successful scan (giving the scanner modal close animation time
  // to finish before the keyboard pops up).
  const priceInputRef = useRef<TextInput | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<AddProductFormData>({
    defaultValues: {
      productName: '',
      sku: '',
      category: '',
      bundleCost: '',
      piecesPerBundle: '',
      costPerPiece: '',
      price: '',
      initialStock: '',
    },
  });

  const productName = watch('productName');
  const sku = watch('sku');
  const price = watch('price');
  const costPerPiece = watch('costPerPiece');
  const bundleCost = watch('bundleCost');
  const piecesPerBundle = watch('piecesPerBundle');
  const initialStock = watch('initialStock');
  const category = watch('category');

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
      safeTrim(sku) !== '');

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

  // Required-field guard for the submit button.
  const isSubmitDisabled =
    insertProductMutation.isPending ||
    !safeTrim(productName) ||
    !safeTrim(sku) ||
    !price ||
    parsedPrice <= 0;

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

    if (isExistingValid) {
      return currentSku;
    }

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
    (barcode: string) => {
      // Pure helper decides what to write. Rule order matters: when
      // auto-generate-SKU is on, we MUST flip it off BEFORE writing
      // productName, otherwise the auto-gen useEffect below re-runs
      // and clobbers our scanned SKU.
      const patch = applyBarcodeToAddProductForm({
        barcode,
        currentProductName: productName ?? '',
        autoGenerateSku,
        lookup: lookupOfflineBarcode,
      });

      if (patch.setAutoGenerateSku) {
        setAutoGenerateSku(false);
      }

      setValue('sku', patch.sku, { shouldDirty: true });

      if (patch.productName !== undefined) {
        setValue('productName', patch.productName, { shouldDirty: true });
      }
      if (patch.category !== undefined) {
        setValue('category', patch.category, { shouldDirty: true });
      }

      if (patch.toast) {
        addToast(patch.toast);
      }

      setIsScannerOpen(false);

      // Focus the price field after the modal close animation settles.
      // 250ms gives KeyboardAwareScrollView time to compute the new
      // layout (it was rendered with the camera surface mounted).
      if (typeof patch.productName === 'string') {
        setTimeout(() => {
          priceInputRef.current?.focus();
        }, 250);
      }
    },
    [addToast, autoGenerateSku, productName, setValue],
  );

  // ─── Submit ────────────────────────────────────────────────────

  const submit = handleSubmit((data) => {
    const priceValue = parsePesosInput(data.price);
    const stockValue = data.initialStock ? parseInt(data.initialStock, 10) : 0;
    const costPriceValue = data.costPerPiece
      ? parsePesosInput(data.costPerPiece)
      : undefined;

    insertProductMutation.mutate(
      {
        name: safeTrim(data.productName),
        sku: safeTrim(data.sku),
        price: priceValue,
        quantity: Number.isFinite(stockValue) ? stockValue : 0,
        cost_price: costPriceValue,
        category: safeTrim(data.category) || undefined,
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
    price,
    costPerPiece,
    initialStock,
    category,

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
