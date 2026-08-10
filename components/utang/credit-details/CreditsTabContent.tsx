import { View } from 'react-native';
import { CreditTransaction } from '@/types/credits.types';
import { TabContentSearch } from './TabContentSearch';
import { UtangCard } from './UtangCard';
import { CreditsEmptyState } from './CreditsEmptyState';
import { NoMatchesState } from './NoMatchesState';

interface CreditsTabContentProps {
  credits: CreditTransaction[];
  totalCount: number;
  searchValue: string;
  onSearchChange: (next: string) => void;
  onQuickSettle: (credit: CreditTransaction) => void;
}

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
