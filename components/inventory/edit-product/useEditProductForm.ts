import { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { useCategories, useGetProduct, useProducts } from '@/hooks';
import { parsePesosInput, tryParsePesosInput } from '@/lib/money';

/**
 * Form values for the Edit Product screen.
 *
 * Money fields (`costPerPiece`, `price`) are kept as decimal strings
 * (the user's typed value) for display math — see AGENTS.md:
 * integer-pesos invariant. We parse them to integer pesos exactly
 * once, inside `submit`, via `parsePesosInput`.
 */
export interface EditProductFormData {
  name: string;
  sku: string;
  costPerPiece: string;
  price: string;
  category: string;
  supplier_id: string;
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
 * Shared form logic + state for the Edit Product screen.
 *
 * Owns react-hook-form setup, initial hydration from `useGetProduct`,
 * category list subscription, discard/delete modal visibility, and the
 * `submit` + `confirmDelete` mutations.
 *
 * The layout component consumes the returned bundle to bind inputs
 * and render modals without any state inside JSX.
 */
export function useEditProductForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id, 10);

  const { updateProductMutation, deleteProductMutation } = useProducts();
  const { getAllCategoriesQuery } = useCategories();
  const { data: categories = [] } = getAllCategoriesQuery;

  const { data: product, isLoading } = useGetProduct(productId);

  // Local UI state — discard + delete modal visibility.
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // react-hook-form. Defaults are seeded from the product row via the
  // `values` option so the form hydrates once the query resolves —
  // matches the original screen's behavior.
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isDirty },
  } = useForm<EditProductFormData>({
    defaultValues: {
      name: '',
      sku: '',
      costPerPiece: '',
      price: '',
      category: '',
      supplier_id: '',
      imageUri: '',
      enableWholesale: false,
      retailUnitName: 'Pc',
      wholesaleUnitName: 'Case',
      conversionFactor: '12',
      wholesalePrice: '',
      wholesaleCostPrice: '',
      wholesaleBarcode: '',
    },
    values: product
      ? {
          name: product.name,
          sku: product.sku,
          costPerPiece: product.cost_price ? product.cost_price.toString() : '',
          price: product.price.toString(),
          category: product.category || '',
          supplier_id: product.supplier_id || '',
          imageUri: product.image_uri || '',
          enableWholesale: !!(product.wholesale_unit_name && product.conversion_factor && product.conversion_factor > 1),
          retailUnitName: product.retail_unit_name || 'Pc',
          wholesaleUnitName: product.wholesale_unit_name || 'Case',
          conversionFactor: product.conversion_factor ? product.conversion_factor.toString() : '12',
          wholesalePrice: product.wholesale_price ? product.wholesale_price.toString() : '',
          wholesaleCostPrice: product.wholesale_cost_price ? product.wholesale_cost_price.toString() : '',
          wholesaleBarcode: product.wholesale_barcode || '',
        }
      : undefined,
  });

  const name = useWatch({ control, name: 'name' });
  const costPerPiece = useWatch({ control, name: 'costPerPiece' });
  const price = useWatch({ control, name: 'price' });
  const category = useWatch({ control, name: 'category' });
  const supplierId = useWatch({ control, name: 'supplier_id' });
  const imageUri = useWatch({ control, name: 'imageUri' });
  const enableWholesale = useWatch({ control, name: 'enableWholesale' });
  const retailUnitName = useWatch({ control, name: 'retailUnitName' });
  const wholesaleUnitName = useWatch({ control, name: 'wholesaleUnitName' });
  const conversionFactor = useWatch({ control, name: 'conversionFactor' });
  const wholesalePrice = useWatch({ control, name: 'wholesalePrice' });
  const wholesaleCostPrice = useWatch({ control, name: 'wholesaleCostPrice' });
  const wholesaleBarcode = useWatch({ control, name: 'wholesaleBarcode' });

  // ─── Derived values ────────────────────────────────────────────

  // Compare the live form values to the original product row. Mirrors
  // the screen's existing comparison: only fields the user can actually
  // edit count as "dirty", so SKU/server-managed timestamps don't trip
  // the guard.
  const hasUnsavedChanges =
    !!product &&
    isDirty &&
    (name !== product.name ||
      costPerPiece !==
        (product.cost_price ? product.cost_price.toString() : '') ||
      price !== product.price.toString() ||
      category !== (product.category || '') ||
      supplierId !== (product.supplier_id || '') ||
      imageUri !== (product.image_uri || '') ||
      enableWholesale !==
        !!(
          product.wholesale_unit_name &&
          product.conversion_factor &&
          product.conversion_factor > 1
        ) ||
      retailUnitName !== (product.retail_unit_name || 'Pc') ||
      wholesaleUnitName !== (product.wholesale_unit_name || 'Case') ||
      conversionFactor !==
        (product.conversion_factor
          ? product.conversion_factor.toString()
          : '12') ||
      wholesalePrice !==
        (product.wholesale_price
          ? product.wholesale_price.toString()
          : '') ||
      wholesaleCostPrice !==
        (product.wholesale_cost_price
          ? product.wholesale_cost_price.toString()
          : '') ||
      wholesaleBarcode !== (product.wholesale_barcode || ''));

  // Live profit preview values — `0` means "empty / invalid input"
  // and the pricing card hides the preview in that case.
  const parsedCost = costPerPiece ? tryParsePesosInput(costPerPiece) : 0;
  const parsedPrice = price ? tryParsePesosInput(price) : 0;
  const profitPerPiece = parsedPrice - parsedCost;
  const markupPercent =
    parsedCost > 0 && parsedPrice > 0
      ? ((parsedPrice - parsedCost) / parsedCost) * 100
      : 0;
  const isLossWarning =
    parsedCost > 0 && parsedPrice > 0 && parsedPrice <= parsedCost;

  // Required-field + pending guard for the Save button.
  const isSubmitDisabled = updateProductMutation.isPending;

  // ─── Category selection ────────────────────────────────────────

  const selectCategory = useCallback(
    (next: string) => {
      // Toggle off if the same pill is tapped again — matches the
      // behavior of the original screen and the add-product card.
      setValue('category', category === next ? '' : next, {
        shouldDirty: true,
      });
    },
    [category, setValue],
  );

  // ─── Unsaved-changes guard ─────────────────────────────────────

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      router.back();
    }
  }, [hasUnsavedChanges]);

  const confirmDiscard = useCallback(() => {
    setShowDiscardModal(false);
    router.back();
  }, []);

  const cancelDiscard = useCallback(() => {
    setShowDiscardModal(false);
  }, []);

  // Wire the Android hardware-back button to the same guard as the
  // header back arrow. Mirrors `useAddProductForm`'s focus effect.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasUnsavedChanges) {
          setShowDiscardModal(true);
          return true;
        }
        return false;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => backHandler.remove();
    }, [hasUnsavedChanges]),
  );

  // ─── Submit ────────────────────────────────────────────────────

  const submit = handleSubmit((data) => {
    if (!data.name.trim()) {
      throw new Error('Product name is required');
    }
    if (!data.sku.trim()) {
      throw new Error('SKU is required');
    }
    if (!data.price || tryParsePesosInput(data.price) <= 0) {
      throw new Error('Valid price is required');
    }

    const priceValue = parsePesosInput(data.price);
    const costPriceValue = data.costPerPiece
      ? parsePesosInput(data.costPerPiece)
      : undefined;

    // Validate that cost price is less than selling price.
    if (costPriceValue !== undefined && costPriceValue >= priceValue) {
      throw new Error('Cost price must be less than selling price');
    }

    const enableWholesaleVal = data.enableWholesale;
    const retailUnitNameVal = data.retailUnitName.trim() || 'Pc';
    const wholesaleUnitNameVal = enableWholesaleVal ? (data.wholesaleUnitName.trim() || null) : null;
    const conversionFactorNum = enableWholesaleVal && data.conversionFactor ? parseInt(data.conversionFactor, 10) : null;
    const wholesalePriceVal = enableWholesaleVal && data.wholesalePrice ? parsePesosInput(data.wholesalePrice) : null;
    const wholesaleCostVal = enableWholesaleVal && data.wholesaleCostPrice ? parsePesosInput(data.wholesaleCostPrice) : null;
    const wholesaleBarcodeVal = enableWholesaleVal && data.wholesaleBarcode ? data.wholesaleBarcode.trim() || null : null;

    updateProductMutation.mutate({
      id: productId,
      name: data.name.trim(),
      sku: data.sku.trim(),
      price: priceValue,
      quantity: product?.quantity || 0,
      cost_price: costPriceValue,
      category: data.category || undefined,
      // Preserve the existing barcode — the edit form has no barcode field,
      // so omitting it would cause normalizeBarcode(undefined) → null and
      // silently wipe whatever barcode was already stored.
      barcode: product?.barcode ?? null,
      supplier_id: data.supplier_id ? data.supplier_id : null,
      image_uri: data.imageUri ? data.imageUri.trim() : null,
      retail_unit_name: retailUnitNameVal,
      wholesale_unit_name: wholesaleUnitNameVal,
      wholesale_price: wholesalePriceVal,
      wholesale_cost_price: wholesaleCostVal,
      conversion_factor: conversionFactorNum && Number.isFinite(conversionFactorNum) && conversionFactorNum >= 2 ? conversionFactorNum : null,
      wholesale_barcode: wholesaleBarcodeVal,
    });
  });

  // ─── Delete ────────────────────────────────────────────────────

  const openDeleteModal = useCallback(() => setShowDeleteModal(true), []);
  const cancelDelete = useCallback(() => setShowDeleteModal(false), []);

  const confirmDelete = useCallback(async () => {
    setShowDeleteModal(false);
    await deleteProductMutation.mutateAsync(productId);
    router.replace('/inventory');
  }, [deleteProductMutation, productId]);

  return {
    // Domain data
    product,
    isLoading,
    categories,

    // Form wiring
    control,
    setValue,

    // Watched values
    name,
    costPerPiece,
    price,
    category,
    supplierId,
    enableWholesale,
    retailUnitName,
    wholesaleUnitName,
    conversionFactor,
    wholesalePrice,
    wholesaleCostPrice,
    wholesaleBarcode,

    // Local UI state
    showDiscardModal,
    cancelDiscard,
    confirmDiscard,
    showDeleteModal,
    openDeleteModal,
    cancelDelete,
    confirmDelete,

    // Derived
    hasUnsavedChanges,
    isSubmitDisabled,
    profitPerPiece,
    markupPercent,
    isLossWarning,

    // Handlers
    handleBack,
    selectCategory,
    submit,

    // Mutation state
    updateProductMutation,
    deleteProductMutation,
  };
}
