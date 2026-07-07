import { View } from 'react-native';
import { CreditHistory } from '@/types/credits.types';
import { TabContentSearch } from './TabContentSearch';
import { HistoryTimeline } from './HistoryTimeline';
import { NoMatchesState } from './NoMatchesState';

interface HistoryTabContentProps {
  /** Already-filtered history list. */
  history: CreditHistory[];
  /** Total count before filtering — drives the "X of Y" caption. */
  totalCount: number;
  searchValue: string;
  onSearchChange: (next: string) => void;
}

/**
 * HistoryTabContent — body of the "History" tab.
 *
 * The timeline handles its own empty state (no rows yet — onboarding
 * copy in the timeline component). When the list has rows but the
 * search filter excludes them, we wrap the timeline in the shared
 * filter row + `NoMatchesState` empty card so the user knows the
 * data exists, it's just filtered out.
 */
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
