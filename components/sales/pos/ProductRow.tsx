import type { NewSaleItem, Product } from '@/types';
import { memo, useState } from 'react';
import { Pressable, View, type PressableStateCallbackType } from 'react-native';
import { StyledText } from '@/components/elements';
import { ProductThumb } from '@/components/ui/ProductThumb';
import { StockBadge, getStockLabel } from '@/components/ui/StockBadge';
import type { ViewMode } from '@/stores/useViewModeStore';
import { calculateBulkSavings, formatPesos } from '@/lib';
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
const LIST_CLASS =
  'mx-4 mb-2 p-2.5 rounded-2xl bg-paper-50 border border-paper-300';
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
  variant?: ViewMode;
}

/** POS catalog item: photo tile for the two-column grid, or a compact list row. */
function ProductRowImpl({
  product,
  cartLine,
  onAdd,
  onUpdateQuantity,
  onToggleUnit,
  onToggleFavorite,
  variant = 'grid',
}: ProductRowProps) {
  const [overStock, setOverStock] = useState(false);

  const handleToggleFavorite = () => onToggleFavorite(product);

  const isGrid = variant === 'grid';
  const isOutOfStock = product.quantity <= 0;
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

  const selectUnit = (unit: 'retail' | 'wholesale') => {
    if (inCart && cartLine?.selected_unit !== unit) {
      onToggleUnit?.(product.id);
    } else if (!inCart) {
      addProduct(unit);
    }
  };

  // Shared pieces, arranged differently by the grid and list layouts below.
  const photoOverlays = (
    <>
      {isOutOfStock ? (
        <View className="absolute inset-0 bg-paper-50/50" />
      ) : null}
      {inCart ? (
        <View
          className={`absolute bg-cinnamon-500 rounded-full flex-row items-center ${
            isGrid ? 'top-2 left-2 px-2 py-0.5' : 'top-1 left-1 px-1.5'
          }`}
        >
          <FontAwesome name="shopping-basket" size={9} color="#FAFAF7" />
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-[11px] ml-1"
          >
            {cartLine!.quantity}
          </StyledText>
        </View>
      ) : null}
    </>
  );

  const favoriteButton = (
    <Pressable
      onPress={handleToggleFavorite}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={
        product.is_favorite
          ? `Unstar ${product.name}`
          : `Star ${product.name} for Fast Lane`
      }
      className={`w-9 h-9 rounded-full items-center justify-center ${
        isGrid
          ? 'absolute top-1.5 right-1.5 bg-paper-50/90 border border-paper-300'
          : ''
      }`}
    >
      <FontAwesome
        name={product.is_favorite ? 'star' : 'star-o'}
        size={15}
        color={product.is_favorite ? '#E85A1F' : '#7A7165'}
      />
    </Pressable>
  );

  const priceLine = (
    <View className="flex-row items-baseline">
      <StyledText variant="extrabold" className="text-ink-900 text-base">
        {formatPesos(displayPrice)}
      </StyledText>
      <StyledText variant="medium" className="text-ink-500 text-[11px] ml-1">
        / {displayUnitLabel}
      </StyledText>
    </View>
  );

  const savingsLine =
    bulkSavings.savings > 0 ? (
      <StyledText
        variant="semibold"
        className="text-sage-700 text-[11px]"
        numberOfLines={1}
      >
        Save {formatPesos(bulkSavings.savings)} per {wholesaleUnitLabel}
      </StyledText>
    ) : null;

  // Tingi vs Pakyaw unit picker for bundle products.
  const unitPicker = bulkSavings.hasWholesale ? (
    <View className="flex-1 flex-row bg-paper-200 border border-paper-300 rounded-xl p-0.5 gap-0.5">
      <Pressable
        onPress={() => selectUnit('retail')}
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
        onPress={() => selectUnit('wholesale')}
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
  ) : null;

  const stepper =
    inCart && cartLine ? (
      <View
        className={`flex-row items-center justify-between bg-paper-200 border border-paper-300 rounded-xl p-0.5 ${
          isGrid ? '' : 'w-[124px]'
        }`}
      >
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
    ) : null;

  // Single-unit products not yet in the cart get an explicit Add button.
  const addButton =
    !inCart && !bulkSavings.hasWholesale ? (
      <Pressable
        onPress={() => {
          if (!isOutOfStock) addProduct();
        }}
        disabled={isOutOfStock}
        accessibilityRole="button"
        accessibilityLabel={`Add ${product.name} to cart`}
        className={`${ADD_BUTTON_CLASS} ${isGrid ? '' : 'px-3.5'} ${
          isOutOfStock ? 'opacity-40' : ''
        }`}
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
    ) : null;

  const overStockText = overStock ? (
    <StyledText
      variant="semibold"
      className={`text-semantic-danger text-[11px] ${isGrid ? 'text-center' : 'text-right mt-1'}`}
      accessibilityLiveRegion="polite"
    >
      Max stock reached
    </StyledText>
  ) : null;

  const pressableProps = {
    onPress: () => {
      if (!isOutOfStock && !inCart) addProduct();
    },
    onLongPress: handleToggleFavorite,
    delayLongPress: 400,
    disabled: isOutOfStock,
    accessibilityRole: 'button' as const,
    accessibilityState: { disabled: isOutOfStock },
    accessibilityLabel: isOutOfStock
      ? `${product.name}, out of stock`
      : inCart
        ? `${product.name}, ${cartLine!.quantity} in cart`
        : `Add ${product.name} to cart, ${formatPesos(product.price)}, ${getStockLabel(product.quantity)}`,
    style: PRESS_TILE,
  };

  if (!isGrid) {
    const hasBottomRow = !!unitPicker || !!stepper;
    return (
      <Pressable
        {...pressableProps}
        className={isOutOfStock ? `${LIST_CLASS} opacity-60` : LIST_CLASS}
      >
        <View className="flex-row items-center gap-3">
          <ProductThumb
            name={product.name}
            imageUri={product.image_uri}
            className="w-14 h-14 rounded-xl border border-paper-300"
            initialsClassName="text-base"
          >
            {photoOverlays}
          </ProductThumb>

          <View className="flex-1 min-w-0 gap-0.5">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-sm leading-tight"
              numberOfLines={2}
            >
              {product.name}
            </StyledText>
            {priceLine}
            <StockBadge quantity={product.quantity} />
          </View>

          <View className="items-end self-stretch justify-between">
            {favoriteButton}
            {addButton}
          </View>
        </View>

        {hasBottomRow ? (
          <View className="flex-row items-center gap-2 mt-2.5">
            {unitPicker ?? (
              <StyledText
                variant="semibold"
                className="flex-1 text-ink-600 text-xs"
                numberOfLines={1}
              >
                In cart ·{' '}
                {formatPesos(displayPrice * (cartLine?.quantity ?? 0))}
              </StyledText>
            )}
            {stepper}
          </View>
        ) : null}
        {overStockText}
      </Pressable>
    );
  }

  return (
    <Pressable
      {...pressableProps}
      className={isOutOfStock ? `${TILE_CLASS} opacity-60` : TILE_CLASS}
    >
      <ProductThumb
        name={product.name}
        imageUri={product.image_uri}
        className="w-full h-24"
        initialsClassName="text-3xl"
      >
        {photoOverlays}
        <StockBadge
          quantity={product.quantity}
          className="absolute bottom-2 left-2"
        />
        {bulkSavings.hasWholesale ? (
          <View className="absolute bottom-2 right-2 bg-sage-50 border border-sage-200 rounded-full w-6 h-6 items-center justify-center">
            <FontAwesome name="cubes" size={10} color="#4F7A24" />
          </View>
        ) : null}
      </ProductThumb>

      {/* Favorite toggle sits outside the decorative thumb so it stays reachable. */}
      {favoriteButton}

      <View className="flex-1 p-2.5">
        <StyledText
          variant="extrabold"
          // Three reserved lines keep size and flavor visible and align prices across a row.
          className="text-ink-900 text-[13px] leading-[17px] min-h-[51px]"
          numberOfLines={3}
        >
          {product.name}
        </StyledText>
        <View className="mt-1">{priceLine}</View>
        {savingsLine}

        <View className="mt-auto pt-2 gap-2">
          {unitPicker ? <View className="flex-row">{unitPicker}</View> : null}
          {stepper}
          {addButton}
          {overStockText}
        </View>
      </View>
    </Pressable>
  );
}

export const ProductRow = memo(ProductRowImpl);
