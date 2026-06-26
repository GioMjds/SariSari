import { StyledText } from '@/components/elements';
import {
  MoneyText,
  ReceiptHero,
  ReceiptHeroDivider,
  StatusPill,
  StatusStamp,
} from '@/components/ui';
import { useCategories, useProducts } from '@/hooks';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LOW_STOCK_THRESHOLD } from '@/constants';
import { formatPesos } from '@/lib/money';

const sariImage = require('@/assets/images/sari-emotions/sari-empty-state.png');

const PERFORATION_COUNT = 22;
const PERFORATION_BG = '#EFE6D2';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const categoryId = id ? Number(id) : NaN;

  const { useGetCategory } = useCategories();
  const { getAllProductsQuery } = useProducts();

  const categoryQuery = useGetCategory(categoryId);
  const productsQuery = getAllProductsQuery;

  const loading = categoryQuery.isLoading || productsQuery.isLoading;
  const category = categoryQuery.data;

  const productsInCategory = useMemo(() => {
    if (!category) return [];
    const list = productsQuery.data || [];
    return list.filter((p: any) => p.category === category.name);
  }, [category, productsQuery.data]);

  const totalValue = useMemo(
    () =>
      productsInCategory.reduce(
        (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
        0,
      ),
    [productsInCategory],
  );

  const totalUnits = useMemo(
    () => productsInCategory.reduce((sum, p) => sum + (p.quantity || 0), 0),
    [productsInCategory],
  );

  const lowStockCount = useMemo(
    () =>
      productsInCategory.filter(
        (p) =>
          p.quantity === 0 ||
          (p.quantity > 0 && p.quantity < LOW_STOCK_THRESHOLD),
      ).length,
    [productsInCategory],
  );

  const handleBack = () => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  };

  const handleAddProduct = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/(edit-forms)/add-product' as any);
  };

  const handleOpenProduct = (productId: string | number) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/(edit-forms)/edit-product/${productId}` as any);
  };

  // ─── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center px-5 pt-3 pb-2">
          <Pressable
            onPress={handleBack}
            hitSlop={20}
            className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center shadow-paper border border-ink-100 active:opacity-70"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>
        </View>
        <View className="flex-1 justify-center items-center">
          <View
            className="w-12 h-12 rounded-full border-2 border-ink-200"
            style={{ borderTopColor: '#E85A1F' }}
          />
          <StyledText variant="medium" className="text-ink-500 mt-4 label-caps">
            Loading category…
          </StyledText>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Not found ─────────────────────────────────────────────────────
  if (!category) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center px-5 pt-3 pb-2">
          <Pressable
            onPress={handleBack}
            hitSlop={20}
            className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center shadow-paper border border-ink-100 active:opacity-70"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>
        </View>
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-paper-50 rounded-2xl p-5 border border-ink-100 items-center">
            <FontAwesome name="folder-open" size={42} color="#C77B0E" />
            <StyledText
              variant="black"
              className="text-ink-900 text-xl mt-3 text-center"
            >
              Category not found
            </StyledText>
            <StyledText
              variant="regular"
              className="text-ink-500 text-sm mt-1 text-center"
            >
              It may have been deleted on another device.
            </StyledText>
            <Pressable
              onPress={() => router.push('/(tabs)/inventory' as any)}
              className="mt-5 bg-persimmon-500 rounded-pill px-6 py-3 shadow-persimmon-glow"
            >
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                Back to Inventory
              </StyledText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Derive header stamp tone ─────────────────────────────────────
  const stampTone = lowStockCount === 0 ? 'sage' : 'cinnamon';
  const stampLabel =
    lowStockCount === 0
      ? 'ALL GOOD'
      : lowStockCount === 1
        ? '1 LOW'
        : `${lowStockCount} LOW`;
  const stampRotate = lowStockCount === 0 ? 6 : -8;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Slim top bar */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable
          onPress={handleBack}
          hitSlop={20}
          accessibilityRole="button"
          accessibilityLabel="Back to Inventory"
          className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center shadow-paper border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Receipt Hero — header + total + meta ────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 480, delay: 60 }}
        >
          <ReceiptHero tone="cinnamon" headerLabel="CATEGORY">
            {/* Eyebrow + status stamp */}
            <View className="px-5 pt-6 pb-3 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-400"
                >
                  Category
                </StyledText>
                <StyledText
                  variant="black"
                  className="text-ink-900 text-3xl mt-1"
                  style={{ letterSpacing: -0.5 }}
                >
                  {category.name}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-sm mt-1"
                >
                  {productsInCategory.length}{' '}
                  {productsInCategory.length === 1 ? 'product' : 'products'}
                  {lowStockCount > 0 ? ` · ${lowStockCount} need restock` : ''}
                </StyledText>
              </View>
              <StatusStamp
                label={stampLabel}
                tone={stampTone}
                size="md"
                rotate={stampRotate}
              />
            </View>

            {/* Featured total-value plate */}
            <View className="px-5 py-5 bg-paper-100 border-y border-dashed border-ink-200">
              <StyledText
                variant="extrabold"
                className="label-caps text-ink-400 mb-2"
              >
                Total Value
              </StyledText>
              <View className="flex-row items-baseline">
                <MoneyText
                  value={totalValue}
                  size="display"
                  className="text-ink-900 font-extrabold"
                  style={{ fontSize: 40, letterSpacing: -1 }}
                />
              </View>
              <StyledText
                variant="medium"
                className="text-mono text-ink-500 mt-2"
              >
                {totalUnits} {totalUnits === 1 ? 'unit' : 'units'} across{' '}
                {productsInCategory.length}{' '}
                {productsInCategory.length === 1 ? 'product' : 'products'}
              </StyledText>
            </View>

            <ReceiptHeroDivider label="STOCK OVERVIEW" tone="cinnamon" />

            {/* Meta block — items / units / low-stock */}
            <View className="px-5 pt-3 pb-5">
              <MetaRow
                label="PRODUCTS"
                value={`${productsInCategory.length}`}
              />
              <View className="h-px border-t border-dashed border-ink-200 my-1.5" />
              <MetaRow label="UNITS IN STOCK" value={`${totalUnits}`} />
              <View className="h-px border-t border-dashed border-ink-200 my-1.5" />
              <MetaRow
                label="NEED RESTOCK"
                value={`${lowStockCount}`}
                valueTone={
                  lowStockCount === 0
                    ? 'text-sage-700'
                    : 'text-semantic-warning'
                }
              />
              <View className="h-px border-t border-dashed border-ink-200 my-1.5" />
              <MetaRow
                label="AVG. PRICE"
                value={
                  productsInCategory.length === 0
                    ? '—'
                    : formatPesos(
                        Math.round(
                          productsInCategory.reduce(
                            (s, p) => s + (p.price || 0),
                            0,
                          ) / productsInCategory.length,
                        ),
                      )
                }
              />
            </View>
          </ReceiptHero>
        </MotiView>

        {/* ─── Items — perforation-separated paper card ───────── */}
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 480, delay: 140 }}
        >
          <View className="mx-4 mt-7">
            {/* Section eyebrow */}
            <View className="flex-row items-center justify-between mb-3 px-1">
              <StyledText variant="black" className="label-caps text-ink-700">
                Products in this folder
              </StyledText>
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-persimmon-500 mr-1.5" />
                <StyledText variant="medium" className="text-mono text-ink-500">
                  {productsInCategory.length}{' '}
                  {productsInCategory.length === 1 ? 'item' : 'items'}
                </StyledText>
              </View>
            </View>

            {productsInCategory.length === 0 ? (
              /* Empty state — perforation card with Sari mascot */
              <View
                className="rounded-3xl overflow-hidden bg-paper-50 border border-ink-100"
                style={{
                  shadowColor: '#564E45',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                  elevation: 4,
                }}
              >
                <View className="relative h-0">
                  <View
                    className="absolute left-0 right-0 h-3 flex-row justify-between"
                    style={{ bottom: -6 }}
                  >
                    {Array.from({ length: PERFORATION_COUNT }).map((_, i) => (
                      <View
                        key={`e-top-${i}`}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PERFORATION_BG }}
                      />
                    ))}
                  </View>
                </View>
                <View className="h-3" />

                <View className="paper-texture items-center px-6 pt-2 pb-8">
                  <StyledText
                    variant="extrabold"
                    className="label-caps text-persimmon-600 mb-4"
                  >
                    Empty folder
                  </StyledText>
                  <Image
                    source={sariImage}
                    style={{ width: 160, height: 160 }}
                    resizeMode="contain"
                  />
                  <StyledText
                    variant="black"
                    className="text-ink-900 text-xl mt-4 text-center px-4"
                  >
                    No products yet
                  </StyledText>
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-sm mt-2 text-center"
                  >
                    Add your first product to this category and start tracking
                    stock.
                  </StyledText>
                  <Pressable
                    onPress={handleAddProduct}
                    className="mt-5 bg-persimmon-500 rounded-pill px-7 py-3 flex-row items-center shadow-persimmon-glow active:opacity-80"
                  >
                    <FontAwesome name="plus" size={14} color="#FBF7EE" />
                    <StyledText
                      variant="extrabold"
                      className="text-paper-50 text-sm ml-2"
                    >
                      Add Product
                    </StyledText>
                  </Pressable>
                </View>

                <View className="relative h-0">
                  <View
                    className="absolute left-0 right-0 h-3 flex-row justify-between"
                    style={{ top: -6 }}
                  >
                    {Array.from({ length: PERFORATION_COUNT }).map((_, i) => (
                      <View
                        key={`e-bot-${i}`}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PERFORATION_BG }}
                      />
                    ))}
                  </View>
                </View>
                <View className="h-3" />
              </View>
            ) : (
              /* Populated product list */
              <View className="bg-paper-50 rounded-3xl shadow-paper border border-ink-100 overflow-hidden">
                {productsInCategory.map((item: any, index: number) => {
                  const isLast = index === productsInCategory.length - 1;
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock =
                    item.quantity > 0 && item.quantity < LOW_STOCK_THRESHOLD;
                  const lineTotal = (item.price || 0) * (item.quantity || 0);

                  return (
                    <MotiView
                      key={String(item.id)}
                      from={{ opacity: 0, translateX: -8 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{
                        type: 'timing',
                        duration: 360,
                        delay: 220 + index * 50,
                      }}
                    >
                      <Pressable
                        onPress={() => handleOpenProduct(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${item.name}`}
                        className={`px-5 py-4 active:opacity-70 ${
                          isLast ? '' : 'border-b border-dashed border-ink-200'
                        }`}
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 pr-3">
                            <StyledText
                              variant="extrabold"
                              className="text-ink-900 text-base"
                              numberOfLines={2}
                            >
                              {item.name}
                            </StyledText>

                            <View className="flex-row items-center mt-1.5">
                              <View className="bg-paper-200 rounded-md px-2 py-0.5">
                                <StyledText
                                  variant="medium"
                                  className="text-mono text-ink-700"
                                >
                                  SKU {item.sku}
                                </StyledText>
                              </View>
                              {isOutOfStock ? (
                                <StatusPill variant="danger" size="sm" dot>
                                  Out
                                </StatusPill>
                              ) : isLowStock ? (
                                <StatusPill variant="warning" size="sm" dot>
                                  {`Low · ${item.quantity} left`}
                                </StatusPill>
                              ) : (
                                <StyledText
                                  variant="medium"
                                  className="text-mono text-ink-500 ml-3"
                                >
                                  {item.quantity} in stock
                                </StyledText>
                              )}
                            </View>
                          </View>

                          <View className="items-end">
                            <MoneyText
                              value={item.price || 0}
                              className="text-ink-900 text-base"
                            />
                            {lineTotal > 0 && (
                              <StyledText
                                variant="medium"
                                className="text-mono text-ink-500 text-xs mt-0.5"
                              >
                                = {formatPesos(lineTotal)}
                              </StyledText>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    </MotiView>
                  );
                })}

                {/* Ledger footer — dashes + total units row */}
                <View className="bg-paper-100 px-5 py-3 flex-row items-center justify-between border-t border-dashed border-ink-300">
                  <StyledText
                    variant="medium"
                    className="label-caps text-ink-500"
                  >
                    Total units
                  </StyledText>
                  <StyledText
                    variant="extrabold"
                    className="text-mono text-ink-900"
                  >
                    {totalUnits}
                  </StyledText>
                </View>
              </View>
            )}
          </View>
        </MotiView>

        {/* ─── Footer note ────────────────────────────────────── */}
        {productsInCategory.length > 0 && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 480, delay: 320 }}
          >
            <View className="mx-4 mt-7">
              <ReceiptHeroDivider label="end of folder" tone="cinnamon" />
              <StyledText
                variant="regular"
                className="text-ink-500 text-xs text-center mt-3"
                style={{ lineHeight: 18 }}
              >
                Tap a product to edit its details, or add a new one below.
              </StyledText>
            </View>
          </MotiView>
        )}
      </ScrollView>

      {/* ─── Sticky action plate (deep cinnamon) ──────────────── */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 520, delay: 220 }}
        className="absolute bottom-0 left-0 right-0"
      >
        <View className="px-4 pb-5 pt-3">
          <View className="bg-cinnamon-500 rounded-3xl shadow-paper-deep px-5 py-4 flex-row items-center justify-between overflow-hidden">
            <View className="flex-1">
              <StyledText
                variant="medium"
                className="label-caps text-paper-200 opacity-90"
              >
                Category value
              </StyledText>
              <View className="flex-row items-baseline mt-1">
                <StyledText
                  variant="medium"
                  className="text-paper-100 text-base mr-1"
                  style={{ letterSpacing: -0.5 }}
                >
                  ₱
                </StyledText>
                <StyledText
                  variant="black"
                  className="text-paper-50 text-3xl"
                  style={{ letterSpacing: -0.5 }}
                >
                  {totalValue.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </StyledText>
              </View>
            </View>

            <Pressable
              onPress={handleAddProduct}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Add product to this category"
              className="flex-row items-center bg-persimmon-500 rounded-pill px-5 py-3 ml-3 active:opacity-80"
              style={{
                shadowColor: '#E85A1F',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.32,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <FontAwesome name="plus" size={14} color="#FBF7EE" />
              <StyledText
                variant="extrabold"
                className="text-paper-50 text-sm ml-2"
              >
                Add Product
              </StyledText>
            </Pressable>
          </View>
        </View>
      </MotiView>
    </SafeAreaView>
  );
}

/* ─── Meta row used inside the hero ────────────────────────────── */

function MetaRow({
  label,
  value,
  valueTone = 'text-ink-900',
}: {
  label: string;
  value: string;
  valueTone?: string;
}) {
  return (
    <View className="flex-row items-baseline justify-between py-1.5">
      <StyledText variant="extrabold" className="label-caps text-ink-400">
        {label}
      </StyledText>
      <StyledText variant="extrabold" className={`text-mono ${valueTone}`}>
        {value}
      </StyledText>
    </View>
  );
}
