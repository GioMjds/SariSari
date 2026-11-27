import { View, Pressable, type LayoutChangeEvent } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { formatPesos } from '@/lib/money';

// Tablets and landscape get one centered column instead of a stretched phone layout.
export const CATEGORY_FRAME_STYLE = {
  width: '100%',
  maxWidth: 640,
  alignSelf: 'center',
} as const;

interface CategoryStickyBarProps {
  totalValue: number;
  productCount: number;
  onAddProduct: () => void;
  /** Reports the bar's height so the scroll view can clear it at any text size. */
  onHeight: (height: number) => void;
}

export function CategoryStickyBar({
  totalValue,
  productCount,
  onAddProduct,
  onHeight,
}: CategoryStickyBarProps) {
  const { t } = useTranslation('inventory');
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const value = formatPesos(totalValue);

  return (
    <MotiView
      from={{
        opacity: reducedMotion ? 1 : 0,
        translateY: reducedMotion ? 0 : 24,
      }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: reducedMotion ? 0 : 240 }}
      className="absolute bottom-0 left-0 right-0"
      onLayout={(e: LayoutChangeEvent) => onHeight(e.nativeEvent.layout.height)}
    >
      <View
        className="px-4 pt-3"
        style={[
          CATEGORY_FRAME_STYLE,
          {
            paddingBottom: Math.max(insets.bottom, 12) + 8,
            paddingLeft: 16 + insets.left,
            paddingRight: 16 + insets.right,
          },
        ]}
      >
        <View className="bg-cinnamon-500 rounded-2xl shadow-paper-lift px-5 py-3.5 flex-row items-center justify-between">
          <View
            className="flex-1"
            accessible
            accessibilityLabel={t('category_valueA11y', { value })}
          >
            <StyledText
              variant="medium"
              className="text-caption text-paper-200"
              numberOfLines={2}
            >
              {t('category_value', {
                products: t('category_productCount', { count: productCount }),
              })}
            </StyledText>
            <StyledText
              variant="black"
              className="text-paper-50 text-2xl mt-0.5"
              style={{ letterSpacing: -0.4, fontVariant: ['tabular-nums'] }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {value}
            </StyledText>
          </View>

          <Pressable
            onPress={onAddProduct}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('category_addProductA11y')}
            className="flex-row items-center bg-persimmon-600 rounded-pill px-5 min-h-[48px] ml-3 active:bg-persimmon-700"
          >
            <Ionicons name="add" size={18} className="text-paper-50" />
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-sm ml-1.5"
            >
              {t('category_addProduct')}
            </StyledText>
          </Pressable>
        </View>
      </View>
    </MotiView>
  );
}
