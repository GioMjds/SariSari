import { useCallback, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { useBarcodeResolver, useCategories, useGetProduct, useProducts } from '@/hooks';
import { parsePesosInput, tryParsePesosInput } from '@/lib';
import { MarkupPreset } from '../products/form/ProductPricingCard';

export interface EditProductFormData {
  name: string;
  sku: string;
  barcode: string;
  costPerPiece: string;
  price: string;
  initialStock: string;
  category: string;
  supplier_id: string;
  imageUri: string;
  bundleCost: string;
  piecesPerBundle: string;
  enableWholesale: boolean;
  retailUnitName: string;
  wholesaleUnitName: string;
  conversionFactor: string;
  wholesalePrice: string;
  wholesaleCostPrice: string;
  wholesaleBarcode: string;
}

const safeTrim = (s?: string) => (s ?? '').trim();

export function useEditProductForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id, 10);

  const { updateProductMutation, deleteProductMutation, getAllProductsQuery } = useProducts();
  const { getAllCategoriesQuery } = useCategories();
  const { data: categories = [] } = getAllCategoriesQuery;
  const { data: product, isLoading } = useGetProduct(productId);
  const { resolve } = useBarcodeResolver();

  const [useBundlePricing, setUseBundlePricing] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isDirty },
  } = useForm<EditProductFormData>({
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      costPerPiece: '',
      price: '',
      initialStock: '',
      category: '',
      supplier_id: '',
      imageUri: '',
      bundleCost: '',
      piecesPerBundle: '',
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
          barcode: product.barcode || '',
          costPerPiece: product.cost_price ? product.cost_price.toString() : '',
          price: product.price.toString(),
          initialStock: product.quantity.toString(),
          category: product.category || '',
          supplier_id: product.supplier_id || '',
          imageUri: product.image_uri || '',
          bundleCost: '',
          piecesPerBundle: '',
          enableWholesale: !!(
            product.wholesale_unit_name &&
            product.conversion_factor &&
            product.conversion_factor > 1
          ),
          retailUnitName: product.retail_unit_name || 'Pc',
          wholesaleUnitName: product.wholesale_unit_name || 'Case',
          conversionFactor: product.conversion_factor
            ? product.conversion_factor.toString()
            : '12',
          wholesalePrice: product.wholesale_price
            ? product.wholesale_price.toString()
            : '',
          wholesaleCostPrice: product.wholesale_cost_price
            ? product.wholesale_cost_price.toString()
            : '',
          wholesaleBarcode: product.wholesale_barcode || '',
        }
      : undefined,
  });

  const name = useWatch({ control, name: 'name' });
  const sku = useWatch({ control, name: 'sku' });
  const barcode = useWatch({ control, name: 'barcode' });
  const costPerPiece = useWatch({ control, name: 'costPerPiece' });
  const price = useWatch({ control, name: 'price' });
  const initialStock = useWatch({ control, name: 'initialStock' });
  const category = useWatch({ control, name: 'category' });
  const supplierId = useWatch({ control, name: 'supplier_id' });
  const enableWholesale = useWatch({ control, name: 'enableWholesale' });
  const retailUnitName = useWatch({ control, name: 'retailUnitName' });
  const wholesaleUnitName = useWatch({ control, name: 'wholesaleUnitName' });
  const conversionFactor = useWatch({ control, name: 'conversionFactor' });
  const wholesalePrice = useWatch({ control, name: 'wholesalePrice' });
  const wholesaleCostPrice = useWatch({ control, name: 'wholesaleCostPrice' });
  const wholesaleBarcode = useWatch({ control, name: 'wholesaleBarcode' });

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
          p.id !== productId &&
          ((p.barcode != null && p.barcode === trimmedBarcode) ||
            (p.wholesale_barcode != null && p.wholesale_barcode === trimmedBarcode) ||
            p.sku === trimmedBarcode),
      ) ?? null
    );
  }, [trimmedBarcode, existingProducts, productId]);

  const isBarcodeDuplicate = barcodeConflictProduct != null;

  const parsedCost = costPerPiece ? tryParsePesosInput(costPerPiece) : 0;
  const parsedPrice = price ? tryParsePesosInput(price) : 0;
  const profitPerPiece = parsedPrice - parsedCost;
  const markupPercent =
    parsedCost > 0 && parsedPrice > 0
      ? ((parsedPrice - parsedCost) / parsedCost) * 100
      : 0;
  const isLossWarning =
    parsedCost > 0 && parsedPrice > 0 && parsedPrice <= parsedCost;

  const isSubmitDisabled =
    updateProductMutation.isPending ||
    !safeTrim(name) ||
    !price ||
    parsedPrice <= 0 ||
    isBarcodeDuplicate;

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
    (next: string) => {
      const current = categoryRef.current;
      const nextCategory = current === next ? '' : next;
      setValue('category', nextCategory, { shouldDirty: true });
    },
    [setValue],
  );

  const openScanner = useCallback(() => setIsScannerOpen(true), []);
  const closeScanner = useCallback(() => setIsScannerOpen(false), []);

  const handleScannedBarcode = useCallback(
    async (barcodeValue: string) => {
      setValue('barcode', safeTrim(barcodeValue), { shouldDirty: true });
      setIsScannerOpen(false);
    },
    [setValue],
  );

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      router.back();
    }
  }, [isDirty]);

  const confirmDiscard = useCallback(() => {
    setShowDiscardModal(false);
    router.back();
  }, []);

  const submit = handleSubmit(async (data) => {
    const priceValue = parsePesosInput(data.price);
    const stockValue = data.initialStock ? parseInt(data.initialStock, 10) : product?.quantity || 0;
    const costPriceValue = data.costPerPiece ? parsePesosInput(data.costPerPiece) : undefined;
    const barcodeVal = safeTrim(data.barcode);

    try {
      await updateProductMutation.mutateAsync({
        id: productId,
        name: safeTrim(data.name),
        sku: safeTrim(data.sku),
        price: priceValue,
        quantity: Number.isFinite(stockValue) ? stockValue : product?.quantity || 0,
        cost_price: costPriceValue,
        category: safeTrim(data.category) || undefined,
        barcode: barcodeVal || null,
        supplier_id: data.supplier_id ? data.supplier_id : null,
        image_uri: data.imageUri ? safeTrim(data.imageUri) : null,
        retail_unit_name: safeTrim(data.retailUnitName) || 'Pc',
        wholesale_unit_name: data.enableWholesale ? safeTrim(data.wholesaleUnitName) || null : null,
        wholesale_price: data.enableWholesale && data.wholesalePrice ? parsePesosInput(data.wholesalePrice) : null,
        wholesale_cost_price: data.enableWholesale && data.wholesaleCostPrice ? parsePesosInput(data.wholesaleCostPrice) : null,
        conversion_factor: data.enableWholesale && data.conversionFactor ? parseInt(data.conversionFactor, 10) : null,
        wholesale_barcode: data.enableWholesale && safeTrim(data.wholesaleBarcode) ? safeTrim(data.wholesaleBarcode) : null,
      });
      router.back();
    } catch {
      // Surfaced by mutation state
    }
  });

  return {
    product,
    isLoading,
    categories,
    control,
    setValue,
    name,
    sku,
    barcode,
    costPerPiece,
    price,
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
    useBundlePricing,
    setUseBundlePricing,
    showDiscardModal,
    setShowDiscardModal,
    showDeleteModal,
    openDeleteModal: () => setShowDeleteModal(true),
    cancelDelete: () => setShowDeleteModal(false),
    confirmDelete: async () => {
      setShowDeleteModal(false);
      await deleteProductMutation.mutateAsync(productId);
      router.replace('/inventory');
    },
    isScannerOpen,
    openScanner,
    closeScanner,
    handleScannedBarcode,
    profitPerPiece,
    markupPercent,
    isLossWarning,
    isBarcodeDuplicate,
    barcodeConflictProduct,
    isSubmitDisabled,
    applyMarkupPreset,
    bumpStock,
    selectCategory,
    handleBack,
    confirmDiscard,
    submit,
    updateProductMutation,
    deleteProductMutation,
  };
}
