import { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useCategories, useProducts } from '@/hooks';
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
}

/**
 * `useEditProductForm()` — owns the Edit Product screen's form state.
 *
 * Encapsulates react-hook-form setup (seeded from the product row),
 * the live profit/markup preview math, the unsaved-changes guard
 * wired to the Android hardware-back button, the submit pipeline
 * that posts to `useUpdateProduct`, and the delete-product flow.
 *
 * The screen and its components stay presentational; this hook is
 * the single place where business logic lives — mirroring the
 * `useAddProductForm` and `useAddSalesForm` conventions.
 */
export function useEditProductForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id, 10);

  const { useGetProduct, updateProductMutation, deleteProductMutation } =
    useProducts();
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
    watch,
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
        }
      : undefined,
  });

  const name = watch('name');
  const costPerPiece = watch('costPerPiece');
  const price = watch('price');
  const category = watch('category');
  const supplierId = watch('supplier_id');
  const imageUri = watch('imageUri');

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
      imageUri !== (product.image_uri || ''));

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

    updateProductMutation.mutate({
      id: productId,
      name: data.name.trim(),
      sku: data.sku.trim(),
      price: priceValue,
      quantity: product?.quantity || 0,
      cost_price: costPriceValue,
      category: data.category || undefined,
      supplier_id: data.supplier_id ? data.supplier_id : null,
      image_uri: data.imageUri ? data.imageUri.trim() : null,
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