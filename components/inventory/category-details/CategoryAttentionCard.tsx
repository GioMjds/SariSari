import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { LOW_STOCK_THRESHOLD } from '@/constants';
import type { CategoryFilter, CategorySummary } from './categoryInsights';

interface CategoryAttentionCardProps {
  summary: CategorySummary;
  onSelect: (filter: CategoryFilter) => void;
}

type Issue = {
  filter: CategoryFilter;
  count: number;
  titleKey: string;
  hintKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTone: string;
  tile: string;
};

// Ordered by how much each issue costs the store today.
const ISSUES: Omit<Issue, 'count'>[] = [
  {
    filter: 'out',
    titleKey: 'category_attentionOut',
    hintKey: 'category_attentionOutHint',
    icon: 'close-circle',
    iconTone: 'text-semantic-danger',
    tile: 'bg-semantic-danger-50',
  },
  {
    filter: 'low',
    titleKey: 'category_attentionLow',
    hintKey: 'category_attentionLowHint',
    icon: 'warning',
    iconTone: 'text-semantic-warning-700',
    tile: 'bg-semantic-warning-50',
  },
  {
    filter: 'slow',
    titleKey: 'category_attentionSlow',
    hintKey: 'category_attentionSlowHint',
    icon: 'hourglass-outline',
    iconTone: 'text-cinnamon-500',
    tile: 'bg-cinnamon-50',
  },
  {
    filter: 'nocost',
    titleKey: 'category_attentionNoCost',
    hintKey: 'category_attentionNoCostHint',
    icon: 'pricetag-outline',
    iconTone: 'text-ink-600',
    tile: 'bg-paper-200',
  },
];

const COUNT_OF: Record<string, (s: CategorySummary) => number> = {
  out: (s) => s.out,
  low: (s) => s.low,
  slow: (s) => s.slow,
  nocost: (s) => s.missingCost,
};

export function CategoryAttentionCard({
  summary,
  onSelect,
}: CategoryAttentionCardProps) {
  const { t } = useTranslation('inventory');
  if (summary.productCount === 0) return null;
  const issues = ISSUES.map((issue) => ({
    ...issue,
    count: COUNT_OF[issue.filter]!(summary),
  })).filter((issue) => issue.count > 0);

  return (
    <View className="mx-4 mt-6">
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="text-ink-900 text-base mb-2 px-1"
      >
        {t('category_attentionTitle')}
      </StyledText>

      {issues.length === 0 ? (
        <View className="bg-sage-50 rounded-2xl border border-sage-200 px-4 py-3.5 flex-row items-center">
          <Ionicons
            name="checkmark-circle"
            size={20}
            className="text-sage-600"
          />
          <StyledText
            variant="semibold"
            className="text-sage-700 text-sm ml-3 flex-1"
          >
            {t('category_attentionAllGood')}
          </StyledText>
        </View>
      ) : (
        <View className="bg-paper-50 rounded-2xl border border-ink-100 overflow-hidden">
          {issues.map((issue, index) => {
            const title = t(issue.titleKey, { count: issue.count });
            const hint = t(issue.hintKey, { threshold: LOW_STOCK_THRESHOLD });
            return (
              <Pressable
                key={issue.filter}
                onPress={() => onSelect(issue.filter)}
                accessibilityRole="button"
                accessibilityLabel={title}
                accessibilityHint={t('category_attentionRowHint', { hint })}
                className={`flex-row items-center px-4 py-3 min-h-[60px] active:bg-paper-100 ${
                  index > 0 ? 'border-t border-dashed border-ink-200' : ''
                }`}
              >
                <View
                  className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${issue.tile}`}
                >
                  <Ionicons
                    name={issue.icon}
                    size={18}
                    className={issue.iconTone}
                  />
                </View>
                <View className="flex-1 pr-2">
                  <StyledText
                    variant="extrabold"
                    className="text-ink-900 text-sm"
                  >
                    {title}
                  </StyledText>
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-[12px] mt-0.5"
                  >
                    {hint}
                  </StyledText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  className="text-ink-400"
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
