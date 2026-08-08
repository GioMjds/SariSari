import type { NewSaleItem, Product } from '@/types';
import { memo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { Image } from 'expo-image';
import { calculateBulkSavings, formatPesos, getProductImageUri } from '@/lib';
import { FontAwesome } from '@expo/vector-icons';
import { useRenderCounter } from '@/hooks/useRenderCounter';
import { useToggleFavorite } from '@/hooks/useProducts';

const ROW_OUT_OF_STOCK_CLASS =
  'mx-4 mb-3 rounded-2xl bg-paper-100 border border-paper-300/80 p-3.5 shadow-card opacity-60';
const ROW_AVAILABLE_CLASS =
  'mx-4 mb-3 rounded-2xl bg-paper-100 border border-paper-300/80 p-3.5 shadow-card active:bg-paper-200/50';
const ADD_BUTTON_DISABLED_CLASS =
  'bg-cinnamon-500 active:bg-cinnamon-600 rounded-xl px-4 py-2.5 flex-row items-center justify-center min-h-[44px] min-w-[44px] shadow-sm opacity-40';
const ADD_BUTTON_ENABLED_CLASS =
  'bg-cinnamon-500 active:bg-cinnamon-600 rounded-xl px-4 py-2.5 flex-row items-center justify-center min-h-[44px] min-w-[44px] shadow-sm';

const RETAIL_CHIP_ACTIVE_CLASS =
  'flex-1 bg-cinnamon-500 active:bg-cinnamon-600 border border-cinnamon-600 rounded-xl px-3 py-2.5 flex-row items-center justify-center min-h-[44px] shadow-sm';
const RETAIL_CHIP_INACTIVE_CLASS =
  'flex-1 bg-paper-100 active:bg-paper-200 border border-paper-300/80 rounded-xl px-3 py-2.5 flex-row items-center justify-center min-h-[44px] shadow-sm';

const WHOLESALE_CHIP_ACTIVE_CLASS =
  'flex-1 bg-sage-600 active:bg-sage-700 border border-sage-700 rounded-xl px-3 py-2.5 flex-row items-center justify-center min-h-[44px] shadow-sm';
const WHOLESALE_CHIP_INACTIVE_CLASS =
  'flex-1 bg-paper-100 active:bg-paper-200 border border-paper-300/80 rounded-xl px-3 py-2.5 flex-row items-center justify-center min-h-[44px] shadow-sm';

interface ProductRowProps {
  product: Product;
  cartLine: NewSaleItem | undefined;
  onAdd: (
    product: Product,
    selectedUnit?: 'retail' | 'wholesale',
  ) => 'over_stock' | void;
  onUpdateQuantity: (
    productId: number,
    delta: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => 'over_stock' | void;
  onToggleUnit?: (productId: number) => void;
}

function ProductRowImpl({
  product,
  cartLine,
  onAdd,
  onUpdateQuantity,
  onToggleUnit,
}: ProductRowProps) {
  const toggleFavorite = useToggleFavorite();
  const [overStock, setOverStock] = useState(false);

  useRenderCounter(`ProductRow#${product.id}`, {
    feature: 'pos_catalog',
    threshold: 25,
    windowMs: 1000,
  });

  const handleToggleFavorite = () => {
    toggleFavorite.mutate({
      productId: product.id,
      isFavorite: !product.is_favorite,
    });
  };

  const isOutOfStock = product.quantity <= 0;
  const isLowStock = !isOutOfStock && product.quantity <= 5;
  const inCart = !!cartLine;
  const activeUnit = cartLine?.selected_unit || 'retail';
  const displayPrice = inCart ? cartLine!.price : product.price;

  const placeholderText = product.name
    ? product.name.trim().charAt(0).toUpperCase()
    : '?';
  const displayImageUri = getProductImageUri(product.image_uri);

  const bulkSavings = calculateBulkSavings(product);
  const retailUnitLabel = product.retail_unit_name || 'PC';
  const wholesaleUnitLabel = product.wholesale_unit_name || 'PK';

  const isRetailActive = !inCart || cartLine?.selected_unit === 'retail';
  const isWholesaleActive = inCart && cartLine?.selected_unit === 'wholesale';

  return (
    <Pressable
      onPress={() => {
        if (isOutOfStock) return;
        if (!inCart) {
          const result = onAdd(product);
          if (result === 'over_stock') {
            setOverStock(true);
          } else {
            setOverStock(false);
          }
        }
      }}
      onLongPress={handleToggleFavorite}
      delayLongPress={400}
      disabled={isOutOfStock}
      accessibilityRole="button"
      accessibilityLabel={
        isOutOfStock
          ? `${product.name} out of stock`
          : `Add ${product.name} to cart`
      }
      className={isOutOfStock ? ROW_OUT_OF_STOCK_CLASS : ROW_AVAILABLE_CLASS}
    >
      {/* Top Header Row: Thumbnail + Details (Title, Category, SKU) */}
      <View className="flex-row items-start mb-2.5">
        {/* Soft Surface Thumbnail Container */}
        <View className="relative w-14 h-14 rounded-xl bg-paper-200 border border-paper-300/60 overflow-hidden mr-3 items-center justify-center">
          {displayImageUri ? (
            <Image
              source={{ uri: displayImageUri }}
              className="w-full h-full"
              contentFit="cover"
            />
          ) : (
            <StyledText variant="black" className="text-persimmon-600 text-lg">
              {placeholderText}
            </StyledText>
          )}
          {bulkSavings.hasWholesale ? (
            <View className="absolute bottom-1 right-1 bg-paper-100/90 border border-paper-300/80 rounded-md px-1 py-0.5 flex-row items-center">
              <FontAwesome name="cubes" size={10} color="#E85A1F" />
            </View>
          ) : null}
        </View>

        {/* Title, Category Badge & SKU */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-base leading-tight mb-1 flex-1 mr-2"
              numberOfLines={2}
            >
              {product.name}
            </StyledText>
            <Pressable
              onPress={handleToggleFavorite}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                product.is_favorite
                  ? `Unstar ${product.name}`
                  : `Star ${product.name} for Fast Lane`
              }
            >
              <FontAwesome
                name={product.is_favorite ? 'star' : 'star-o'}
                size={16}
                color={product.is_favorite ? '#E85A1F' : '#B0A89E'}
              />
            </Pressable>
          </View>

          <View className="flex-row items-center flex-wrap gap-1.5">
            {/* Category Tag Badge */}
            <View className="bg-paper-200 rounded-md px-2 py-0.5 self-start">
              <StyledText
                variant="medium"
                className="text-ink-600 text-[11px] uppercase tracking-wider"
              >
                {product.category || 'General'}
              </StyledText>
            </View>

            {/* SKU Badge */}
            {product.sku ? (
              <View className="bg-paper-200/60 border border-dashed border-paper-300 rounded-md px-1.5 py-0.5 self-start">
                <StyledText
                  variant="medium"
                  className="text-ink-500 font-mono text-[10px]"
                >
                  SKU {product.sku}
                </StyledText>
              </View>
            ) : null}

            {/* Wholesale Conversion Badge */}
            {bulkSavings.hasWholesale ? (
              <View className="bg-sage-50 border border-sage-200 rounded-md px-2 py-0.5 self-start flex-row items-center">
                <StyledText
                  variant="extrabold"
                  className="text-sage-700 text-[10px]"
                >
                  1 {wholesaleUnitLabel} = {product.conversion_factor}{' '}
                  {retailUnitLabel}s
                </StyledText>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Unit Action Buttons for Bundle Products (Tingi vs Pakyaw) */}
      {bulkSavings.hasWholesale ? (
        <View className="mb-3">
          {bulkSavings.savings > 0 && (
            <View className="bg-sage-50 border border-sage-200 rounded-full px-2.5 py-0.5 flex-row items-center self-start mb-2">
              <FontAwesome name="tag" size={10} color="#4F7A24" />
              <StyledText
                variant="extrabold"
                className="text-sage-700 text-[11px] ml-1"
              >
                Save {formatPesos(bulkSavings.savings)} in bulk
              </StyledText>
            </View>
          )}
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => {
                if (inCart && cartLine?.selected_unit !== 'retail') {
                  onToggleUnit?.(product.id);
                } else if (!inCart) {
                  onAdd(product, 'retail');
                }
              }}
              disabled={isOutOfStock}
              accessibilityRole="button"
              accessibilityLabel={`Select or add retail unit Tingi ${retailUnitLabel} at ${formatPesos(product.price)}`}
              className={
                isRetailActive
                  ? RETAIL_CHIP_ACTIVE_CLASS
                  : RETAIL_CHIP_INACTIVE_CLASS
              }
            >
              {!inCart && (
                <FontAwesome
                  name="plus"
                  size={11}
                  color={isRetailActive ? '#FAFAF7' : '#623418'}
                  style={{ marginRight: 4 }}
                />
              )}
              <StyledText
                variant="extrabold"
                className={
                  isRetailActive
                    ? 'text-paper-50 text-xs text-center'
                    : 'text-ink-800 text-xs text-center'
                }
              >
                Tingi ({retailUnitLabel}) • {formatPesos(product.price)}
              </StyledText>
            </Pressable>

            <Pressable
              onPress={() => {
                if (inCart && cartLine?.selected_unit !== 'wholesale') {
                  onToggleUnit?.(product.id);
                } else if (!inCart) {
                  onAdd(product, 'wholesale');
                }
              }}
              disabled={isOutOfStock}
              accessibilityRole="button"
              accessibilityLabel={`Select or add wholesale unit Pakyaw ${wholesaleUnitLabel} at ${formatPesos(product.wholesale_price || 0)}`}
              className={
                isWholesaleActive
                  ? WHOLESALE_CHIP_ACTIVE_CLASS
                  : WHOLESALE_CHIP_INACTIVE_CLASS
              }
            >
              {!inCart ? (
                <FontAwesome
                  name="cubes"
                  size={11}
                  color={isWholesaleActive ? '#FAFAF7' : '#4F7A24'}
                  style={{ marginRight: 4 }}
                />
              ) : null}
              <StyledText
                variant="extrabold"
                className={
                  isWholesaleActive
                    ? 'text-paper-50 text-xs text-center'
                    : 'text-ink-800 text-xs text-center'
                }
              >
                Pakyaw ({wholesaleUnitLabel}) •{' '}
                {formatPesos(product.wholesale_price || 0)}
              </StyledText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Bottom Section: Stock Status Pill, Price in Pesos, Action Button/Stepper */}
      <View className="flex-row items-center justify-between pt-1 border-t border-paper-300/40">
        <View className="flex-col items-start gap-1">
          {/* Stock status indicator pill */}
          {isOutOfStock ? (
            <View className="bg-semantic-danger-50 border border-semantic-danger/20 px-2.5 py-0.5 rounded-full flex-row items-center">
              <FontAwesome name="times-circle" size={10} color="#C13030" />
              <StyledText
                variant="semibold"
                className="text-semantic-danger text-[11px] ml-1"
              >
                Out of stock
              </StyledText>
            </View>
          ) : isLowStock ? (
            <View className="bg-semantic-warning-50 border border-semantic-warning-100 px-2.5 py-0.5 rounded-full flex-row items-center">
              <FontAwesome
                name="exclamation-triangle"
                size={10}
                color="#C77B0E"
              />
              <StyledText
                variant="semibold"
                className="text-semantic-warning text-[11px] ml-1"
              >
                {product.quantity} in stock (Low)
              </StyledText>
            </View>
          ) : (
            <View className="bg-sage-50 border border-sage-200 px-2.5 py-0.5 rounded-full flex-row items-center">
              <FontAwesome name="check-circle" size={10} color="#4F7A24" />
              <StyledText
                variant="semibold"
                className="text-sage-700 text-[11px] ml-1"
              >
                {product.quantity} in stock
              </StyledText>
            </View>
          )}

          {/* Formatted Price Display in Pesos */}
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-lg leading-tight"
          >
            {formatPesos(displayPrice)}
          </StyledText>
        </View>

        {/* Action: Quantity adjuster pill when in cart, or + Add button for Single products */}
        {inCart && cartLine ? (
          <View className="flex-row items-center bg-paper-200 border border-paper-300 rounded-xl p-1">
            <Pressable
              onPress={() => {
                onUpdateQuantity(product.id, -1, activeUnit);
                setOverStock(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Decrease quantity for ${product.name}`}
              className="w-10 h-10 rounded-lg bg-paper-100 items-center justify-center border border-paper-300 active:bg-paper-300 min-h-[44px] min-w-[44px]"
            >
              <FontAwesome name="minus" size={12} color="#4D2810" />
            </Pressable>

            <StyledText
              variant="extrabold"
              className="text-ink-900 text-sm px-3"
            >
              {cartLine.quantity}
            </StyledText>

            <Pressable
              onPress={() => {
                const result = onUpdateQuantity(
                  product.id,
                  1,
                  activeUnit,
                );
                if (result === 'over_stock') {
                  setOverStock(true);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`Increase quantity for ${product.name}`}
              className="w-10 h-10 rounded-lg bg-cinnamon-500 items-center justify-center active:bg-cinnamon-600 min-h-[44px] min-w-[44px]"
            >
              <FontAwesome name="plus" size={12} color="#FAFAF7" />
            </Pressable>
          </View>
        ) : !bulkSavings.hasWholesale ? (
          <Pressable
            onPress={() => {
              if (!isOutOfStock && !inCart) {
                const result = onAdd(product);
                if (result === 'over_stock') {
                  setOverStock(true);
                } else {
                  setOverStock(false);
                }
              }
            }}
            disabled={isOutOfStock}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
            className={
              isOutOfStock
                ? ADD_BUTTON_DISABLED_CLASS
                : ADD_BUTTON_ENABLED_CLASS
            }
            delayLongPress={400}
          >
            <FontAwesome name="plus" size={12} color="#FAFAF7" />
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-sm ml-1.5"
            >
              Add
            </StyledText>
          </Pressable>
        ) : null}
      </View>
      {overStock && (
        <View className="mt-1 items-end">
          <StyledText
            variant="semibold"
            className="text-semantic-danger text-[11px]"
            accessibilityLiveRegion="polite"
          >
            Max stock
          </StyledText>
        </View>
      )}
    </Pressable>
  );
}

export const ProductRow = memo(ProductRowImpl);
