import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import { CashEntry } from '@/types/cash.types';

interface CashMovementsListProps {
  entries: CashEntry[];
  entriesLoading: boolean;
}

function getEntryBadgeColor(type: string): string {
  switch (type) {
    case 'expense':
      return 'bg-semantic-danger';
    case 'owner_drawing':
      return 'bg-cinnamon-400';
    case 'owner_addition':
      return 'bg-sage-500';
    default:
      return 'bg-ink-400';
  }
}

export function CashMovementsList({
  entries,
  entriesLoading,
}: CashMovementsListProps) {
  return (
    <View className="mt-6">
      <StyledText
        variant="black"
        className="label-caps text-ink-900 mb-3"
      >
        Daily Cash Movements ({entries.length})
      </StyledText>

      {entriesLoading ? (
        <StyledText className="text-xs text-ink-400 py-4">
          Loading entries...
        </StyledText>
      ) : entries.length === 0 ? (
        <View className="bg-paper-50 rounded-xl border border-dashed border-ink-200 p-6 items-center">
          <StyledText variant="regular" className="text-ink-400 text-sm">
            No manual movements recorded today.
          </StyledText>
        </View>
      ) : (
        <View className="space-y-2">
          {entries.map((item) => (
            <View
              key={item.id}
              className="bg-paper-50 border border-ink-100 rounded-xl p-3.5 flex-row justify-between items-center"
            >
              <View className="flex-1 mr-2">
                <View className="flex-row items-center gap-1.5">
                  <View
                    className={`px-2 py-0.5 rounded-full ${getEntryBadgeColor(item.type)}`}
                  >
                    <StyledText
                      variant="semibold"
                      className="text-xxs uppercase tracking-wider text-white"
                    >
                      {item.type.replace('_', ' ')}
                    </StyledText>
                  </View>
                  <StyledText
                    variant="regular"
                    className="text-ink-400 text-xxs"
                  >
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </StyledText>
                </View>
                <StyledText
                  variant="medium"
                  className="text-ink-800 text-sm mt-1"
                >
                  {item.notes || 'No description'}
                </StyledText>
              </View>
              <StyledText
                variant="semibold"
                className={`text-sm ${
                  item.type === 'owner_addition'
                    ? 'text-sage-600'
                    : 'text-semantic-danger'
                }`}
              >
                {item.type === 'owner_addition' ? '+' : '-'}
                {formatPesos(item.amount)}
              </StyledText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
