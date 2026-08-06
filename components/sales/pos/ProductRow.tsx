import type { NewSaleItem, Product } from '@/types';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { Image } from 'expo-image';
import { formatPesos, getProductImageUri } from '@/lib';
import { FontAwesome } from '@expo/vector-icons';
import { useRenderCounter } from '@/hooks/useRenderCounter';
import { useToggleFavorite } from '@/hooks/useProducts';

// Variant style maps live outside the component so css-interop sees
// stable references and does not reprocess the row's className string
// on each toggle. Render-time ternaries were the previous pattern;
// the variants below are referenced by static classNames only.
const ROW_OUT_OF_STOCK_CLASS = 'mx-4 mb-3 rounded-2xl bg-paper-100 border border-paper-300/80 p-3.5 shadow-card opacity-60';
const ROW_AVAILABLE_CLASS = 'mx-4 mb-3 rounded-2xl bg-paper-100 border border-paper-300/80 p-3.5 shadow-card active:opacity-95';

const PC_CHIP_ACTIVE_CLASS = 'flex-1 py-1.5 rounded-lg items-center min-h-[36px] justify-center bg-cinnamon-500 shadow-sm border border-cinnamon-600';
const PC_CHIP_INACTIVE_CLASS = 'flex-1 py-1.5 rounded-lg items-center min-h-[36px] justify-center';

const PC_LABEL_ACTIVE_CLASS = 'text-xs text-paper-50';
const PC_LABEL_INACTIVE_CLASS = 'text-xs text-ink-700';

const PK_CHIP_ACTIVE_CLASS = PC_CHIP_ACTIVE_CLASS;
const PK_CHIP_INACTIVE_CLASS = PC_CHIP_INACTIVE_CLASS;

const PK_LABEL_ACTIVE_CLASS = PC_LABEL_ACTIVE_CLASS;
const PK_LABEL_INACTIVE_CLASS = PC_LABEL_INACTIVE_CLASS;

const ADD_BUTTON_DISABLED_CLASS = 'bg-cinnamon-500 active:bg-cinnamon-600 rounded-xl px-4 py-2.5 flex-row items-center justify-center min-h-[44px] min-w-[44px] shadow-sm opacity-40';
const ADD_BUTTON_ENABLED_CLASS = 'bg-cinnamon-500 active:bg-cinnamon-600 rounded-xl px-4 py-2.5 flex-row items-center justify-center min-h-[44px] min-w-[44px] shadow-sm';

interface ProductRowProps {
  product: Product;
  cartLine: NewSaleItem | undefined;
  onAdd: (product: Product, selectedUnit?: 'retail' | 'wholesale') => void;
  onUpdateQuantity: (
    productId: number,
    delta: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => void;
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

  const hasWholesale =
    product.wholesale_price != null &&
    product.conversion_factor != null &&
    product.conversion_factor >= 2;

  const retailUnitLabel = product.retail_unit_name || 'PC';
  const wholesaleUnitLabel = product.wholesale_unit_name || 'PK';

  // PC/PK are "active" by className, not by ternary string. The same
  // string is reused for both states so css-interop caches the parsed
  // styles after the first render of each row.
  const isRetailActive = !inCart || cartLine?.selected_unit === 'retail';
  const isWholesaleActive =
    inCart && cartLine?.selected_unit === 'wholesale';

  return (
    <Pressable
      onPress={() => {
        if (isOutOfStock) return;
        if (!inCart) onAdd(product);
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
      className={
        isOutOfStock ? ROW_OUT_OF_STOCK_CLASS : ROW_AVAILABLE_CLASS
      }
    >
      {/* Top Header Row: Thumbnail + Details (Title, Category, SKU) */}
      <View className="flex-row items-start mb-2.5">
        {/* Soft Surface Thumbnail Container */}
        <View className="w-14 h-14 rounded-xl bg-paper-200 border border-paper-300/60 overflow-hidden mr-3 items-center justify-center">
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
          </View>
        </View>
      </View>

      {/* Unit Toggle Badge (PC vs PK) */}
      {hasWholesale ? (
        <View className="flex-row items-center mb-3 bg-paper-200/80 rounded-xl p-1 border border-paper-300/60">
          <Pressable
            onPress={() => {
              if (inCart && cartLine?.selected_unit !== 'retail') {
                onToggleUnit?.(product.id);
              } else if (!inCart) {
                onAdd(product, 'retail');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={`Select ${retailUnitLabel} unit`}
            className={
              isRetailActive ? PC_CHIP_ACTIVE_CLASS : PC_CHIP_INACTIVE_CLASS
            }
          >
            <StyledText
              variant="extrabold"
              className={
                isRetailActive
                  ? PC_LABEL_ACTIVE_CLASS
                  : PC_LABEL_INACTIVE_CLASS
              }
            >
              PC ({retailUnitLabel})
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
            accessibilityRole="button"
            accessibilityLabel={`Select ${wholesaleUnitLabel} unit`}
            className={
              isWholesaleActive ? PK_CHIP_ACTIVE_CLASS : PK_CHIP_INACTIVE_CLASS
            }
          >
            <StyledText
              variant="extrabold"
              className={
                isWholesaleActive
                  ? PK_LABEL_ACTIVE_CLASS
                  : PK_LABEL_INACTIVE_CLASS
              }
            >
              PK ({wholesaleUnitLabel})
            </StyledText>
          </Pressable>
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

        {/* Action: Tactile + Add button or Quantity adjuster pill */}
        {inCart && cartLine ? (
          <View className="flex-row items-center bg-paper-200 border border-paper-300 rounded-xl p-1">
            <Pressable
              onPress={() => onUpdateQuantity(product.id, -1, activeUnit)}
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
              onPress={() => onUpdateQuantity(product.id, 1, activeUnit)}
              accessibilityRole="button"
              accessibilityLabel={`Increase quantity for ${product.name}`}
              className="w-10 h-10 rounded-lg bg-cinnamon-500 items-center justify-center active:bg-cinnamon-600 min-h-[44px] min-w-[44px]"
            >
              <FontAwesome name="plus" size={12} color="#FAFAF7" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              if (!isOutOfStock && !inCart) onAdd(product);
            }}
            disabled={isOutOfStock}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
            className={
              isOutOfStock ? ADD_BUTTON_DISABLED_CLASS : ADD_BUTTON_ENABLED_CLASS
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
        )}
      </View>
    </Pressable>
  );
}

export const ProductRow = memo(ProductRowImpl);