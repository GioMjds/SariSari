import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import { CashSession } from '@/types/cash.types';

interface ActiveSessionSummaryCardProps {
  currentSession: CashSession;
  summary: any;
  expectedCash: number;
  isOpen: boolean;
}

function CashSummaryRow({
  label,
  value,
  isAdd,
  isSubtract,
}: {
  label: string;
  value: number;
  isAdd?: boolean;
  isSubtract?: boolean;
}) {
  let sign = '';
  let color = 'text-ink-700';

  if (isAdd) {
    sign = '+';
    color = 'text-sage-600';
  } else if (isSubtract) {
    sign = '-';
    color = 'text-semantic-danger';
  }

  return (
    <View className="flex-row justify-between items-center py-1">
      <StyledText variant="regular" className="text-ink-500 text-sm">
        {label}
      </StyledText>
      <StyledText variant="medium" className={`text-sm ${color}`}>
        {sign}
        {formatPesos(value)}
      </StyledText>
    </View>
  );
}

export function ActiveSessionSummaryCard({
  currentSession,
  summary,
  expectedCash,
  isOpen,
}: ActiveSessionSummaryCardProps) {
  return (
    <>
      {/* Status Indicator */}
      <View
        className={`rounded-xl border p-3 mb-4 flex-row items-center justify-between ${
          isOpen
            ? 'bg-sage-50 border-sage-100'
            : 'bg-ink-100 border-ink-200'
        }`}
      >
        <View className="flex-row items-center">
          <View
            className={`w-2.5 h-2.5 rounded-full mr-2 ${isOpen ? 'bg-sage-500' : 'bg-ink-400'}`}
          />
          <StyledText
            variant="semibold"
            className={isOpen ? 'text-sage-700' : 'text-ink-700'}
          >
            {isOpen
              ? 'Drawer is Active / Open'
              : 'Drawer is Closed & Locked'}
          </StyledText>
        </View>
        <StyledText variant="regular" className="text-ink-400 text-xs">
          Opened:{' '}
          {new Date(currentSession.openingTimestamp).toLocaleTimeString(
            [],
            { hour: '2-digit', minute: '2-digit' },
          )}
        </StyledText>
      </View>

      {/* Cashflow Summary Card */}
      <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
        <StyledText
          variant="black"
          className="label-caps text-cinnamon-500 mb-3"
        >
          Cash Summary Breakdown
        </StyledText>

        <View className="space-y-2">
          <CashSummaryRow
            label="Opening Cash"
            value={currentSession.openingCash}
          />
          <CashSummaryRow
            label="Cash Sales"
            value={summary?.cashSales ?? 0}
            isAdd
          />
          <CashSummaryRow
            label="Cash Utang Payments"
            value={summary?.cashUtangPayments ?? 0}
            isAdd
          />
          <CashSummaryRow
            label="Owner Additions"
            value={summary?.ownerAdditions ?? 0}
            isAdd
          />
          <CashSummaryRow
            label="Expenses"
            value={summary?.expenses ?? 0}
            isSubtract
          />
          <CashSummaryRow
            label="Owner Drawings"
            value={summary?.ownerDrawings ?? 0}
            isSubtract
          />

          <View className="h-px border-t border-dashed border-ink-300 my-2" />

          <View className="flex-row justify-between items-center py-1">
            <StyledText
              variant="extrabold"
              className="text-ink-950 text-base"
            >
              Expected Cash
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-ink-950 text-lg"
            >
              {formatPesos(expectedCash)}
            </StyledText>
          </View>

          {!isOpen && (
            <>
              <CashSummaryRow
                label="Physical Counted"
                value={currentSession.actualCash ?? 0}
              />
              <View className="h-px border-t border-dashed border-ink-300 my-2" />
              <View className="flex-row justify-between items-center py-1">
                <StyledText
                  variant="extrabold"
                  className="text-ink-950 text-base"
                >
                  Variance
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className={`text-lg ${(currentSession.variance ?? 0) >= 0 ? 'text-sage-600' : 'text-semantic-danger'}`}
                >
                  {formatPesos(currentSession.variance ?? 0)}
                </StyledText>
              </View>
            </>
          )}
        </View>
      </View>
    </>
  );
}
