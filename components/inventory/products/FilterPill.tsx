import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

export type FilterPillSize = 'md' | 'lg';
export type FilterPillTone = 'primary' | 'secondary';
export type FilterPillIcon = keyof typeof FontAwesome.glyphMap;

export interface FilterPillProps {
  /** Visible label. */
  label: string;
  /** Selected state — drives the fill, weight, and a11y `selected`. */
  selected: boolean;
  /** What happens on tap. */
  onPress: () => void;
  /** md ≈ 36pt + hitSlop = 44pt effective; lg ≈ 44pt visible (Stock Status). */
  size?: FilterPillSize;
  /** Tone: primary fills with cinnamon (Stock), secondary with ink (Alerts/Category). */
  tone?: FilterPillTone;
  /** Optional leading icon — alert kind glyphs on Inventory Alerts. */
  icon?: FilterPillIcon;
  /** Optional icon color override (alert-kind palette). */
  iconColor?: string;
  /** Optional count badge — shows after the label. */
  count?: number | string;
  /** Disable interaction (e.g. Add Category is always disabled until tapped). */
  disabled?: boolean;
  /** a11y override — defaults to a derived label. */
  accessibilityLabel?: string;
  /** a11y group hint (e.g. "Pick one stock status"). */
  accessibilityHint?: string;
}

/**
 * FilterPill — the only selectable pill shape in the product filter modal.
 * Collapses four near-identical inline blocks (Status, Alert, Category, Add)
 * into one component, so state changes (disabled, dim, new color) happen once.
 *
 * Sizing:
 *  - `md`  → vertical padding 2.5 (10px) + text-xs (~18px lh) ≈ 38px visible,
 *            `hitSlop 8/8/4/4` brings effective tap area to ≥ 44×44pt (POS-grade).
 *  - `lg`  → vertical padding 3 (12px) + text-sm (~20px lh) ≈ 44px visible
 *            without hitSlop — used for the primary Stock Status row.
 */
export function FilterPill({
  label,
  selected,
  onPress,
  size = 'md',
  tone = 'secondary',
  icon,
  iconColor,
  count,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: FilterPillProps) {
  // Fill + border — the only place classNames diverge across the four former
  // inline copies. Token names; no literals.
  const surface = selected
    ? tone === 'primary'
      ? 'bg-cinnamon-500 border-cinnamon-500'
      : 'bg-ink-900 border-ink-900'
    : 'bg-paper-100 border-ink-200';

  const textColor = selected ? 'text-paper-50' : 'text-ink-700';
  const weight = selected ? 'extrabold' : 'medium';
  const resize =
    size === 'lg' ? 'px-4 py-3 text-sm' : 'px-3.5 py-2.5 text-xs';

  // Hit area. lg already meets 44pt; md relies on hitSlop to reach it.
  const hitSlop =
    size === 'lg'
      ? { top: 2, bottom: 2, left: 2, right: 2 }
      : { top: 8, bottom: 8, left: 4, right: 4 };

  const resolvedIconColor =
    iconColor ?? (selected ? '#FAFAF7' : '#28231D');

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={
        accessibilityLabel ??
        (typeof count === 'number' ? `${label}, ${count} items` : label)
      }
      accessibilityHint={accessibilityHint}
      hitSlop={hitSlop}
      className={`${resize} ${surface} rounded-pill border justify-center flex-row items-center gap-1.5 ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      {icon ? (
        <FontAwesome name={icon} size={12} color={resolvedIconColor} />
      ) : null}
      <StyledText variant={weight} className={`text-xs ${textColor}`}>
        {label}
      </StyledText>
      {count !== undefined ? (
        <View
          className={`px-1.5 py-0.5 rounded-full ${
            selected ? 'bg-ink-700' : 'bg-paper-50'
          }`}
        >
          <StyledText
            variant="extrabold"
            className={`text-[10px] ${selected ? 'text-paper-50' : 'text-ink-900'}`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {count}
          </StyledText>
        </View>
      ) : null}
    </Pressable>
  );
}
