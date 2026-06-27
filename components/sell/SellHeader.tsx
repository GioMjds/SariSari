import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Pressable, View } from 'react-native';

interface SellHeaderProps {
  /** Eyebrow label shown above the title (e.g. "Resibo Book"). */
  eyebrow: string;
  /** Big title (e.g. "My Sales"). */
  title: string;
  /** Count line shown under the title. Pass `null` to skip. */
  subtitle?: string | null;
  /** Number of currently active filters — drives the badge on the filter button. */
  activeFilterCount: number;
  /** Tap handlers for the filter button and the new-sale CTA. */
  onOpenFilters: () => void;
  onOpenAddSales: () => void;
  /** A11y labels for the filter + new-sale buttons. */
  filterA11yLabel: string;
  newSaleA11yLabel: string;
}

/**
 * SellHeader — cinnamon hero bar that sits at the top of the Sell tab.
 *
 * Layout (top → bottom):
 *   • Monogram avatar (₱ chip) + label-caps eyebrow on the left.
 *   • Row of [title + subtitle]  +  [filter button + new-sale CTA].
 *
 * Wrapped in a MotiView fade so the header animates in once on mount.
 * Pure presentational — receives everything it renders as props.
 */
export function SellHeader({
  eyebrow,
  title,
  subtitle,
  activeFilterCount,
  onOpenFilters,
  onOpenAddSales,
  filterA11yLabel,
  newSaleA11yLabel,
}: SellHeaderProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 320 }}
    >
      <View className="bg-cinnamon-500 px-5 pt-3 pb-5">
        {/* small monogram dot + eyebrow */}
        <View className="flex-row items-center mb-3">
          <View
            className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center mr-2"
            style={{
              shadowColor: '#564E45',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <StyledText variant="black" className="text-paper-50 text-xl">
              ₱
            </StyledText>
          </View>
          <StyledText
            variant="extrabold"
            className="label-caps text-paper-200 opacity-80"
          >
            {eyebrow}
          </StyledText>
        </View>

        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <StyledText
              variant="black"
              className="text-paper-50 text-h1"
            >
              {title}
            </StyledText>
            {subtitle ? (
              <StyledText
                variant="regular"
                className="text-paper-200 text-sm mt-1 opacity-90"
              >
                {subtitle}
              </StyledText>
            ) : null}
          </View>

          <View className="flex-row items-center gap-2">
            {/* Filter button */}
            <Pressable
              hitSlop={12}
              onPress={onOpenFilters}
              accessibilityRole="button"
              accessibilityLabel={filterA11yLabel}
              className="relative w-11 h-11 rounded-full items-center justify-center"
              style={({ pressed }) => ({
                backgroundColor: 'rgba(251, 247, 238, 0.15)', // bg-paper-50/15
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <FontAwesome name="sliders" size={18} color="#FBF7EE" />
              {activeFilterCount > 0 && (
                <View className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-persimmon-500 items-center justify-center border-2 border-cinnamon-500">
                  <StyledText
                    variant="black"
                    className="text-paper-50 text-[10px]"
                  >
                    {activeFilterCount}
                  </StyledText>
                </View>
              )}
            </Pressable>

            {/* New sale entry point — pushes the AddSales modal route */}
            <Pressable
              hitSlop={12}
              onPress={onOpenAddSales}
              accessibilityRole="button"
              accessibilityLabel={newSaleA11yLabel}
              className="w-11 h-11 rounded-full items-center justify-center bg-persimmon-500"
              style={({ pressed }) => ({
                shadowColor: '#564E45',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 6,
                elevation: 3,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <FontAwesome name="plus" size={18} color="#FBF7EE" />
            </Pressable>
          </View>
        </View>
      </View>
    </MotiView>
  );
}