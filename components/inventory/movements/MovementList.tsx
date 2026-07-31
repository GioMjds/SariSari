import { SectionList } from 'react-native';
import { groupMovementsByDay } from './groupMovementsByDay';
import { MovementRow } from './MovementRow';
import { DayHeader } from '@/components/inventory/DayHeader';
import { MovementEmptyState } from './MovementEmptyState';

interface Props {
  movements: any[];
}

export function MovementList({ movements }: Props) {
  const sections = groupMovementsByDay(movements);
  if (sections.length === 0) return <MovementEmptyState />;
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      contentContainerClassName="pt-3 pb-32"
      renderSectionHeader={({ section }) => (
        <DayHeader
          date={section.date}
          netChange={section.totals.net}
          in={section.totals.in}
          out={section.totals.out}
        />
      )}
      renderItem={({ item }) => <MovementRow transaction={item} />}
    />
  );
}
