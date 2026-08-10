import { View } from 'react-native';
import { CreditHistory } from '@/types/credits.types';
import { TabContentSearch } from './TabContentSearch';
import { HistoryTimeline } from './HistoryTimeline';
import { NoMatchesState } from './NoMatchesState';

interface HistoryTabContentProps {
  history: CreditHistory[];
  totalCount: number;
  searchValue: string;
  onSearchChange: (next: string) => void;
}

export function HistoryTabContent({
  history,
  totalCount,
  searchValue,
  onSearchChange,
}: HistoryTabContentProps) {
  if (history.length === 0 && totalCount === 0) {
    return <HistoryTimeline history={[]} />;
  }
  if (history.length === 0) {
    return (
      <View>
        <TabContentSearch
          value={searchValue}
          onChange={onSearchChange}
          resultCount={0}
          totalCount={totalCount}
          noun="Entry"
          placeholder="Search description…"
        />
        <NoMatchesState noun="Entry" />
      </View>
    );
  }
  return (
    <View>
      <TabContentSearch
        value={searchValue}
        onChange={onSearchChange}
        resultCount={history.length}
        totalCount={totalCount}
        noun="Entry"
        placeholder="Search description…"
      />
      <HistoryTimeline history={history} />
    </View>
  );
}
