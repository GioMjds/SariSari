import React from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { formatCurrency } from '@/utils';

export interface CashSessionCardProps {
  status?: 'open' | 'closed';
  startingFloat?: number | null;
  expectedCash?: number | null;
  variance?: number | null;
  onSessionAction: () => void;
}

export function CashSessionCard({
  status = 'closed',
  startingFloat = 0,
  expectedCash = 0,
  variance = 0,
  onSessionAction,
}: CashSessionCardProps) {
  const isOpen = status === 'open';

  return (
    <View className="px-4 mb-4">
      <View className="bg-paper-50 rounded-2xl p-4 border border-ink-100 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mr-2.5">
              <FontAwesome5
                name="cash-register"
                size={14}
                className="text-emerald-600"
              />
            </View>
            <View>
              <StyledText variant="extrabold" className="text-ink-900 text-sm">
                Register Session
              </StyledText>
              <StyledText variant="regular" className="text-ink-400 text-xs">
                Drawer & Float Balance
              </StyledText>
            </View>
          </View>
          <View
            className={`px-2.5 py-1 rounded-full ${isOpen ? 'bg-emerald-100' : 'bg-ink-100'}`}
          >
            <StyledText
              variant="extrabold"
              className={`text-xs ${isOpen ? 'text-emerald-800' : 'text-ink-600'}`}
            >
              {isOpen ? 'Open' : 'Closed'}
            </StyledText>
          </View>
        </View>

        {isOpen && (
          <View className="flex-row justify-between pt-2 border-t border-ink-100 mb-3">
            <View>
              <StyledText variant="regular" className="text-ink-400 text-xs">
                Starting Float
              </StyledText>
              <StyledText
                variant="extrabold"
                className="text-ink-800 text-sm mt-0.5"
              >
                {formatCurrency(startingFloat ?? 0)}
              </StyledText>
            </View>
            <View>
              <StyledText variant="regular" className="text-ink-400 text-xs">
                Expected Cash
              </StyledText>
              <StyledText
                variant="extrabold"
                className="text-ink-800 text-sm mt-0.5"
              >
                {formatCurrency(expectedCash ?? 0)}
              </StyledText>
            </View>
          </View>
        )}

        <Pressable
          onPress={onSessionAction}
          className="bg-cinnamon-500 py-2.5 rounded-xl items-center justify-center"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-sm">
            {isOpen ? 'Manage Register' : 'Open Cash Session'}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}
