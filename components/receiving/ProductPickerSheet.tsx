import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/inventory/modals/_shared';
import { BarcodeScannerModal } from '@/components/ui';
import { useBarcodeResolver } from '@/hooks/useBarcodeResolver';
import { usePaginatedProducts } from '@/hooks/useProducts';
import { formatPesos } from '@/lib/money';
import type { DraftLineForm } from '@/lib/deliveryForm';
import { useToastStore } from '@/stores';
import type { Product } from '@/types/products.types';
import { QuickAddProductSheet } from './QuickAddProductSheet';
import { lineFormFromProduct, lineFormFromQuickAdd } from './lineForms';

interface Props {
  visible: boolean;
  supplierId: string | null;
  onClose: () => void;
  onPick: (form: DraftLineForm) => void;
}

type Mode = 'list' | 'scan' | 'quick';

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Product search for a delivery line. With a blank search it lists the
 * supplier's own products; typing searches the whole catalog. Scan and the
 * quick-add sheet swap in place of the list so only one modal is ever open.
 */
export function ProductPickerSheet({
  visible,
  supplierId,
  onClose,
  onPick,
}: Props) {
  const { t } = useTranslation('receiving');
  const addToast = useToastStore((s) => s.addToast);
  const { resolve } = useBarcodeResolver();

  const [mode, setMode] = useState<Mode>('list');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [quickPrefill, setQuickPrefill] = useState<{
    name?: string;
    barcode?: string;
  }>({});

  // Reset when the sheet re-opens.
  useEffect(() => {
    if (visible) {
      setMode('list');
      setSearch('');
      setDebounced('');
      setQuickPrefill({});
    }
  }, [visible]);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebounced(search.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  const supplierFilter =
    debounced === '' && supplierId !== null
      ? { supplier: supplierId }
      : undefined;
  const supplierOnly = supplierFilter !== undefined;
  const productsQuery = usePaginatedProducts(debounced, 'all', supplierFilter);
  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data],
  );

  const pick = (form: DraftLineForm) => {
    onPick(form);
    onClose();
  };

  const pickProduct = (p: Product, unit?: 'retail' | 'wholesale') =>
    pick(lineFormFromProduct(p, unit));

  const openQuickAdd = (prefill: { name?: string; barcode?: string } = {}) => {
    setQuickPrefill(prefill);
    setMode('quick');
  };

  const handleScan = async (barcode: string) => {
    setMode('list');
    if (!barcode) return;
    const result = await resolve(barcode);
    switch (result.kind) {
      case 'resolved':
        pickProduct(result.product, result.matchedUnit);
        return;
      case 'catalog_match':
        openQuickAdd({
          name: result.catalogProduct.name,
          barcode: result.barcode,
        });
        return;
      case 'missing':
        openQuickAdd({ barcode: result.barcode });
        return;
      case 'invalid':
        addToast({ message: t('scanInvalid'), variant: 'warning' });
        return;
      case 'store_products_unavailable':
        addToast({ message: t('scanUnavailable'), variant: 'warning' });
        return;
      case 'superseded':
      case 'duplicate':
        return;
    }
  };

  return (
    <>
      <Sheet visible={visible && mode === 'list'} onClose={onClose}>
        <View className="flex-row items-center justify-between">
          <StyledText variant="black" className="text-ink-900 text-base">
            {t('addLine')}
          </StyledText>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('cancel')}
            className="w-9 h-9 rounded-full items-center justify-center active:bg-paper-100"
          >
            <FontAwesome name="times" size={14} color="#0E0C0A" />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-paper-100 border border-ink-200 rounded-xl px-3 py-2">
            <FontAwesome
              name="search"
              size={14}
              color="#A39C96"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-sm text-ink-900 font-stack-sans p-0"
              placeholder={t('searchProducts')}
              placeholderTextColor="#A39C96"
              accessibilityLabel={t('searchProducts')}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable
                onPress={() => setSearch('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={8}
              >
                <FontAwesome name="times-circle" size={14} color="#A39C96" />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => setMode('scan')}
            accessibilityRole="button"
            accessibilityLabel={t('scanBarcode')}
            className="press-scale w-11 h-11 items-center justify-center rounded-xl bg-ink-900 active:opacity-80"
          >
            <FontAwesome name="barcode" size={16} color="#FBF7EE" />
          </Pressable>
        </View>

        {supplierOnly ? (
          <StyledText variant="regular" className="text-ink-400 text-xs -mt-2">
            {t('pickerSupplierHint')}
          </StyledText>
        ) : null}

        <ScrollView
          style={{ maxHeight: 340 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => openQuickAdd()}
            accessibilityRole="button"
            accessibilityLabel={t('newProduct')}
            className="flex-row items-center gap-3 p-3 rounded-xl mb-1.5 border border-dashed border-persimmon-300 bg-persimmon-50"
          >
            <FontAwesome name="plus-circle" size={16} color="#E85A1F" />
            <StyledText
              variant="semibold"
              className="text-persimmon-700 text-sm"
            >
              {t('newProduct')}
            </StyledText>
          </Pressable>

          {products.length === 0 ? (
            productsQuery.isLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#E85A1F" />
              </View>
            ) : (
              <View className="py-4 items-center">
                <FontAwesome
                  name="exclamation-circle"
                  size={20}
                  color="#A39C96"
                />
                <StyledText
                  variant="medium"
                  className="text-ink-400 text-xs mt-1"
                >
                  {t('pickerEmpty')}
                </StyledText>
              </View>
            )
          ) : (
            products.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => pickProduct(product)}
                accessibilityRole="button"
                accessibilityLabel={product.name}
                className="flex-row items-center justify-between p-3 rounded-xl mb-1.5 border bg-paper-100 border-ink-100 active:bg-paper-200"
              >
                <View className="flex-1 mr-2">
                  <StyledText
                    variant="semibold"
                    className="text-ink-900 text-md"
                    numberOfLines={1}
                  >
                    {product.name}
                  </StyledText>
                  <StyledText variant="medium" className="text-ink-400 text-sm">
                    {product.cost_price != null
                      ? `${t('unitCost')}: ${formatPesos(product.cost_price)}`
                      : formatPesos(product.price)}
                  </StyledText>
                </View>
                <FontAwesome name="angle-right" size={14} color="#A89F90" />
              </Pressable>
            ))
          )}

          {productsQuery.hasNextPage && (
            <Pressable
              onPress={() => productsQuery.fetchNextPage()}
              disabled={productsQuery.isFetchingNextPage}
              accessibilityRole="button"
              accessibilityLabel={t('loadMore')}
              className="py-2.5 items-center justify-center bg-paper-100 rounded-xl border border-ink-200 mt-1"
            >
              {productsQuery.isFetchingNextPage ? (
                <ActivityIndicator size="small" color="#E85A1F" />
              ) : (
                <StyledText
                  variant="semibold"
                  className="text-persimmon-500 text-xs font-stack-sans-bold"
                >
                  {t('loadMore')}
                </StyledText>
              )}
            </Pressable>
          )}
        </ScrollView>
      </Sheet>

      <BarcodeScannerModal
        mode="single"
        visible={visible && mode === 'scan'}
        onClose={() => setMode('list')}
        onScan={(barcode) => {
          void handleScan(barcode);
        }}
      />

      <QuickAddProductSheet
        visible={visible && mode === 'quick'}
        onClose={() => setMode('list')}
        onSubmit={(p) => pick(lineFormFromQuickAdd(p))}
        {...(quickPrefill.name !== undefined
          ? { initialName: quickPrefill.name }
          : {})}
        {...(quickPrefill.barcode !== undefined
          ? { initialBarcode: quickPrefill.barcode }
          : {})}
      />
    </>
  );
}
