import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { CashSessionHeader } from './CashSessionHeader';
import { LegacyCashSessionBanner } from './ActiveSessionSummaryCard';

interface OpenSessionViewProps {
  onBack: () => void;
  openControl?: any;
  handleOpenSubmit?: any;
  openErrors?: any;
  openIsValid?: boolean;
  isPending?: boolean;
  focusedField?: string | null;
  onFocusField?: (field: string | null) => void;
  onOpenSession?: (data: any) => void;
}

export function OpenSessionView({ onBack }: OpenSessionViewProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <CashSessionHeader
          title="Legacy Cash Sessions"
          subtitle="Read-Only History"
          onBack={onBack}
        />

        <View className="px-4">
          <LegacyCashSessionBanner />

          <View className="rounded-2xl bg-paper-50 p-4 mb-4 border border-ink-100 shadow-paper">
            <View className="flex-row items-center gap-3">
              <View className="bg-ink-100 w-10 h-10 rounded-full items-center justify-center">
                <FontAwesome name="lock" size={16} color="#4A453E" />
              </View>
              <View className="flex-1">
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-base"
                >
                  Active Drawer Creation Retired
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-ink-700 text-xs mt-0.5 leading-relaxed"
                >
                  Active cash session creation is retired. Use Gastos & Kaha Ledger for recording operating expenses and owner drawings.
                </StyledText>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

