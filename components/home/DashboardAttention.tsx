import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import { DashboardSection } from './DashboardSection';
import type { AttentionItem, HomeDestination } from './home-state';

export interface DashboardAttentionProps {
  items: AttentionItem[];
  onPress: (destination: HomeDestination) => void;
}

type Glyph = keyof typeof FontAwesome.glyphMap;

const TONES = {
  danger: { box: 'bg-semantic-danger-50', color: '#C13030' },
  warning: { box: 'bg-semantic-warning-50', color: '#8F5A0A' },
  info: { box: 'bg-semantic-info-50', color: '#2E6FA8' },
} as const;

const ICONS = {
  outOfStock: 'ban',
  lowStock: 'exclamation-triangle',
  overdueUtang: 'clock-o',
  supplierDue: 'truck',
  stocktake: 'clipboard',
} satisfies Record<AttentionItem['kind'], Glyph>;

function describe(item: AttentionItem, t: TFunction) {
  switch (item.kind) {
    case 'outOfStock':
      return {
        title: t('dashboard.attention.outOfStock', { count: item.count }),
        sub: t('dashboard.attention.outOfStockSub'),
      };
    case 'lowStock':
      return {
        title: t('dashboard.attention.lowStock', { count: item.count }),
        sub: t('dashboard.attention.lowStockSub'),
      };
    case 'overdueUtang':
      return {
        title: t('dashboard.attention.overdue', { count: item.count }),
        sub: t('dashboard.attention.overdueSub', {
          amount: formatPesos(item.amount ?? 0),
        }),
      };
    case 'supplierDue':
      return {
        title: t(
          item.overdue
            ? 'dashboard.attention.supplierOverdue'
            : 'dashboard.attention.supplierDueSoon',
          { count: item.count },
        ),
        sub: t('dashboard.attention.supplierDueSub', {
          amount: formatPesos(item.amount ?? 0),
        }),
      };
    case 'stocktake': {
      const s = item.stocktake;
      return {
        title:
          s?.status === 'inProgress'
            ? t('dashboard.stocktakeNudge.inProgress')
            : s?.status === 'stale'
              ? t('dashboard.stocktakeNudge.stale', { count: s.days })
              : t('dashboard.stocktakeNudge.never'),
        sub: t('dashboard.stocktakeNudge.sub'),
      };
    }
  }
}

export const DashboardAttention = memo(function DashboardAttention({
  items,
  onPress,
}: DashboardAttentionProps) {
  const { t } = useTranslation('common');

  return (
    <DashboardSection
      testID="home-attention"
      title={t('dashboard.attention.title', {
        defaultValue: 'Needs attention',
      })}
    >
      {items.length === 0 ? (
        <View className="flex-row items-center px-4 py-4">
          <View className="w-10 h-10 rounded-xl bg-sage-50 items-center justify-center mr-3">
            <FontAwesome name="check" size={16} color="#3D5E1B" />
          </View>
          <View className="flex-1">
            <StyledText variant="semibold" className="text-sm text-ink-900">
              {t('dashboard.attention.clearTitle')}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-caption text-ink-500 mt-0.5"
            >
              {t('dashboard.attention.clearSub')}
            </StyledText>
          </View>
        </View>
      ) : (
        items.map((item, index) => {
          const { title, sub } = describe(item, t);
          const tone = TONES[item.tone];
          return (
            <Pressable
              key={item.kind}
              onPress={() => onPress(item.destination)}
              accessibilityRole="button"
              accessibilityLabel={`${title}. ${sub}`}
              className={`flex-row items-center px-4 py-3 min-h-[60px] active:bg-paper-100 ${
                index > 0 ? 'border-t border-ink-100' : ''
              }`}
            >
              <View
                className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${tone.box}`}
              >
                <FontAwesome
                  name={ICONS[item.kind]}
                  size={16}
                  color={tone.color}
                />
              </View>
              <View className="flex-1 mr-2">
                <StyledText variant="semibold" className="text-sm text-ink-900">
                  {title}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-caption text-ink-500 mt-0.5"
                  numberOfLines={2}
                >
                  {sub}
                </StyledText>
              </View>
              <FontAwesome name="chevron-right" size={11} color="#7A7165" />
            </Pressable>
          );
        })
      )}
    </DashboardSection>
  );
});
