import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos, Pesos } from '@/lib/money';

interface AddCustomerHeaderProps {
  /** Currently typed customer name (drives the Passbook preview). */
  name: string;
  /** Currently typed phone number (drives the Passbook preview). */
  phone: string;
  /** True when a non-zero credit limit has been entered. */
  hasLimit: boolean;
  /** Parsed credit-limit value in integer pesos. */
  parsedLimit: number | Pesos;
  onBack: () => void;
}

/**
 * AddCustomerHeader — top bar with back button, title eyebrow, and
 * the dark `bg-cinnamon-500` Suki Passbook hero card.
 *
 * The Passbook card updates in real time as the user types into the
 * form below. An empty credit limit renders as "No Limit" in
 * `text-persimmon-300` to denote open-ended borrowing; a valid
 * value formats via `formatPesos`.
 *
 * The large semi-transparent `₱` glyph sits absolutely-positioned in
 * the top-right of the card as a decorative "watermark".
 */
export function AddCustomerHeader({
  name,
  phone,
  hasLimit,
  parsedLimit,
  onBack,
}: AddCustomerHeaderProps) {
  const displayName = name?.trim() ? name.trim() : 'Suki Name';
  const isNamePlaceholder = !name?.trim();

  return (
    <View className="px-5 pt-3 pb-4 bg-background">
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <View className="items-center">
          <StyledText variant="extrabold" className="text-ink-900 text-h2">
            New Suki
          </StyledText>
          <StyledText
            variant="medium"
            className="label-caps text-ink-400 mt-0.5"
          >
            Customer Passbook
          </StyledText>
        </View>

        <View className="w-10 h-10" />
      </View>

      {/* Passbook Hero Card — dark cinnamon, with a decorative ₱
          watermark in the corner and a "New Suki" tag. */}
      <View className="bg-cinnamon-500 rounded-3xl shadow-paper-deep px-5 py-4 overflow-hidden relative">
        {/* Decorative ₱ watermark */}
        <StyledText
          variant="black"
          className="absolute -right-2 -top-3 text-paper-100 opacity-10 text-[120px] leading-none"
        >
          ₱
        </StyledText>

        <View className="flex-row items-center justify-between mb-3 relative">
          <View className="bg-persimmon-500/20 border border-persimmon-500 rounded-pill px-2.5 py-1">
            <StyledText
              variant="extrabold"
              className="label-caps text-persimmon-300"
            >
              New Suki
            </StyledText>
          </View>
          <StyledText
            variant="medium"
            className="label-caps text-paper-200 opacity-90"
          >
            Member Card
          </StyledText>
        </View>

        {/* Live name binding */}
        <StyledText
          variant="extrabold"
          className={`text-h3 relative ${isNamePlaceholder ? 'text-paper-200 opacity-60' : 'text-paper-50'}`}
          numberOfLines={1}
        >
          {displayName}
        </StyledText>

        {/* Phone + credit-limit row */}
        <View className="flex-row items-end justify-between mt-3 relative">
          <View className="flex-1 pr-3">
            <StyledText
              variant="medium"
              className="label-caps text-paper-200 opacity-90"
            >
              Phone
            </StyledText>
            <StyledText
              variant="semibold"
              className={`text-sm mt-0.5 ${phone?.trim() ? 'text-paper-50' : 'text-paper-200 opacity-60'}`}
              numberOfLines={1}
            >
              {phone?.trim() || '—'}
            </StyledText>
          </View>

          <View className="items-end">
            <StyledText
              variant="medium"
              className="label-caps text-paper-200 opacity-90"
            >
              Credit Limit
            </StyledText>
            {hasLimit ? (
              <StyledText
                variant="extrabold"
                className="text-paper-50 text-base mt-0.5"
              >
                {formatPesos(parsedLimit)}
              </StyledText>
            ) : (
              <StyledText
                variant="extrabold"
                className="text-persimmon-300 text-base mt-0.5"
              >
                No Limit
              </StyledText>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}