import type { NewSaleItem, Product } from '@/types';
import { memo, useState } from 'react';
import { Pressable, View, type PressableStateCallbackType } from 'react-native';
import { StyledText } from '@/components/elements';
import { ProductThumb } from '@/components/ui/ProductThumb';
import { calculateBulkSavings, formatPesos } from '@/lib';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import { FontAwesome } from '@expo/vector-icons';

// Pressed colors as Pressable style functions; NativeWind active: classes add a per-node interaction wrapper.
const pressedBg =
  (backgroundColor: string) =>
  ({ pressed }: PressableStateCallbackType) =>
    pressed ? { backgroundColor } : null;
const PRESS_TILE = pressedBg('#F2F0E8'); // paper-100
const PRESS_CINNAMON = pressedBg('#4D2810'); // cinnamon-600
const PRESS_PAPER = pressedBg('#F7F6F2'); // paper-200
const PRESS_PAPER_DEEP = pressedBg('#E6E3D8'); // paper-300
const PRESS_SAGE = pressedBg('#2C4413'); // sage-700

const TILE_CLASS =
  'w-[48.5%] mb-3 rounded-2xl bg-paper-50 border border-paper-300 overflow-hidden';
const SEGMENT_BASE =
  'flex-1 rounded-lg px-1 py-1 items-center justify-center min-h-[44px]';
const ADD_BUTTON_CLASS =
  'bg-cinnamon-500 rounded-xl flex-row items-center justify-center min-h-[44px]';

interface ProductRowProps {
  product: Product;
  cartLine?: NewSaleItem;
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
  onToggleFavorite: (product: Product) => void;
}

/** POS catalog tile: photo-first card laid out in a two-column grid. */
function ProductRowImpl({
  product,
  cartLine,
  onAdd,
  onUpdateQuantity,
  onToggleUnit,
  onToggleFavorite,
}: ProductRowProps) {
  const [overStock, setOverStock] = useState(false);

  const handleToggleFavorite = () => onToggleFavorite(product);

  const isOutOfStock = product.quantity <= 0;
  const isLowStock = !isOutOfStock && product.quantity <= LOW_STOCK_THRESHOLD;
  const inCart = !!cartLine;
  const activeUnit = cartLine?.selected_unit || 'retail';
  const displayPrice = inCart ? cartLine!.price : product.price;

  const bulkSavings = calculateBulkSavings(product);
  const retailUnitLabel = product.retail_unit_name || 'PC';
  const wholesaleUnitLabel = product.wholesale_unit_name || 'PK';
  const displayUnitLabel =
    activeUnit === 'wholesale' ? wholesaleUnitLabel : retailUnitLabel;

  const isRetailActive = !inCart || cartLine?.selected_unit === 'retail';
  const isWholesaleActive = inCart && cartLine?.selected_unit === 'wholesale';

  const addProduct = (unit?: 'retail' | 'wholesale') => {
    const result = unit ? onAdd(product, unit) : onAdd(product);
    setOverStock(result === 'over_stock');
  };

  const stockText = isOutOfStock
    ? 'Out of stock'
    : isLowStock
      ? `${product.quantity} left`
      : `${product.quantity} ${retailUnitLabel}`;

  return (
    <Pressable
      onPress={() => {
        if (!isOutOfStock && !inCart) addProduct();
      }}
      onLongPress={handleToggleFavorite}
      delayLongPress={400}
      disabled={isOutOfStock}
      accessibilityRole="button"
      accessibilityState={{ disabled: isOutOfStock }}
      accessibilityLabel={
        isOutOfStock
          ? `${product.name}, out of stock`
          : inCart
            ? `${product.name}, ${cartLine!.quantity} in cart`
            : `Add ${product.name} to cart, ${formatPesos(product.price)}, ${stockText}`
      }
      className={isOutOfStock ? `${TILE_CLASS} opacity-60` : TILE_CLASS}
      style={PRESS_TILE}
    >
      {/* Photo with status overlays */}
      <ProductThumb
        name={product.name}
        imageUri={product.image_uri}
        className="w-full h-28"
        initialsClassName="text-3xl"
      >
        {isOutOfStock ? (
          <View className="absolute inset-0 bg-paper-50/50" />
        ) : null}

        {inCart ? (
          <View className="absolute top-2 left-2 bg-cinnamon-500 rounded-full px-2 py-0.5 flex-row items-center">
            <FontAwesome name="shopping-basket" size={9} color="#FAFAF7" />
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-[11px] ml-1"
            >
              {cartLine!.quantity}
            </StyledText>
          </View>
        ) : null}

        <View
          className={`absolute bottom-2 left-2 rounded-full px-2 py-0.5 flex-row items-center border ${
            isOutOfStock
              ? 'bg-semantic-danger-50 border-semantic-danger/20'
              : isLowStock
                ? 'bg-semantic-warning-50 border-semantic-warning-100'
                : 'bg-paper-50/90 border-paper-300'
          }`}
        >
          {isOutOfStock || isLowStock ? (
            <FontAwesome
              name={isOutOfStock ? 'times-circle' : 'exclamation-triangle'}
              size={9}
              color={isOutOfStock ? '#C13030' : '#C77B0E'}
              style={{ marginRight: 3 }}
            />
          ) : null}
          <StyledText
            variant="semibold"
            className={`text-[11px] ${
              isOutOfStock
                ? 'text-semantic-danger'
                : isLowStock
                  ? 'text-semantic-warning'
                  : 'text-ink-700'
            }`}
          >
            {stockText}
          </StyledText>
        </View>

        {bulkSavings.hasWholesale ? (
          <View className="absolute bottom-2 right-2 bg-sage-50 border border-sage-200 rounded-full w-6 h-6 items-center justify-center">
            <FontAwesome name="cubes" size={10} color="#4F7A24" />
          </View>
        ) : null}
      </ProductThumb>

      {/* Favorite toggle sits outside the decorative thumb so it stays reachable. */}
      <Pressable
        onPress={handleToggleFavorite}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={
          product.is_favorite
            ? `Unstar ${product.name}`
            : `Star ${product.name} for Fast Lane`
        }
        className="absolute top-1.5 right-1.5 w-9 h-9 rounded-full bg-paper-50/90 border border-paper-300 items-center justify-center"
      >
        <FontAwesome
          name={product.is_favorite ? 'star' : 'star-o'}
          size={15}
          color={product.is_favorite ? '#E85A1F' : '#7A7165'}
        />
      </Pressable>

      <View className="flex-1 p-2.5">
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-sm leading-tight min-h-[36px]"
          numberOfLines={2}
        >
          {product.name}
        </StyledText>

        <View className="flex-row items-baseline mt-1">
          <StyledText variant="extrabold" className="text-ink-900 text-base">
            {formatPesos(displayPrice)}
          </StyledText>
          <StyledText
            variant="medium"
            className="text-ink-500 text-[11px] ml-1"
          >
            / {displayUnitLabel}
          </StyledText>
        </View>

        {bulkSavings.savings > 0 ? (
          <StyledText
            variant="semibold"
            className="text-sage-700 text-[11px]"
            numberOfLines={1}
          >
            Save {formatPesos(bulkSavings.savings)} per {wholesaleUnitLabel}
          </StyledText>
        ) : null}

        <View className="mt-auto pt-2 gap-2">
          {/* Tingi vs Pakyaw unit picker for bundle products */}
          {bulkSavings.hasWholesale ? (
            <View className="flex-row bg-paper-200 border border-paper-300 rounded-xl p-0.5 gap-0.5">
              <Pressable
                onPress={() => {
                  if (inCart && cartLine?.selected_unit !== 'retail') {
                    onToggleUnit?.(product.id);
                  } else if (!inCart) {
                    addProduct('retail');
                  }
                }}
                disabled={isOutOfStock}
                accessibilityRole="button"
                accessibilityState={{ selected: inCart && isRetailActive }}
                accessibilityLabel={`Tingi, per ${retailUnitLabel}, ${formatPesos(product.price)}`}
                className={`${SEGMENT_BASE} ${isRetailActive ? 'bg-cinnamon-500' : ''}`}
                style={isRetailActive ? PRESS_CINNAMON : PRESS_PAPER}
              >
                <StyledText
                  variant="semibold"
                  className={`text-[11px] ${isRetailActive ? 'text-paper-50' : 'text-ink-600'}`}
                  numberOfLines={1}
                >
                  {inCart ? '' : '+ '}Tingi
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className={`text-xs ${isRetailActive ? 'text-paper-50' : 'text-ink-900'}`}
                  numberOfLines={1}
                >
                  {formatPesos(product.price)}
                </StyledText>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (inCart && cartLine?.selected_unit !== 'wholesale') {
                    onToggleUnit?.(product.id);
                  } else if (!inCart) {
                    addProduct('wholesale');
                  }
                }}
                disabled={isOutOfStock}
                accessibilityRole="button"
                accessibilityState={{ selected: isWholesaleActive }}
                accessibilityLabel={`Pakyaw, per ${wholesaleUnitLabel} of ${product.conversion_factor}, ${formatPesos(product.wholesale_price || 0)}`}
                className={`${SEGMENT_BASE} ${isWholesaleActive ? 'bg-sage-600' : ''}`}
                style={isWholesaleActive ? PRESS_SAGE : PRESS_PAPER}
              >
                <StyledText
                  variant="semibold"
                  className={`text-[11px] ${isWholesaleActive ? 'text-paper-50' : 'text-sage-700'}`}
                  numberOfLines={1}
                >
                  {inCart ? '' : '+ '}Pakyaw ×{product.conversion_factor}
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className={`text-xs ${isWholesaleActive ? 'text-paper-50' : 'text-ink-900'}`}
                  numberOfLines={1}
                >
                  {formatPesos(product.wholesale_price || 0)}
                </StyledText>
              </Pressable>
            </View>
          ) : null}

          {/* Stepper when in cart, full-width Add for single-unit products */}
          {inCart && cartLine ? (
            <View className="flex-row items-center justify-between bg-paper-200 border border-paper-300 rounded-xl p-0.5">
              <Pressable
                onPress={() => {
                  onUpdateQuantity(product.id, -1, activeUnit);
                  setOverStock(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  cartLine.quantity <= 1
                    ? `Remove ${product.name} from cart`
                    : `Decrease quantity for ${product.name}`
                }
                className="w-11 h-11 rounded-lg bg-paper-50 items-center justify-center border border-paper-300"
                style={PRESS_PAPER_DEEP}
              >
                <FontAwesome
                  name={cartLine.quantity <= 1 ? 'trash-o' : 'minus'}
                  size={13}
                  color="#4D2810"
                />
              </Pressable>

              <StyledText
                variant="extrabold"
                className="text-ink-900 text-base"
                accessibilityLiveRegion="polite"
              >
                {cartLine.quantity}
              </StyledText>

              <Pressable
                onPress={() => {
                  const result = onUpdateQuantity(product.id, 1, activeUnit);
                  if (result === 'over_stock') setOverStock(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Increase quantity for ${product.name}`}
                className="w-11 h-11 rounded-lg bg-cinnamon-500 items-center justify-center"
                style={PRESS_CINNAMON}
              >
                <FontAwesome name="plus" size={13} color="#FAFAF7" />
              </Pressable>
            </View>
          ) : !bulkSavings.hasWholesale ? (
            <Pressable
              onPress={() => {
                if (!isOutOfStock && !inCart) addProduct();
              }}
              disabled={isOutOfStock}
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name} to cart`}
              className={
                isOutOfStock
                  ? `${ADD_BUTTON_CLASS} opacity-40`
                  : ADD_BUTTON_CLASS
              }
              style={PRESS_CINNAMON}
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

          {overStock ? (
            <StyledText
              variant="semibold"
              className="text-semantic-danger text-[11px] text-center"
              accessibilityLiveRegion="polite"
            >
              Max stock reached
            </StyledText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const ProductRow = memo(ProductRowImpl);
