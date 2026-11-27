import { View, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { formatPesos } from '@/lib/money';

interface CategoryStickyBarProps {
  totalValue: number;
  productCount: number;
  onAddProduct: () => void;
}

export function CategoryStickyBar({
  totalValue,
  productCount,
  onAddProduct,
}: CategoryStickyBarProps) {
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  return (
    <MotiView
      from={{
        opacity: reducedMotion ? 1 : 0,
        translateY: reducedMotion ? 0 : 24,
      }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: reducedMotion ? 0 : 240 }}
      className="absolute bottom-0 left-0 right-0"
    >
      <View
        className="px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}
      >
        <View className="bg-cinnamon-500 rounded-2xl shadow-paper-lift px-5 py-3.5 flex-row items-center justify-between">
          <View
            className="flex-1"
            accessible
            accessibilityLabel={`Category value ${formatPesos(totalValue)}`}
          >
            <StyledText
              variant="medium"
              className="text-caption text-paper-200"
            >
              Category value · {productCount}{' '}
              {productCount === 1 ? 'product' : 'products'}
            </StyledText>
            <StyledText
              variant="black"
              className="text-paper-50 text-2xl mt-0.5"
              style={{ letterSpacing: -0.4, fontVariant: ['tabular-nums'] }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPesos(totalValue)}
            </StyledText>
          </View>

          <Pressable
            onPress={onAddProduct}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add product to this category"
            className="flex-row items-center bg-persimmon-500 rounded-pill px-5 min-h-[48px] ml-3 active:bg-persimmon-700"
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
  );
}
