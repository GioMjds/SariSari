import type { NewSaleItem, Product } from '@/types';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { Image } from 'expo-image';
import { formatPesos, getProductImageUri } from '@/lib';
import { FontAwesome } from '@expo/vector-icons';

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

  return (
    <Pressable
      onPress={() => {
        if (isOutOfStock) return;
        if (!inCart) onAdd(product);
      }}
      disabled={isOutOfStock}
      accessibilityRole="button"
      accessibilityLabel={
        isOutOfStock
          ? `${product.name} out of stock`
          : `Add ${product.name} to cart`
      }
      className={`mx-4 mb-3 rounded-2xl bg-paper-100 border border-paper-300/80 p-3.5 shadow-card ${
        isOutOfStock ? 'opacity-60' : 'active:opacity-95'
      }`}
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
            <StyledText
              variant="black"
              className="text-persimmon-600 text-lg"
            >
              {placeholderText}
            </StyledText>
          )}
        </View>

        {/* Title, Category Badge & SKU */}
        <View className="flex-1">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-base leading-tight mb-1"
            numberOfLines={2}
          >
            {product.name}
          </StyledText>

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
            className={`flex-1 py-1.5 rounded-lg items-center min-h-[36px] justify-center ${
              !inCart || cartLine?.selected_unit === 'retail'
                ? 'bg-cinnamon-500 shadow-sm border border-cinnamon-600'
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
            className={`flex-1 py-1.5 rounded-lg items-center min-h-[36px] justify-center ${
              inCart && cartLine?.selected_unit === 'wholesale'
                ? 'bg-cinnamon-500 shadow-sm border border-cinnamon-600'
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
              <FontAwesome name="exclamation-triangle" size={10} color="#C77B0E" />
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
          <StyledText variant="extrabold" className="text-ink-900 text-lg leading-tight">
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

            <StyledText variant="extrabold" className="text-ink-900 text-sm px-3">
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
              if (!isOutOfStock) onAdd(product);
            }}
            disabled={isOutOfStock}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
            className={`bg-cinnamon-500 active:bg-cinnamon-600 rounded-xl px-4 py-2.5 flex-row items-center justify-center min-h-[44px] min-w-[44px] shadow-sm ${
              isOutOfStock ? 'opacity-40' : ''
            }`}
          >
            <FontAwesome name="plus" size={12} color="#FAFAF7" />
            <StyledText variant="extrabold" className="text-paper-50 text-sm ml-1.5">
              Add
            </StyledText>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
