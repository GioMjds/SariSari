import type { NewSaleItem, Product } from '@/types';
import { Pressable, View } from 'react-native';
import { PerforationRow } from '../PerforationRow';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { StepperStamp } from './StepperStamp';
import { Image } from 'expo-image';
import { getProductImageUri } from '@/lib';

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

/**
 * ProductRow — a resibo-style "torn paper stub" for each catalog item.
 */
export function ProductRow({
  product,
  cartLine,
  onAdd,
  onUpdateQuantity,
  onToggleUnit,
}: ProductRowProps) {
  const isOutOfStock = product.quantity <= 0;
  const isLowStock = !isOutOfStock && product.quantity <= 5;
  const inCart = !!cartLine;
  const activeUnit = cartLine?.selected_unit || 'retail';
  const displayPrice = inCart ? cartLine!.price : product.price;

  // Stock dot color: red-600 / orange-600 / sage-500.
  const dotColor = isOutOfStock
    ? '#C13030'
    : isLowStock
      ? '#C77B0E'
      : '#4F7A24';
  const stockLabel = isOutOfStock
    ? 'Out of stock'
    : `${product.quantity} in stock`;

  // Placeholder design: First letter of name capitalized.
  const placeholderText = product.name ? product.name.trim().charAt(0).toUpperCase() : '?';
  const displayImageUri = getProductImageUri(product.image_uri);

  return (
    <Pressable
      onPress={() => {
        if (isOutOfStock) return;
        // If already in cart, tap on the body still opens the stepper
        // path — increment via the cart path keeps the existing line
        // and respects stock caps. The + button on the stepper does
        // the same thing, so tap-to-add is just the simpler gesture.
        if (!inCart) onAdd(product);
      }}
      disabled={isOutOfStock}
      accessibilityRole="button"
      accessibilityLabel={
        isOutOfStock
          ? `${product.name} out of stock`
          : `Add ${product.name} to cart`
      }
      className={`mx-4 mb-4 rounded-3xl overflow-hidden bg-paper-50 border border-ink-100 ${
        isOutOfStock ? 'opacity-60' : 'active:opacity-90'
      }`}
      style={{
        shadowColor: '#564E45',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <PerforationRow side="top" />

      <View className="paper-texture px-5 pt-3 pb-3">
        {/* Header: Image (left) + Name & SKU (right) */}
        <View className="flex-row items-start mb-2">
          {/* Image box */}
          <View className="w-12 h-12 rounded-xl bg-paper-100 border border-ink-150 overflow-hidden mr-3 items-center justify-center">
            {displayImageUri ? (
              <Image
                source={{ uri: displayImageUri }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <View className="w-full h-full bg-persimmon-50 items-center justify-center">
                <StyledText variant="black" className="text-persimmon-600 text-base">
                  {placeholderText}
                </StyledText>
              </View>
            )}
          </View>

          {/* Name & SKU */}
          <View className="flex-1 mr-2">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-h2 mb-1"
              numberOfLines={2}
            >
              {product.name}
            </StyledText>
            <View className="self-start bg-paper-100 border border-dashed border-ink-200 rounded-md px-2 py-0.5">
              <StyledText
                variant="medium"
                className="text-mono text-ink-500 text-[10px]"
              >
                SKU {product.sku}
              </StyledText>
            </View>
          </View>
        </View>

        {/* Dotted divider */}
        <View className="divider-dotted-thin mb-3" />

        {product.wholesale_price != null &&
          product.conversion_factor != null &&
          product.conversion_factor >= 2 && (
            <View className="flex-row items-center mb-3 bg-paper-100 rounded-xl p-1 border border-ink-100">
              <Pressable
                onPress={() => {
                  if (inCart && cartLine?.selected_unit !== 'retail') {
                    onToggleUnit?.(product.id);
                  } else if (!inCart) {
                    onAdd(product, 'retail');
                  }
                }}
                className={`flex-1 py-1.5 rounded-lg items-center ${
                  !inCart || cartLine?.selected_unit === 'retail'
                    ? 'bg-cinnamon-500 border border-cinnamon-600'
                    : ''
                }`}
              >
                <StyledText
                  variant="extrabold"
                  className={`text-xs ${
                    !inCart || cartLine?.selected_unit === 'retail'
                      ? 'text-paper-50'
                      : 'text-ink-700'
                  }`}
                >
                  Tingi ({product.retail_unit_name || 'Pc'})
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
                className={`flex-1 py-1.5 rounded-lg items-center ${
                  inCart && cartLine?.selected_unit === 'wholesale'
                    ? 'bg-cinnamon-500 border border-cinnamon-600'
                    : ''
                }`}
              >
                <StyledText
                  variant="extrabold"
                  className={`text-xs ${
                    inCart && cartLine?.selected_unit === 'wholesale'
                      ? 'text-paper-50'
                      : 'text-ink-700'
                  }`}
                >
                  Pakyaw ({product.wholesale_unit_name || 'Case'})
                </StyledText>
              </Pressable>
            </View>
          )}

        {/* Body: price + stock indicator (or stepper when in cart) */}
        {inCart && cartLine ? (
          <View className="flex-row items-center justify-between">
            <MoneyText
              value={displayPrice}
              size="lg"
              className="text-ink-700"
            />
            <StepperStamp
              quantity={cartLine.quantity}
              onDecrement={() => onUpdateQuantity(product.id, -1, activeUnit)}
              onIncrement={() => onUpdateQuantity(product.id, 1, activeUnit)}
              max={
                activeUnit === 'wholesale' && product.conversion_factor
                  ? Math.floor(product.quantity / product.conversion_factor)
                  : product.quantity
              }
            />
          </View>
        ) : (
          <View className="flex-row items-end justify-between">
            <View>
              <StyledText
                variant="medium"
                className="label-caps text-ink-400 mb-0.5"
              >
                Price
              </StyledText>
              <MoneyText
                value={displayPrice}
                size="xl"
                className="text-ink-900"
              />
            </View>
            <View className="items-end pb-0.5">
              <View className="flex-row items-center">
                <View
                  className="w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: dotColor }}
                />
                <StyledText
                  variant="semibold"
                  className={`text-xs ${
                    isOutOfStock
                      ? 'text-semantic-danger'
                      : isLowStock
                        ? 'text-semantic-warning'
                        : 'text-ink-700'
                  }`}
                >
                  {stockLabel}
                </StyledText>
              </View>
              {isLowStock && (
                <StyledText
                  variant="medium"
                  className="label-caps text-semantic-warning mt-1"
                >
                  Low stock
                </StyledText>
              )}
            </View>
          </View>
        )}
      </View>

      <PerforationRow side="bottom" />
      <View className="h-3" />
    </Pressable>
  );
}
