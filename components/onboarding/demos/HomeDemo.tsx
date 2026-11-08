import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { HintRing } from '@/components/onboarding/HintRing';
import { formatPesos } from '@/lib/money';
import type { DemoProps } from './types';

const TILES = [
  {
    id: 'sales',
    labelKey: 'demoHomeTileSales',
    bubbleKey: 'demoHomeSalesBubble',
    value: formatPesos(1250),
  },
  {
    id: 'items',
    labelKey: 'demoHomeTileItems',
    bubbleKey: 'demoHomeItemsBubble',
    value: '48',
  },
  {
    id: 'credit',
    labelKey: 'demoHomeTileCredit',
    bubbleKey: 'demoHomeCreditBubble',
    value: formatPesos(320),
  },
] as const;

export function HomeDemo({ say, complete }: DemoProps) {
  const { t } = useTranslation('onboarding');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View className="flex-row gap-2">
      {TILES.map((tile, idx) => {
        const isSelected = selected === tile.id;
        return (
          <View key={tile.id} className="flex-1">
            <HintRing active={selected === null && idx === 0}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(tile.labelKey)}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  setSelected(tile.id);
                  say(tile.bubbleKey);
                  complete();
                }}
                className={`min-h-[88px] justify-between rounded-2xl border p-3 ${
                  isSelected
                    ? 'bg-persimmon-50 border-persimmon-400'
                    : 'bg-paper-100 border-paper-300'
                }`}
              >
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-caption"
                >
                  {t(tile.labelKey)}
                </StyledText>
                <StyledText variant="extrabold" className="text-ink-900 text-base">
                  {tile.value}
                </StyledText>
              </Pressable>
            </HintRing>
          </View>
        );
      })}
    </View>
  );
}
