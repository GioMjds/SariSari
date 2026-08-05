import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RestockSheet,
  MarkDamagedSheet,
  AdjustStockSheet,
} from '@/components/inventory/modals/';
import { BarcodeScannerModal } from '@/components/ui';
import { useStockSheetSignal } from '@/stores';
import { useProducts } from '@/hooks';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';

interface Props {
  scannerOpen: boolean;
  onCloseScanner: () => void;
}

export function InventoryModalsHost({ scannerOpen, onCloseScanner }: Props) {
  const router = useRouter();
  const signal = useStockSheetSignal();
  const { getAllProductsQuery } = useProducts();

  const products = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const [restockOpen, setRestockOpen] = useState(false);
  const [damagedOpen, setDamagedOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const [adjustProduct, setAdjustProduct] = useState<number | null>(null);
  const [damagedProduct, setDamagedProduct] = useState<number | null>(null);
  const [restockProduct, setRestockProduct] = useState<number | null>(null);

  const resolveProduct = useCallback(
    (id: number | null) =>
      id == null ? null : (products.find((p) => p.id === id) ?? null),
    [products],
  );

  const lockedAdjust = useMemo(
    () => resolveProduct(adjustProduct),
    [resolveProduct, adjustProduct],
  );
  const lockedDamaged = useMemo(
    () => resolveProduct(damagedProduct),
    [resolveProduct, damagedProduct],
  );
  const lockedRestock = useMemo(
    () => resolveProduct(restockProduct),
    [resolveProduct, restockProduct],
  );

  useEffect(() => {
    if (signal.adjust.productId !== null) {
      setAdjustProduct(signal.adjust.productId);
      setAdjustOpen(true);
      signal.clearAdjust();
    }
  }, [signal.adjust.productId, signal]);

  useEffect(() => {
    if (signal.restock.productId !== null) {
      setRestockProduct(signal.restock.productId);
      setRestockOpen(true);
      signal.clearRestock();
    }
  }, [signal.restock.productId, signal]);

  useEffect(() => {
    if (signal.damaged.productId !== null) {
      setDamagedProduct(signal.damaged.productId);
      setDamagedOpen(true);
      signal.clearDamaged();
    }
  }, [signal.damaged.productId, signal]);

  const handleScanResult = (barcode: string) => {
    onCloseScanner();
    if (!barcode) return;
    router.push({
      pathname: '/(edit-forms)/add-product',
      params: { prefillBarcode: barcode },
    } as Href);
  };

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
      <MarkDamagedSheet
        visible={damagedOpen}
        lockedProduct={lockedDamaged}
        onClose={() => {
          setDamagedOpen(false);
          setDamagedProduct(null);
        }}
      />
      <AdjustStockSheet
        visible={adjustOpen}
        lockedProduct={lockedAdjust}
        onClose={() => {
          setAdjustOpen(false);
          setAdjustProduct(null);
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
