import { View } from 'react-native';
import { StyledText } from '@/components/elements';

/**
 * ReceiptHero
 *
 * A perforated-edge "receipt" surface used as a hero card on detail
 * screens (sale-details, credit-details). Composed entirely of RN
 * primitives — no SVG — so it renders cleanly inside a scroll view
 * and re-uses the same flat-list recycling pipeline.
 *
 * Two layers of horizontal scalloped perforations (top + bottom) sit
 * on either side of a paper-textured body. The body wraps arbitrary
 * children so the screen can place its title, totals, customer stamp
 * and itemised list inside.
 *
 * NOTE on text rendering: every text node is wrapped in <StyledText>.
 * React Native will throw "Text strings must be rendered within a
 * <Text> component" if a raw string lands inside a <View>.
 *
 * @example
 *   <ReceiptHero tone="persimmon">
 *     <ReceiptHeroHeader label="OFFICIAL RESIBO" code="№ 00482" />
 *     <ReceiptHeroTotal value={1250.5} currency />
 *   </ReceiptHero>
 */

type Tone = 'persimmon' | 'cinnamon' | 'sage';

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  headerLabel?: string;
  headerCode?: string;
  /** Number of perforation circles on each side. 22 looks good on phone widths. */
  perforations?: number;
};

const TONE_HEADER_BG: Record<Tone, string> = {
  persimmon: 'bg-persimmon-500',
  cinnamon: 'bg-cinnamon-500',
  sage: 'bg-sage-500',
};
const TONE_HEADER_TEXT: Record<Tone, string> = {
  persimmon: 'text-paper-50',
  cinnamon: 'text-paper-50',
  sage: 'text-paper-50',
};
const TONE_ACCENT: Record<Tone, string> = {
  persimmon: 'text-persimmon-600',
  cinnamon: 'text-cinnamon-700',
  sage: 'text-sage-600',
};

/**
 * Header strip at the top of the receipt. Renders above the
 * perforation so the eyebrow / label reads like a printed banner.
 */
function Header({
  tone,
  label,
  code,
}: {
  tone: Tone;
  label: string;
  code?: string;
}) {
  return (
    <View
      className={`${TONE_HEADER_BG[tone]} px-5 pt-5 pb-4 flex-row items-center justify-between`}
    >
      <View className="flex-row items-center">
        {/* Stamp dot — small paper dot like an inked stamp highlight */}
        <View className="w-2 h-2 rounded-full bg-paper-50 mr-3" />
        <StyledText
          variant="extrabold"
          className={`label-caps ${TONE_HEADER_TEXT[tone]} opacity-90`}
        >
          {label}
        </StyledText>
      </View>
      {code && (
        <StyledText
          variant="medium"
          className={`text-mono ${TONE_HEADER_TEXT[tone]} opacity-80`}
        >
          {code}
        </StyledText>
      )}
    </View>
  );
}

export function ReceiptHero({
  children,
  tone = 'persimmon',
  className = '',
  headerLabel,
  headerCode,
  perforations = 22,
}: Props) {
  return (
    <View
      className={`mx-4 rounded-3xl overflow-hidden bg-paper-50 shadow-paper-lift border border-ink-100 ${className}`}
    >
      {/* Top header strip */}
      <Header tone={tone} label={headerLabel || 'OFFICIAL RESIBO'} code={headerCode} />

      {/* Top perforation — circles sit just above the body, biting
			    into the header so the paper looks torn along this line. */}
      <View className="relative h-0">
        <View
          className="absolute left-0 right-0 h-3 flex-row justify-between"
          style={{ top: -6 }}
        >
          {Array.from({ length: perforations }).map((_, i) => (
            <View
              key={`top-${i}`}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#EFE6D2' }}
            />
          ))}
        </View>
      </View>

      {/* Body — paper-textured, holds the screen's content */}
      <View className="paper-texture">{children}</View>

      {/* Bottom perforation — circles bite up into the body */}
      <View className="relative h-0">
        <View
          className="absolute left-0 right-0 h-3 flex-row justify-between"
          style={{ bottom: -6 }}
        >
          {Array.from({ length: perforations }).map((_, i) => (
            <View
              key={`bot-${i}`}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#EFE6D2' }}
            />
          ))}
        </View>
      </View>

      {/* Empty tail strip to give the bottom perforation room */}
      <View className="h-3" />
    </View>
  );
}

/* ─── Sub-components used inside the receipt ───────────────────── */

export function ReceiptHeroMeta({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <View className="px-5 pt-5 pb-3">
      {rows.map((row, idx) => (
        <View
          key={row.label}
          className={`flex-row items-baseline justify-between py-1.5 ${
            idx < rows.length - 1 ? 'border-b border-dashed border-ink-200' : ''
          }`}
        >
          <StyledText variant="extrabold" className="label-caps text-ink-400">
            {row.label}
          </StyledText>
          <StyledText variant="medium" className="text-mono text-ink-700">
            {row.value}
          </StyledText>
        </View>
      ))}
    </View>
  );
}

export function ReceiptHeroTotal({
  label = 'AMOUNT DUE',
  amount,
  currency = '₱',
}: {
  label?: string;
  amount: number;
  currency?: string;
}) {
  const formatted = amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View className="px-5 py-5 bg-paper-100 border-y border-dashed border-ink-200">
      <StyledText variant="extrabold" className="label-caps text-ink-400 mb-2">
        {label}
      </StyledText>
      <View className="flex-row items-baseline">
        <StyledText
          variant="medium"
          className="text-mono text-ink-500 mr-2 text-base"
        >
          {currency}
        </StyledText>
        <StyledText variant="black" className="text-hero text-ink-900">
          {formatted}
        </StyledText>
      </View>
    </View>
  );
}

export function ReceiptHeroDivider({
  label,
  tone = 'persimmon',
}: {
  label?: string;
  tone?: Tone;
}) {
  return (
    <View className="px-5 py-3 flex-row items-center">
      <View className="flex-1 h-px bg-ink-200" />
      {label && (
        <StyledText
          variant="extrabold"
          className={`label-caps ${TONE_ACCENT[tone]} mx-3 opacity-80`}
        >
          {label}
        </StyledText>
      )}
      <View className="flex-1 h-px bg-ink-200" />
    </View>
  );
}
