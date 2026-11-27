import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
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
  title: string;
  hint: string;
  icon: keyof typeof FontAwesome.glyphMap;
  color: string;
  tile: string;
};

// Ordered by how much each issue costs the store today.
function issuesFor(s: CategorySummary): Issue[] {
  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;
  const issues: Issue[] = [
    {
      filter: 'out',
      count: s.out,
      title: `${plural(s.out, 'product', 'products')} out of stock`,
      hint: 'Customers cannot buy these. Restock first.',
      icon: 'times-circle',
      color: '#C13030',
      tile: 'bg-semantic-danger-50',
    },
    {
      filter: 'low',
      count: s.low,
      title: `${plural(s.low, 'product', 'products')} running low`,
      hint: `${LOW_STOCK_THRESHOLD} or fewer left. Add to your next palengke trip.`,
      icon: 'exclamation-triangle',
      color: '#C77B0E',
      tile: 'bg-semantic-warning-50',
    },
    {
      filter: 'slow',
      count: s.slow,
      title: `${plural(s.slow, 'product', 'products')} not moving`,
      hint: 'No sales in 28 days. Hold off on reordering.',
      icon: 'hourglass-half',
      color: '#623418',
      tile: 'bg-cinnamon-50',
    },
    {
      filter: 'nocost',
      count: s.missingCost,
      title: `${plural(s.missingCost, 'product', 'products')} missing cost price`,
      hint: 'Profit cannot be counted for these.',
      icon: 'tag',
      color: '#564E45',
      tile: 'bg-paper-200',
    },
  ];
  return issues.filter((issue) => issue.count > 0);
}

export function CategoryAttentionCard({
  summary,
  onSelect,
}: CategoryAttentionCardProps) {
  if (summary.productCount === 0) return null;
  const issues = issuesFor(summary);

  return (
    <View className="mx-4 mt-6">
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="text-ink-900 text-base mb-2 px-1"
      >
        Needs attention
      </StyledText>

      {issues.length === 0 ? (
        <View className="bg-sage-50 rounded-2xl border border-sage-200 px-4 py-3.5 flex-row items-center">
          <FontAwesome name="check-circle" size={18} color="#4F7A24" />
          <StyledText
            variant="semibold"
            className="text-sage-700 text-sm ml-3 flex-1"
          >
            Everything here is stocked, priced, and selling.
          </StyledText>
        </View>
      ) : (
        <View className="bg-paper-50 rounded-2xl border border-ink-100 overflow-hidden">
          {issues.map((issue, index) => (
            <Pressable
              key={issue.filter}
              onPress={() => onSelect(issue.filter)}
              accessibilityRole="button"
              accessibilityLabel={issue.title}
              accessibilityHint={`${issue.hint} Shows these products in the list below.`}
              className={`flex-row items-center px-4 py-3 min-h-[60px] active:bg-paper-100 ${
                index > 0 ? 'border-t border-dashed border-ink-200' : ''
              }`}
            >
              <View
                className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${issue.tile}`}
              >
                <FontAwesome name={issue.icon} size={15} color={issue.color} />
              </View>
              <View className="flex-1 pr-2">
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-sm"
                >
                  {issue.title}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-[12px] mt-0.5"
                >
                  {issue.hint}
                </StyledText>
              </View>
              <FontAwesome name="chevron-right" size={12} color="#A89F90" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
