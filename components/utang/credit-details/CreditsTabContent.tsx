import { View } from 'react-native';
import { CreditTransaction } from '@/types/credits.types';
import { TabContentSearch } from './TabContentSearch';
import { UtangCard } from './UtangCard';
import { CreditsEmptyState } from './CreditsEmptyState';
import { NoMatchesState } from './NoMatchesState';

interface CreditsTabContentProps {
  /** Already-filtered credit list. */
  credits: CreditTransaction[];
  /** Total count before filtering — drives the "X of Y" caption. */
  totalCount: number;
  searchValue: string;
  onSearchChange: (next: string) => void;
  onQuickSettle: (credit: CreditTransaction) => void;
}

/**
 * CreditsTabContent — body of the "Credits" tab.
 *
 * Renders one of three states:
 *   • Empty state — no credits exist for this suki yet.
 *   • No matches — credits exist but the search filter excluded them.
 *   • List — a `TabContentSearch` filter row followed by animated
 *     `UtangCard` rows.
 *
 * Pure presentation. Filtering is the parent's job; this component
 * only renders the results.
 */
export function CreditsTabContent({
  credits,
  totalCount,
  searchValue,
  onSearchChange,
  onQuickSettle,
}: CreditsTabContentProps) {
  if (credits.length === 0 && totalCount === 0) {
    return <CreditsEmptyState />;
  }
  if (credits.length === 0) {
    return (
      <View>
        <TabContentSearch
          value={searchValue}
          onChange={onSearchChange}
          resultCount={0}
          totalCount={totalCount}
          noun="Credit"
          placeholder="Search by product or note…"
        />
        <NoMatchesState noun="Credit" />
      </View>
    );
  }
  return (
    <View>
      <TabContentSearch
        value={searchValue}
        onChange={onSearchChange}
        resultCount={credits.length}
        totalCount={totalCount}
        noun="Credit"
        placeholder="Search by product or note…"
      />
      {credits.map((credit, idx) => (
        <UtangCard
          key={credit.id}
          credit={credit}
          index={idx}
          onQuickSettle={onQuickSettle}
        />
      ))}
    </View>
  );
}
