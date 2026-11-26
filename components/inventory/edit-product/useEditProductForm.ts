import { useCallback, useMemo, useRef, useState } from 'react';
import { type NavigationAction, useNavigation, usePreventRemove } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { useGetProduct, useProducts } from '@/hooks';
import { parsePesosInput, tryParsePesosInput } from '@/lib';
import { validateBarcode } from '@/lib/barcodes/format';
import { useToastStore } from '@/stores';
import type { Product, UpdateProductParams } from '@/types/products.types';
import {
  PRODUCT_FORM_DEFAULTS,
  type ProductFormData,
  findBarcodeConflict,
  safeTrim,
} from '../products/form';
import type { ScanTarget } from '../products/add-product';

const toFormValues = (p: Product): ProductFormData => ({
  ...PRODUCT_FORM_DEFAULTS,
  productName: p.name,
  sku: p.sku,
  barcode: p.barcode ?? '',
  category: p.category ?? '',
  supplierId: p.supplier_id ?? '',
  imageUri: p.image_uri ?? '',
  costPerPiece: p.cost_price ? String(p.cost_price) : '',
  price: String(p.price),
  initialStock: String(p.quantity),
  enableWholesale: !!(p.wholesale_unit_name && (p.conversion_factor ?? 0) > 1),
  retailUnitName: p.retail_unit_name || 'Pc',
  wholesaleUnitName: p.wholesale_unit_name || 'Case',
  conversionFactor: p.conversion_factor ? String(p.conversion_factor) : '12',
  wholesalePrice: p.wholesale_price ? String(p.wholesale_price) : '',
  wholesaleCostPrice: p.wholesale_cost_price ? String(p.wholesale_cost_price) : '',
  wholesaleBarcode: p.wholesale_barcode ?? '',
});

export function useEditProductForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id ?? '0', 10);

  const { updateProductMutation, deleteProductMutation, getAllProductsQuery } = useProducts();
  const { data: product, isLoading } = useGetProduct(productId);
  const addToast = useToastStore((state) => state.addToast);

  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stockSheet, setStockSheet] = useState<'restock' | 'adjust' | null>(null);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);

  const values = useMemo(() => (product ? toFormValues(product) : PRODUCT_FORM_DEFAULTS), [product]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isDirty },
  } = useForm<ProductFormData>({
    defaultValues: values,
    values,
    // A restock refetches the product; keep whatever the user already typed.
    resetOptions: { keepDirtyValues: true, keepDirty: true },
  });

  const [name, price, barcode] = useWatch({ control, name: ['productName', 'price', 'barcode'] });

  const barcodeConflictProduct = useMemo(
    () => findBarcodeConflict(getAllProductsQuery.data ?? [], barcode, productId),
    [getAllProductsQuery.data, barcode, productId],
  );

  const blocker = !isDirty
    ? 'No changes yet'
    : !safeTrim(name)
      ? 'Add a product name to save'
      : !(tryParsePesosInput(price) > 0)
        ? 'Add a selling price to save'
        : barcodeConflictProduct
          ? 'That barcode belongs to another product'
          : null;

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
    setShowDiscardModal(true);
  });

  const leaveAfterSave = () => {
    saved.current = true;
    router.back();
  };

  // Scans only fill barcode fields; duplicates surface through the conflict card.
  const handleScannedBarcode = useCallback(
    (value: string) => {
      const check = validateBarcode(value);
      if (check.ok && scanTarget) setValue(scanTarget, check.barcode, { shouldDirty: true });
      else addToast({ message: 'Barcodes are 8 to 14 digits.', variant: 'warning' });
      setScanTarget(null);
    },
    [scanTarget, setValue, addToast],
  );

  const submit = handleSubmit(async (data) => {
    if (!product) return;
    const wholesale = data.enableWholesale;
    const factor = parseInt(data.conversionFactor, 10);
    const payload: UpdateProductParams = {
      id: productId,
      name: safeTrim(data.productName),
      sku: product.sku,
      price: parsePesosInput(data.price),
      // Stock only moves through restock/adjust, so always send the latest saved count.
      quantity: product.quantity,
      barcode: safeTrim(data.barcode) || null,
      supplier_id: safeTrim(data.supplierId) || null,
      image_uri: safeTrim(data.imageUri) || null,
      retail_unit_name: safeTrim(data.retailUnitName) || 'Pc',
      wholesale_unit_name: wholesale ? safeTrim(data.wholesaleUnitName) || null : null,
      wholesale_price: wholesale && data.wholesalePrice ? parsePesosInput(data.wholesalePrice) : null,
      wholesale_cost_price:
        wholesale && data.wholesaleCostPrice ? parsePesosInput(data.wholesaleCostPrice) : null,
      conversion_factor: wholesale && Number.isFinite(factor) && factor >= 2 ? factor : null,
      wholesale_barcode: wholesale ? safeTrim(data.wholesaleBarcode) || null : null,
    };
    if (data.costPerPiece) payload.cost_price = parsePesosInput(data.costPerPiece);
    if (safeTrim(data.category)) payload.category = safeTrim(data.category);

    try {
      await updateProductMutation.mutateAsync(payload);
      leaveAfterSave();
    } catch {
      // Surfaced by mutation state.
    }
  });

  return {
    product,
    isLoading,
    control,
    setValue,
    blocker,
    barcodeConflictProduct,
    submit,
    updateProductMutation,
    deleteProductMutation,
    handleBack: router.back,
    showDiscardModal,
    cancelDiscard: () => setShowDiscardModal(false),
    confirmDiscard: () => {
      setShowDiscardModal(false);
      if (pendingLeave.current) navigation.dispatch(pendingLeave.current);
    },
    showDeleteModal,
    openDeleteModal: () => setShowDeleteModal(true),
    cancelDelete: () => setShowDeleteModal(false),
    confirmDelete: async () => {
      setShowDeleteModal(false);
      await deleteProductMutation.mutateAsync(productId);
      leaveAfterSave();
    },
    stockSheet,
    setStockSheet,
    isScannerOpen: scanTarget !== null,
    openScanner: setScanTarget,
    closeScanner: () => setScanTarget(null),
    handleScannedBarcode,
  };
}
