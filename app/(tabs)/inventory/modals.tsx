import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddCategoryModal, AddSupplierModal, RestockSheet } from '@/components/inventory/modals/';
import { LogTransactionForm } from '@/components/inventory/ledger';
import { BarcodeScannerModal } from '@/components/ui';
import { useStockSheetSignal } from '@/stores';
import { useProducts } from '@/hooks';
import type { Product } from '@/types/products.types';
import type { InventoryEventType } from '@/types/inventory.types';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';

interface Props {
  scannerOpen: boolean;
  onCloseScanner: () => void;
  categoryOpen: boolean;
  onCloseCategory: () => void;
  supplierOpen: boolean;
  onCloseSupplier: () => void;
}

export function InventoryModalsHost({
  scannerOpen,
  onCloseScanner,
  categoryOpen,
  onCloseCategory,
  onCloseSupplier,
  supplierOpen,
}: Props) {
  const router = useRouter();
  const signal = useStockSheetSignal();
  const { getAllProductsQuery } = useProducts();

  const products = useMemo(
    () => (getAllProductsQuery.data as Product[]) ?? [],
    [getAllProductsQuery.data],
  );

  const [restockOpen, setRestockOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<number | null>(null);

  const [txForm, setTxForm] = useState<{
    visible: boolean;
    product: Product | null;
    type: InventoryEventType;
  }>({
    visible: false,
    product: null,
    type: 'adjustment',
  });

  const resolveProduct = useCallback(
    (id: number | null) =>
      id == null ? null : (products.find((p) => p.id === id) ?? null),
    [products],
  );

  const lockedRestock = useMemo(
    () => resolveProduct(restockProduct),
    [resolveProduct, restockProduct],
  );

  useEffect(() => {
    if (signal.adjust.active) {
      const p = resolveProduct(signal.adjust.productId);
      setTxForm({ visible: true, product: p, type: 'adjustment' });
      signal.clearAdjust();
    }
  }, [signal.adjust.active, signal.adjust.productId, resolveProduct, signal]);

  useEffect(() => {
    if (signal.restock.active) {
      setRestockProduct(signal.restock.productId);
      setRestockOpen(true);
      signal.clearRestock();
    }
  }, [signal.restock.active, signal.restock.productId, signal]);

  useEffect(() => {
    if (signal.damaged.active) {
      const p = resolveProduct(signal.damaged.productId);
      setTxForm({ visible: true, product: p, type: 'damaged' });
      signal.clearDamaged();
    }
  }, [signal.damaged.active, signal.damaged.productId, resolveProduct, signal]);

  const handleScanResult = (barcode: string) => {
    onCloseScanner();
    if (!barcode) return;
    router.push({
      pathname: '/(edit-forms)/add-product',
      params: { prefillBarcode: barcode },
    } as Href);
  };

  const handleCloseTxForm = useCallback(() => {
    setTxForm((prev) => ({ ...prev, visible: false, product: null }));
  }, []);

  return (
    <>
      <RestockSheet
        visible={restockOpen}
        initialProductId={lockedRestock}
        onClose={() => {
          setRestockOpen(false);
          setRestockProduct(null);
        }}
      />
      <LogTransactionForm
        product={txForm.product}
        initialType={txForm.type}
        visible={txForm.visible}
        onClose={handleCloseTxForm}
        onSuccess={handleCloseTxForm}
      />
      <AddCategoryModal
        visible={categoryOpen}
        onClose={onCloseCategory}
        onSuccess={(categoryName) => {
          router.setParams({ category: categoryName });
        }}
      />
      <AddSupplierModal
        visible={supplierOpen}
        onClose={onCloseSupplier}
        onSuccess={(supplier) => {
          router.setParams({ supplier: supplier.id });
        }}
      />
      <BarcodeScannerModal
        mode="single"
        visible={scannerOpen}
        onClose={onCloseScanner}
        onScan={handleScanResult}
      />
    </>
  );
}
