import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';

type StockTone = 'out' | 'low' | 'ok';

const TONES = {
  out: {
    chip: 'bg-semantic-danger-50 border-semantic-danger/20',
    text: 'text-semantic-danger',
    icon: 'times-circle',
    color: '#C13030',
  },
  low: {
    chip: 'bg-semantic-warning-50 border-semantic-warning-100',
    text: 'text-semantic-warning-700',
    icon: 'exclamation-triangle',
    color: '#C77B0E',
  },
  ok: {
    chip: 'bg-paper-100 border-paper-300',
    text: 'text-ink-600',
    icon: 'check-circle',
    color: '#4F7A24',
  },
} as const;

export function getStockTone(quantity: number): StockTone {
  if (quantity <= 0) return 'out';
  return quantity <= LOW_STOCK_THRESHOLD ? 'low' : 'ok';
}

export function getStockLabel(quantity: number): string {
  const tone = getStockTone(quantity);
  if (tone === 'out') return 'Out of stock';
  if (tone === 'low') return `Low · ${quantity} left`;
  return `${quantity} in stock`;
}

interface StockBadgeProps {
  quantity: number;
  /** Positioning or overrides, e.g. "absolute bottom-2 left-2" for photo overlays. */
  className?: string;
}

/** Stock status chip with icon, text and color so status never relies on color alone. */
export function StockBadge({ quantity, className = '' }: StockBadgeProps) {
  const tone = TONES[getStockTone(quantity)];
  return (
    <View
      className={`flex-row items-center self-start border rounded-full px-2 py-0.5 ${tone.chip} ${className}`}
    >
      <FontAwesome name={tone.icon} size={10} color={tone.color} />
      <StyledText
        variant="semibold"
        className={`text-[11px] ml-1 ${tone.text}`}
      >
        {getStockLabel(quantity)}
      </StyledText>
    </View>
  );
}
