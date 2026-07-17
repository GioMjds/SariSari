import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { MoneyText, StatusPill, ReceiptHeroDivider } from '@/components/ui';
import { LOW_STOCK_THRESHOLD } from '@/constants';
import { formatPesos } from '@/lib/money';

const sariImage = require('@/assets/images/sari-emotions/sari-empty-state.png');

const PERFORATION_COUNT = 22;
const PERFORATION_BG = '#EFE6D2';

interface CategoryProductsSectionProps {
  productsInCategory: any[];
  totalUnits: number;
  onAddProduct: () => void;
  onOpenProduct: (productId: string | number) => void;
}

export function CategoryProductsSection({
  productsInCategory,
  totalUnits,
  onAddProduct,
  onOpenProduct,
}: CategoryProductsSectionProps) {
  return (
    <>
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
                  onPress={onAddProduct}
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
                      onPress={() => onOpenProduct(item.id)}
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
    </>
  );
}
